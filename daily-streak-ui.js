/* Daily Streak: explicit check-ins, an independent durable Medal bank, and a read-only view. */
(function(root){'use strict';
 const STORAGE_KEY='danis-table.daily-streak.v1';
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const amount=half=>(half/2).toLocaleString('en-US',{maximumFractionDigits:1});
 const reward=half=>amount(half)+' '+(half===2?'Medal':'Medals');
 const copy=state=>state?{...state}:null;
 function mount(api={}){
  const model=root.BODailyStreak,clock=()=>api.now?api.now():Date.now();
  let committed=null,signature='',warning='',errorCode='',pending=false,lastToday=null,epoch=0;
  const blocked=()=>['invalid-storage','storage-read','model-unavailable','invalid-state'].includes(errorCode);
  function tagged(code,message){return Object.assign(new Error(message),{code})}
  function readCanonical(){
   if(!model)throw tagged('model-unavailable','Daily Streak is unavailable. Keep daily-streak.js with the game.');
   let raw;try{raw=root.localStorage.getItem(STORAGE_KEY)}catch(error){throw tagged('storage-read','Daily Streak storage could not be read. No Medals were awarded. Enable browser storage, then try again.')}
   if(raw===null)return model.create();
   try{
    const parsed=JSON.parse(raw);
    // Only a truly missing key is fresh progress. A present null, array, bad JSON
    // or malformed model is not permission to reset somebody's earned bank.
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid saved state');
    return model.normalize(parsed);
   }catch(error){throw tagged('invalid-storage','Daily Streak save needs attention. Its stored data has not been overwritten. No Medals were awarded. Export a backup from Settings before changing browser data.')}
  }
  function accept(state){
   const nextSignature=JSON.stringify(state);if(nextSignature===signature)return;
   committed=copy(state);signature=nextSignature;
   // Optional statistics/export mirrors cannot undo a durable canonical commit.
   try{api.mirror?.(copy(committed))}catch(error){/* Canonical storage remains authoritative. */}
  }
  function info(){
   if(!model||!committed||blocked())return null;
   try{return model.info(committed,clock())}catch(error){return null}
  }
  function todayKey(){try{return model?.info(model.create(),clock()).today??null}catch(error){return null}}
  function status(){return {pending,blocked:blocked()||!info(),code:errorCode,warning}}
  function notice(data){
   if(warning)return warning;
   if(data?.clockRollback)return 'Your device date is earlier than your last check-in. Correct the clock before claiming again. Your Medals are safe.';
   return '';
  }
  // Rendering shares the visible bank, never the check-in model or its schema.
  function combinedHalf(data){if(api.totalMedalsHalf){const total=api.totalMedalsHalf();return Number.isSafeInteger(total)&&total>=0?total:null}const extra=api.extraMedalsHalf?api.extraMedalsHalf():0,total=data?data.medalsHalf+extra:NaN;return extra!==null&&Number.isSafeInteger(extra)&&extra>=0&&Number.isSafeInteger(total)?total:null}
  function buttonHTML(){return '<button class="btn ghost small daily-streak-open" data-streak-action="open">Daily Streak</button>'}
  function homeHTML(){
   const data=info(),total=combinedHalf(data),bank=total!==null?amount(total)+' Medals':'Combined bank unavailable',label=data?(data.claimedToday?'Checked in today':'Next: '+reward(data.nextRewardHalf)):'Open for save details';
   return '<aside class="daily-streak-home" aria-label="Daily Streak"><div class="daily-streak-home-copy"><strong><span aria-hidden="true">✦</span> Daily Streak'+(data?' <span>· Day '+data.day+' / 90</span>':'')+'</strong><small>'+escape(bank)+' · '+escape(label)+'</small></div><button class="btn daily-streak-home-button" data-streak-action="open">Daily Streak <span aria-hidden="true">↗</span></button></aside>';
  }
  function innerHTML(view='modal'){
   const prefix=view==='tab'?'daily-streak-tab-':'daily-streak-';
   const data=info(),total=combinedHalf(data),day=data?.day??0,alert=notice(data),ready=!!data?.canCheckIn&&!pending&&!blocked();
   const statusText=!data?'Save needs attention':data.clockRollback?'Check your device clock':data.claimedToday?'Checked in today':data.missed?'A fresh streak is ready':'Ready to check in';
   const next=data?'Next check-in: '+reward(data.nextRewardHalf):'Next reward unavailable';
   return '<div class="daily-streak-heading"><div><div class="daily-streak-eyebrow">AVAILABLE FROM LEVEL 1</div>'+(view==='tab'?'<h2>Daily Streak</h2>':'')+'<p>One check-in. A little more every day.</p></div><span class="daily-streak-medal" aria-hidden="true">✦</span></div>'+
    '<div class="daily-streak-summary"><div><small>Current streak</small><strong id="'+prefix+'day" data-streak-day>'+(data?'Day '+day:'Unavailable')+'</strong><span>of 90 days</span></div><div><small>Your Medal bank</small><strong id="'+prefix+'medals" data-streak-medals>'+(total!==null?amount(total):'Unavailable')+'</strong><span>Medals · separate from coins</span></div></div>'+
    '<div class="daily-streak-progress" role="progressbar" aria-label="Daily streak progress" aria-valuemin="0" aria-valuemax="90" aria-valuenow="'+day+'" aria-valuetext="'+(data?'Day '+day+' of 90':'Progress unavailable')+'"><span style="width:'+(day/90*100)+'%"></span></div>'+
    '<div class="daily-streak-scale" aria-hidden="true"><span>0</span><span>30</span><span>60</span><span>90</span></div>'+
    '<div class="daily-streak-checkin"><p id="'+prefix+'status" data-streak-status role="status" tabindex="-1">'+escape(statusText)+'</p><p id="'+prefix+'reward" data-streak-reward>'+escape(next)+'</p>'+(data?.claimedToday?'<small>Today’s check-in: +'+reward(day+1)+'. Next check-in opens at midnight.</small>':'')+
    '<button id="'+prefix+'check-in" class="btn primary" data-streak-action="check-in" '+(ready?'':'disabled')+'>'+(pending?'Saving check-in…':data?.claimedToday?'✓ Checked in today':'Check In'+(data?.canCheckIn?' · +'+reward(data.nextRewardHalf):''))+'</button></div>'+
    (alert?'<p class="daily-streak-warning" role="alert">'+escape(alert)+'</p>':'')+
    (api.tasksHTML?.(view)||'')+
     '<div class="daily-streak-rules"><h3>How it works</h3><ul><li>Check in once each calendar day. A new day starts at <b>midnight in Tenerife</b> (Atlantic/Canary), not 24 hours after your last check-in.</li><li>Day 1 earns <b>1 Medal</b>. Each consecutive day adds <b>0.5</b> to that day’s reward.</li><li>Miss a whole calendar day and the streak resets to <b>Day 0</b>. You <b>keep all banked Medals</b>; your next check-in starts Day 1.</li><li>At <b>Day 90</b>, the streak stays at 90 and each consecutive check-in earns <b>45.5 Medals</b>.</li></ul><p>No automatic claims. No coin or XP bonuses. New runs do not reset your Medal bank. Saved in this browser.</p></div>';
  }
  function modalHTML(){return '<section class="daily-streak-scope" id="daily-streak-root" data-daily-streak-view="modal">'+innerHTML()+'</section>'}
  function tabHTML(){return '<section class="daily-streak-scope daily-streak-tab panel" id="daily-streak-tab" data-daily-streak-view="tab" aria-label="Daily Streak">'+innerHTML('tab')+'</section>'}
  function paint(){
   for(const panel of document.querySelectorAll('[data-daily-streak-view]')){const html=innerHTML(panel.dataset.dailyStreakView);if(panel.innerHTML!==html){const focused=panel.contains(document.activeElement),action=document.activeElement?.dataset.streakAction;panel.innerHTML=html;if(focused){const target=action?panel.querySelector('[data-streak-action="'+action+'"]:not(:disabled)'):null;(target||panel.querySelector('[data-streak-status]'))?.focus({preventScroll:true})}}panel.dataset.streakCode=errorCode}
   const home=document.querySelector('.daily-streak-home');if(home){const html=homeHTML();if(home.outerHTML!==html){const focused=home.contains(document.activeElement);home.outerHTML=html;if(focused)document.querySelector('.daily-streak-home [data-streak-action="open"]')?.focus({preventScroll:true})}}
  }
  function fail(error,fallback){errorCode=error?.code||fallback||'invalid-state';warning=error?.code?error.message:'Daily Streak could not be safely saved. No Medals were awarded. Please try again.';paint();return {ok:false,code:errorCode,state:copy(committed),day:info()?.day??0,rewardHalf:0}}
  function refresh(){
   try{const fresh=readCanonical();warning='';errorCode='';accept(fresh)}catch(error){fail(error)}
   lastToday=todayKey();paint();return info();
  }
  function open(){refresh();api.openModal?.('Daily Streak',modalHTML())}
  function commit(){
   let fresh,result;
   try{api.assertWritable?.();fresh=readCanonical();result=model.checkIn(fresh,clock())}catch(error){return fail(error)}
   if(!result.ok){warning='';errorCode='';accept(fresh);lastToday=todayKey();paint();api.notify?.(result.code==='already-claimed'?'You already checked in today. Come back after midnight in Tenerife.':'Your device clock moved backwards. Correct it before checking in.');return result}
   // No await between this fresh read and the write. Neither cached profile/run
   // data nor their save outcomes are allowed to participate in this receipt.
   try{root.localStorage.setItem(STORAGE_KEY,JSON.stringify(result.state))}catch(error){return fail(tagged('storage-write','Daily Streak could not be saved. No Medals were awarded. Free some browser storage, then try Check In again.'))}
   warning='';errorCode='';accept(result.state);lastToday=todayKey();paint();api.notify?.('Day '+result.day+' checked in · +'+reward(result.rewardHalf)+'.');return result;
  }
  // The app calls reset only after its typed confirmation removes the canonical
  // key. An older queued click must not recreate a receipt after that reset.
  function reset(){epoch++;pending=false;refresh()}
  async function checkIn(){
   if(pending||api.busy?.())return {ok:false,code:'busy',state:copy(committed),day:info()?.day??0,rewardHalf:0};
   const requestEpoch=epoch,cancelled=()=>({ok:false,code:'cancelled',state:copy(committed),day:info()?.day??0,rewardHalf:0}),lockedCommit=()=>requestEpoch===epoch?commit():cancelled();
   pending=true;paint();
   try{
    // Web Locks serialize same-origin tabs. Read and timestamp happen INSIDE
    // the acquired lock, including when a queued request crosses midnight.
    return root.navigator?.locks?.request?await root.navigator.locks.request(STORAGE_KEY,{mode:'exclusive'},lockedCommit):lockedCommit();
   }catch(error){return requestEpoch===epoch?fail(error,'storage-lock'):cancelled()}finally{if(requestEpoch===epoch){pending=false;paint()}}
  }
  function onClick(event){const button=event.target.closest('button[data-streak-action]');if(!button||button.disabled||api.busy?.())return;event.preventDefault();event.stopImmediatePropagation();if(button.dataset.streakAction==='open')open();else if(button.dataset.streakAction==='check-in')void checkIn()}
  function onStorage(event){if(event.key===STORAGE_KEY||event.key===null)refresh()}
  function onVisible(){if(!document.hidden)refresh()}
  function heartbeat(){if(!document.hidden&&todayKey()!==lastToday)refresh()}
  document.addEventListener('click',onClick,{capture:true});root.addEventListener('storage',onStorage);root.addEventListener('focus',onVisible);document.addEventListener('visibilitychange',onVisible);
  const timer=root.setInterval(heartbeat,1000);refresh();
  return {open,refresh,paint,checkIn,reset,getState:()=>copy(committed),info,status,homeHTML,buttonHTML,tabHTML,heartbeat,destroy:()=>{root.clearInterval(timer);document.removeEventListener('click',onClick,{capture:true});root.removeEventListener('storage',onStorage);root.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible)}};
 }
 root.BOStreakUI={STORAGE_KEY,mount};
})(window);
