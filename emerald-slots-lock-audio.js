/* Presentation only. A successful durable native Spin supplies the sole fresh
 * token. No gameplay/storage/RNG/ownership authority or ambient work at load. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldSlotsLockAudio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const NAMES=Object.freeze(['slots_lock_left','slots_lock_middle','slots_lock_right']),time=n=>Number.isSafeInteger(n)&&n>=0&&n<=8640000000000000;
 function create(host){
  if(!host||!['now','peek','schedule','clear','paint','play'].every(k=>typeof host[k]==='function'))throw Error('Slots audio presentation host is incomplete.');
  let token=null,epoch=0,destroyed=false;
  function cancel(){epoch++;const old=token;token=null;if(old)for(const id of old.timers)try{host.clear(id)}catch(_){}}
  function read(){try{return host.peek()}catch(_){return null}}
  function matches(c,t){try{
   if(!c||c.eligible!==true||c.writable!==true||c.stamp!==t.stamp||c.startedAtMs!==t.startedAtMs)return false;
   const s=c.state;if(!s||s.spinsStarted!==t.serial||!Array.isArray(s.reels)||s.reels.length!==3||!s.reels.every(r=>r&&typeof r.locked==='boolean'&&(!r.locked||Array.isArray(r.symbols)&&r.symbols.length===3)))return false;
   if(s.phase==='result')return s.spinsSettled===t.serial&&s.last?.id==='slots:'+t.serial&&s.last.serial===t.serial&&s.last.atMs===t.deadlines[2]&&s.reels.every(r=>r.locked&&r.lockAtMs===null);
   return (s.phase==='spinning'||s.phase==='ready')&&s.spinsSettled===t.serial-1&&s.reels.every((r,i)=>r.lockAtMs===t.deadlines[i]);
  }catch(_){return false}}
  function check(){if(!token)return false;if(destroyed||!matches(read(),token)){cancel();return false}return true}
  function timely(t,i,at){return time(at)&&at>=t.deadlines[i]&&at-t.deadlines[i]<=250&&!t.deadlines.some((due,j)=>j>i&&at>=due)}
  function stop(t,i){
   if(destroyed||token!==t||epoch!==t.epoch||t.consumed[i])return;
   // Consume BEFORE paint/audio, including a silent/late/failed attempt.
   t.consumed[i]=true;const c=read();if(!matches(c,t)){cancel();return}
   try{if(!timely(t,i,host.now())||!c.state.reels[i].locked||c.state.phase==='result'&&i!==2)return;
    if(host.paint(c.state)===false)return;
    if(token!==t||epoch!==t.epoch||!matches(read(),t)||!timely(t,i,host.now()))return;
    host.play(NAMES[i]);
   }catch(_){/* Locked/muted/failed presentation is nonfatal, consumed, never retried. */}
  }
  function fresh(result){
   cancel();if(destroyed||!result||result.ok!==true||result.changed!==true||result.completed!==false||result.resumed===true||result.receipt!==null)return false;
   try{const c=read(),s=c?.state,r=result.state,deadlines=s?.reels?.map(reel=>reel.lockAtMs),at=host.now();
    if(!time(at)||!time(c?.startedAtMs)||!Number.isSafeInteger(s?.spinsStarted)||s.spinsStarted<1||!Array.isArray(deadlines)||deadlines.length!==3||!deadlines.every((due,i)=>time(due)&&due>c.startedAtMs&&(!i||due>deadlines[i-1]))||!r||r.spinsStarted!==s.spinsStarted||r.spinsSettled!==s.spinsSettled||!['spinning','ready'].includes(r.phase)||!Array.isArray(r.reels)||r.reels.length!==3||!r.reels.every((reel,i)=>reel?.lockAtMs===deadlines[i]))return false;
    const t={serial:s.spinsStarted,startedAtMs:c.startedAtMs,deadlines:deadlines.slice(),stamp:c.stamp,epoch,consumed:[false,false,false],timers:[]};
    if(typeof t.stamp!=='string'||!matches(c,t)||s.phase==='result')return false;
    token=t;for(let i=0;i<3;i++)t.timers.push(host.schedule(()=>stop(t,i),Math.max(0,deadlines[i]-at)));return true;
   }catch(_){cancel();return false}
  }
  return Object.freeze({fresh,check,cancel,destroy(){destroyed=true;cancel()}});
 }
 return Object.freeze({create});
});
