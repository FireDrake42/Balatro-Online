/* Daily Streak: explicit check-ins, an independent durable Medal bank, and a read-only view. */
(function(root){'use strict';
// Finite keyed presentation only: lookup at call time; canonical models and receipts stay untouched.

function _aux(key,fallback,params){const rt=globalThis.BOTranslation,values=params||{},plain=()=>fallback.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(all,name)=>Object.prototype.hasOwnProperty.call(values,name)?String(values[name]):all);if(!rt)return plain();const text=rt.t(key,values);return text===key?plain():text;}
function _auxEsc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const _auxKeys=Object.freeze({"{value1} Medals":"aux.surveys.ui.520bb8ffb66a","Next: {value1}":"aux.daily.streak.ui.634d8b810db5","Next check-in: {value1}":"aux.daily.streak.ui.fe2b864e577f","Day {value1}":"aux.daily.streak.ui.bf7e2b89f7d8","Day {value1} of 90":"aux.daily.streak.ui.c0f8626a5b59","Check In{value1}":"aux.daily.streak.ui.86ad34d009d5","Medal":"aux.daily.streak.ui.e191eb56478e","Medals":"aux.surveys.ui.deee9f584857","Your device date is earlier than your last check-in. Correct the clock before claiming again. Your Medals are safe.":"aux.daily.streak.ui.2cf31f39421c","Daily Streak":"nav.streak","Combined bank unavailable":"aux.daily.streak.ui.d40148af8645","Checked in today":"aux.daily.streak.ui.0f114a1c4573","Open for save details":"aux.daily.streak.ui.f50bfb55c72e","· Day":"aux.daily.streak.ui.f2fb52bee37c","Save needs attention":"aux.daily.streak.ui.6015fb9d7c7a","Check your device clock":"aux.daily.streak.ui.5fa80130ce65","A fresh streak is ready":"aux.daily.streak.ui.b4d8f8b50b8e","Ready to check in":"aux.daily.streak.ui.fb5d0d53f4d3","Next reward unavailable":"aux.daily.streak.ui.07ba835300f0","AVAILABLE FROM LEVEL 1":"aux.daily.streak.ui.d797366f59da","One check-in. A little more every day.":"aux.daily.streak.ui.f4468d33459e","Current streak":"aux.daily.streak.ui.f1758c281584","Unavailable":"aux.levels.ui.ca1844969742","of 90 days":"aux.daily.streak.ui.77407504b390","Your Medal bank":"aux.daily.streak.ui.e7a9c2435d86","Medals · separate from coins":"aux.daily.streak.ui.e9e047fe324a","Progress unavailable":"aux.daily.streak.ui.563b460c3f26","Today’s check-in: +":"aux.daily.streak.ui.61d876d3f70c","Saving check-in…":"aux.daily.streak.ui.6d1a621eb123","✓ Checked in today":"aux.daily.streak.ui.a794f1951bb2","How it works":"aux.daily.streak.ui.9c870aa6e5e9","midnight in Tenerife":"aux.daily.streak.ui.be66eae291a4","1 Medal":"aux.daily.streak.ui.4ccfc39a0379","Day 0":"aux.daily.streak.ui.a87e7da3f61b","keep all banked Medals":"aux.daily.streak.ui.289a2abc67e6","Day 90":"aux.daily.streak.ui.1279f8efd458","45.5 Medals":"aux.daily.streak.ui.59fa7b2d4064","No automatic claims. No coin or XP bonuses. New runs do not reset your Medal bank. Saved in this browser.":"aux.daily.streak.ui.957ba8306d4e","Check in once each calendar day. A new day starts at":"aux.daily.streak.ui.3d7ef58788ad","(Atlantic/Canary), not 24 hours after your last check-in.":"aux.daily.streak.ui.6abd9abea60d","Day 1 earns":"aux.daily.streak.ui.395b444f88f5","to that day’s reward.":"aux.daily.streak.ui.da15cfa0efef","Miss a whole calendar day and the streak resets to":"aux.daily.streak.ui.6a269ef81293","; your next check-in starts Day 1.":"aux.daily.streak.ui.5d03f1ac56be","At":"aux.daily.streak.ui.c72c5404cfcb",", the streak stays at 90 and each consecutive check-in earns":"aux.daily.streak.ui.89232babd19b"});
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
function _auxMarkup(html){return globalThis.BOI18n?.projectHTML?.("daily-streak",html)??html;}
function _auxSetText(element,key,fallback,params){const text=_aux(key,fallback,params);element.textContent=text;element.setAttribute?.('data-i18n',key);if(params)element.setAttribute?.('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindText?.(element,key,params||{});return text;}
function _auxSetAttribute(element,attribute,key,fallback,params){const text=_aux(key,fallback,params);if(element.nodeType===9&&attribute==='title'){element.title=text;const leaf=element.querySelector('title');if(leaf)_auxSetText(leaf,key,fallback,params);return text;}element.setAttribute(attribute,text);element.setAttribute('data-i18n-'+attribute,key);if(params)element.setAttribute('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindAttribute?.(element,attribute,key,params||{});return text;}


 const STORAGE_KEY='danis-table.daily-streak.v1';
 const escape=value=>value&&typeof value==='object'&&_auxDisplayValues.has(value)?_auxValueHTML(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const amount=half=>(half/2).toLocaleString('en-US',{maximumFractionDigits:1});
 const reward=half=>amount(half)+' '+(half===2?_auxValue("aux.daily.streak.ui.e191eb56478e","Medal"):_auxValue("aux.surveys.ui.deee9f584857","Medals"));
 function _streakCount(kind,half){const amountValue=amount(half),singular=half===2,units=singular?'Medal':'Medals',prefix={nextReward:'Next check-in: ',homeNext:'Next: ',checkedReward:'Today’s check-in: +',checkIn:'Check In · +'}[kind],suffix=kind==='checkedReward'?'. Next check-in opens at midnight.':'';return _auxValue('aux.dailyStreak.'+kind+'.'+(singular?'one':'many'),prefix+'{amount} '+units+suffix,{amount:amountValue});}
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
   if(data?.clockRollback)return _auxValue("aux.daily.streak.ui.2cf31f39421c","Your device date is earlier than your last check-in. Correct the clock before claiming again. Your Medals are safe.");
   return '';
  }
  // Rendering shares the visible bank, never the check-in model or its schema.
  function combinedHalf(data){if(api.totalMedalsHalf){const total=api.totalMedalsHalf();return Number.isSafeInteger(total)&&total>=0?total:null}const extra=api.extraMedalsHalf?api.extraMedalsHalf():0,total=data?data.medalsHalf+extra:NaN;return extra!==null&&Number.isSafeInteger(extra)&&extra>=0&&Number.isSafeInteger(total)?total:null}
  function buttonHTML(){return (_auxMarkup("<button class=\"btn ghost small daily-streak-open\" data-streak-action=\"open\""+" data-i18n=\"nav.streak\""+">"+_auxEsc(_aux("nav.streak","Daily Streak"))+"</button>"))}
  function homeHTML(){
   const data=info(),total=combinedHalf(data),bank=total!==null?_auxValue("aux.surveys.ui.520bb8ffb66a","{value1} Medals",{value1:(amount(total))}):_auxValue("aux.daily.streak.ui.d40148af8645","Combined bank unavailable"),label=data?(data.claimedToday?_auxValue("aux.daily.streak.ui.0f114a1c4573","Checked in today"):_streakCount('homeNext',data.nextRewardHalf)):_auxValue("aux.daily.streak.ui.f50bfb55c72e","Open for save details");
   return _auxMarkup(("<aside class=\"daily-streak-home\" aria-label=\""+_auxAttribute("aria-label","\"","nav.streak","Daily Streak")+"\"><div class=\"daily-streak-home-copy\"><strong><span aria-hidden=\"true\">✦</span> "+_auxInline("nav.streak","Daily Streak"))+(data?(" <span>"+_auxInline("aux.daily.streak.ui.f2fb52bee37c","· Day")+" ")+data.day+' / 90</span>':'')+'</strong><small>'+escape(bank)+' · '+escape(label)+("</small></div><button class=\"btn daily-streak-home-button\" data-streak-action=\"open\">"+_auxInline("nav.streak","Daily Streak")+" <span aria-hidden=\"true\">↗</span></button></aside>"));
  }
  function innerHTML(view='modal'){
   const prefix=view==='tab'?'daily-streak-tab-':'daily-streak-';
   const data=info(),total=combinedHalf(data),day=data?.day??0,alert=notice(data),ready=!!data?.canCheckIn&&!pending&&!blocked();
   const statusText=!data?_auxValue("aux.daily.streak.ui.6015fb9d7c7a","Save needs attention"):data.clockRollback?_auxValue("aux.daily.streak.ui.5fa80130ce65","Check your device clock"):data.claimedToday?_auxValue("aux.daily.streak.ui.0f114a1c4573","Checked in today"):data.missed?_auxValue("aux.daily.streak.ui.b4d8f8b50b8e","A fresh streak is ready"):_auxValue("aux.daily.streak.ui.fb5d0d53f4d3","Ready to check in");
   const next=data?_streakCount('nextReward',data.nextRewardHalf):_auxValue("aux.daily.streak.ui.07ba835300f0","Next reward unavailable");
   return _auxMarkup(("<div class=\"daily-streak-heading\"><div><div class=\"daily-streak-eyebrow\""+" data-i18n=\"aux.daily.streak.ui.d797366f59da\""+">"+_auxEsc(_aux("aux.daily.streak.ui.d797366f59da","AVAILABLE FROM LEVEL 1"))+"</div>")+(view==='tab'?("<h2"+" data-i18n=\"nav.streak\""+">"+_auxEsc(_aux("nav.streak","Daily Streak"))+"</h2>"):'')+("<p"+" data-i18n=\"aux.daily.streak.ui.f4468d33459e\""+">"+_auxEsc(_aux("aux.daily.streak.ui.f4468d33459e","One check-in. A little more every day."))+"</p></div><span class=\"daily-streak-medal\" aria-hidden=\"true\">✦</span></div>")+
    ("<div class=\"daily-streak-summary\"><div><small"+" data-i18n=\"aux.daily.streak.ui.f1758c281584\""+">"+_auxEsc(_aux("aux.daily.streak.ui.f1758c281584","Current streak"))+"</small><strong id=\"")+prefix+'day" data-streak-day>'+(data?_auxInline("aux.daily.streak.ui.bf7e2b89f7d8","Day {value1}",{value1:(day)}):_auxInline("aux.levels.ui.ca1844969742","Unavailable"))+("</strong><span"+" data-i18n=\"aux.daily.streak.ui.77407504b390\""+">"+_auxEsc(_aux("aux.daily.streak.ui.77407504b390","of 90 days"))+"</span></div><div><small"+" data-i18n=\"aux.daily.streak.ui.e7a9c2435d86\""+">"+_auxEsc(_aux("aux.daily.streak.ui.e7a9c2435d86","Your Medal bank"))+"</small><strong id=\"")+prefix+'medals" data-streak-medals>'+(total!==null?amount(total):_auxInline("aux.levels.ui.ca1844969742","Unavailable"))+("</strong><span"+" data-i18n=\"aux.daily.streak.ui.e9e047fe324a\""+">"+_auxEsc(_aux("aux.daily.streak.ui.e9e047fe324a","Medals · separate from coins"))+"</span></div></div>")+
    '<div class="daily-streak-progress" role="progressbar" aria-label="Daily streak progress" aria-valuemin="0" aria-valuemax="90" aria-valuenow="'+day+'" aria-valuetext="'+(data?_auxEsc(_aux("aux.daily.streak.ui.c0f8626a5b59","Day {value1} of 90",{value1:(day)})):_auxEsc(_aux("aux.daily.streak.ui.563b460c3f26","Progress unavailable")))+'"><span style="width:'+(day/90*100)+'%"></span></div>'+
    '<div class="daily-streak-scale" aria-hidden="true"><span>0</span><span>30</span><span>60</span><span>90</span></div>'+
    '<div class="daily-streak-checkin"><p id="'+prefix+'status" data-streak-status role="status" tabindex="-1">'+escape(statusText)+'</p><p id="'+prefix+'reward" data-streak-reward>'+escape(next)+'</p>'+(data?.claimedToday?'<small>'+escape(_streakCount('checkedReward',day+1))+'</small>':'')+
    '<button id="'+prefix+'check-in" class="btn primary" data-streak-action="check-in" '+(ready?'':'disabled')+'>'+(pending?_auxInline("aux.daily.streak.ui.6d1a621eb123","Saving check-in…"):data?.claimedToday?_auxInline("aux.daily.streak.ui.a794f1951bb2","✓ Checked in today"):data?.canCheckIn?escape(_streakCount('checkIn',data.nextRewardHalf)):_auxInline('aux.daily.streak.ui.86ad34d009d5','Check In{value1}',{value1:''}))+'</button></div>'+
    (alert?'<p class="daily-streak-warning" role="alert">'+escape(alert)+'</p>':'')+
    (api.tasksHTML?.(view)||'')+
     ("<div class=\"daily-streak-rules\"><h3 data-i18n=\"aux.daily.streak.ui.9c870aa6e5e9\">"+_auxEsc(_aux("aux.daily.streak.ui.9c870aa6e5e9","How it works"))+"</h3><ul>"+"<li>"+_auxInline("aux.dailyStreak.ruleCalendar","Check in once each calendar day. A new day starts at midnight in Tenerife (Atlantic/Canary), not 24 hours after your last check-in.")+"</li>"+"<li>"+_auxInline("aux.dailyStreak.ruleReward","Day 1 earns {first} Medal. Each consecutive day adds {increase} to that day’s reward.",{"first":1,"increase":0.5})+"</li>"+"<li>"+_auxInline("aux.dailyStreak.ruleMiss","Miss a whole calendar day and the streak resets to Day {reset}. You keep all banked Medals; your next check-in starts Day {restart}.",{"reset":0,"restart":1})+"</li>"+"<li>"+_auxInline("aux.dailyStreak.ruleCap","At Day {cap}, the streak stays at {cap} and each consecutive check-in earns {reward} Medals.",{"cap":90,"reward":45.5})+"</li>"+"</ul><p"+" data-i18n=\"aux.daily.streak.ui.957ba8306d4e\""+">"+_auxEsc(_aux("aux.daily.streak.ui.957ba8306d4e","No automatic claims. No coin or XP bonuses. New runs do not reset your Medal bank. Saved in this browser."))+"</p></div>"));
  }
  function modalHTML(){return _auxMarkup('<section class="daily-streak-scope" id="daily-streak-root" data-daily-streak-view="modal">'+innerHTML()+'</section>')}
  function tabHTML(){return _auxMarkup(("<section class=\"daily-streak-scope daily-streak-tab panel\" id=\"daily-streak-tab\" data-daily-streak-view=\"tab\" aria-label=\""+_auxAttribute("aria-label","\"","nav.streak","Daily Streak")+"\">")+innerHTML('tab')+'</section>')}
  function paint(){
   for(const panel of document.querySelectorAll('[data-daily-streak-view]')){const html=_auxMarkup(innerHTML(panel.dataset.dailyStreakView));if(panel.innerHTML!==html){const focused=panel.contains(document.activeElement),action=document.activeElement?.dataset.streakAction;panel.innerHTML=html;if(focused){const target=action?panel.querySelector('[data-streak-action="'+action+'"]:not(:disabled)'):null;(target||panel.querySelector('[data-streak-status]'))?.focus({preventScroll:true})}}panel.dataset.streakCode=errorCode}
   const home=document.querySelector('.daily-streak-home');if(home){const html=_auxMarkup(homeHTML());if(home.outerHTML!==html){const focused=home.contains(document.activeElement);home.outerHTML=html;if(focused)document.querySelector('.daily-streak-home [data-streak-action="open"]')?.focus({preventScroll:true})}}
  }
  function fail(error,fallback){errorCode=error?.code||fallback||'invalid-state';warning=error?.code?error.message:'Daily Streak could not be safely saved. No Medals were awarded. Please try again.';paint();return {ok:false,code:errorCode,state:copy(committed),day:info()?.day??0,rewardHalf:0}}
  function refresh(){
   try{const fresh=readCanonical();warning='';errorCode='';accept(fresh)}catch(error){fail(error)}
   lastToday=todayKey();paint();return info();
  }
  function open(){refresh();api.openModal?.(_auxValue("nav.streak","Daily Streak"),_auxMarkup(modalHTML()))}
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
