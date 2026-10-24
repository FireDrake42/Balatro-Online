/* Native Emerald consent/commit controller. Reading/opening is side-effect free.
 * host owns slot/writer/cloud fences and storage; complete PROFILE or RUN write
 * plus exact readback precedes live apply. An uncertain write freezes saving.
 */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports;const api=factory(root,node?require('./emerald-runtime'):root.BOEmeraldRuntime,node?require('./emerald-workshop'):root.BOEmeraldWorkshop,node?require('./emerald-progress'):root.BOEmeraldProgress,node?require('./potions'):root.BOPotions);if(node)module.exports=api;else root.BOEmeraldActions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root,R,W,P,PT){'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function check(ok,message){if(!ok)throw Error(message)}
 function stable(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(stable).join(',')+']';return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'}
 function cardName(c){return (c.rank<=10?c.rank:({11:'J',12:'Q',13:'K',14:'A'})[c.rank])+({S:'♠',H:'♥',D:'♦',C:'♣'})[c.suit]+(c.enhancement?' · '+c.enhancement:'')+(c.edition?' · '+c.edition:'')}
 function create(host){let pending=null,entered=false,events=[];
  function get(){const c=host.get();check(c&&c.profile&&c.run&&c.page==='game','Continue the active game before using Emerald.');return c}
  function fence(c,dialog=false){host.assertWritable(dialog);const live=get();check(live.run===c.run&&live.profile===c.profile&&live.level===c.level&&host.stamp()===c.stamp,'The slot, run or player level changed. Reopen Emerald’s current action.');return live}
  function capture(dialog=false){host.assertWritable(dialog);const c=get();return {...c,stamp:host.stamp(),profileRaw:host.read('profile'),runRaw:host.read('run')}}
  function unchanged(c){check(host.read('profile')===c.profileRaw&&host.read('run')===c.runRaw,'The saved game changed. Reopen Emerald’s current action.');fence(c,true)}
  function write(c,key,value){let attempted=false;
   try{unchanged(c);const raw=JSON.stringify(value);attempted=true;check(host.write(key,value)!==false,'The save could not be written.');check(host.read(key)===raw,'The save readback did not match.');fence(c,true);return true}
   catch(error){if(attempted)host.pause('Emerald saving is uncertain. The action may already be saved. Do not retry or reset; reload safely to inspect it. '+error.message);throw error}
  }
  function automaticSpeech(){try{
   const c=capture(false),now=host.now();check(R.capabilities(c.profile,c.level).speedGift,'Speed gifts unlock at Emerald Level 4.');
   if(c.profile.emerald.speech.sequence&&now-c.profile.emerald.speech.lastAt<P.SPEECH_COOLDOWN_MS)return {ok:false,reason:'cooldown'};
   if(R.workshopInfo(c.run,now).silent)return {ok:false,reason:'working'};
   const stored=c.profileRaw===null?null:JSON.parse(c.profileRaw);check(stored&&stable(stored.emerald)===stable(c.profile.emerald)&&stable(stored.potions)===stable(c.profile.potions),'Emerald or potion progress is not durably reconciled yet.');
   const result=R.speech(c.profile,c.run,c.level,now);write(c,'profile',result.profile);host.applyProfile(result.profile,now);
   const gift=result.gift;return {ok:true,gift,message:gift.granted?'A Speed Potion for you! Scoring animations take 30% less time for two minutes.':gift.rolled?'A Speed gift rolled, but both potion slots are full. Make room for a future gift!':null};
  }catch(error){return {ok:false,reason:error.message}}}
  function status(){const c=host.get(),now=host.now();if(!c?.profile)return {progress:null,capabilities:null,workshop:null};return {progress:R.progress(c.profile,c.level),capabilities:R.capabilities(c.profile,c.level),workshop:c.run&&c.run._uiId?R.workshopInfo(c.run,now):null}}
  function welcome(){if(entered)return null;entered=true;const c=get();return R.capabilities(c.profile,c.level).welcome?'Welcome Back! I’m glad you’re here!':null}
  function eventCurrent(event,c){return !!c?.run&&c.page==='game'&&event.run===c.run&&event.id===c.run._uiId&&event.round===c.run.round&&event.hand===c.run.roundHands&&event.phase===c.run.phase&&event.result===c.run.lastResult}
  function purgeEvents(){const c=host.get();events=events.filter(event=>eventCurrent(event,c));return c}
  function queue(messages){const c=purgeEvents();if(!c?.run||!Array.isArray(messages))return;for(const message of messages)if(typeof message==='string'&&message.length&&message.length<=1200)events.push({message,run:c.run,id:c.run._uiId,round:c.run.round,hand:c.run.roundHands,phase:c.run.phase,result:c.run.lastResult});if(events.length>8)events=events.slice(-8)}
  function takeEvent(){purgeEvents();return events.shift()?.message||null}
  function close(){pending=null;host.closeModal()}
  function openWorkshop(){try{
   const c=capture(false),s=status();check(s.capabilities.workshop,'Emerald’s card workshop unlocks at Emerald Level 9.');
   const w=s.workshop,r=c.run;check(r.phase==='shop','Give or collect cards in the shop of their origin run.');
   pending={...c,revision:r.emeraldWorkshop?.revision||0,jobId:r.emeraldWorkshop?.job?.id||null,cards:stable(r.cards),petLevel:s.progress.level};
   let body;
   if(w.busy)body='<p>'+ (w.ready?'Your original card is ready to collect.': 'Emerald is working silently. '+Math.ceil(w.workRemainingMs/1000)+' seconds remaining.')+'</p>'+(w.ready?'<button class="btn primary" data-emerald-action="claim">Collect upgraded card</button>':'');
   else if(w.cooldownRemainingMs>0)body='<p>Cooling down after completion · '+Math.ceil(w.cooldownRemainingMs/1000)+' seconds remaining.</p>';
   else body='<p>Give one owned playing card. It leaves your deck for 2 minutes of silent work; collect it in this run’s shop. A 5-minute cooldown starts when work finishes. Replacing or abandoning this run forfeits its reserved card.</p><p>Same card ID and suit; rank +'+s.capabilities.workshopRankGain+' (Ace maximum). '+(s.progress.level>=10?'40% primary modifier chance, plus an independent 10% chance for one enhancement and one edition together.':'10% chance for Foil, Holographic or Polychrome.')+'</p><label for="emerald-card-pick">Owned playing card</label><select id="emerald-card-pick">'+r.cards.map(card=>'<option value="'+esc(card.id)+'">'+esc(cardName(card))+'</option>').join('')+'</select><button class="btn primary" data-emerald-action="give" '+(!r.cards.length?'disabled':'')+'>Give selected card</button>';
   host.modal('Emerald’s card workshop',body+'<p class="build-note">Only fictional game cards. No payment, real gambling or external accounts.</p><button class="btn ghost" data-emerald-action="close">Close</button>');return true;
  }catch(error){host.notify(error.message);return false}}
  function consent(){check(pending,'Reopen Emerald’s current card offer.');const c=pending;fence(c,true);const now=host.now(),level=R.progress(c.profile,c.level).level;check(level===c.petLevel&&(c.run.emeraldWorkshop?.revision||0)===c.revision&&stable(c.run.cards)===c.cards&&c.run.phase==='shop','The card, workshop or Emerald level changed. Reopen the workshop.');return {c,now}}
  function commitRun(c,next){
   // Full durable source must match live game data before replacing the RUN.
   // potionNow is merely the action clock snapshot, not money/inventory/RNG.
   const raw=host.read('run');check(raw!==null,'Save the current run before using the workshop.');const durable=JSON.parse(raw),live=clone(c.run);delete durable.potionNow;delete live.potionNow;check(stable(durable)===stable(live),'The saved run differs from this offer. Reopen the workshop after saving.');
   const profileRaw=host.read('profile');check(profileRaw===c.profileRaw||profileRaw===host.ownRaw?.('profile'),'The durable profile changed outside this tab. Reopen the workshop.');const storedProfile=profileRaw===null?null:JSON.parse(profileRaw);check(storedProfile&&stable(storedProfile.emerald)===stable(c.profile.emerald)&&stable(storedProfile.potions)===stable(c.profile.potions),'Emerald or potion inventory changed during this offer. Reopen the workshop.');const current={...c,profileRaw,runRaw:raw};write(current,'run',next);host.applyRun(next);pending=null;host.closeModal();host.render();
  }
  function give(cardId){try{const {c,now}=consent();check(c.run.cards.some(card=>String(card.id)===String(cardId)),'Choose an owned playing card.');const proposal=W.give(c.run,{progress:c.profile.emerald,actualLevel:c.level,expectedRevision:c.revision,now,cardId,rolls:R.rolls(c.run,cardId)});commitRun(c,proposal.run);host.notify('Card reserved and saved. Emerald will work silently for 2 minutes.');return true}catch(error){host.notify(error.message);return false}}
  function claim(){try{const {c,now}=consent();const proposal=W.claim(c.run,{progress:c.profile.emerald,actualLevel:c.level,expectedRevision:c.revision,now,jobId:c.jobId});commitRun(c,proposal.run);host.notify('Your upgraded original card is back in this run’s deck.');return true}catch(error){host.notify(error.message);return false}}
  function click(event){const el=event.target.closest?.('[data-emerald-action]');if(!el)return;const action=el.dataset.emeraldAction;if(action==='open-workshop')openWorkshop();else if(action==='close')close();else if(action==='give')give(root.document.querySelector('#emerald-card-pick')?.value);else if(action==='claim')claim()}
  root.document?.addEventListener('click',click);
  return Object.freeze({status,automaticSpeech,openWorkshop,give,claim,welcome,queue,takeEvent,destroy(){root.document?.removeEventListener('click',click);pending=null;events=[]}});
 }
 return Object.freeze({create,stable,cardName});
});
