/* Pure, RUN-owned Emerald workshop. Proposals only: no clocks, RNG calls,
 * storage, engine callbacks or DOM. Parent commits/readbacks the complete RUN
 * atomically before live apply. Giving physically reserves a card outside the
 * canonical deck and all three piles; never call destruction/reacquisition
 * callbacks (which would fabricate Joker triggers). Claim returns the SAME id.
 */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports;const api=factory(node?require('./emerald-progress.js'):root.BOEmeraldProgress);if(node)module.exports=api;else root.BOEmeraldWorkshop=api;})(typeof globalThis!=='undefined'?globalThis:this,function(P){'use strict';
 const VERSION=1,WORK_MS=120000,COOLDOWN_MS=300000,MAX_TIME=8640000000000000,MAX_CARDS=20000;
 const EDITIONS=Object.freeze(['foil','holo','poly']),ENHANCEMENTS=Object.freeze(['bonus','mult','wild','glass','steel','stone','gold','lucky']),SEALS=Object.freeze(['red','blue','gold','purple']),MODIFIERS=Object.freeze([...EDITIONS,...ENHANCEMENTS]);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),count=n=>Number.isSafeInteger(n)&&n>=0,timestamp=n=>count(n)&&n<=MAX_TIME;
 function check(ok,message){if(!ok)throw new Error(message)}
 function dataKeys(value){
  check(value&&typeof value==='object'&&!Array.isArray(value),'Expected a plain data object.');const p=Object.getPrototypeOf(value);check(p===null||p===Object.prototype,'Unsupported object prototype.');
  const keys=Reflect.ownKeys(value);check(keys.every(k=>typeof k==='string'&&!['__proto__','constructor','prototype'].includes(k)),'Unsupported data keys.');
  for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);check(d&&own(d,'value')&&d.enumerable===true,'Only enumerable data properties are supported.')}return keys;
 }
 function fields(value,keys){try{const names=dataKeys(value);return names.length===keys.length&&names.every(k=>keys.includes(k))}catch(_){return false}}
 function dataArray(value,max){
  check(Array.isArray(value)&&Object.getPrototypeOf(value)===Array.prototype&&value.length<=max,'Invalid data array.');const keys=Reflect.ownKeys(value);check(keys.length===value.length+1&&keys.includes('length'),'Unsupported array properties.');
  for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));check(d&&own(d,'value')&&d.enumerable===true,'Sparse or accessor array is unsupported.')}return value;
 }
 function jsonCopy(value,limit=1000000){
  const path=new Set();let nodes=0;
  function visit(v,depth){
   check(++nodes<=limit&&depth<=32,'Workshop data is too large or deep.');
   if(v===null||typeof v==='boolean')return v;
   if(typeof v==='number'){check(Number.isFinite(v),'Workshop contains a nonfinite value.');return v}
   if(typeof v==='string'){check(v.length<=65536,'Workshop text is too large.');return v}
   check(typeof v==='object'&&!path.has(v),'Workshop data is not acyclic JSON.');path.add(v);let out;
   if(Array.isArray(v)){dataArray(v,MAX_CARDS);out=v.map(x=>visit(x,depth+1))}else{out={};for(const k of dataKeys(v))out[k]=visit(v[k],depth+1)}path.delete(v);return out;
  }
  return visit(value,0);
 }
 function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(stable).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}'}
 function same(a,b){return stable(a)===stable(b)}
 function runId(id){return !!P&&P.validRunId(id)}
 function cardId(id){return typeof id==='string'&&id.length>=1&&id.length<=160&&!['__proto__','constructor','prototype'].includes(id)||count(id)}
 function cardData(c){
  const card=jsonCopy(c,4096);dataKeys(card);check(own(card,'id')&&cardId(card.id)&&Number.isInteger(card.rank)&&card.rank>=2&&card.rank<=14&&['S','H','D','C'].includes(card.suit),'Invalid workshop playing card.');
  for(const [key,allowed]of [['enhancement',ENHANCEMENTS],['edition',EDITIONS],['seal',SEALS]])if(own(card,key))check(card[key]===null||allowed.includes(card[key]),'Invalid single card '+key+'.');
  if(own(card,'bonusChips'))check(typeof card.bonusChips==='number'&&Number.isFinite(card.bonusChips)&&card.bonusChips>=0,'Invalid permanent card Chips.');
  for(const k of ['faceDown','debuffed'])if(own(card,k))check(typeof card[k]==='boolean','Invalid card visibility metadata.');return card;
 }
 function validateCard(card){try{cardData(card);return true}catch(_){return false}}
 function dice(rolls){dataArray(rolls,4);check(rolls.length===4&&rolls.every(r=>typeof r==='number'&&Number.isFinite(r)&&r>=0&&r<1),'Supply exactly four guarded rolls in [0,1).');return rolls.slice()}
 function transform(input,level,rolls){
  const c=cardData(input),d=dice(rolls);check(level===9||level===10,'Invalid Emerald workshop level.');c.rank=Math.min(14,c.rank+(level===10?3:1));
  if(level===9){if(d[0]<.1)c.edition=EDITIONS[Math.floor(d[1]*EDITIONS.length)]}
  else if(d[0]<.4||d[2]<.1){
   const mod=MODIFIERS[Math.floor(d[1]*MODIFIERS.length)],isEdition=EDITIONS.includes(mod);c[isEdition?'edition':'enhancement']=mod;
   // Independent 10% coexist roll, including when the 40% primary roll missed.
   // One field per category: never arrays, stacked editions or enhancements.
   if(d[2]<.1){const opposite=isEdition?ENHANCEMENTS:EDITIONS;c[isEdition?'enhancement':'edition']=opposite[Math.floor(d[3]*opposite.length)]}
  }
  return c;
 }
 function create(id){check(runId(id),'Workshop needs the existing stable run id.');return {version:VERSION,runId:id,revision:0,sequence:0,availableAt:0,job:null}}
 function jobId(id,sequence){return id+':emerald:'+sequence}
 function validate(state){try{
  const keys=['version','runId','revision','sequence','availableAt','job'];if(own(state,'workMs'))keys.push('workMs');
  check(fields(state,keys)&&state.version===VERSION&&runId(state.runId)&&count(state.revision)&&count(state.sequence)&&state.sequence<=Math.floor(Number.MAX_SAFE_INTEGER/2)&&timestamp(state.availableAt),'Invalid workshop state.');
  // Absence is the exact legacy120s branch. New timing stays frozen through claim.
  const workMs=own(state,'workMs')?state.workMs:WORK_MS;check(count(workMs)&&workMs>=66000&&workMs<=WORK_MS&&(WORK_MS-workMs)%6000===0,'Invalid frozen workshop duration.');
  check(state.revision===state.sequence*2-(state.job===null?0:1),'Invalid workshop revision or sequence.');
  if(state.job===null){check(state.sequence===0?state.availableAt===0:state.availableAt>=workMs+COOLDOWN_MS,'Invalid workshop cooldown.');return true}
  const j=state.job;check(fields(j,['id','runId','level','startedAt','completedAt','input','result','rolls'])&&state.sequence>0&&j.id===jobId(state.runId,state.sequence)&&j.runId===state.runId&&(j.level===9||j.level===10)&&timestamp(j.startedAt)&&j.startedAt<=MAX_TIME-workMs-COOLDOWN_MS&&j.completedAt===j.startedAt+workMs&&state.availableAt===j.completedAt+COOLDOWN_MS,'Invalid run-owned workshop job or timestamps.');
  const before=cardData(j.input),after=cardData(j.result),expected=transform(before,j.level,j.rolls);check(same(after,expected),'Stored workshop result does not match its one-time dice.');return true;
 }catch(_){return false}}
 function copy(state){check(validate(state),'Emerald workshop save needs attention. No card was moved.');return jsonCopy(state)}
 function inspectedRun(run){
  const r=jsonCopy(run);dataKeys(r);check(r.version===1&&runId(r._uiId)&&['select','play','cashout','shop','pack','won','lost'].includes(r.phase),'Invalid workshop origin run.');
  const map=new Map(),used=new Set();
  for(const key of ['cards','hand','drawPile','discardPile'])dataArray(r[key],MAX_CARDS);
  for(const c of r.cards){cardData(c);const id=String(c.id);check(!map.has(id),'Duplicate canonical playing-card id.');map.set(id,c)}
  for(const key of ['hand','drawPile','discardPile'])for(const c of r[key]){cardData(c);const id=String(c.id);check(map.has(id)&&!used.has(id)&&same(c,map.get(id)),'Unknown, duplicate or changed pile card.');used.add(id)}
  if(own(r,'handDrawOrder')){dataArray(r.handDrawOrder,MAX_CARDS);const seen=new Set(),ids=new Set(r.hand.map(c=>String(c.id)));for(const id of r.handDrawOrder){check(cardId(id)&&ids.has(String(id))&&!seen.has(String(id)),'Invalid hand draw-order reference.');seen.add(String(id))}}
  if(own(r,'emeraldWorkshop')){
   const state=copy(r.emeraldWorkshop);check(state.runId===r._uiId,'Workshop belongs to another run.');
   if(state.job)check(!map.has(String(state.job.input.id))&&!used.has(String(state.job.input.id)),'Reserved workshop card is duplicated in the deck or piles.');r.emeraldWorkshop=state;
  }
  // Equivalent to engine hydrate(): all pile entries alias canonical card data.
  for(const key of ['hand','drawPile','discardPile'])r[key]=r[key].map(c=>map.get(String(c.id)));return r;
 }
 function validateRun(run){try{inspectedRun(run);return true}catch(_){return false}}
 function info(run,now){
  check(timestamp(now),'Invalid absolute workshop timestamp.');const r=inspectedRun(run),s=own(r,'emeraldWorkshop')?r.emeraldWorkshop:create(r._uiId),j=s.job;
  return {busy:!!j,silent:!!j&&now<j.completedAt,ready:!!j&&now>=j.completedAt,jobId:j?j.id:null,workRemainingMs:j?Math.max(0,j.completedAt-now):0,cooldownRemainingMs:Math.max(0,s.availableAt-now),nextGiveAt:s.availableAt};
 }
 function authorize(run,options,keys){
  check(fields(options,keys),'Invalid workshop command fields.');check(timestamp(options.now),'Invalid absolute workshop timestamp.');
  const r=inspectedRun(run);check(r.phase==='shop'&&r.abandoned!==true,'Give and claim playing cards only in the shop of their active origin run.');
  check(P&&P.capabilities(options.progress,options.actualLevel).workshop,'Workshop unlocks at Emerald Level 9 and actual player Level 10+.');
  const s=own(r,'emeraldWorkshop')?r.emeraldWorkshop:create(r._uiId);check(count(options.expectedRevision)&&options.expectedRevision===s.revision,'Workshop revision changed. Reopen the current action.');return {run:r,state:s};
 }
 function give(run,options){
  const keys=['progress','actualLevel','expectedRevision','now','cardId','rolls'];if(options&&own(options,'friendshipLevel'))keys.push('friendshipLevel');
  const a=authorize(run,options,keys),r=a.run,s=a.state,friendshipLevel=own(options,'friendshipLevel')?options.friendshipLevel:1;
  check(Number.isInteger(friendshipLevel)&&friendshipLevel>=1&&friendshipLevel<=10,'Invalid workshop friendship level.');const workMs=WORK_MS-6000*(friendshipLevel-1);
  check(!s.job,'Claim the existing workshop job before giving another card.');check(options.now>=s.availableAt,'Emerald workshop is cooling down after completion.');check(options.now<=MAX_TIME-workMs-COOLDOWN_MS,'Workshop completion timestamp would overflow.');
  check(cardId(options.cardId),'Choose an owned playing-card id.');const card=r.cards.find(c=>String(c.id)===String(options.cardId));check(card,'That playing card is not owned or is unavailable.');check(s.sequence<Math.floor(Number.MAX_SAFE_INTEGER/2),'Workshop sequence overflow.');
  const rolls=dice(options.rolls),level=P.progress(options.progress,options.actualLevel).level>=10?10:9,input=cardData(card),result=transform(input,level,rolls),id=String(card.id);
  for(const key of ['cards','hand','drawPile','discardPile'])r[key]=r[key].filter(c=>String(c.id)!==id);
  if(own(r,'handDrawOrder'))r.handDrawOrder=r.handDrawOrder.filter(x=>String(x)!==id);
  if(own(r,'forcedCardId')&&String(r.forcedCardId)===id)r.forcedCardId=null;
  s.sequence++;s.revision++;s.availableAt=options.now+workMs+COOLDOWN_MS;s.job={id:jobId(r._uiId,s.sequence),runId:r._uiId,level,startedAt:options.now,completedAt:options.now+workMs,input,result,rolls};
  if(workMs!==WORK_MS||own(s,'workMs'))s.workMs=workMs;r.emeraldWorkshop=s;
  check(validateRun(r),'Workshop give proposal violates card ownership.');return {run:r,changed:true,jobId:s.job.id};
 }
 function claim(run,options){
  const a=authorize(run,options,['progress','actualLevel','expectedRevision','now','jobId']),r=a.run,s=a.state;
  check(s.job&&typeof options.jobId==='string'&&options.jobId===s.job.id,'This workshop job was already claimed or belongs to another action.');check(options.now>=s.job.completedAt,'Emerald is still working silently.');check(r.cards.length<MAX_CARDS,'No room to restore the workshop card.');
  const card=cardData(s.job.result);check(!r.cards.some(c=>String(c.id)===String(card.id)),'The workshop card is already present.');r.cards.push(card);r.drawPile.push(card);s.job=null;s.revision++;r.emeraldWorkshop=s;
  check(validateRun(r),'Workshop claim proposal violates card ownership.');return {run:r,changed:true,card};
 }
 return Object.freeze({VERSION,WORK_MS,COOLDOWN_MS,MAX_TIME,MAX_CARDS,EDITIONS,ENHANCEMENTS,SEALS,MODIFIERS,create,validate,copy,validateCard,validateRun,info,give,claim});
});
