/* Browser presentation measurement only: no game clock, XP, saves or history. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.BOBrowserFPS=api;if(root.document)api.mount(root);}})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 function createMeter(){let first=null,frames=0,level=null,fps=null;return{reset(){first=null;frames=0;level=null;fps=null;},sample(at,nextLevel){if(!Number.isFinite(at)||!Number.isInteger(nextLevel)||nextLevel<1||nextLevel>100){this.reset();return{level:null,fps:null};}if(first===null||nextLevel!==level||at<first){first=at;frames=0;level=nextLevel;fps=null;}else{frames++;if(at-first>=1000){fps=frames*1000/(at-first);first=at;frames=0;}}return{level,fps};}};}
 function mount(w){if(w.__boBrowserFPSCounter)return w.__boBrowserFPSCounter;const d=w.document,meter=createMeter(),node=d.createElement('span');node.id='bo-browser-fps';node.className='bo-browser-fps';node.title='Measured browser animation frames per second; not game ticks or XP updates.';node.setAttribute('aria-label','Current player level and measured browser frames per second');let raf=null,dead=false,current={level:null,fps:null};
  function level(){try{return w.BOApp?.getProfile?.()?.progression?.level??null;}catch(_){return null;}}
  function paint(paused=false){const text=(current.level===null?'Player':'Lv'+current.level)+' · '+(paused?'FPS paused':current.fps===null?'measuring FPS':Math.round(current.fps)+' browser FPS');if(node.textContent!==text)node.textContent=text;const header=d.querySelector('.topbar');if(header&&!node.isConnected)header.appendChild(node);}
  function frame(at){raf=null;if(dead||d.hidden)return;current=meter.sample(at,level());paint();raf=w.requestAnimationFrame(frame);}
  function stop(){if(raf!==null)w.cancelAnimationFrame(raf);raf=null;meter.reset();current={level:level(),fps:null};paint(true);}
  function start(){if(dead||d.hidden||raf!==null)return;meter.reset();current={level:level(),fps:null};paint();raf=w.requestAnimationFrame(frame);}
  function visibility(){if(d.hidden)stop();else start();}
  function destroy(){if(dead)return;stop();dead=true;node.remove();d.removeEventListener('visibilitychange',visibility);w.removeEventListener('pagehide',stop);w.removeEventListener('pageshow',start);delete w.__boBrowserFPSCounter;}
  d.addEventListener('visibilitychange',visibility);w.addEventListener('pagehide',stop);w.addEventListener('pageshow',start);const controller=Object.freeze({view:()=>({...current,paused:d.hidden}),destroy});w.__boBrowserFPSCounter=controller;start();return controller;
 }
 return Object.freeze({createMeter,mount});
});
