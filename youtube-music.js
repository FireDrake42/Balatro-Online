/* R21: explicit opt-in, visible ONLINE YouTube chapters. No audio extraction or saved IDs. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.BOYouTubeMusic=api;root.BOYouTubeMusicUI=api.mount(root);}})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const videoID='U64JImQL48Y';
const tracks=Object.freeze([
 ['Shop and Adventure',0,123],['Good Life',123,240],['Forest Shop',240,317],['Silently Building',317,443],['The OG Mysteries and Wondering',443,568],['Quite Fun And Bank',568,688],['Getting to an End',688,887]
].map(([name,start,end])=>Object.freeze({name,start,end})));
const linkFor=i=>'https://www.youtube.com/watch?v='+videoID+'&t='+tracks[i].start+'s';
const providerErrors={2:'Invalid video request',5:'YouTube HTML5 player could not play',100:'Video unavailable, removed or private',101:'Video owner disabled embedded playback',150:'Video owner disabled embedded playback',153:'YouTube requires client/referrer identification'};
function createController(deps){
 let index=0,generation=0,player=null,active=false,phase='idle',message='Internet required. No YouTube connection until you choose Load YouTube player.',loop=false,time=null,lastNative=null;
 const changed=()=>deps.changed?.(snapshot());
 const native=()=>deps.audio?.status?.()||{};
 const visible=()=>deps.visible?.()!==false;
 const online=()=>deps.online?.()!==false;
 const allowed=()=>{const s=native();return s.musicEnabled===true&&!s.muted;};
 const request=()=>({videoId:videoID,startSeconds:tracks[index].start,endSeconds:tracks[index].end});
 function snapshot(){return {index,track:tracks[index],active,phase,message,loop,currentTime:time,generation,ready:!!player};}
 function close(reason='YouTube closed. Local soundtrack restored.',nextPhase='idle'){
  generation++;const old=player;player=null;active=false;time=null;lastNative=null;
  // Destroy/remove the iframe BEFORE restoring native music: never two music transports.
  try{old?.destroy?.();}catch(_){}try{deps.unload?.();}catch(_){}
  deps.audio?.setExternalMusicActive?.(false);phase=nextPhase;message=reason;changed();
 }
 function begin(userGesture){
  if(userGesture!==true)return null;
  if(!visible()){message='Show the Music panel and player first.';changed();return null;}
  if(!online()){phase='offline';message='Offline: YouTube needs internet. Local music remains available.';changed();return null;}
  if(!allowed()){message='Enable Music and unmute using the existing music controls first.';changed();return null;}
  if(active)return generation;
  generation++;active=true;phase='loading';message='Connecting to YouTube… Use Play in its visible player when ready.';deps.audio?.setExternalMusicActive?.(true);changed();return generation;
 }
 function syncNative(force=false){
  if(!player)return;
  const s=native(),next=[!!s.muted,!!s.musicEnabled,Number.isFinite(s.musicVolume)?s.musicVolume:.44];
  if(!force&&lastNative&&next.every((v,i)=>v===lastNative[i]))return;
  lastNative=next;
  try{player.setVolume(Math.round(Math.max(0,Math.min(1,next[2]))*100));if(next[0])player.mute();else player.unMute();
   if(!next[1]||next[0]){player.pauseVideo();phase='paused';message='Paused by the existing Music / mute / volume controls.';}
  }catch(_){fail('API');return;}changed();
 }
 function attach(next,token){
  if(!active||token!==generation||!visible()||!online()){try{next?.destroy?.();}catch(_){}return false;}
  player=next;phase='cued';message='Ready online. Tap Play in the visible YouTube player; an extra tap may be needed.';
  try{player.cueVideoById(request());syncNative(true);}catch(_){fail('API');return false;}changed();return true;
 }
 function select(next,userGesture){
  if(!Number.isInteger(next)||next<0||next>=tracks.length||active&&userGesture!==true)return false;
  const wasPlaying=phase==='playing';index=next;time=null;
  if(player){try{if(wasPlaying&&userGesture===true&&visible()&&allowed())player.loadVideoById(request());else player.cueVideoById(request());phase=wasPlaying?'loading':'cued';message='Selected '+tracks[index].name+' · online YouTube chapter.';}catch(_){fail('API');}}
  changed();return true;
 }
 function providerState(code){
  if(!active||!player)return;
  if(!visible()||!online()){close('Player hidden or offline. YouTube stopped; local music restored.');return;}
  if(code===1){if(!allowed()){try{player.pauseVideo();}catch(_){}phase='paused';message='Music is disabled or muted. Use the existing controls, then YouTube Play.';}else{phase='playing';message='Playing online: '+tracks[index].name+' · YouTube controls and ads remain unchanged.';}}
  else if(code===2){phase='paused';message='YouTube paused. Use its visible Play button to resume.';}
  else if(code===3){phase='buffering';message='YouTube buffering… Internet is required.';}
  else if(code===5){phase='cued';message='Chapter ready. Use Play in the visible YouTube player.';}
  else if(code===0){phase='ended';message='Chapter ended.';if(loop&&allowed()){try{player.loadVideoById(request());phase='loading';message='Repeating this chapter (Loop is on).';}catch(_){fail('API');return;}}}
  changed();
 }
 function fail(code){close('YouTube '+String(code)+': '+(providerErrors[code]||'Player/API unavailable or blocked')+'. Use Open this chapter on YouTube, or retry when online.','error');}
 function autoplayBlocked(){if(!active)return;phase='blocked';message='Playback blocked by the browser. Tap Play in the visible YouTube player.';changed();}
 function tick(){if(!active)return;if(!visible()||!online()){close(online()?'Player hidden: YouTube stopped. Local soundtrack restored.':'Offline: YouTube stopped. Local music remains available.',online()?'idle':'offline');return;}try{const v=player?.getCurrentTime?.();time=Number.isFinite(v)?v:null;}catch(_){}changed();}
 function setLoop(value){loop=value===true;changed();}
 return Object.freeze({snapshot,begin,attach,select,providerState,syncNative,close,fail,autoplayBlocked,tick,setLoop});
}
function mount(w){
 const d=w.document;if(!d||!w.MutationObserver)return;
 let section=null,controller=null,provider=null,iframe=null,timer=null,intersection=null,apiPromise=null,intersectionVisible=true;
 function isVisible(){if(!section?.isConnected||d.hidden||section.closest('[hidden]'))return false;const b=section.getBoundingClientRect();if(b.width<200||b.height===0)return false;return !iframe||intersectionVisible;}
 function unload(){if(timer!==null){w.clearInterval(timer);timer=null;}intersection?.disconnect();intersection=null;try{provider?.destroy?.();}catch(_){}provider=null;iframe?.remove();iframe=null;intersectionVisible=true;if(section){section.querySelector('.psx-player-host').replaceChildren();section.querySelector('[data-psx-load]').hidden=false;}}
 function render(s){if(!section?.isConnected)return;const status=section.querySelector('[data-psx-status]');if(status.textContent!==s.message)status.textContent=s.message;section.dataset.phase=s.phase;section.querySelector('[data-psx-select]').value=String(s.index);const a=section.querySelector('[data-psx-link]');a.href=linkFor(s.index);a.textContent='Open '+s.track.name+' on YouTube ↗';const bounds=section.querySelector('[data-psx-bounds]'),clock=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0');const text=clock(s.track.start)+'–'+clock(s.track.end)+' · Your title for source Soundtrack '+(s.index+1);if(bounds.textContent!==text)bounds.textContent=text;section.querySelector('[data-psx-close]').hidden=!s.active;section.querySelector('[data-psx-load]').hidden=s.active;section.querySelector('[data-psx-loop]').checked=s.loop;}
 function ensureAPI(){
  if(w.YT?.Player)return Promise.resolve(w.YT);
  if(apiPromise)return apiPromise;
  apiPromise=new Promise((resolve,reject)=>{const previous=w.onYouTubeIframeAPIReady;let done=false;const script=d.createElement('script');script.src='https://www.youtube.com/iframe_api';script.referrerPolicy='strict-origin-when-cross-origin';script.async=true;
   const timeout=w.setTimeout(()=>finish(false),18000);
   function finish(ok){if(done)return;done=true;w.clearTimeout(timeout);script.onerror=null;if(ok)resolve(w.YT);else{script.remove();apiPromise=null;reject(new Error('YouTube API unavailable'));}}
   w.onYouTubeIframeAPIReady=function(){try{if(typeof previous==='function')previous();}catch(_){}finish(!!w.YT?.Player);};script.onerror=()=>finish(false);d.head.append(script);
  });return apiPromise;
 }
 function start(event){
  if(event?.isTrusted!==true)return;
  const owner=controller,token=owner.begin(true);if(token===null)return;
  if(iframe)return;
  const s=controller.snapshot(),host=section.querySelector('.psx-player-host');iframe=d.createElement('iframe');iframe.id='petsimx-youtube-frame';iframe.title='Pet Simulator X · visible online YouTube player';iframe.width='480';iframe.height='270';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;
  const vars=new URLSearchParams({enablejsapi:'1',controls:'1',autoplay:'0',playsinline:'1',rel:'0',start:String(s.track.start),end:String(s.track.end)});
  if(/^https?:$/.test(w.location.protocol))vars.set('origin',w.location.origin);
  iframe.src='https://www.youtube-nocookie.com/embed/'+videoID+'?'+vars.toString();host.append(iframe);iframe.scrollIntoView({block:'nearest'});
  if(w.IntersectionObserver){intersection=new w.IntersectionObserver(entries=>{for(const entry of entries){intersectionVisible=entry.isIntersecting&&entry.intersectionRatio>=.5;if(!intersectionVisible&&controller.snapshot().active)controller.close('Player scrolled out of view: YouTube stopped. Local music restored.');}},{threshold:[0,.5]});intersection.observe(iframe);}
  timer=w.setInterval(()=>controller.tick(),500);
  const frame=iframe,current=()=>controller===owner&&iframe===frame&&owner.snapshot().active&&owner.snapshot().generation===token;
  ensureAPI().then(()=>{if(!current()||!isVisible())return;provider=new w.YT.Player(frame,{host:'https://www.youtube-nocookie.com',events:{onReady:e=>{if(current())owner.attach(e.target,token);else try{e.target.destroy();}catch(_){}},onStateChange:e=>{if(current())owner.providerState(e.data);},onError:e=>{if(current())owner.fail(e.data);},onAutoplayBlocked:()=>{if(current())owner.autoplayBlocked();}}});}).catch(()=>{if(current())owner.fail('API');});
 }
 function connect(){
  const anchor=d.querySelector('#soundtrack-credits');
  if(section&&!section.isConnected){controller.close('Music panel closed. YouTube stopped.');section=null;controller=null;}
  if(!anchor||section)return;
  section=d.createElement('section');section.id='petsimx-youtube';section.className='psx-youtube';section.setAttribute('aria-label','Pet Simulator X online music');
  section.innerHTML='<h3>Pet Simulator X · YouTube <span class="psx-online">ONLINE</span></h3><p>Seven chapters, with your track names. Internet required. Local soundtracks above stay unchanged.</p><label>Online chapter<select data-psx-select aria-label="Pet Simulator X online chapter"></select></label><p class="psx-bounds" data-psx-bounds></p><div class="psx-actions"><button type="button" class="btn small" data-psx-prev>Previous</button><button type="button" class="btn small" data-psx-next>Next</button><label class="psx-loop"><input type="checkbox" data-psx-loop> Loop chapter</label></div><button type="button" class="btn" data-psx-load>Load YouTube player</button><div class="psx-player-host"></div><p role="status" aria-live="polite" data-psx-status></p><button type="button" class="btn ghost small" data-psx-close hidden>Close YouTube · return to local music</button><a data-psx-link target="_blank" rel="noopener noreferrer"></a><p class="psx-privacy">Load connects to YouTube/Google; their privacy terms and ads apply. No YouTube request before you load. Use the visible player’s Play button. Your existing Music volume/mute controls also apply. Playback stops when this player leaves view, Settings closes, or the page hides — not background/offline audio. Chapter limits are requested from YouTube; its controls, branding and ads are not altered. This selection is temporary, not a saved local soundtrack ID. Source: Dun Roblox compilation; titles here are your labels, not composer credits.</p>';
  const select=section.querySelector('[data-psx-select]');tracks.forEach((t,i)=>{const o=d.createElement('option');o.value=String(i);o.textContent=t.name;select.append(o);});anchor.append(section);
  controller=createController({audio:w.BOAudio,visible:isVisible,online:()=>w.navigator.onLine!==false,changed:render,unload});render(controller.snapshot());
  section.querySelector('[data-psx-load]').addEventListener('click',start);
  section.querySelector('[data-psx-close]').addEventListener('click',()=>controller.close());
  select.addEventListener('change',()=>controller.select(Number(select.value),true));
  for(const [q,step]of [['[data-psx-prev]',-1],['[data-psx-next]',1]])section.querySelector(q).addEventListener('click',()=>controller.select((controller.snapshot().index+step+tracks.length)%tracks.length,true));
  section.querySelector('[data-psx-loop]').addEventListener('change',e=>controller.setLoop(e.target.checked));
 }
 const observer=new w.MutationObserver(()=>{connect();if(controller?.snapshot().active&&!isVisible())controller.close('Music panel hidden. YouTube stopped; local music restored.');});
 observer.observe(d.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style']});
 d.addEventListener('visibilitychange',()=>{if(d.hidden&&controller?.snapshot().active)controller.close('Page hidden. YouTube stopped; local music restored.');});
 w.addEventListener('pagehide',()=>controller?.close('Page closed. YouTube stopped.'));
 w.addEventListener('offline',()=>{if(controller?.snapshot().active)controller.close('Offline: YouTube stopped. Local music remains available.','offline');});
 w.addEventListener('bo-audio-status',()=>controller?.syncNative());
 d.addEventListener('change',e=>{if(e.target?.id==='music-track'&&controller?.snapshot().active)controller.close('Local soundtrack selected. YouTube stopped.');});
 d.addEventListener('input',e=>{if(e.target?.id==='music-volume')controller?.syncNative();});
 connect();
 return Object.freeze({status:()=>controller?.snapshot()||{phase:'unmounted',active:false},close:()=>controller?.close()});
}
return Object.freeze({videoID,tracks,linkFor,createController,mount});
});
