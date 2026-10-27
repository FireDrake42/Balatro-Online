/* Native Emerald consent/commit controller. Reading/opening is side-effect free.
 * host owns slot/writer/cloud fences and storage; complete PROFILE or RUN write
 * plus exact readback precedes live apply. An uncertain write freezes saving.
 */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports;const api=factory(root,node?require('./emerald-runtime'):root.BOEmeraldRuntime,node?require('./emerald-workshop'):root.BOEmeraldWorkshop,node?require('./emerald-progress'):root.BOEmeraldProgress,node?require('./potions'):root.BOPotions,node?require('./emerald-friendship'):root.BOEmeraldFriendship,node?require('./emerald-poker-events'):root.BOEmeraldPokerEvents,node?require('./emerald-poker-profile'):root.BOEmeraldPokerProfile);if(node)module.exports=api;else root.BOEmeraldActions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root,R,W,P,PT,F,E,V){'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function check(ok,message){if(!ok)throw Error(message)}
 function stable(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(stable).join(',')+']';return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'}
 function cardName(c){return (c.rank<=10?c.rank:({11:'J',12:'Q',13:'K',14:'A'})[c.rank])+({S:'♠',H:'♥',D:'♦',C:'♣'})[c.suit]+(c.enhancement?' · '+c.enhancement:'')+(c.edition?' · '+c.edition:'')}
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),thenable=x=>!!x&&(typeof x==='object'||typeof x==='function')&&typeof x.then==='function';
 function create(host){let pending=null,entered=false,events=[],acting=false,paused=false,destroyed=false;
  function get(){const c=host.get();check(c&&c.profile&&c.run&&c.page==='game','Continue the active game before using Emerald.');return c}
  function clock(){const now=host.now();check(Number.isSafeInteger(now)&&now>=0&&now<=W.MAX_TIME,'Invalid absolute Emerald action clock.');return now}
  function writable(dialog){check(!paused&&!destroyed,'Emerald saving is paused. Reload safely.');const result=host.assertWritable(dialog);check(result!==false&&!thenable(result),'The save is not synchronously writable.')}
  function eligible(c){check(!c.hidden&&!c.protected&&!c.suspended&&!c.animating&&!c.conductPaused&&!c.cloudRestoring&&!c.slotBusy&&!c.survey&&!root.document?.hidden&&root.document?.visibilityState!=='hidden','Return to the visible, unprotected game before using Emerald.')}
  function read(key){const raw=host.read(key);check(raw===null||typeof raw==='string','The saved '+key+' could not be read.');return raw}
  function eventData(profile){if(!profile||!own(profile,'emeraldPokerEvents'))return undefined;const d=Object.getOwnPropertyDescriptor(profile,'emeraldPokerEvents');check(d&&d.enumerable&&own(d,'value')&&d.value!==undefined,'Invalid saved Poker event field.');return d.value}
  function workshopEvents(c,now,profileRaw,authenticate=true){
   const liveEvents=eventData(c.profile),saved=profileRaw===null?null:JSON.parse(profileRaw),savedEvents=eventData(saved);if(liveEvents===undefined&&savedEvents===undefined)return {};
   check(liveEvents!==undefined&&savedEvents!==undefined&&E,'Reconcile the saved Poker event source before using the workshop.');const effects=E.effectsAt(savedEvents,now);
   if(authenticate){check(V,'The native Poker source validator is unavailable.');V.validateProfile(saved);V.validateProfile(c.profile);check(stable(saved)===stable(c.profile)&&saved.progression?.level===c.level,'The complete saved profile differs from the actual player. Reopen the workshop after saving.')}
   else check(stable(E.copy(liveEvents))===stable(savedEvents)&&saved.progression?.level===c.level&&c.profile.progression?.level===c.level,'The saved Poker event projection changed.');
   // Status projects ONLY saved/public event data, never private Poker replay.
   // Offers/commands authenticate all paired sources before using this context.
   return effects.zeroCooldowns?{pokerEvents:savedEvents}:{};
  }
  function fence(c,dialog=false){writable(dialog);const live=get();eligible(live);check(live.run===c.run&&live.profile===c.profile&&live.level===c.level&&host.stamp()===c.stamp,'The slot, run or player level changed. Reopen Emerald’s current action.');if(own(c,'runSource'))check(stable(live.run)===c.runSource&&stable(live.profile)===c.profileSource,'Live progress changed during this action. Reopen the workshop.');return live}
  function capture(dialog=false){writable(dialog);const c=get();eligible(c);const out={...c,stamp:host.stamp(),profileRaw:read('profile'),runRaw:read('run'),now:clock()};out.eventContext=workshopEvents(out,out.now,out.profileRaw);return out}
  function unchanged(c){fence(c,true);check(read('profile')===c.profileRaw&&read('run')===c.runRaw,'The saved game changed. Reopen Emerald’s current action.');fence(c,true);check(read('profile')===c.profileRaw&&read('run')===c.runRaw,'The saved game changed during its ownership check.')}
  function uncertain(error){if(paused)return;paused=true;pending=null;try{host.pause('Emerald saving is uncertain. The action may already be saved. Do not retry or reset; reload safely to inspect it. '+error.message)}catch(_){}}
  function apply(fn){try{const result=fn();check(result!==false&&!thenable(result),'The saved action could not be applied synchronously.')}catch(error){uncertain(error);throw error}}
  function write(c,key,value){let attempted=false;
   try{unchanged(c);const raw=JSON.stringify(value),other=key==='run'?'profile':'run',otherRaw=other==='run'?c.runRaw:c.profileRaw;attempted=true;const result=host.write(key,value);check(result!==false&&!thenable(result),'The save could not be written synchronously.');check(read(key)===raw&&read(other)===otherRaw,'The complete save readback did not match.');fence(c,true);check(read(key)===raw&&read(other)===otherRaw,'The save changed during its final ownership check.');return true}
   catch(error){if(attempted)uncertain(error);throw error}
  }
  function automaticSpeech(){if(acting)return {ok:false,reason:'busy'};acting=true;try{
   const c=capture(false),now=c.now;check(R.capabilities(c.profile,c.level).speedGift,'Speed gifts unlock at Emerald Level 4.');
   if(c.profile.emerald.speech.sequence&&now-c.profile.emerald.speech.lastAt<P.SPEECH_COOLDOWN_MS)return {ok:false,reason:'cooldown'};
   if(R.workshopInfo(c.run,now).silent)return {ok:false,reason:'working'};
   const stored=c.profileRaw===null?null:JSON.parse(c.profileRaw);check(stored&&stable(stored.emerald)===stable(c.profile.emerald)&&stable(stored.potions)===stable(c.profile.potions),'Emerald or potion progress is not durably reconciled yet.');
   c.runSource=stable(c.run);c.profileSource=stable(c.profile);const result=R.speech(c.profile,c.run,c.level,now);write(c,'profile',result.profile);apply(()=>host.applyProfile(result.profile,now));
   const gift=result.gift;return {ok:true,gift,message:gift.granted?'A Speed Potion for you! Scoring animations take 30% less time for two minutes.':gift.rolled?'A Speed gift rolled, but both potion slots are full. Make room for a future gift!':null};
  }catch(error){return {ok:false,reason:error.message}}finally{acting=false}}
  function projection(c,now,context={}){const w=c.run&&c.run._uiId?R.workshopInfo(c.run,now):null;
   // Match W.info's virtual deadline using the existing lightweight projection;
   // rendering must not inspect canonical cards, hidden piles or either RNG.
   if(w&&own(context,'pokerEvents')&&now>=w.nextGiveAt-W.COOLDOWN_MS){w.cooldownRemainingMs=0;w.nextGiveAt=Math.min(now,w.nextGiveAt)}return {progress:R.progress(c.profile,c.level),capabilities:R.capabilities(c.profile,c.level),workshop:w};
  }
  function status(){const c=host.get(),now=clock();if(!c?.profile)return {progress:null,capabilities:null,workshop:null};const s=projection(c,now);if(!own(c.profile,'emeraldPokerEvents'))return s;try{return projection(c,now,workshopEvents(c,now,read('profile'),false))}catch(error){return {...s,capabilities:{...s.capabilities,workshop:false},reason:error.message}}}
  function welcome(){if(entered)return null;entered=true;const c=get();return R.capabilities(c.profile,c.level).welcome?'Welcome Back! I’m glad you’re here!':null}
  function eventCurrent(event,c){return !!c?.run&&c.page==='game'&&event.run===c.run&&event.id===c.run._uiId&&event.round===c.run.round&&event.hand===c.run.roundHands&&event.phase===c.run.phase&&(event.handKey?c.run.levels?.[event.handKey]===event.handLevel:event.result===c.run.lastResult)}
  function purgeEvents(){const c=host.get();events=events.filter(event=>eventCurrent(event,c));return c}
  function queue(messages){const c=purgeEvents();if(!c?.run||!Array.isArray(messages))return;for(const item of messages){const detail=item&&typeof item==='object'&&typeof item.handKey==='string'&&[10,20,30,40,50].includes(item.handLevel)&&c.run.levels?.[item.handKey]===item.handLevel?item:null,message=detail?detail.message:item;if(typeof message==='string'&&message.length&&message.length<=1200)events.push({message,...(detail?{handKey:detail.handKey,handLevel:detail.handLevel}:{}),run:c.run,id:c.run._uiId,round:c.run.round,hand:c.run.roundHands,phase:c.run.phase,result:c.run.lastResult})}if(events.length>8)events=events.slice(-8)}
  function takeEvent(){purgeEvents();return events.shift()?.message||null}
  function close(){pending=null;host.closeModal()}
  function openWorkshop(){if(acting)return false;try{
   const c=capture(false),s=projection(c,c.now,c.eventContext);check(s.capabilities.workshop,'Emerald’s card workshop unlocks at Emerald Level 9.');
   const w=s.workshop,r=c.run;check(r.phase==='shop','Give or collect cards in the shop of their origin run.');
   pending={...c,revision:r.emeraldWorkshop?.revision||0,jobId:r.emeraldWorkshop?.job?.id||null,cards:stable(r.cards),petLevel:s.progress.level,friendship:stable(c.profile.emeraldFriendship??null),friendshipLevel:F.info(c.profile.emeraldFriendship).level};
   let body;
   if(w.busy)body='<p>'+ (w.ready?'Your original card is ready to collect.': 'Emerald is working silently. '+Math.ceil(w.workRemainingMs/1000)+' seconds remaining.')+'</p>'+(w.ready?'<button class="btn primary" data-emerald-action="claim">Collect upgraded card</button>':'');
   else if(w.cooldownRemainingMs>0)body='<p>Cooling down after completion · '+Math.ceil(w.cooldownRemainingMs/1000)+' seconds remaining.</p>';
   else body='<p>Give one owned playing card. It leaves your deck for '+(F.info(c.profile.emeraldFriendship).workMs/1000)+' seconds of silent work; collect it in this run’s shop. A 5-minute cooldown starts when work finishes. Replacing or abandoning this run forfeits its reserved card.</p><p>Same card ID and suit; rank +'+s.capabilities.workshopRankGain+' (Ace maximum). '+(s.progress.level>=10?'40% primary modifier chance, plus an independent 10% chance for one enhancement and one edition together.':'10% chance for Foil, Holographic or Polychrome.')+'</p><label for="emerald-card-pick">Owned playing card</label><select id="emerald-card-pick">'+r.cards.map(card=>'<option value="'+esc(card.id)+'">'+esc(cardName(card))+'</option>').join('')+'</select><button class="btn primary" data-emerald-action="give" '+(!r.cards.length?'disabled':'')+'>Give selected card</button>';
   if(own(c.eventContext,'pokerEvents'))body+='<p>While your Royal Flush event is active, only the 5-minute after-job cooldown is skipped. Silent work and explicit collection still apply.</p>';
   host.modal('Emerald’s card workshop',body+'<p class="build-note">Only fictional game cards. No payment, real gambling or external accounts.</p><button class="btn ghost" data-emerald-action="close">Close</button>');return true;
  }catch(error){host.notify(error.message);return false}}
  function consent(){check(pending,'Reopen Emerald’s current card offer.');const c=pending;fence(c,true);const now=clock(),level=R.progress(c.profile,c.level).level,context=workshopEvents(c,now,read('profile'));check(stable(c.profile.emeraldFriendship??null)===c.friendship&&level===c.petLevel&&(c.run.emeraldWorkshop?.revision||0)===c.revision&&stable(c.run.cards)===c.cards&&c.run.phase==='shop','The card, workshop or Emerald level changed. Reopen the workshop.');return {c:{...c,actionNow:now,runSource:stable(c.run),profileSource:stable(c.profile)},now,context}}
  function commitRun(c,next){
   // Full durable source must match live game data before replacing the RUN.
   // potionNow is merely the action clock snapshot, not money/inventory/RNG.
   const raw=read('run');check(raw!==null,'Save the current run before using the workshop.');const durable=JSON.parse(raw),live=clone(c.run);delete durable.potionNow;delete live.potionNow;check(stable(durable)===stable(live),'The saved run differs from this offer. Reopen the workshop after saving.');
   const profileRaw=read('profile');check(profileRaw===c.profileRaw||profileRaw===host.ownRaw?.('profile'),'The durable profile changed outside this tab. Reopen the workshop.');workshopEvents(c,c.actionNow,profileRaw);const storedProfile=profileRaw===null?null:JSON.parse(profileRaw);check(storedProfile&&stable(storedProfile.emerald)===stable(c.profile.emerald)&&stable(storedProfile.potions)===stable(c.profile.potions)&&stable(storedProfile.emeraldFriendship??null)===c.friendship,'Emerald, friendship or potion inventory changed during this offer. Reopen the workshop.');const current={...c,profileRaw,runRaw:raw};write(current,'run',next);apply(()=>host.applyRun(next));pending=null;host.closeModal();host.render();
  }
  function give(cardId){if(acting)return false;acting=true;try{const {c,now,context}=consent();check(c.run.cards.some(card=>String(card.id)===String(cardId)),'Choose an owned playing card.');const proposal=W.give(c.run,{progress:c.profile.emerald,actualLevel:c.level,expectedRevision:c.revision,now,cardId,rolls:R.rolls(c.run,cardId),friendshipLevel:c.friendshipLevel,...context});commitRun(c,proposal.run);host.notify('Card reserved and saved. Emerald will work silently for '+((proposal.run.emeraldWorkshop.job.completedAt-proposal.run.emeraldWorkshop.job.startedAt)/1000)+' seconds.');return true}catch(error){host.notify(error.message);return false}finally{acting=false}}
  function claim(){if(acting)return false;acting=true;try{const {c,now}=consent();const proposal=W.claim(c.run,{progress:c.profile.emerald,actualLevel:c.level,expectedRevision:c.revision,now,jobId:c.jobId});commitRun(c,proposal.run);host.notify('Your upgraded original card is back in this run’s deck.');return true}catch(error){host.notify(error.message);return false}finally{acting=false}}
  function click(event){const el=event.target.closest?.('[data-emerald-action]');if(!el)return;const action=el.dataset.emeraldAction;if(action==='open-workshop')openWorkshop();else if(action==='close')close();else if(action==='give')give(root.document.querySelector('#emerald-card-pick')?.value);else if(action==='claim')claim()}
  root.document?.addEventListener('click',click);
  return Object.freeze({status,automaticSpeech,openWorkshop,give,claim,welcome,queue,takeEvent,destroy(){destroyed=true;root.document?.removeEventListener('click',click);pending=null;events=[]}});
 }
 return Object.freeze({create,stable,cardName});
});
