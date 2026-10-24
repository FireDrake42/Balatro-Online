/* Five daily tasks: observed engine deltas, an independent canonical Medal bank and pure views. */
(function(root){'use strict';
 const STORAGE_KEY='danis-table.daily-tasks.v1',MAX_PENDING=256;
 const counters=['handsPlayed','cardsPlayed','moneyEarned','blindsWon','tarotsUsed'];
 const copy=value=>value==null?null:JSON.parse(JSON.stringify(value));
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
  function render(view='modal'){
   const data=info(),prefix=view==='tab'?'daily-tasks-tab-':'daily-tasks-',paid=data?.tasks.filter(task=>task.paid).length??0;
   return '<section class="daily-tasks" id="'+prefix+'root" aria-label="Daily Tasks"><div class="daily-tasks-heading"><div><h3>Daily Tasks</h3><p>5 tasks · <b>20 Medals each</b> · up to 100 daily</p></div><span class="daily-tasks-today">'+(data?escape(data.day):'Save needs attention')+'</span></div>'+
    (data?'<p class="daily-tasks-summary" role="status">'+paid+' / 5 completed · <b>'+paid*20+' / 100 Medals paid today</b></p><ol class="daily-tasks-list">'+data.tasks.map((task,index)=>{
     const progress=Math.min(task.target,Math.max(0,task.progress)),percent=task.target>0?progress/task.target*100:0;
     return '<li id="'+prefix+'task-'+index+'" class="daily-task'+(task.completed?' is-complete':'')+'" data-daily-task="'+escape(task.id)+'" data-paid="'+String(task.paid)+'"><div class="daily-task-top"><strong>'+escape(task.label)+'</strong><span class="daily-task-reward">+20 Medals</span></div><div class="daily-task-progress" role="progressbar" aria-label="'+escape(task.label)+'" aria-valuemin="0" aria-valuemax="'+task.target+'" aria-valuenow="'+progress+'"><span style="width:'+percent+'%"></span></div><div class="daily-task-details"><span>'+number(progress)+' / '+number(task.target)+'</span><small>'+(task.paid?'✓ Complete · Paid +20 Medals':task.completed?'Complete · Saving reward…':'In progress · automatic reward')+'</small></div></li>';
    }).join('')+'</ol>':'<p class="daily-tasks-unavailable">Task progress and the combined Medal bank are unavailable. Your check-in progress remains separate.</p>')+
    (warning?'<p class="daily-tasks-warning" role="alert">'+escape(warning)+'</p>':'')+
    (queue.length?'<div class="daily-tasks-pending"><span>'+queue.length+' pending action '+(queue.length===1?'group':'groups')+' · '+(pending?'saving safely…':'not yet banked')+'</span><button class="btn ghost small" data-tasks-action="retry" '+(pending?'disabled':'')+'>'+(pending?'Saving…':'Retry saving progress')+'</button></div>':'')+
    '<p class="daily-tasks-note">Progress resets at midnight in Tenerife (Atlantic/Canary). Keep every banked Medal across days and new runs. Only actual new actions count: one-hand score, played cards (not retriggers), gross game income, Blind wins (not skips), and Tarot uses. No bonus cash, coins or XP.</p></section>';
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
