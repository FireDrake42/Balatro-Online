/* Optional shared Yanma/Anorith model. Pure reductions only; callers MUST supply
 * a confirmed native PROFILE and source-earned trigger stream under native
 * owner/slot/raw guards. This module is NOT an authority or storage writer. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BOYanmaAnorith=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const FIELD='yanmaAnorith',VERSION=1,PLAYER_UNLOCK=9,FORM_PRICE_HALF=200;
 const KEYS=Object.freeze(['version','form','level','xpCenti','lastReceipt','lastForm']);
 const THRESHOLDS=Object.freeze([0,10000,100000,2000000,10000000]);
 const QUALIFYING=Object.freeze([2,3,6,8]);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function check(ok,message){if(!ok)throw Error('Yanma/Anorith: '+message);}
 function record(v,label){check(v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype,'invalid '+label+' prototype');check(Object.getOwnPropertySymbols(v).length===0,'symbol in '+label);return v;}
 function value(o,k,label){const d=Object.getOwnPropertyDescriptor(o,k);check(d&&own(d,'value')&&!own(d,'get')&&!own(d,'set'),'missing/accessor '+(label||k));return d.value;}
 function fields(o,allowed,label){record(o,label);const names=Object.getOwnPropertyNames(o);check(names.length===allowed.length&&names.every(k=>allowed.includes(k)),'unsupported/missing '+label+' field');for(const k of names)value(o,k,label+'.'+k);}
 function sourceId(v,nullable){check((nullable&&v===null)||(typeof v==='string'&&v.length>=1&&v.length<=256&&/^[A-Za-z0-9:._/\-]+$/.test(v)),'invalid native receipt identity');return v;}
 function validate(state){
  fields(state,own(state,'prefs')?KEYS.concat('prefs'):KEYS,'shared model');
  check(value(state,'version')===VERSION,'unsupported shared model version');
  check(['yanma','anorith'].includes(value(state,'form')),'invalid active form');
  const level=value(state,'level'),xp=value(state,'xpCenti');
  check(Number.isSafeInteger(level)&&level>=1&&level<=5,'invalid shared level');
  check(Number.isSafeInteger(xp)&&xp>=0&&(level===5?xp===0:xp<THRESHOLDS[level]),'invalid shared centi-XP');
  sourceId(value(state,'lastReceipt'),true);sourceId(value(state,'lastForm'),true);if(own(state,'prefs')){const p=value(state,'prefs');validatePreferences(p);check(!p.autoSimplify||level>=2,'auto simplify below companion Lv2');check(!p.inactivityTips||level>=4,'inactivity tips below companion Lv4')}return true;
 }
 function validatePreferences(p){fields(p,['autoSimplify','inactivityTips'],'companion preferences');check(typeof value(p,'autoSimplify')==='boolean'&&typeof value(p,'inactivityTips')==='boolean','invalid companion preference flags');return true;}
 function preferences(s){validate(s);return own(s,'prefs')?{autoSimplify:s.prefs.autoSimplify,inactivityTips:s.prefs.inactivityTips}:{autoSimplify:false,inactivityTips:false};}
 function create(){return {version:VERSION,form:'yanma',level:1,xpCenti:0,lastReceipt:null,lastForm:null};}
 function copyState(s){validate(s);return {version:s.version,form:s.form,level:s.level,xpCenti:s.xpCenti,lastReceipt:s.lastReceipt,lastForm:s.lastForm,...(own(s,'prefs')?{prefs:{autoSimplify:s.prefs.autoSimplify,inactivityTips:s.prefs.inactivityTips}}:{})};}
 function playerLevel(profile){record(profile,'PROFILE');const p=value(profile,'progression');record(p,'progression');const level=value(p,'level');check(Number.isSafeInteger(level)&&level>=1&&level<=100,'invalid actual PLAYER level');return level;}
 function read(profile){
  const level=playerLevel(profile),present=own(profile,FIELD);
  if(present){const state=value(profile,FIELD);validate(state);check(level>=PLAYER_UNLOCK,'shared model below PLAYER9');return copyState(state);}
  return level>=PLAYER_UNLOCK?create():null;
 }
 function rankStream(ranks){check(Array.isArray(ranks)&&Object.getPrototypeOf(ranks)===Array.prototype,'invalid earned trigger stream');check(Object.getOwnPropertySymbols(ranks).length===0,'symbol in earned stream');const names=Object.getOwnPropertyNames(ranks);check(names.length===ranks.length+1,'sparse/extended earned stream');for(let i=0;i<ranks.length;i++){const n=value(ranks,String(i),'earned rank');check(Number.isSafeInteger(n)&&n>=2&&n<=14,'invalid actual scored rank');}return ranks;}
 function fold(state,ranks,receiptId){
  const next=copyState(state);rankStream(ranks);sourceId(receiptId,false);
  check(next.lastReceipt!==receiptId,'earned receipt replay');
  let earned=false;
  for(const rank of ranks){
   if(!QUALIFYING.includes(rank))continue;
   earned=true;
   if(next.level===5)continue;
   next.xpCenti+=33;
   if(next.xpCenti>=THRESHOLDS[next.level]){next.level++;next.xpCenti=0;}
  }
  if(earned)next.lastReceipt=receiptId;
  validate(next);return next;
 }
 function beginHand(profile){const level=playerLevel(profile),shared=read(profile);if(shared)Object.freeze(shared);return Object.freeze({playerLevel:level,clubEligible:level>=PLAYER_UNLOCK&&shared!==null&&shared.level>=3,shared});}
 // Copy confirmed JSON-shaped data without executing accessors or toJSON hooks.
 // Only the NEW model uses its narrow schema; original model fields are neither
 // normalized nor silently omitted by this helper.
 function copyData(data,seen){
  if(data===null||typeof data==='string'||typeof data==='boolean')return data;
  if(typeof data==='number'){check(Number.isFinite(data),'nonfinite original data');return data;}
  check(typeof data==='object','unsupported original data');
  seen=seen||new Set();check(!seen.has(data),'cyclic original data');seen.add(data);
  let result;
  if(Array.isArray(data)){
   check(Object.getPrototypeOf(data)===Array.prototype&&Object.getOwnPropertySymbols(data).length===0,'invalid original array');
   check(Object.getOwnPropertyNames(data).length===data.length+1,'sparse/extended original array');
   result=[];for(let i=0;i<data.length;i++)result.push(copyData(value(data,String(i)),seen));
  }else{
   record(data,'original data');result={};
   for(const k of Object.getOwnPropertyNames(data)){check(!['__proto__','constructor','prototype'].includes(k),'unsafe original key');Object.defineProperty(result,k,{value:copyData(value(data,k),seen),enumerable:true,writable:true,configurable:true});}
  }
  seen.delete(data);return result;
 }
 function projectForm(profile,target,receiptId,spendNative){
  check(['yanma','anorith'].includes(target),'invalid requested form');sourceId(receiptId,false);
  const current=read(profile);check(current!==null,'PLAYER9 required for a form');
  const candidate=copyData(profile);
  if(current.form===target)return candidate; // Includes legacy virtual Yanma: NO materialization or charge.
  check(current.lastForm!==receiptId,'form intent replay');
  check(typeof spendNative==='function','native detached spend adapter required');
  // The native adapter must validate/debit the WHOLE detached progression,
  // preserving Faucet carry, Joker unlocks and every other original field.
  const progression=spendNative(candidate.progression,FORM_PRICE_HALF);
  record(progression,'detached spent progression');candidate.progression=copyData(progression);
  current.form=target;current.lastForm=receiptId;validate(current);candidate[FIELD]=current;
  return candidate;
 }
 function validateMirror(profile,run){
  const state=read(profile);if(run===null)return true;record(run,'RUN');
  const mirror=own(run,'_potionProfile')?value(run,'_potionProfile'):null;
  if(own(profile,FIELD)){
   record(mirror,'whole model mirror');check(own(mirror,FIELD),'missing whole shared model mirror');
   const mirrored=value(mirror,FIELD);validate(mirrored);
   check(KEYS.every(k=>value(mirrored,k)===state[k]),'shared model mirror differs from confirmed PROFILE');
  }else if(mirror!==null){record(mirror,'whole mirror');check(!own(mirror,FIELD),'partial shared model mirror without PROFILE');}
  return true;
 }
 return Object.freeze({FIELD,VERSION,PLAYER_UNLOCK,FORM_PRICE_HALF,THRESHOLDS,QUALIFYING,create,validate,validatePreferences,preferences,read,fold,beginHand,projectForm,validateMirror});
});
