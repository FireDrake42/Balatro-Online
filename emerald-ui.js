/* Emerald v3 public-state presentation. DOM reads and manual controls never
 * roll gifts or advance progression. Existing genuine automatic utterances keep
 * ONE guarded gift opportunity after ten visible seconds. Auto Speak only
 * operates the manual Next control: no voice, chat or extra gift opportunities.
 * Its five-minute elapsed window / one-minute rest are tab-local monotonic UI
 * state, never saved. Reloading cancels them; no background catch-up advances.
 */
(function(root){'use strict';
// Finite keyed presentation only: lookup at call time; canonical models and receipts stay untouched.

function _aux(key,fallback,params){const rt=globalThis.BOTranslation,values=params||{},plain=()=>fallback.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(all,name)=>Object.prototype.hasOwnProperty.call(values,name)?String(values[name]):all);if(!rt)return plain();const text=rt.t(key,values);return text===key?plain():text;}
function _auxEsc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const _auxKeys=Object.freeze({"{value1}, your green beetle companion":"aux.emerald.ui.b3569f43f4f1","{value1} · next tip":"aux.emerald.ui.84c3ce0bf9e4","Ask {value1} about Balatro":"aux.emerald.ui.b12d1e0f8a83","{value1} is working silently on your card":"aux.emerald.ui.88fdc3858ede","{value1} game companion":"aux.emerald.ui.2c77bcf64382","This speech lasts ten seconds. Next tip in {value1}s.":"aux.emerald.ui.2c2156b41aec","Auto Speak · {value1}{value2}s":"aux.emerald.ui.a2343f19deb7","Auto Speak · cooldown {value1}s":"aux.emerald.ui.2a62a85a8a7d","Frenzy active, {value1} seconds remaining":"aux.emerald.ui.9ad8041f1859","{value1} of {value2} scored cards":"aux.emerald.ui.a81c85269b95","{value1}/{value2} · {value3}s · rainbow rush":"aux.emerald.ui.8b7076d5c37d","{value1}/{value2} scored cards":"aux.emerald.ui.04c44a00c88e","Emerald Level {value1}, view Emerald’s level roadmap":"aux.emerald.ui.1fdf58451a58","Emerald Level {value1}":"aux.emerald.ui.3a522cc25197","Emerald E{value1} · {value2}":"aux.emerald.ui.1ac92567b2a8","{value1} of {value2} fresh game wins toward Emerald Level {value3}":"aux.emerald.ui.ae524ba56fdd","Friendship Lv{value1} · {value2}/{value3} FP · {value4} · +{value5}% nicer":"aux.emerald.ui.bf83af1f55d3","Working silently · {value1}s":"aux.emerald.ui.cb6a771bd776","Workshop cooldown · {value1}s":"aux.emerald.ui.bea5e2db639a","Looker Mode only compares fully visible cards in your current playable hand.":"aux.emerald.ui.734ea89b5281","Tips are paused. Choose 1st tips, 2nd tips, or both.":"aux.emerald.ui.8a427667488a","I’ll check the current table before my next tip.":"aux.emerald.ui.cf817f2e8fda","I’m here while you explore. Choose the next tip when you’re ready.":"aux.emerald.ui.a79ec42f931f","Looker Mode · On":"aux.emerald.ui.c6e9a2e83b70","Looker Mode":"aux.emerald.ui.030cd491bbd6","Browse tips only — no extra gift rolls":"aux.emerald.ui.2f779cacb077","second":"aux.emerald.ui.16367aacb67a","Show tips":"aux.emerald.ui.754e196536fe","Quiet":"aux.emerald.ui.c0ebb7d6b693","Auto Speak":"aux.emerald.ui.d1378b7a864d","Auto Next every 10 seconds for 5 minutes, then 1 minute cooldown. Pauses when unavailable; the elapsed window still ends. No voice, chat or extra gifts. This tab only: reloading cancels.":"aux.emerald.ui.a59ae4dc9c47","Frenzy scoring-card charge":"aux.emerald.ui.aec207536a4d","FRENZY":"aux.emerald.ui.f41db4a2359f","Frenzy scored cards":"aux.emerald.ui.7da0d3597416","FRENZY!!! · +50% Mult":"aux.emerald.ui.30b9b00d5d3e","Offline local rules, not online AI. No questions leave this device. No swearing: the whole game is banned on this browser for 3 calendar months. All saves are kept; this is not an account/server ban.":"aux.emerald.ui.bdbff79fb716","Ask a green beetle about Balatro":"aux.emerald.ui.a8aee4fa7f45","How does Mult work?":"aux.emerald.ui.21150783779b","Send":"aux.emerald.ui.f6f4688ff23d","The guarded local game chat is unavailable. Keep all game files together.":"aux.emerald.ui.6178151b6f5f","Ask one Balatro question, using 1–240 characters.":"aux.emerald.ui.fff56c1f49c9","No answer was committed. Your saves are unchanged.":"aux.emerald.ui.889fb169a9c4","The guarded game chat is unavailable.":"aux.emerald.ui.561b0a986386","a green beetle, your green beetle companion":"aux.emerald.ui.77d734f768f9","a green beetle · next tip":"aux.emerald.ui.f76da73e7a73","1st tips":"aux.emerald.ui.c97df97bd7b2","2nd tips":"aux.emerald.ui.4fdd92680f1c","Talk":"aux.emerald.ui.449f5a775762","View Emerald’s own levels and upgrades":"aux.emerald.ui.676b0150dfa6","BUTTON":"aux.emerald.ui.9e9f23ca031c","Emerald fresh game wins":"aux.emerald.ui.b9976b1c5774","Emerald progress is unavailable.":"aux.emerald.ui.006519d1dfcc","Emerald Level 10, MAX, 100%":"aux.emerald.ui.7013cd322150","Emerald friendship points":"aux.emerald.ui.c1d8fdb7ff16","Give Emerald a card":"aux.emerald.ui.73092281f9a1","Collect upgraded card":"aux.emerald.ui.3189c1f06b9f","Give or collect in the shop of this run":"aux.emerald.ui.e9a55057b5a1"});
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
function _auxMarkup(html){return globalThis.BOI18n?.projectHTML?.("emerald",html)??html;}
function _auxSetText(element,key,fallback,params){const text=_aux(key,fallback,params);element.textContent=text;element.setAttribute?.('data-i18n',key);if(params)element.setAttribute?.('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindText?.(element,key,params||{});return text;}
function _auxSetAttribute(element,attribute,key,fallback,params){const text=_aux(key,fallback,params);if(element.nodeType===9&&attribute==='title'){element.title=text;const leaf=element.querySelector('title');if(leaf)_auxSetText(leaf,key,fallback,params);return text;}element.setAttribute(attribute,text);element.setAttribute('data-i18n-'+attribute,key);if(params)element.setAttribute('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindAttribute?.(element,attribute,key,params||{});return text;}


 const COOLDOWN=10000,AUTO_DURATION=300000,AUTO_REST=60000;
 function mount(host){
  let stage=null,group=null,bubble=null,photo=null,photoLink=null,controls=null,levelBar=null,friendshipBar=null,lookerButton=null,workshopButton=null,meter=null,nextButton=null,quietButton=null,talkButton=null,autoButton=null,chatForm=null,chatInput=null,chatAnswer=null;
  let autoUntil=null,autoNextAt=null,autoCooldownUntil=0,autoWasEligible=false,contextSeen=false,contextIdentity=null,contextRun=null,contextRunId=null,contextPage=null;
  let lookerMode=false;
  let entries=[],current=null,cursor=0,digest='',latestState=null,compact=false,lastFrenzy=null,nextAt=null,lastSpeechAt=null,turnSource='none',autoDone=true,autoVisibleMs=0,lastObserved=null,wasEligible=false,retryAt=0,timer=null,destroyed=false,greeted=false,generation=0,sending=false,prefPending=false,chatOpen=false;
  const quirks=root.BOEmeraldTextQuirks?.create();let utterance=0,lookerTurn=0,chatTurn=0,chatRaw=null,chatSpoken=false;
  const speechText=(raw,s)=>root.BOEmerald.displayText(root.BOI18n?.projectText?.('emerald',raw)??raw,s.level);
  function answer(raw,spoken=false){chatRaw=String(raw??'');chatSpoken=spoken;if(spoken)chatTurn++;if(chatAnswer)chatAnswer.textContent=chatRaw}
  function paintAnswer(s){if(!chatAnswer||chatRaw===null)return;const raw=speechText(chatRaw,s);if(chatSpoken&&quirks)quirks.paint(chatAnswer,raw,'chat:'+chatTurn,s.level);else if(chatAnswer.textContent!==raw)chatAnswer.textContent=raw}
  const now=()=>typeof host.now==='function'?host.now():root.performance?.now?root.performance.now():Date.now();
  function releaseNotice(){const n=meter?.querySelector('#faucet-ready-notice');if(n){n.classList.remove('frenzy-inline-notice');document.body.append(n)}}
  function remove(){stage?.remove();stage=null;group=null;bubble=null;photo=null;photoLink=null;controls=null;levelBar=null;friendshipBar=null;lookerButton=null;workshopButton=null;nextButton=null;quietButton=null;talkButton=null;autoButton=null;chatForm=null;chatInput=null;chatAnswer=null;chatRaw=null;chatSpoken=false;generation++;sending=false;chatOpen=false}
  function tableStamp(s){const r=s?.run;return JSON.stringify([r?._uiId,r?.round,r?.roundHands,r?.phase,r?.lastResult?.key,r?.lastResult?.total])}
  function preferences(s){return root.BOEmerald.tips(s?.tips)}
  function suppressAutomatic(){turnSource='manual';autoDone=true;autoVisibleMs=0;wasEligible=false}
  function gameContext(s){return root.BOEmerald?.visible(s)===true}
  function allowed(s){const model=root.BOEmerald;return !!model&&s?.blackjack!==true&&(model.presentationVisible?model.presentationVisible(s):model.visible(s))&&!root.document.hidden}
  function speakingAllowed(s){const t=preferences(s);return allowed(s)&&!lookerMode&&!compact&&s.workshop?.silent!==true&&(t.first||t.second)}
  function refresh(s){
   const game=gameContext(s),r=game?s.run:{},publicR=game?root.BOEmerald.publicRun(s):null,f=game?root.BOEmerald.frenzyInfo(s):{},t=preferences(s);
   // Digest ONLY public facts. In particular, never stringify run.hand, which
   // would read face-down rank/suit fields, or any deck/draw/seed/RNG fields.
   const key=JSON.stringify(game?[s.language,s.section,s.surveyCompletion,lookerMode,s.friendship?.fp,s.level,s.page,s.survey,s.protected,s.suspended,publicR,r._uiId,r.phase,r.money,r.target,r.score,r.hands,r.shop,r.lastResult?.name,r.lastResult?.key,r.lastResult?.chips,r.lastResult?.mult,r.lastResult?.total,s.selected,s.pet,s.capabilities,s.faucetReady,s.faucetLevel,s.passiveReady,s.xp,t,f.active,f.charge,f.required,f.meterMax]:[s.language,s.section,s.surveyCompletion,s.friendship?.fp,s.level,s.page,s.pet,t]);
   if(key!==digest){entries=root.BOEmerald.catalog(root.BO,lookerMode?{...s,looker:true}:s,t);digest=key}
   if(current?.kind==='entry'){const fresh=entries.find(e=>e.id===current.id);current=fresh?{...fresh,kind:'entry'}:null}
   else if(current?.kind==='event'&&(!game||current.stamp!==tableStamp(s)))current=null;
  }
  function begin(entry,s,at,source='automatic'){
   utterance++;current=entry;lastSpeechAt=at;nextAt=at+COOLDOWN;turnSource=source;autoDone=source!=='automatic';autoVisibleMs=0;lastObserved=at;wasEligible=speakingAllowed(s);retryAt=0;
  }
  function selectEntry(s,at,source){if(!entries.length)return false;cursor=(cursor+1)%entries.length;begin({...entries[cursor],kind:'entry'},s,at,source);return true}
  function advanceTip(s,at){if(!speakingAllowed(s)||nextAt===null||at<nextAt)return false;refresh(s);return selectEntry(s,at,'manual')}
  function stopAuto(at){if(autoUntil!==null){const ended=Math.min(at,autoUntil);autoUntil=null;autoNextAt=null;autoCooldownUntil=ended+AUTO_REST;autoWasEligible=false;suppressAutomatic()}}
  function checkContext(s,at){
   const identity=s?.identity??null,run=s?.run||null,runId=run?._uiId??null,page=s?.page??null;
   if(contextSeen&&(identity!==contextIdentity||run!==contextRun||runId!==contextRunId||page!==contextPage)){stopAuto(at);suppressAutomatic();lookerMode=false;digest='';current=null;utterance++;if(identity!==contextIdentity||runId!==contextRunId)quirks?.clear();chatRaw=null;chatSpoken=false;generation++;sending=false;chatOpen=false;if(chatInput)chatInput.value='';if(chatAnswer)chatAnswer.textContent='';const send=chatForm?.querySelector('button');if(send)send.disabled=false}
   contextSeen=true;contextIdentity=identity;contextRun=run;contextRunId=runId;contextPage=page;
   if(!Number.isInteger(s?.level)||s.level<36||s.level>100)stopAuto(at);
  }
  function cycleAuto(s,at,advance=false){
   if(autoUntil===null)return;
   if(at>=autoUntil){const ended=autoUntil;stopAuto(ended);return}
   if(!speakingAllowed(s)||s.level<36){autoWasEligible=false;return}
   if(!autoWasEligible){autoWasEligible=true;autoNextAt=Math.max(at+COOLDOWN,nextAt??0);return}
   if(advance&&at>=autoNextAt){advanceTip(s,at);autoNextAt=at+COOLDOWN}
  }
  function toggleAuto(){let s;try{s=host.state()}catch(_){return}const at=now();checkContext(s,at);cycleAuto(s,at);
   if(autoUntil!==null){stopAuto(at);paint(s,at);return}
   if(!speakingAllowed(s)||s.level<36||at<autoCooldownUntil)return;refresh(s);if(!entries.length)return;
   suppressAutomatic();autoUntil=at+AUTO_DURATION;autoNextAt=Math.max(at+COOLDOWN,nextAt??0);autoWasEligible=true;paint(s,at);
  }
  function openRoadmap(){let s;try{s=host.state()}catch(_){return}if(!allowed(s)||s.level<36||typeof host.openRoadmap!=='function')return;host.openRoadmap()}
  function paint(s,at){if(!bubble)return;const t=preferences(s),silent=s.workshop?.silent===true,name=root.BOEmerald.displayName(s.level);
   const next=_aux("aux.emerald.ui.84c3ce0bf9e4","{value1} · next tip",{value1:(name)});if(nextButton.textContent!==next)nextButton.textContent=next;
   if(chatForm){const label=chatForm.querySelector('label'),text=_aux("aux.emerald.ui.b12d1e0f8a83","Ask {value1} about Balatro",{value1:(name)});if(label.textContent!==text)label.textContent=text}
   const message=lookerMode?(entries[0]?.message||_aux("aux.emerald.ui.734ea89b5281","Looker Mode only compares fully visible cards in your current playable hand.")):!t.first&&!t.second?_aux("aux.emerald.ui.8a427667488a","Tips are paused. Choose 1st tips, 2nd tips, or both."):current?.message||(gameContext(s)?_aux("aux.emerald.ui.cf817f2e8fda","I’ll check the current table before my next tip."):_aux("aux.emerald.ui.a79ec42f931f","I’m here while you explore. Choose the next tip when you’re ready."));
   if(lookerButton){lookerButton.hidden=!gameContext(s);lookerButton.disabled=silent;lookerButton.textContent=lookerMode?_aux("aux.emerald.ui.c6e9a2e83b70","Looker Mode · On"):_aux("aux.emerald.ui.030cd491bbd6","Looker Mode");lookerButton.setAttribute('aria-pressed',String(lookerMode))}
   bubble.hidden=compact||silent;stage.classList.toggle('emerald-compact',compact);stage.classList.toggle('emerald-working',silent);stage.setAttribute('aria-label',silent?_aux("aux.emerald.ui.88fdc3858ede","{value1} is working silently on your card",{value1:(name)}):_aux("aux.emerald.ui.2c77bcf64382","{value1} game companion",{value1:(name)}));
   if(nextButton){const remaining=nextAt===null?COOLDOWN:Math.max(0,nextAt-at);nextButton.disabled=silent||compact||!entries.length||remaining>0;nextButton.title=remaining>0?_aux("aux.emerald.ui.2c2156b41aec","This speech lasts ten seconds. Next tip in {value1}s.",{value1:(Math.ceil(remaining/1000))}):_aux("aux.emerald.ui.2f779cacb077","Browse tips only — no extra gift rolls");nextButton.setAttribute('aria-disabled',String(nextButton.disabled))}
   for(const name of ['first',"second"]){const b=controls?.querySelector('[data-emerald-tips="'+name+'"]');if(b){b.setAttribute('aria-pressed',String(t[name]));b.disabled=prefPending||!gameContext(s)}}
   if(quietButton){quietButton.textContent=compact?_aux("aux.emerald.ui.754e196536fe","Show tips"):_aux("aux.emerald.ui.c0ebb7d6b693","Quiet");quietButton.setAttribute('aria-pressed',String(compact))}
   if(talkButton){talkButton.disabled=silent||lookerMode||!gameContext(s);talkButton.setAttribute('aria-expanded',String(chatOpen&&gameContext(s)))}
   if(chatForm)chatForm.hidden=!chatOpen||silent||!gameContext(s);
   // Choose only after visibility is set. Keep the native begin identity outside
   // refreshed catalog entries; reopening/rerendering is not another utterance.
   const raw=speechText(message,s),key=lookerMode?'looker:'+lookerTurn+':'+tableStamp(s)+':'+(entries[0]?.id||'fallback'):'speech:'+utterance+':'+(current?'current':'fallback');
   if(t.first||t.second){if(quirks)quirks.paint(bubble,raw,key,s.level);else if(bubble.textContent!==raw)bubble.textContent=raw}else if(bubble.textContent!==raw)bubble.textContent=raw;
   paintAnswer(s);
   if(autoButton){const active=autoUntil!==null,rest=Math.max(0,autoCooldownUntil-at),remaining=active?Math.ceil((autoUntil-at)/1000):0;autoButton.textContent=active?_aux("aux.emerald.ui.a2343f19deb7","Auto Speak · {value1}{value2}s",{value1:(speakingAllowed(s)?'Stop ':'Paused · Stop '),value2:(remaining)}):rest>0?_aux("aux.emerald.ui.2a62a85a8a7d","Auto Speak · cooldown {value1}s",{value1:(Math.ceil(rest/1000))}):_aux("aux.emerald.ui.d1378b7a864d","Auto Speak");autoButton.disabled=!active&&(rest>0||!speakingAllowed(s)||!entries.length);autoButton.setAttribute('aria-pressed',String(active));_auxSetAttribute(autoButton,"title","aux.emerald.ui.a59ae4dc9c47","Auto Next every 10 seconds for 5 minutes, then 1 minute cooldown. Pauses when unavailable; the elapsed window still ends. No voice, chat or extra gifts. This tab only: reloading cancels.")}
  }
  function updateFrenzy(s){const visible=s&&s.page==='game'&&s.run&&Number.isInteger(s.level)&&s.level>=33&&!s.protected&&!s.survey&&!s.suspended,active=visible&&s.frenzy?.active===true;
   if(!visible){releaseNotice();meter?.remove();meter=null}
   else{const parent=document.querySelector('#app .table-column')||document.querySelector('#app');if(parent){
    if(!meter?.isConnected){meter=document.createElement('section');meter.id='frenzy-meter';meter.className='frenzy-meter';meter.setAttribute('aria-label',_aux("aux.emerald.ui.aec207536a4d","Frenzy scoring-card charge"));meter.innerHTML=("<div class=\"frenzy-title\""+" data-i18n=\"aux.emerald.ui.f41db4a2359f\""+">"+_auxEsc(_aux("aux.emerald.ui.f41db4a2359f","FRENZY"))+"</div><div class=\"frenzy-track\" role=\"progressbar\" aria-label=\""+_auxAttribute("aria-label","\"","aux.emerald.ui.7da0d3597416","Frenzy scored cards")+"\" aria-valuemin=\"0\"><span class=\"frenzy-fill\"></span></div><div class=\"frenzy-count\"></div>");parent.prepend(meter)}
    const f=root.BOEmerald.frenzyInfo(s),track=meter.querySelector('.frenzy-track'),value=Math.max(0,Math.min(f.meterMax,f.meter));
    meter.classList.toggle('is-active',f.active);meter.querySelector('.frenzy-title').textContent=f.active?_aux("aux.emerald.ui.30b9b00d5d3e","FRENZY!!! · +50% Mult"):_aux("aux.emerald.ui.f41db4a2359f","FRENZY");meter.querySelector('.frenzy-fill').style.width=(100*value/f.meterMax)+'%';track.setAttribute('aria-valuemax',String(f.meterMax));track.setAttribute('aria-valuenow',String(Math.round(value)));track.setAttribute('aria-valuetext',f.active?_aux("aux.emerald.ui.9ad8041f1859","Frenzy active, {value1} seconds remaining",{value1:((f.remainingMs/1000).toFixed(1))}):_aux("aux.emerald.ui.a81c85269b95","{value1} of {value2} scored cards",{value1:(f.charge),value2:(f.required)}));meter.querySelector('.frenzy-count').textContent=f.active?_aux("aux.emerald.ui.8b7076d5c37d","{value1}/{value2} · {value3}s · rainbow rush",{value1:(Math.round(value)),value2:(f.meterMax),value3:((f.remainingMs/1000).toFixed(1))}):_aux("aux.emerald.ui.04c44a00c88e","{value1}/{value2} scored cards",{value1:(f.charge),value2:(f.required)});
    const notice=document.querySelector('#faucet-ready-notice');if(notice){notice.classList.add('frenzy-inline-notice');if(notice.parentNode!==meter)meter.append(notice)}
   }}
   document.body.classList.toggle('frenzy-active',!!active);document.body.classList.toggle('frenzy-motion-off',s?.motion===false);if(active!==lastFrenzy){lastFrenzy=!!active;host.frenzyChanged?.(!!active)}
  }
  function button(text,handler){const b=document.createElement('button');b.type='button';b.textContent=text;if(handler)b.addEventListener('click',handler);return b}
  function changeTips(name){let s;try{s=host.state()}catch(_){return}if(!allowed(s)||!gameContext(s)||prefPending||typeof host.setTips!=='function')return;
   const next=preferences(s);next[name]=!next[name];prefPending=true;suppressAutomatic();paint(s,now());
   function done(result){prefPending=false;if(destroyed)return;if(result?.ok!==true&&chatAnswer)answer(result?.reason||'Tip preferences were not saved. Keep your current save.');update()}
   try{const result=host.setTips(next);if(result&&typeof result.then==='function')result.then(done,error=>done({ok:false,reason:error.message}));else done(result)}catch(error){done({ok:false,reason:error.message})}
  }
  function createChat(){
   chatForm=document.createElement('form');chatForm.id='emerald-chat-form';chatForm.className='emerald-chat';chatForm.hidden=true;
   const note=document.createElement('p');note.className='emerald-chat-note';_auxSetText(note,"aux.emerald.ui.bdbff79fb716","Offline local rules, not online AI. No questions leave this device. No swearing: the whole game is banned on this browser for 3 calendar months. All saves are kept; this is not an account/server ban.");
   const label=document.createElement('label');label.htmlFor='emerald-chat-input';_auxSetText(label,"aux.emerald.ui.a8aee4fa7f45","Ask a green beetle about Balatro");
   chatInput=document.createElement('input');chatInput.id='emerald-chat-input';chatInput.name='emerald-question';chatInput.type='text';chatInput.maxLength=240;chatInput.autocomplete='off';chatInput.required=true;_auxSetAttribute(chatInput,"placeholder","aux.emerald.ui.21150783779b","How does Mult work?");
   const send=button(_aux("aux.emerald.ui.f6f4688ff23d","Send"));send.type='submit';chatAnswer=document.createElement('p');chatAnswer.id='emerald-chat-answer';chatAnswer.setAttribute('role','status');chatAnswer.setAttribute('aria-live','polite');chatForm.append(note,label,chatInput,send,chatAnswer);
   chatForm.addEventListener('submit',async event=>{event.preventDefault();let s;try{s=host.state()}catch(_){return}if(sending||!allowed(s)||!gameContext(s)||s.workshop?.silent)return;
    suppressAutomatic();const text=chatInput.value;if(typeof host.sendChat!=='function'){answer(_aux("aux.emerald.ui.6178151b6f5f","The guarded local game chat is unavailable. Keep all game files together."));return}
    if(!text.trim()||text.length>240){answer(_aux("aux.emerald.ui.fff56c1f49c9","Ask one Balatro question, using 1–240 characters."));return}
    const token=generation,runId=s.run._uiId;sending=true;send.disabled=true;
    try{const result=await host.sendChat(text);if(destroyed||generation!==token||host.state()?.run?._uiId!==runId)return;answer(result?.message||result?.reason||_aux("aux.emerald.ui.889fb169a9c4","No answer was committed. Your saves are unchanged."),result?.ok===true&&typeof result.message==='string');paintAnswer(host.state());if(result?.ok)chatInput.value=''}catch(error){if(generation===token&&chatAnswer){answer(error.message||_aux("aux.emerald.ui.561b0a986386","The guarded game chat is unavailable."));paintAnswer(host.state())}}finally{if(generation===token){sending=false;send.disabled=false}}
   });
  }
  function createStage(parent,s){
   remove();stage=document.createElement('section');stage.id='emerald-companion';stage.className='emerald-stage';group=document.createElement('div');group.className='emerald-group';bubble=document.createElement('p');bubble.className='emerald-bubble';bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');
   photo=root.BOEmeraldPortrait.create(document,s.pet?.unlocked?s.pet.level:0,s.level);controls=document.createElement('div');controls.className='emerald-controls';
   nextButton=button(_aux("aux.emerald.ui.f76da73e7a73","a green beetle · next tip"),()=>{let live;try{live=host.state()}catch(_){return}const at=now();if(advanceTip(live,at))paint(live,at)});nextButton.dataset.emeraldNext='';
   quietButton=button(compact?_aux("aux.emerald.ui.754e196536fe","Show tips"):_aux("aux.emerald.ui.c0ebb7d6b693","Quiet"),()=>{compact=!compact;if(compact)suppressAutomatic();update()});quietButton.dataset.emeraldQuiet='';
   const first=button(_aux("aux.emerald.ui.c97df97bd7b2","1st tips"),()=>changeTips('first')),second=button(_aux("aux.emerald.ui.4fdd92680f1c","2nd tips"),()=>changeTips("second"));first.dataset.emeraldTips='first';second.dataset.emeraldTips='second';
   talkButton=button(_aux("aux.emerald.ui.449f5a775762","Talk"),()=>{let live;try{live=host.state()}catch(_){return}if(!allowed(live)||!gameContext(live)||live.workshop?.silent)return;suppressAutomatic();chatOpen=!chatOpen;paint(live,now());if(chatOpen)chatInput?.focus()});talkButton.dataset.emeraldTalk='';talkButton.setAttribute('aria-controls','emerald-chat-form');
   lookerButton=button(_aux("aux.emerald.ui.030cd491bbd6","Looker Mode"),()=>{let live;try{live=host.state()}catch(_){return}if(!allowed(live)||!gameContext(live)||live.workshop?.silent)return;const at=now();stopAuto(at);suppressAutomatic();lookerMode=!lookerMode;lookerTurn++;compact=false;chatOpen=false;current=null;digest='';refresh(live);if(!lookerMode&&entries[0])begin({...entries[0],kind:'entry'},live,at,'manual');update()});lookerButton.dataset.emeraldLooker='';
   controls.append(nextButton,quietButton,first,second,talkButton,lookerButton);createChat();group.append(bubble,photo,controls,chatForm);stage.append(group);parent.append(stage);
  }
  function updateLevel(s){const caps=s.capabilities||{},pet=s.pet,enhanced=s.level>=36,canRoadmap=typeof host.openRoadmap==='function';
   root.BOEmeraldPortrait.update(photo,pet?.unlocked?pet.level:0,s.level);
   stage.classList.toggle('emerald-following',s.following===true&&pet?.level>=5);stage.classList.toggle('emerald-motion-off',s.motion===false);stage.classList.toggle('emerald-aura',s.level>=10&&caps.greenAura===true);stage.classList.toggle('emerald-rich-green',s.level>=38);stage.style.setProperty('--emerald-scale',String(s.level>=10&&caps.photoScale||1));stage.style.setProperty('--emerald-speed',String(s.level>=10&&caps.movementSpeed||1));stage.dataset.emeraldLevel=String(pet?.level||1);stage.dataset.position=['bob','glide','corner'][Math.floor(now()/24000)%3];
   if(enhanced){
    if(!photoLink){photoLink=button('',openRoadmap);photoLink.className='emerald-photo-link';photoLink.dataset.emeraldRoadmap='photo';group.insertBefore(photoLink,photo);photoLink.append(photo)}
    photoLink.disabled=!canRoadmap;photoLink.setAttribute('aria-label',_aux("aux.emerald.ui.1fdf58451a58","Emerald Level {value1}, view Emerald’s level roadmap",{value1:(pet?.level||1)}));_auxSetAttribute(photoLink,"title","aux.emerald.ui.676b0150dfa6","View Emerald’s own levels and upgrades");
    if(!autoButton){autoButton=button(_aux("aux.emerald.ui.d1378b7a864d","Auto Speak"),toggleAuto);autoButton.dataset.emeraldAuto='';controls.append(autoButton)}
   }else{if(photoLink){group.insertBefore(photo,photoLink);photoLink.remove();photoLink=null}autoButton?.remove();autoButton=null}
   if(s.level>=10&&pet?.unlocked){
    if(levelBar&&((levelBar.tagName==="BUTTON")!==enhanced)){levelBar.remove();levelBar=null}
    if(!levelBar){levelBar=enhanced?button('',openRoadmap):document.createElement('section');levelBar.className='emerald-level-bar';if(enhanced)levelBar.dataset.emeraldRoadmap='progress';levelBar.innerHTML=("<span class=\"emerald-level-label\"></span><span class=\"emerald-level-track\" role=\"progressbar\" aria-label=\""+_auxAttribute("aria-label","\"","aux.emerald.ui.b9976b1c5774","Emerald fresh game wins")+"\" aria-valuemin=\"0\"><span class=\"emerald-level-fill\"></span></span>");group.insertBefore(levelBar,controls)}
    const percent=pet.max?100:pet.nextWins>0?Math.max(0,Math.min(100,100*pet.wins/pet.nextWins)):0;let progressAvailable=true,label=_aux("aux.emerald.ui.1ac92567b2a8","Emerald E{value1} · {value2}",{value1:(pet.level),value2:(pet.max?'MAX':pet.wins+'/'+pet.nextWins+' fresh wins')});
    try{label=root.BOEmeraldRoadmap.label(pet)}catch(_){label=_aux("aux.emerald.ui.006519d1dfcc","Emerald progress is unavailable.");progressAvailable=false}
    levelBar.querySelector('.emerald-level-label').textContent=label;
    if(enhanced){levelBar.disabled=!canRoadmap||!progressAvailable;levelBar.setAttribute('aria-label',label+'. View Emerald’s level roadmap')}
    const track=levelBar.querySelector('.emerald-level-track');track.hidden=!progressAvailable;track.style.display=progressAvailable?'':'none';track.setAttribute('aria-valuemax',String(pet.nextWins||1));track.setAttribute('aria-valuenow',String(pet.max?1:pet.wins));track.setAttribute('aria-valuetext',pet.max?_aux("aux.emerald.ui.7013cd322150","Emerald Level 10, MAX, 100%"):_aux("aux.emerald.ui.ae524ba56fdd","{value1} of {value2} fresh game wins toward Emerald Level {value3}",{value1:(pet.wins),value2:(pet.nextWins),value3:(pet.nextLevel)}));levelBar.querySelector('.emerald-level-fill').style.width=percent+'%';
   }else{levelBar?.remove();levelBar=null}
   if(s.level>=10&&pet?.unlocked&&pet.level>=5&&s.friendship&&levelBar){if(!friendshipBar){friendshipBar=document.createElement('section');friendshipBar.className='emerald-level-bar emerald-friendship-bar';friendshipBar.innerHTML=("<span class=\"emerald-friendship-label\"></span><span class=\"emerald-level-track\" role=\"progressbar\" aria-label=\""+_auxAttribute("aria-label","\"","aux.emerald.ui.c1d8fdb7ff16","Emerald friendship points")+"\" aria-valuemin=\"0\"><span class=\"emerald-level-fill\"></span></span>");group.insertBefore(friendshipBar,levelBar)}const f=s.friendship;const label=_aux("aux.emerald.ui.bf83af1f55d3","Friendship Lv{value1} · {value2}/{value3} FP · {value4} · +{value5}% nicer",{value1:(f.level),value2:(f.fp),value3:(f.required),value4:(f.capped?'Final bar full':f.remaining+' FP left '+(f.level===10?'to fill final bar':'to level up')),value5:(f.nicenessPercent)});const text=friendshipBar.querySelector('.emerald-friendship-label');if(text.textContent!==label)text.textContent=label;const track=friendshipBar.querySelector('.emerald-level-track');track.setAttribute('aria-valuemax',String(f.required));track.setAttribute('aria-valuenow',String(f.fp));track.setAttribute('aria-valuetext',label);friendshipBar.querySelector('.emerald-level-fill').style.width=f.percent+'%'}else{friendshipBar?.remove();friendshipBar=null}
   if(gameContext(s)&&s.level>=10&&caps.workshop){if(!workshopButton){workshopButton=button(_aux("aux.emerald.ui.73092281f9a1","Give Emerald a card"));workshopButton.dataset.emeraldAction='open-workshop';controls.append(workshopButton)}const w=s.workshop;workshopButton.disabled=s.run.phase!=='shop';workshopButton.textContent=w?.silent?_aux("aux.emerald.ui.cb6a771bd776","Working silently · {value1}s",{value1:(Math.ceil(w.workRemainingMs/1000))}):w?.ready?_aux("aux.emerald.ui.3189c1f06b9f","Collect upgraded card"):w?.cooldownRemainingMs>0?_aux("aux.emerald.ui.bea5e2db639a","Workshop cooldown · {value1}s",{value1:(Math.ceil(w.cooldownRemainingMs/1000))}):_aux("aux.emerald.ui.73092281f9a1","Give Emerald a card");_auxSetAttribute(workshopButton,"title","aux.emerald.ui.e9a55057b5a1","Give or collect in the shop of this run")}else{workshopButton?.remove();workshopButton=null}
  }
  function observe(s,at){const eligible=gameContext(s)&&speakingAllowed(s)&&!!current,delta=lastObserved===null?0:Math.max(0,at-lastObserved);if(eligible&&wasEligible&&turnSource==='automatic'&&!autoDone)autoVisibleMs+=delta;lastObserved=at;wasEligible=eligible}
  function automatic(s,at){if(!gameContext(s)||!speakingAllowed(s)||!current)return;
   if(turnSource==='automatic'&&!autoDone&&autoVisibleMs>=COOLDOWN&&at>=retryAt){
    // Exactly one opportunity belonging to THIS automatically begun utterance.
    // Keeping the same line, idling, manual turns or toggles cannot renew it.
    if(s.level<10||!s.capabilities?.speedGift)autoDone=true;
    else{let result;try{result=host.automaticSpeech?.()}catch(_){result=null}if(result?.ok){autoDone=true;if(result.message){utterance++;current={message:result.message,kind:'event',stamp:tableStamp(s)}}}else retryAt=at+1000}
   }
   if(at>=nextAt&&preferences(s).first){let message;try{message=host.takeEvent?.()}catch(_){message=null}if(typeof message==='string'&&message)begin({message,kind:'event',stamp:tableStamp(s)},s,at,'automatic')}
  }
  function update(force=true){if(destroyed)return;let s;const at=now();try{s=host.state()}catch(_){s=null}latestState=s;checkContext(s,at);if(root.BOEmerald)cycleAuto(s,at);
   if(root.BOEmerald)updateFrenzy(s);
   if(!allowed(s)||!document.querySelector('#app')||!root.BOEmeraldAsset){remove();wasEligible=false;autoWasEligible=false;lastObserved=at;return}
   refresh(s);
   if(nextAt===null){cursor=0;const first=entries[0];if(first)begin({...first,kind:'entry'},s,at,gameContext(s)?'automatic':'manual');else{nextAt=at+COOLDOWN;lastSpeechAt=at}}
   if(gameContext(s)&&!greeted&&preferences(s).first&&s.capabilities?.welcome){greeted=true;let greeting;try{greeting=host.welcome?.()}catch(_){}if(greeting&&turnSource!=='manual')begin({message:greeting,kind:'event',stamp:tableStamp(s)},s,at,'automatic')}
   if(!stage?.isConnected)createStage(document.querySelector('#app'),s);
   updateLevel(s);observe(s,at);if(!force)automatic(s,at);cycleAuto(s,at,!force);
   paint(s,at);
  }
  function visibilityChanged(){lastObserved=now();if(document.hidden)autoWasEligible=false;try{wasEligible=!destroyed&&gameContext(host.state())&&speakingAllowed(host.state())}catch(_){wasEligible=false}}
  function pagehide(){stopAuto(now());clearInterval(timer)}
  document.addEventListener('visibilitychange',visibilityChanged);timer=setInterval(()=>update(false),100);root.addEventListener('pagehide',pagehide,{once:true});update();
  return Object.freeze({update,destroy(){destroyed=true;stopAuto(now());clearInterval(timer);document.removeEventListener('visibilitychange',visibilityChanged);root.removeEventListener('pagehide',pagehide);remove();releaseNotice();meter?.remove();document.body.classList.remove('frenzy-active','frenzy-motion-off')},status(){return {visible:!!stage?.isConnected,messages:entries.map(e=>e.message),compact,lookerMode,nextAt,lastSpeechAt,turnSource,automaticOpportunityDone:autoDone,tips:latestState?preferences(latestState):root.BOEmerald.tips(),chatOpen,autoSpeak:{active:autoUntil!==null,until:autoUntil,nextAt:autoNextAt,cooldownUntil:autoCooldownUntil,paused:autoUntil!==null&&(!latestState||!speakingAllowed(latestState))}}}});
 }
 root.BOEmeraldUI=Object.freeze({mount});
})(window);
