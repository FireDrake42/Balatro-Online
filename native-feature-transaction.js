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
 // v1 KEYS/API/serialized record stay unchanged. v2 uses the SAME journal key
 // and only these existing canonical native banks, in this fixed order.
 const AUX_KEYS=Object.freeze(['danis-table.daily-streak.v1','danis-table.daily-tasks.v1']);
 const TASK_COUNTERS=Object.freeze(['handsPlayed','cardsPlayed','moneyEarned','blindsWon','tarotsUsed']);
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
 function list(value,max,min=0){
  check(Array.isArray(value)&&Object.getPrototypeOf(value)===Array.prototype,'a native finite data array is required.');
  const descriptors=Object.getOwnPropertyDescriptors(value),length=descriptors.length?.value;
  check(Number.isInteger(length)&&length>=min&&length<=max,'native source array budget exceeded.');
  check(Reflect.ownKeys(descriptors).length===length+1,'unexpected native source array fields.');
  const out=[];for(let i=0;i<length;i++){const d=descriptors[String(i)];check(d&&Object.hasOwn(d,'value')&&d.enumerable===true,'native source accessors/holes are unsupported.');out.push(d.value);}return out;
 }
 function sourceKeys(value){const keys=list(value,2,1);check(keys.every((key,i)=>AUX_KEYS.includes(key)&&(i===0||AUX_KEYS.indexOf(keys[i-1])<AUX_KEYS.indexOf(key))),'unknown, duplicate or unordered native source banks.');return keys;}
 function stamp(value){check(Number.isSafeInteger(value)&&value>=0&&value<=8640000000000000,'invalid original native source time.');return value;}
 function taskCounters(value,after=false){const hasScore=!!value&&Object.hasOwn(value,'handScore'),names=[...TASK_COUNTERS,...hasScore?['handScore']:[]],out=fields(value,names);check(!after||hasScore,'native task after score is required.');for(const n of Object.values(out))check(typeof n==='number'&&Number.isFinite(n)&&n>=0,'invalid native task counter.');return out;}
 function observation(value){const o=fields(value,['runId','at','before','after']);check(typeof o.runId==='string'&&o.runId.trim().length>0&&o.runId.length<=1024,'invalid original task run identity.');return {runId:o.runId,at:stamp(o.at),before:taskCounters(o.before),after:taskCounters(o.after,true)};}
 function sourceInputs(value,keys){const values=list(value,2,1);check(values.length===keys.length,'native source records/banks disagree.');return values.map((value,i)=>{
  const task=keys[i]===AUX_KEYS[1],s=fields(value,task?['key','kind','at','observations']:['key','kind','at']);check(s.key===keys[i]&&s.kind===(task?'daily-task':'check-in'),'native source key/kind/order disagrees.');
  return task?{key:s.key,kind:s.kind,at:stamp(s.at),observations:list(s.observations,256,1).map(observation)}:{key:s.key,kind:s.kind,at:stamp(s.at)};
 });}
 function auxiliary(value){const keys=sourceKeys(value.sourceKeys),sources=sourceInputs(value.sources,keys),all=[...KEYS,...AUX_KEYS],before=fields(value.before,all),after=fields(value.after,all);for(const image of [before,after])for(const key of all)check(image[key]===null||typeof image[key]==='string','raw native source banks must be strings or null.');check(before[KEYS[2]]===after[KEYS[2]],'a native source transaction cannot change settings.');for(const key of AUX_KEYS)if(!keys.includes(key))check(before[key]===after[key],'an unproduced native daily witness cannot change.');return {sourceKeys:keys,sources,keys:all,before,after};}
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
  function validate(image){for(const key of KEYS)validateBank(key,image[key]);if(typeof options.validateImage==='function')options.validateImage(image);}
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
  // v2 validates original source-model evidence before the first journal write.
  // Its commit fences require the EXACT phase-known image, not merely either
  // proposed image. New-session recovery alone may inspect known mixed banks.
  function auxValidate(a,context){
   check(typeof options.validateAuxTransition==='function','this reader cannot validate a source-inclusive v2 journal. Keep it for a matching main-game recovery.');
   for(const image of [a.before,a.after]){for(const key of a.keys)validateBank(key,image[key]);if(typeof options.validateImage==='function')options.validateImage(image);}
   options.validateAuxTransition({context,sourceKeys:a.sourceKeys,sources:a.sources,before:a.before,after:a.after});
  }
  function auxGuard(context,a,current,mode){const frame=Object.freeze({version:2,mode,sourceKeys:Object.freeze([...a.sourceKeys]),expected:Object.freeze({...current})});check(!paused,'saving is paused; a new session is required.');assertOwner(frame);assertContext(context,frame);}
  function auxExact(a,current,raw,context,mode){for(let pass=0;pass<2;pass++){auxGuard(context,a,current,mode);journalMatches(raw);for(const key of a.keys)check(readable(key)===current[key],'phase-known whole native source readback did not match.');auxGuard(context,a,current,mode);journalMatches(raw);}}
  function auxKnown(a,raw,context){
   check(!paused,'saving is paused; a new session is required.');assertOwner();assertContext(context);journalMatches(raw);
   const current={};for(const key of a.keys){const value=readable(key);check(value===a.before[key]||value===a.after[key],'a foreign whole native source bank was found. It has not been overwritten.');current[key]=value;}
   auxExact(a,current,raw,context,'recover');return current;
  }
  function commitAux(request){
   let attempted=false;
   try{
    const input=fields(request,['context','before','after','sourceKeys','sources']),a=auxiliary(input),context=input.context;
    check(typeof context==='string'&&context.length>0,'a current selected-slot context is required.');auxValidate(a,context);const current={...a.before};auxExact(a,current,null,context,'commit');
    const id=token();check(typeof id==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(id),'invalid transaction identity.');
    const journal={version:2,id,state:'prepared',context,before:a.before,after:a.after,sourceKeys:a.sourceKeys,sources:a.sources},prepared=JSON.stringify(journal),committed=JSON.stringify({...journal,state:'committed'});
    auxExact(a,current,null,context,'commit');attempted=true;storage.setItem(JOURNAL_KEY,prepared);auxExact(a,current,prepared,context,'commit');
    for(const key of a.keys){auxExact(a,current,prepared,context,'commit');if(a.after[key]!==current[key]){a.after[key]===null?storage.removeItem(key):storage.setItem(key,a.after[key]);current[key]=a.after[key];auxExact(a,current,prepared,context,'commit');}}
    auxExact(a,a.after,prepared,context,'commit');storage.setItem(JOURNAL_KEY,committed);auxExact(a,a.after,committed,context,'commit');storage.removeItem(JOURNAL_KEY);auxExact(a,a.after,null,context,'commit');
    return Object.freeze({committed:true,id});
   }catch(error){return failure(error,attempted);}
  }
  function recoverAux(raw,parsed,markAttempt){
   const j=fields(parsed,['version','id','state','context','before','after','sourceKeys','sources']);
   check(j.version===2&&typeof j.id==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(j.id)&&['prepared','committed'].includes(j.state),'unsupported source recovery journal.');check(typeof j.context==='string'&&j.context.length>0,'missing source recovery slot binding.');
   const a=auxiliary(j);auxValidate(a,j.context);const current=auxKnown(a,raw,j.context),target=j.state==='committed'?a.after:a.before;auxExact(a,current,raw,j.context,'recover');
   for(const key of a.keys){auxExact(a,current,raw,j.context,'recover');if(current[key]!==target[key]){markAttempt();target[key]===null?storage.removeItem(key):storage.setItem(key,target[key]);current[key]=target[key];auxExact(a,current,raw,j.context,'recover');}}
   auxExact(a,target,raw,j.context,'recover');markAttempt();storage.removeItem(JOURNAL_KEY);auxExact(a,target,null,j.context,'recover');return Object.freeze({recovered:true,direction:j.state==='committed'?'forward':'rollback',id:j.id});
  }
  function recover(){
   let attempted=false;
   try{
    check(!paused,'saving is paused; a new session is required for recovery.');
    const raw=readable(JOURNAL_KEY);if(raw===null)return Object.freeze({recovered:false});
    const parsed=JSON.parse(raw);if(parsed&&parsed.version===2)return recoverAux(raw,parsed,()=>{attempted=true;});
    const j=fields(parsed,['version','id','state','context','before','after']);
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
  return Object.freeze({commit,commitAux,recover,status:()=>Object.freeze({writable:!paused,paused,reason})});
 }
 return Object.freeze({JOURNAL_KEY,KEYS,AUX_KEYS,parseSources:(keys,inputs)=>{const selected=sourceKeys(keys);return {sourceKeys:selected,sources:sourceInputs(inputs,selected)};},create});
});
