/* Emerald v3 public-state presentation. DOM reads and manual controls never
 * roll gifts or advance progression. Existing genuine automatic utterances keep
 * ONE guarded gift opportunity after ten visible seconds. Auto Speak only
 * operates the manual Next control: no voice, chat or extra gift opportunities.
 * Its five-minute elapsed window / one-minute rest are tab-local monotonic UI
 * state, never saved. Reloading cancels them; no background catch-up advances.
 */
(function(root){'use strict';
 const COOLDOWN=10000,AUTO_DURATION=300000,AUTO_REST=60000;
 function mount(host){
  let stage=null,group=null,bubble=null,photo=null,photoLink=null,controls=null,levelBar=null,workshopButton=null,meter=null,nextButton=null,quietButton=null,talkButton=null,autoButton=null,chatForm=null,chatInput=null,chatAnswer=null;
  let autoUntil=null,autoNextAt=null,autoCooldownUntil=0,autoWasEligible=false,contextSeen=false,contextIdentity=null,contextRun=null,contextRunId=null,contextPage=null;
  let entries=[],current=null,cursor=0,digest='',latestState=null,compact=false,lastFrenzy=null,nextAt=null,lastSpeechAt=null,turnSource='none',autoDone=true,autoVisibleMs=0,lastObserved=null,wasEligible=false,retryAt=0,timer=null,destroyed=false,greeted=false,generation=0,sending=false,prefPending=false,chatOpen=false;
  const now=()=>typeof host.now==='function'?host.now():root.performance?.now?root.performance.now():Date.now();
  function releaseNotice(){const n=meter?.querySelector('#faucet-ready-notice');if(n){n.classList.remove('frenzy-inline-notice');document.body.append(n)}}
  function remove(){stage?.remove();stage=null;group=null;bubble=null;photo=null;photoLink=null;controls=null;levelBar=null;workshopButton=null;nextButton=null;quietButton=null;talkButton=null;autoButton=null;chatForm=null;chatInput=null;chatAnswer=null;generation++;sending=false;chatOpen=false}
  function tableStamp(s){const r=s?.run;return JSON.stringify([r?._uiId,r?.round,r?.roundHands,r?.phase,r?.lastResult?.key,r?.lastResult?.total])}
  function preferences(s){return root.BOEmerald.tips(s?.tips)}
  function suppressAutomatic(){turnSource='manual';autoDone=true;autoVisibleMs=0;wasEligible=false}
  function gameContext(s){return root.BOEmerald?.visible(s)===true}
  function allowed(s){const model=root.BOEmerald;return !!model&&(model.presentationVisible?model.presentationVisible(s):model.visible(s))&&!root.document.hidden}
  function speakingAllowed(s){const t=preferences(s);return allowed(s)&&!compact&&s.workshop?.silent!==true&&(t.first||t.second)}
  function refresh(s){
   const game=gameContext(s),r=game?s.run:{},publicR=game?root.BOEmerald.publicRun(s):null,f=game?root.BOEmerald.frenzyInfo(s):{},t=preferences(s);
   // Digest ONLY public facts. In particular, never stringify run.hand, which
   // would read face-down rank/suit fields, or any deck/draw/seed/RNG fields.
   const key=JSON.stringify(game?[s.level,s.page,s.survey,s.protected,s.suspended,publicR,r._uiId,r.phase,r.money,r.target,r.score,r.hands,r.shop,r.lastResult?.name,r.lastResult?.key,r.lastResult?.chips,r.lastResult?.mult,r.lastResult?.total,s.selected,s.pet,s.capabilities,s.faucetReady,s.faucetLevel,s.passiveReady,s.xp,t,f.active,f.charge,f.required,f.meterMax]:[s.level,s.page,s.pet,t]);
   if(key!==digest){entries=root.BOEmerald.catalog(root.BO,s,t);digest=key}
   if(current?.kind==='entry'){const fresh=entries.find(e=>e.id===current.id);current=fresh?{...fresh,kind:'entry'}:null}
   else if(current?.kind==='event'&&(!game||current.stamp!==tableStamp(s)))current=null;
  }
  function begin(entry,s,at,source='automatic'){
   current=entry;lastSpeechAt=at;nextAt=at+COOLDOWN;turnSource=source;autoDone=source!=='automatic';autoVisibleMs=0;lastObserved=at;wasEligible=speakingAllowed(s);retryAt=0;
  }
  function selectEntry(s,at,source){if(!entries.length)return false;cursor=(cursor+1)%entries.length;begin({...entries[cursor],kind:'entry'},s,at,source);return true}
  function advanceTip(s,at){if(!speakingAllowed(s)||nextAt===null||at<nextAt)return false;refresh(s);return selectEntry(s,at,'manual')}
  function stopAuto(at){if(autoUntil!==null){const ended=Math.min(at,autoUntil);autoUntil=null;autoNextAt=null;autoCooldownUntil=ended+AUTO_REST;autoWasEligible=false;suppressAutomatic()}}
  function checkContext(s,at){
   const identity=s?.identity??null,run=s?.run||null,runId=run?._uiId??null,page=s?.page??null;
   if(contextSeen&&(identity!==contextIdentity||run!==contextRun||runId!==contextRunId||page!==contextPage)){stopAuto(at);suppressAutomatic();current=null;generation++;sending=false;chatOpen=false;if(chatInput)chatInput.value='';if(chatAnswer)chatAnswer.textContent='';const send=chatForm?.querySelector('button');if(send)send.disabled=false}
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
  function paint(s,at){if(!bubble)return;const t=preferences(s),silent=s.workshop?.silent===true;
   bubble.textContent=!t.first&&!t.second?'Tips are paused. Choose 1st tips, 2nd tips, or both.':current?.message||(gameContext(s)?'I’ll check the current table before my next tip.':'I’m here while you explore. Choose the next tip when you’re ready.');
   bubble.hidden=compact||silent;stage.classList.toggle('emerald-compact',compact);stage.classList.toggle('emerald-working',silent);stage.setAttribute('aria-label',silent?'Emerald is working silently on your card':'Emerald game companion');
   if(nextButton){const remaining=nextAt===null?COOLDOWN:Math.max(0,nextAt-at);nextButton.disabled=silent||compact||!entries.length||remaining>0;nextButton.title=remaining>0?'This speech lasts ten seconds. Next tip in '+Math.ceil(remaining/1000)+'s.':'Browse tips only — no extra gift rolls';nextButton.setAttribute('aria-disabled',String(nextButton.disabled))}
   for(const name of ['first','second']){const b=controls?.querySelector('[data-emerald-tips="'+name+'"]');if(b){b.setAttribute('aria-pressed',String(t[name]));b.disabled=prefPending||!gameContext(s)}}
   if(quietButton){quietButton.textContent=compact?'Show tips':'Quiet';quietButton.setAttribute('aria-pressed',String(compact))}
   if(talkButton){talkButton.disabled=silent||!gameContext(s);talkButton.setAttribute('aria-expanded',String(chatOpen&&gameContext(s)))}
   if(chatForm)chatForm.hidden=!chatOpen||silent||!gameContext(s);
   if(autoButton){const active=autoUntil!==null,rest=Math.max(0,autoCooldownUntil-at),remaining=active?Math.ceil((autoUntil-at)/1000):0;autoButton.textContent=active?'Auto Speak · '+(speakingAllowed(s)?'Stop ':'Paused · Stop ')+remaining+'s':rest>0?'Auto Speak · cooldown '+Math.ceil(rest/1000)+'s':'Auto Speak';autoButton.disabled=!active&&(rest>0||!speakingAllowed(s)||!entries.length);autoButton.setAttribute('aria-pressed',String(active));autoButton.title='Auto Next every 10 seconds for 5 minutes, then 1 minute cooldown. Pauses when unavailable; the elapsed window still ends. No voice, chat or extra gifts. This tab only: reloading cancels.'}
  }
  function updateFrenzy(s){const visible=s&&s.page==='game'&&s.run&&Number.isInteger(s.level)&&s.level>=33&&!s.protected&&!s.survey&&!s.suspended,active=visible&&s.frenzy?.active===true;
   if(!visible){releaseNotice();meter?.remove();meter=null}
   else{const parent=document.querySelector('#app .table-column')||document.querySelector('#app');if(parent){
    if(!meter?.isConnected){meter=document.createElement('section');meter.id='frenzy-meter';meter.className='frenzy-meter';meter.setAttribute('aria-label','Frenzy scoring-card charge');meter.innerHTML='<div class="frenzy-title">FRENZY</div><div class="frenzy-track" role="progressbar" aria-label="Frenzy scored cards" aria-valuemin="0"><span class="frenzy-fill"></span></div><div class="frenzy-count"></div>';parent.prepend(meter)}
    const f=root.BOEmerald.frenzyInfo(s),track=meter.querySelector('.frenzy-track'),value=Math.max(0,Math.min(f.meterMax,f.meter));
    meter.classList.toggle('is-active',f.active);meter.querySelector('.frenzy-title').textContent=f.active?'FRENZY!!! · +50% Mult':'FRENZY';meter.querySelector('.frenzy-fill').style.width=(100*value/f.meterMax)+'%';track.setAttribute('aria-valuemax',String(f.meterMax));track.setAttribute('aria-valuenow',String(Math.round(value)));track.setAttribute('aria-valuetext',f.active?'Frenzy active, '+(f.remainingMs/1000).toFixed(1)+' seconds remaining':f.charge+' of '+f.required+' scored cards');meter.querySelector('.frenzy-count').textContent=f.active?Math.round(value)+'/'+f.meterMax+' · '+(f.remainingMs/1000).toFixed(1)+'s · rainbow rush':f.charge+'/'+f.required+' scored cards';
    const notice=document.querySelector('#faucet-ready-notice');if(notice){notice.classList.add('frenzy-inline-notice');if(notice.parentNode!==meter)meter.append(notice)}
   }}
   document.body.classList.toggle('frenzy-active',!!active);document.body.classList.toggle('frenzy-motion-off',s?.motion===false);if(active!==lastFrenzy){lastFrenzy=!!active;host.frenzyChanged?.(!!active)}
  }
  function button(text,handler){const b=document.createElement('button');b.type='button';b.textContent=text;if(handler)b.addEventListener('click',handler);return b}
  function changeTips(name){let s;try{s=host.state()}catch(_){return}if(!allowed(s)||!gameContext(s)||prefPending||typeof host.setTips!=='function')return;
   const next=preferences(s);next[name]=!next[name];prefPending=true;suppressAutomatic();paint(s,now());
   function done(result){prefPending=false;if(destroyed)return;if(result?.ok!==true&&chatAnswer)chatAnswer.textContent=result?.reason||'Tip preferences were not saved. Keep your current save.';update()}
   try{const result=host.setTips(next);if(result&&typeof result.then==='function')result.then(done,error=>done({ok:false,reason:error.message}));else done(result)}catch(error){done({ok:false,reason:error.message})}
  }
  function createChat(){
   chatForm=document.createElement('form');chatForm.id='emerald-chat-form';chatForm.className='emerald-chat';chatForm.hidden=true;
   const note=document.createElement('p');note.className='emerald-chat-note';note.textContent='Offline local rules, not online AI. No questions leave this device. No swearing: the whole game is banned on this browser for 3 calendar months. All saves are kept; this is not an account/server ban.';
   const label=document.createElement('label');label.htmlFor='emerald-chat-input';label.textContent='Ask Emerald about Balatro';
   chatInput=document.createElement('input');chatInput.id='emerald-chat-input';chatInput.name='emerald-question';chatInput.type='text';chatInput.maxLength=240;chatInput.autocomplete='off';chatInput.required=true;chatInput.placeholder='How does Mult work?';
   const send=button('Send');send.type='submit';chatAnswer=document.createElement('p');chatAnswer.id='emerald-chat-answer';chatAnswer.setAttribute('role','status');chatAnswer.setAttribute('aria-live','polite');chatForm.append(note,label,chatInput,send,chatAnswer);
   chatForm.addEventListener('submit',async event=>{event.preventDefault();let s;try{s=host.state()}catch(_){return}if(sending||!allowed(s)||!gameContext(s)||s.workshop?.silent)return;
    suppressAutomatic();const text=chatInput.value;if(typeof host.sendChat!=='function'){chatAnswer.textContent='The guarded local game chat is unavailable. Keep all game files together.';return}
    if(!text.trim()||text.length>240){chatAnswer.textContent='Ask one Balatro question, using 1–240 characters.';return}
    const token=generation,runId=s.run._uiId;sending=true;send.disabled=true;
    try{const result=await host.sendChat(text);if(destroyed||generation!==token||host.state()?.run?._uiId!==runId)return;chatAnswer.textContent=result?.message||result?.reason||'No answer was committed. Your saves are unchanged.';if(result?.ok)chatInput.value=''}catch(error){if(generation===token&&chatAnswer)chatAnswer.textContent=error.message||'The guarded game chat is unavailable.'}finally{if(generation===token){sending=false;send.disabled=false}}
   });
  }
  function createStage(parent,s){
   remove();stage=document.createElement('section');stage.id='emerald-companion';stage.className='emerald-stage';group=document.createElement('div');group.className='emerald-group';bubble=document.createElement('p');bubble.className='emerald-bubble';bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');
   photo=document.createElement('img');photo.src=root.BOEmeraldAsset;photo.alt='Emerald, your green beetle companion';photo.width=98;photo.height=64;photo.draggable=false;controls=document.createElement('div');controls.className='emerald-controls';
   nextButton=button('Emerald · next tip',()=>{let live;try{live=host.state()}catch(_){return}const at=now();if(advanceTip(live,at))paint(live,at)});nextButton.dataset.emeraldNext='';
   quietButton=button(compact?'Show tips':'Quiet',()=>{compact=!compact;if(compact)suppressAutomatic();update()});quietButton.dataset.emeraldQuiet='';
   const first=button('1st tips',()=>changeTips('first')),second=button('2nd tips',()=>changeTips('second'));first.dataset.emeraldTips='first';second.dataset.emeraldTips='second';
   talkButton=button('Talk',()=>{let live;try{live=host.state()}catch(_){return}if(!allowed(live)||!gameContext(live)||live.workshop?.silent)return;suppressAutomatic();chatOpen=!chatOpen;paint(live,now());if(chatOpen)chatInput?.focus()});talkButton.dataset.emeraldTalk='';talkButton.setAttribute('aria-controls','emerald-chat-form');
   controls.append(nextButton,quietButton,first,second,talkButton);createChat();group.append(bubble,photo,controls,chatForm);stage.append(group);parent.append(stage);
  }
  function updateLevel(s){const caps=s.capabilities||{},pet=s.pet,enhanced=s.level>=36,canRoadmap=typeof host.openRoadmap==='function';
   stage.classList.toggle('emerald-motion-off',s.motion===false);stage.classList.toggle('emerald-aura',s.level>=10&&caps.greenAura===true);stage.classList.toggle('emerald-rich-green',s.level>=38);stage.style.setProperty('--emerald-scale',String(s.level>=10&&caps.photoScale||1));stage.style.setProperty('--emerald-speed',String(s.level>=10&&caps.movementSpeed||1));stage.dataset.emeraldLevel=String(pet?.level||1);stage.dataset.position=['bob','glide','corner'][Math.floor(now()/24000)%3];
   if(enhanced){
    if(!photoLink){photoLink=button('',openRoadmap);photoLink.className='emerald-photo-link';photoLink.dataset.emeraldRoadmap='photo';group.insertBefore(photoLink,photo);photoLink.append(photo);const badge=document.createElement('span');badge.className='emerald-photo-level';photoLink.append(badge)}
    photoLink.disabled=!canRoadmap;photoLink.setAttribute('aria-label','Emerald Level '+(pet?.level||1)+', view Emerald’s level roadmap');photoLink.title='View Emerald’s own levels and upgrades';photoLink.querySelector('.emerald-photo-level').textContent='Emerald Level '+(pet?.level||1);
    if(!autoButton){autoButton=button('Auto Speak',toggleAuto);autoButton.dataset.emeraldAuto='';controls.append(autoButton)}
   }else{if(photoLink){group.insertBefore(photo,photoLink);photoLink.remove();photoLink=null}autoButton?.remove();autoButton=null}
   if(s.level>=10&&pet?.unlocked){
    if(levelBar&&((levelBar.tagName==='BUTTON')!==enhanced)){levelBar.remove();levelBar=null}
    if(!levelBar){levelBar=enhanced?button('',openRoadmap):document.createElement('section');levelBar.className='emerald-level-bar';if(enhanced)levelBar.dataset.emeraldRoadmap='progress';levelBar.innerHTML='<span class="emerald-level-label"></span><span class="emerald-level-track" role="progressbar" aria-label="Emerald fresh game wins" aria-valuemin="0"><span class="emerald-level-fill"></span></span>';group.insertBefore(levelBar,controls)}
    const percent=pet.max?100:pet.nextWins>0?Math.max(0,Math.min(100,100*pet.wins/pet.nextWins)):0;let progressAvailable=true,label='Emerald E'+pet.level+' · '+(pet.max?'MAX':pet.wins+'/'+pet.nextWins+' fresh wins');
    if(enhanced){try{label=root.BOEmeraldRoadmap.label(pet)}catch(_){label='Emerald progress is unavailable.';progressAvailable=false}}
    levelBar.querySelector('.emerald-level-label').textContent=label;
    if(enhanced){levelBar.disabled=!canRoadmap||!progressAvailable;levelBar.setAttribute('aria-label',label+'. View Emerald’s level roadmap')}
    const track=levelBar.querySelector('.emerald-level-track');track.hidden=!progressAvailable;track.style.display=progressAvailable?'':'none';track.setAttribute('aria-valuemax',String(pet.nextWins||1));track.setAttribute('aria-valuenow',String(pet.max?1:pet.wins));track.setAttribute('aria-valuetext',pet.max?'Emerald Level 10, MAX, 100%':pet.wins+' of '+pet.nextWins+' fresh game wins toward Emerald Level '+pet.nextLevel);levelBar.querySelector('.emerald-level-fill').style.width=percent+'%';
   }else{levelBar?.remove();levelBar=null}
   if(gameContext(s)&&s.level>=10&&caps.workshop){if(!workshopButton){workshopButton=button('Give Emerald a card');workshopButton.dataset.emeraldAction='open-workshop';controls.append(workshopButton)}const w=s.workshop;workshopButton.disabled=s.run.phase!=='shop';workshopButton.textContent=w?.silent?'Working silently · '+Math.ceil(w.workRemainingMs/1000)+'s':w?.ready?'Collect upgraded card':w?.cooldownRemainingMs>0?'Workshop cooldown · '+Math.ceil(w.cooldownRemainingMs/1000)+'s':'Give Emerald a card';workshopButton.title='Give or collect in the shop of this run'}else{workshopButton?.remove();workshopButton=null}
  }
  function observe(s,at){const eligible=gameContext(s)&&speakingAllowed(s)&&!!current,delta=lastObserved===null?0:Math.max(0,at-lastObserved);if(eligible&&wasEligible&&turnSource==='automatic'&&!autoDone)autoVisibleMs+=delta;lastObserved=at;wasEligible=eligible}
  function automatic(s,at){if(!gameContext(s)||!speakingAllowed(s)||!current)return;
   if(turnSource==='automatic'&&!autoDone&&autoVisibleMs>=COOLDOWN&&at>=retryAt){
    // Exactly one opportunity belonging to THIS automatically begun utterance.
    // Keeping the same line, idling, manual turns or toggles cannot renew it.
    if(s.level<10||!s.capabilities?.speedGift)autoDone=true;
    else{let result;try{result=host.automaticSpeech?.()}catch(_){result=null}if(result?.ok){autoDone=true;if(result.message)current={message:result.message,kind:'event',stamp:tableStamp(s)}}else retryAt=at+1000}
   }
   if(at>=nextAt&&preferences(s).first&&s.capabilities?.eventCommentary){let message;try{message=host.takeEvent?.()}catch(_){message=null}if(typeof message==='string'&&message)begin({message,kind:'event',stamp:tableStamp(s)},s,at,'automatic')}
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
  return Object.freeze({update,destroy(){destroyed=true;stopAuto(now());clearInterval(timer);document.removeEventListener('visibilitychange',visibilityChanged);root.removeEventListener('pagehide',pagehide);remove();releaseNotice();meter?.remove();document.body.classList.remove('frenzy-active','frenzy-motion-off')},status(){return {visible:!!stage?.isConnected,messages:entries.map(e=>e.message),compact,nextAt,lastSpeechAt,turnSource,automaticOpportunityDone:autoDone,tips:latestState?preferences(latestState):root.BOEmerald.tips(),chatOpen,autoSpeak:{active:autoUntil!==null,until:autoUntil,nextAt:autoNextAt,cooldownUntil:autoCooldownUntil,paused:autoUntil!==null&&(!latestState||!speakingAllowed(latestState))}}}});
 }
 root.BOEmeraldUI=Object.freeze({mount});
})(window);
