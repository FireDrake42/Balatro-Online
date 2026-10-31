/* Detached native tutorial PROFILE/RUN/settings boundary.
 * Host MUST hold its existing writer permit and the native survey/PROFILE/
 * streak/tasks Web Locks for commit/recover. This module owns no lease, timer,
 * engine, reward, or UI. It never advances live models. Prepared rolls back;
 * committed rolls forward on a NEW session, without replaying native actions.
 * Any attempted uncertainty permanently pauses this instance; it never retries.
 * validateBank must be a pure host schema check. Context is exact slot metadata.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BONativeFeatureTransaction=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const JOURNAL_KEY='danis-table.tutorial-journal.v1';
 const KEYS=Object.freeze(['danis-table.profile.v1','danis-table.run.v1','danis-table.settings.v1']);
 function check(ok,message){if(!ok)throw new Error('Tutorial save: '+message);}
 function fields(value,names){
  check(value!==null&&typeof value==='object'&&!Array.isArray(value),'malformed record.');
  const proto=Object.getPrototypeOf(value);check(proto===Object.prototype||proto===null,'unsupported record prototype.');
  const descriptors=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(descriptors);
  check(keys.length===names.length&&keys.every(k=>typeof k==='string'&&names.includes(k)),'unexpected or missing fields.');
  const result={};
  for(const name of names){const d=descriptors[name];check(d&&Object.hasOwn(d,'value')&&d.enumerable===true,'only own enumerable data fields are supported.');result[name]=d.value;}
  return result;
 }
 function banks(value){const result=fields(value,KEYS);for(const key of KEYS)check(result[key]===null||typeof result[key]==='string','raw banks must be strings or null.');return result;}
 function create(options){
  const {storage,assertOwner,assertContext,validateBank,token,onPause}=options;
  check(storage&&typeof storage.getItem==='function'&&typeof storage.setItem==='function'&&typeof storage.removeItem==='function','native Storage required.');
  check([assertOwner,assertContext,validateBank,token].every(fn=>typeof fn==='function'),'native owner, context, schema and token callbacks required.');
  let paused=false,reason='';
  function guard(context){check(!paused,'saving is paused; reload to inspect recovery before retrying.');assertOwner();assertContext(context);}
  function readable(key){const value=storage.getItem(key);check(value===null||typeof value==='string','Storage returned an unreadable raw bank.');return value;}
  function journalMatches(raw){check(readable(JOURNAL_KEY)===raw,'journal changed outside this operation. Keep browser data and recovery evidence.');}
  function exact(image,raw,context){
   for(let pass=0;pass<2;pass++){guard(context);journalMatches(raw);for(const key of KEYS)check(readable(key)===image[key],'whole bank readback did not match.');guard(context);journalMatches(raw);}
  }
  function known(before,after,raw,context){
   guard(context);journalMatches(raw);
   for(const key of KEYS){const value=readable(key);check(value===before[key]||value===after[key],'a foreign whole bank was found. It has not been overwritten.');}
   guard(context);journalMatches(raw);
  }
  function validate(image){for(const key of KEYS)validateBank(key,image[key]);}
  function failure(error,attempted,uncertain=false){
   const message=error instanceof Error?error.message:'native storage or ownership failure';
   const mustPause=attempted||uncertain;
   const result=Object.assign(new Error(message+(mustPause?' Saving is paused in this tab; reload to inspect before retrying.':'')),{attempted,reloadRequired:mustPause});
   if(mustPause){paused=true;reason=result.message;if(typeof onPause==='function'){try{onPause(result);}catch(_){/* Never let a UI callback erase the original uncertainty. */}}}
   throw result;
  }
  function commit(request){
   let attempted=false;
   try{
    const input=fields(request,['context','before','after']),before=banks(input.before),after=banks(input.after),context=input.context;
    check(typeof context==='string'&&context.length>0,'a current selected-slot context is required.');
    validate(before);validate(after);exact(before,null,context);
    const id=token();check(typeof id==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(id),'invalid transaction identity.');
    const journal={version:1,id,state:'prepared',context,before,after};
    const prepared=JSON.stringify(journal),committed=JSON.stringify({...journal,state:'committed'});
    exact(before,null,context);
    attempted=true;storage.setItem(JOURNAL_KEY,prepared);exact(before,prepared,context);
    for(const key of KEYS){
     known(before,after,prepared,context);
     if(after[key]!==before[key]){after[key]===null?storage.removeItem(key):storage.setItem(key,after[key]);known(before,after,prepared,context);}
    }
    exact(after,prepared,context);
    storage.setItem(JOURNAL_KEY,committed);exact(after,committed,context);
    storage.removeItem(JOURNAL_KEY);exact(after,null,context);
    return Object.freeze({committed:true,id});
   }catch(error){return failure(error,attempted);}
  }
  function recover(){
   let attempted=false;
   try{
    check(!paused,'saving is paused; a new session is required for recovery.');
    const raw=readable(JOURNAL_KEY);if(raw===null)return Object.freeze({recovered:false});
    const j=fields(JSON.parse(raw),['version','id','state','context','before','after']);
    check(j.version===1&&typeof j.id==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(j.id)&&['prepared','committed'].includes(j.state),'unsupported recovery journal.');
    check(typeof j.context==='string'&&j.context.length>0,'missing recovery slot binding.');
    const before=banks(j.before),after=banks(j.after);validate(before);validate(after);
    known(before,after,raw,j.context);known(before,after,raw,j.context);
    const target=j.state==='committed'?after:before;
    for(const key of KEYS){
     known(before,after,raw,j.context);
     if(readable(key)!==target[key]){attempted=true;target[key]===null?storage.removeItem(key):storage.setItem(key,target[key]);known(before,after,raw,j.context);}
    }
    exact(target,raw,j.context);attempted=true;
    storage.removeItem(JOURNAL_KEY);exact(target,null,j.context);
    return Object.freeze({recovered:true,direction:j.state==='committed'?'forward':'rollback',id:j.id});
   }catch(error){return failure(error,attempted,true);}
  }
  return Object.freeze({commit,recover,status:()=>Object.freeze({writable:!paused,paused,reason})});
 }
 return Object.freeze({JOURNAL_KEY,KEYS,create});
});
