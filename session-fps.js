/* Browser presentation only. Boost is reversible, current-page-only; no saved preference. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.BOBrowserFPS=api;if(root.document)api.mount(root);}})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 function createMeter(){let first=null,frames=0,level=null,fps=null;return{reset(){first=null;frames=0;level=null;fps=null;},sample(at,nextLevel){if(!Number.isFinite(at)||!Number.isInteger(nextLevel)||nextLevel<1||nextLevel>100){this.reset();return{level:null,fps:null};}if(first===null||nextLevel!==level||at<first){first=at;frames=0;level=nextLevel;fps=null;}else{frames++;if(at-first>=1000){fps=frames*1000/(at-first);first=at;frames=0;}}return{level,fps};}};}
 function settingsHTML(){return '<section id="bo-fps-settings" class="bo-fps-settings" aria-labelledby="bo-fps-title"><h3 id="bo-fps-title">Performance</h3><p id="bo-fps-help" class="build-note">Boost FPS reduces decorative effects and makes text instant. Game clocks, XP and rewards stay on. Current page only: resets OFF on reload. Higher FPS is not guaranteed.</p></section>';}
 function mount(w){
  if(w.__boBrowserFPSCounter)return w.__boBrowserFPSCounter;
  const d=w.document,meter=createMeter(),node=d.createElement('span'),button=d.createElement('button');
  node.id='bo-browser-fps';node.className='bo-browser-fps';node.title='Measured browser animation frames per second; not game ticks or XP updates.';node.setAttribute('aria-label','Current player level and measured browser frames per second');
  button.type='button';button.id='bo-fps-boost';button.className='bo-fps-boost';button.setAttribute('aria-describedby','bo-fps-help');button.setAttribute('aria-pressed','false');
  let raf=null,dead=false,boost=false,nextPaint=0,current={level:null,fps:null};
  function level(){try{return w.BOApp?.getProfile?.()?.progression?.level??null;}catch(_){return null;}}
  function available(){try{return !dead&&!d.hidden&&d.visibilityState==='visible'&&d.hasFocus()&&w.BOApp?.saveStatus?.()?.writable===true&&w.BONativePlayerXP?.status?.()?.paused===false;}catch(_){return false;}}
  function settingsHost(){
   let host=d.querySelector('#bo-fps-settings');if(host)return host;
   // Anchor to the real Settings form, not a translated title or another modal.
   const save=d.querySelector('#dialog-body [data-action="save-settings"]'),body=save?.closest('#dialog-body');
   if(!body)return null;body.insertAdjacentHTML('afterbegin',settingsHTML());return d.querySelector('#bo-fps-settings');
  }
  function paint(paused=false){
   const text=(current.level===null?'Player':'Lv'+current.level)+' · '+(paused?'FPS paused':current.fps===null?'measuring FPS':Math.round(current.fps)+' browser FPS');if(node.textContent!==text)node.textContent=text;
   const label='Boost FPS: '+(boost?'ON':'OFF');if(button.textContent!==label)button.textContent=label;button.setAttribute('aria-pressed',String(boost));button.disabled=!available();
   const header=d.querySelector('.topbar');if(header&&!node.isConnected)header.appendChild(node);
   const host=settingsHost();if(host&&button.parentNode!==host)host.appendChild(button);
  }
  function activate(event){
   if(event.isTrusted!==true||!available())return;
   return w.BONativePlayerXP.handle(event,()=>{if(!available())return false;boost=!boost;d.documentElement.classList.toggle('fps-boost',boost);paint();return true;},{owner:'ui:fps-boost',sourceWindow:w});
  }
  button.addEventListener('click',event=>{try{Promise.resolve(activate(event)).catch(()=>{});}catch(_){/* Native admission owns uncertainty reporting; never retry. */}});
  // Count every frame; query/paint the meter and Settings at most four times/sec.
  function frame(at){raf=null;if(dead||d.hidden)return;current=meter.sample(at,level());if(at>=nextPaint){paint();nextPaint=at+250;}raf=w.requestAnimationFrame(frame);}
  function stop(){if(raf!==null)w.cancelAnimationFrame(raf);raf=null;meter.reset();current={level:level(),fps:null};paint(true);}
  function start(){if(dead||d.hidden||raf!==null)return;meter.reset();nextPaint=0;current={level:level(),fps:null};paint();raf=w.requestAnimationFrame(frame);}
  function visibility(){if(d.hidden)stop();else start();}
  function destroy(){if(dead)return;stop();dead=true;d.documentElement.classList.remove('fps-boost');node.remove();button.remove();d.removeEventListener('visibilitychange',visibility);w.removeEventListener('pagehide',stop);w.removeEventListener('pageshow',start);delete w.__boBrowserFPSCounter;}
  d.addEventListener('visibilitychange',visibility);w.addEventListener('pagehide',stop);w.addEventListener('pageshow',start);
  const controller=Object.freeze({view:()=>({...current,paused:d.hidden,boost}),boostEnabled:()=>boost,destroy});w.__boBrowserFPSCounter=controller;start();return controller;
 }
 return Object.freeze({createMeter,settingsHTML,mount});
});
