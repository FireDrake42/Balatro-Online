/* Five daily tasks: observed engine deltas, an independent canonical Medal bank and pure views. */
(function(root){'use strict';
// Finite keyed presentation only: lookup at call time; canonical models and receipts stay untouched.

function _aux(key,fallback,params){const rt=globalThis.BOTranslation,values=params||{},plain=()=>fallback.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(all,name)=>Object.prototype.hasOwnProperty.call(values,name)?String(values[name]):all);if(!rt)return plain();const text=rt.t(key,values);return text===key?plain():text;}
function _auxEsc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const _auxKeys=Object.freeze({"Daily Tasks":"task.title","20 Medals each":"aux.daily.tasks.ui.61529e17e1e3","5 tasks ·":"aux.daily.tasks.ui.d7adfffdf1bf","· up to 100 daily":"aux.daily.tasks.ui.b156da454e0b","Save needs attention":"aux.daily.streak.ui.6015fb9d7c7a","+20 Medals":"aux.daily.tasks.ui.4add76ee4121","✓ Complete · Paid +20 Medals":"aux.daily.tasks.ui.875b23193b6b","Complete · Saving reward…":"aux.daily.tasks.ui.0fed84ab5788","In progress · automatic reward":"aux.daily.tasks.ui.6246373a79ee","Task progress and the combined Medal bank are unavailable. Your check-in progress remains separate.":"aux.daily.tasks.ui.228886cebb56"," pending action ":"aux.daily.tasks.ui.9b0c15341959","group":"aux.daily.tasks.ui.ad936fcbed63","groups":"aux.daily.tasks.ui.4ed379d418bb","saving safely…":"aux.daily.tasks.ui.8553a43a25e5","not yet banked":"aux.daily.tasks.ui.eb51ab7d63e7","Saving…":"aux.surveys.ui.23e39291d613","Retry saving progress":"aux.daily.tasks.ui.6dfe69dc79b1","Progress resets at midnight in Tenerife (Atlantic/Canary). Keep every banked Medal across days and new runs. Only actual new actions count: one-hand score, played cards (not retriggers), gross game income, Blind wins (not skips), and Tarot uses. No bonus cash, coins or XP.":"aux.daily.tasks.ui.b4e6a5cc8218"});
function _auxSource(source){if(typeof source!=='string')return source;const key=_auxKeys[source]||globalThis.BOTranslation?.keyFor?.(source);return key?_aux(key,source):source;}


// Source-explicit text/attribute bindings: no scanning English text, DOM-source recovery or user-data inference.
const _auxDisplayValues=new WeakMap();
function _auxInline(key,fallback,params){return '<span data-i18n-inline="true" data-i18n="'+_auxEsc(key)+'"'+(params?' data-i18n-params="'+_auxEsc(JSON.stringify(params))+'"':'')+'>'+_auxEsc(_aux(key,fallback,params))+'</span>';}
function _auxAttribute(attribute,quote,key,fallback,params){return _auxEsc(_aux(key,fallback,params))+quote+' data-i18n-'+attribute+'='+quote+_auxEsc(key)+(params?quote+' data-i18n-params='+quote+_auxEsc(JSON.stringify(params)):'');}
function _auxValue(key,fallback,params){const value=new String(_aux(key,fallback,params));_auxDisplayValues.set(value,{key,fallback,params});return value;}
function _auxSourceValue(source){if(typeof source!=='string')return source;const key=_auxKeys[source]||globalThis.BOTranslation?.keyFor?.(source);return key?_auxValue(key,source):source;}
function _auxValueHTML(value){const binding=value&&typeof value==='object'&&_auxDisplayValues.get(value);return binding?_auxInline(binding.key,binding.fallback,binding.params):_auxEsc(value);}

// Exact keyed projection of source-explicit bindings, before native equality checks.
// Never traverses the live document and never invokes an economy/controller/render callback.
function _auxMarkup(html){return globalThis.BOI18n?.projectHTML?.("daily-tasks",html)??html;}
function _auxSetText(element,key,fallback,params){const text=_aux(key,fallback,params);element.textContent=text;element.setAttribute?.('data-i18n',key);if(params)element.setAttribute?.('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindText?.(element,key,params||{});return text;}
function _auxSetAttribute(element,attribute,key,fallback,params){const text=_aux(key,fallback,params);if(element.nodeType===9&&attribute==='title'){element.title=text;const leaf=element.querySelector('title');if(leaf)_auxSetText(leaf,key,fallback,params);return text;}element.setAttribute(attribute,text);element.setAttribute('data-i18n-'+attribute,key);if(params)element.setAttribute('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindAttribute?.(element,attribute,key,params||{});return text;}


 const STORAGE_KEY='danis-table.daily-tasks.v1',MAX_PENDING=256;
 const counters=['handsPlayed','cardsPlayed','moneyEarned','blindsWon','tarotsUsed'];
 const copy=value=>value==null?null:JSON.parse(JSON.stringify(value));
 const escape=value=>{if(value&&typeof value==='object'&&_auxDisplayValues.has(value))return _auxValueHTML(value);return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));};
 const number=value=>Number(value).toLocaleString('en-US',{maximumFractionDigits:2});
 function mount(api={}){
  const model=root.BODailyTasks,clock=()=>api.now?api.now():Date.now();
  let committed=null,signature='',warning='',errorCode='',queue=[],pending=false,inflight=null,epoch=0,lastDay=null;
  const blocked=()=>['invalid-storage','storage-read','model-unavailable','invalid-state','invalid-pending'].includes(errorCode);
  const tagged=(code,message)=>Object.assign(new Error(message),{code});
  function publish(){try{api.changed?.()}catch(error){/* Rendering cannot reverse a canonical receipt. */}}
  function readCanonical(){
   if(!model)throw tagged('model-unavailable','Daily Tasks are unavailable. Keep daily-tasks.js with the game.');
   let raw;try{raw=root.localStorage.getItem(STORAGE_KEY)}catch(error){throw tagged('storage-read','Daily Tasks storage could not be read. The combined Medal bank is unavailable; your check-in bank is unchanged. Enable browser storage, then retry.');}
   if(raw===null)return model.create();
   try{const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid saved state');return model.normalize(parsed)}
   catch(error){throw tagged('invalid-storage','Daily Tasks save needs attention. Its stored data has not been overwritten. The combined Medal bank is unavailable; your check-in bank is unchanged. Export a backup before changing browser data.');}
  }
  function accept(state){const next=JSON.stringify(state);if(next===signature)return;committed=copy(state);signature=next;try{api.mirror?.(copy(committed))}catch(error){/* Export mirrors are subordinate to canonical storage. */}}
  function info(){if(!model||!committed||blocked())return null;try{return model.info(committed,clock())}catch(error){return null}}
  function dayAt(at){return model.info(model.create(),at).day}
  function status(){return {pending,blocked:blocked()||!info(),code:errorCode,warning,pendingCount:queue.length}}
  function fail(error,fallback='invalid-state'){
   errorCode=error?.code||fallback;warning=error?.code?error.message:'Daily Tasks could not be safely saved. No Medals were awarded. Your pending actions are retained; retry saving progress.';publish();
   return {ok:false,code:errorCode,state:copy(committed),newlyCompleted:[],awardedHalf:0};
  }
  function refresh(){try{const fresh=readCanonical();if(errorCode)warning='';errorCode='';accept(fresh)}catch(error){fail(error)}lastDay=info()?.day??null;publish();return info()}
  function capture(run){return run&&model?.capture?model.capture(run):null}
  function sameCounters(a,b){return counters.every(key=>a?.[key]===b?.[key])}
  function canMerge(previous,next){return !!previous&&previous.runId===next.runId&&dayAt(previous.at)===dayAt(next.at)&&sameCounters(previous.after,next.before)}
  function append(observation){
   const serialized=JSON.stringify(observation);if(queue.some(item=>JSON.stringify(item)===serialized))return true;
   const previous=queue.at(-1);
   if(canMerge(previous,observation)){
    // Scores are non-monotonic. Only genuine new hands may contribute a score;
    // stale lastResult values carried by Tarot/income actions never qualify.
    const scoreA=previous.after.handsPlayed>previous.before.handsPlayed?previous.after.handScore:0;
    const scoreB=observation.after.handsPlayed>observation.before.handsPlayed?observation.after.handScore:0;
    queue[queue.length-1]={runId:previous.runId,at:observation.at,before:previous.before,after:{...observation.after,handScore:Math.max(scoreA||0,scoreB||0)}};return true;
   }
   if(queue.length>=MAX_PENDING)throw tagged('pending-capacity','Daily Tasks have 256 pending action groups. No pending progress was dropped. Free browser storage and retry saving before taking another action.');
   queue.push(observation);return true;
  }
  // This hook runs BEFORE the app's normal SAVE write. Pending receipts follow
  // the next run as well, rather than disappearing when an origin run is replaced.
  function prepare(run=api.getRun?.()){
   if(!run)return;
   if(queue.length){const next=copy(queue);if(JSON.stringify(run._dailyTaskPending)!==JSON.stringify(next))run._dailyTaskPending=next}
   else if(Object.prototype.hasOwnProperty.call(run,'_dailyTaskPending'))delete run._dailyTaskPending;
  }
  function recover(run=api.getRun?.()){
   if(!run||!Object.prototype.hasOwnProperty.call(run,'_dailyTaskPending'))return;
   try{
    const saved=run._dailyTaskPending;if(!Array.isArray(saved)||saved.length>MAX_PENDING)throw new Error('Invalid pending queue');
    for(const raw of saved){const o=copy(raw);if(!o||typeof o.runId!=='string'||!o.before||!o.after||!Number.isFinite(o.at))throw new Error('Invalid pending observation');
     // Validate with the pure model only; recovery never infers old run history.
     model.observe(model.create(),o,clock());if(o.after.handsPlayed<=o.before.handsPlayed)o.after.handScore=0;append(o);
    }
    prepare(run);
   }catch(error){fail(tagged('invalid-pending','Pending Daily Tasks data needs attention. No Medals were awarded and the stored task bank has not been overwritten. Export a backup before changing browser data.'))}
  }
  function ensureCapacity(){
   if(queue.length<MAX_PENDING)return;
   const current=capture(api.getRun?.());if(current&&canMerge(queue.at(-1),{runId:current.runId,at:clock(),before:current.metrics}))return;
   const error=tagged('pending-capacity','Daily Tasks have 256 pending action groups. Retry saving progress before another action; pending actions have not been dropped.');fail(error);throw error;
  }
  function enqueue(before,after,at=clock()){
   if(!before||!after||before.runId!==after.runId)return false;
   if(!counters.some(key=>after.metrics[key]>before.metrics[key]))return false;
   const observation={runId:before.runId,at,before:copy(before.metrics),after:copy(after.metrics)};
   if(observation.after.handsPlayed<=observation.before.handsPlayed)observation.after.handScore=0;
   try{append(observation);return true}catch(error){fail(error);throw error}
  }
  function commit(requestEpoch){
   if(requestEpoch!==epoch)return {ok:false,code:'cancelled',state:copy(committed),newlyCompleted:[],awardedHalf:0};
   if(!queue.length)return {ok:true,code:'idle',state:copy(committed),newlyCompleted:[],awardedHalf:0};
   const batch=queue.slice();let fresh,next,awardedHalf=0,newlyCompleted=[],expired=0;
   try{
    api.assertWritable?.();fresh=readCanonical();next=fresh;
    for(const observation of batch){const result=model.observe(next,observation,clock());if(!result.ok&&result.code==='stale-observation'){expired++;continue}if(!result.ok)throw tagged(result.code||'invalid-observation','Pending Daily Tasks progress could not be saved ('+(result.code||'invalid observation')+'). No Medals were awarded. Pending actions are retained.');next=result.state;awardedHalf+=result.awardedHalf;newlyCompleted.push(...result.newlyCompleted)}
   }catch(error){return fail(error)}
   // One fresh canonical read, pure reductions, one durable write. Neither the
   // cached profile mirror nor a run-save outcome may mint the task wallet.
   if(JSON.stringify(next)!==JSON.stringify(fresh))try{root.localStorage.setItem(STORAGE_KEY,JSON.stringify(next))}
   catch(error){return fail(tagged('storage-write','Daily Tasks could not be saved. No Medals were awarded. Pending actions are kept for retry, including in your run save when browser storage allows. Free some browser storage, then retry saving progress.'))}
   queue=queue.filter(item=>!batch.includes(item));warning=expired?'Old pending Daily Tasks actions expired after 90 calendar days and were discarded without rewards. All banked Medals are safe; new actions still count.':'';errorCode='';accept(next);
   // The canonical receipt already succeeded. A frozen/stale run mirror or a
   // presentation callback must never turn a saved award into a false failure.
   try{prepare()}catch(error){warning+=(warning?' ':'')+'Daily Tasks progress and Medals were saved. The pending run mirror could not be cleared; reload will safely deduplicate it.'}
   lastDay=info()?.day??null;publish();
   if(awardedHalf)try{api.notify?.('Daily Tasks complete · +'+number(awardedHalf/2)+' Medals automatically banked.')}catch(error){/* The reward is already durable. */}
   return {ok:true,code:'saved',state:copy(committed),newlyCompleted,awardedHalf};
  }
  function retry(){
   if(pending)return inflight;if(!queue.length)return Promise.resolve({ok:true,code:'idle',state:copy(committed),newlyCompleted:[],awardedHalf:0});
   const requestEpoch=epoch;pending=true;publish();
   inflight=Promise.resolve().then(()=>root.navigator?.locks?.request?root.navigator.locks.request(STORAGE_KEY,{mode:'exclusive'},()=>commit(requestEpoch)):commit(requestEpoch))
    .catch(error=>requestEpoch===epoch?fail(error,'storage-lock'):{ok:false,code:'cancelled',state:copy(committed),newlyCompleted:[],awardedHalf:0})
    .finally(()=>{if(requestEpoch===epoch){pending=false;inflight=null;publish()}});
   return inflight;
  }
  function reset(){epoch++;queue=[];pending=false;inflight=null;committed=null;signature='';warning='';errorCode='';refresh()}

function _auxTaskLabel(task,attribute=false){const key=task.id==='hand-score'?'aux.daily.task.score':task.id==='cards-played'?'aux.daily.task.play':task.id==='money-earned'?'aux.daily.task.earn':task.id==='blinds-won'?'aux.daily.task.blinds':'aux.daily.task.tarots';return attribute?_auxAttribute('aria-label','"',key,task.label,{count:task.target}):_auxValue(key,task.label,{count:task.target});}
  function render(view='modal'){
   const data=info(),prefix=view==='tab'?'daily-tasks-tab-':'daily-tasks-',paid=data?.tasks.filter(task=>task.paid).length??0;
   return _auxMarkup('<section class="daily-tasks" id="'+prefix+("root\" aria-label=\"Daily Tasks\"><div class=\"daily-tasks-heading\"><div><h3"+" data-i18n=\"task.title\""+">"+_auxEsc(_auxValue("task.title","Daily Tasks"))+"</h3><p>"+_auxInline("aux.daily.tasks.ui.d7adfffdf1bf","5 tasks ·")+" <b"+" data-i18n=\"aux.daily.tasks.ui.61529e17e1e3\""+">"+_auxEsc(_auxValue("aux.daily.tasks.ui.61529e17e1e3","20 Medals each"))+"</b> "+_auxInline("aux.daily.tasks.ui.b156da454e0b","· up to 100 daily")+"</p></div><span class=\"daily-tasks-today\">")+(data?escape(data.day):_auxInline("aux.daily.streak.ui.6015fb9d7c7a","Save needs attention"))+'</span></div>'+
    (data?'<p class="daily-tasks-summary" role="status">'+_auxInline('aux.daily.tasks.summary','{completed} / 5 completed · {paid} / 100 Medals paid today',{completed:paid,paid:paid*20})+'</p><ol class="daily-tasks-list">'+data.tasks.map((task,index)=>{
     const progress=Math.min(task.target,Math.max(0,task.progress)),percent=task.target>0?progress/task.target*100:0;
     return '<li id="'+prefix+'task-'+index+'" class="daily-task'+(task.completed?' is-complete':'')+'" data-daily-task="'+escape(task.id)+'" data-paid="'+String(task.paid)+'"><div class="daily-task-top"><strong>'+escape(_auxTaskLabel(task))+("</strong><span class=\"daily-task-reward\""+" data-i18n=\"aux.daily.tasks.ui.4add76ee4121\""+">"+_auxEsc(_auxValue("aux.daily.tasks.ui.4add76ee4121","+20 Medals"))+"</span></div><div class=\"daily-task-progress\" role=\"progressbar\" aria-label=\"")+_auxTaskLabel(task,true)+'" aria-valuemin="0" aria-valuemax="'+task.target+'" aria-valuenow="'+progress+'"><span style="width:'+percent+'%"></span></div><div class="daily-task-details"><span>'+number(progress)+' / '+number(task.target)+'</span><small>'+(task.paid?_auxInline("aux.daily.tasks.ui.875b23193b6b","✓ Complete · Paid +20 Medals"):task.completed?_auxInline("aux.daily.tasks.ui.0fed84ab5788","Complete · Saving reward…"):_auxInline("aux.daily.tasks.ui.6246373a79ee","In progress · automatic reward"))+'</small></div></li>';
    }).join('')+'</ol>':("<p class=\"daily-tasks-unavailable\""+" data-i18n=\"aux.daily.tasks.ui.228886cebb56\""+">"+_auxEsc(_auxValue("aux.daily.tasks.ui.228886cebb56","Task progress and the combined Medal bank are unavailable. Your check-in progress remains separate."))+"</p>"))+
    (warning?'<p class="daily-tasks-warning" role="alert">'+escape(warning)+'</p>':'')+
    (queue.length?'<div class="daily-tasks-pending"><span>'+queue.length+_auxInline("aux.daily.tasks.ui.9b0c15341959"," pending action ")+(queue.length===1?_auxInline("aux.daily.tasks.ui.ad936fcbed63","group"):_auxInline("aux.daily.tasks.ui.4ed379d418bb","groups"))+' · '+(pending?_auxInline("aux.daily.tasks.ui.8553a43a25e5","saving safely…"):_auxInline("aux.daily.tasks.ui.eb51ab7d63e7","not yet banked"))+'</span><button class="btn ghost small" data-tasks-action="retry" '+(pending?'disabled':'')+'>'+(pending?_auxInline("aux.surveys.ui.23e39291d613","Saving…"):_auxInline("aux.daily.tasks.ui.6dfe69dc79b1","Retry saving progress"))+'</button></div>':'')+
    ("<p class=\"daily-tasks-note\""+" data-i18n=\"aux.daily.tasks.ui.b4e6a5cc8218\""+">"+_auxEsc(_auxValue("aux.daily.tasks.ui.b4e6a5cc8218","Progress resets at midnight in Tenerife (Atlantic/Canary). Keep every banked Medal across days and new runs. Only actual new actions count: one-hand score, played cards (not retriggers), gross game income, Blind wins (not skips), and Tarot uses. No bonus cash, coins or XP."))+"</p></section>"));
  }
  function onClick(event){const button=event.target.closest('button[data-tasks-action="retry"]');if(!button||button.disabled)return;event.preventDefault();event.stopImmediatePropagation();refresh();void retry()}
  function onStorage(event){if(event.key===STORAGE_KEY||event.key===null)refresh()}
  function onVisible(){if(!document.hidden){refresh();void retry()}}
  function heartbeat(){if(!document.hidden&&model&&dayAt(clock())!==lastDay)refresh()}
  document.addEventListener('click',onClick,{capture:true});root.addEventListener('storage',onStorage);root.addEventListener('focus',onVisible);document.addEventListener('visibilitychange',onVisible);
  const timer=root.setInterval(heartbeat,1000);refresh();recover();
  return {capture,enqueue,prepare,recover,ensureCapacity,retry,refresh,info,status,render,reset,getState:()=>copy(committed),heartbeat,destroy:()=>{epoch++;root.clearInterval(timer);document.removeEventListener('click',onClick,{capture:true});root.removeEventListener('storage',onStorage);root.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible)}};
 }
 root.BODailyTasksUI={STORAGE_KEY,MAX_PENDING,mount,createController:mount};
})(window);
