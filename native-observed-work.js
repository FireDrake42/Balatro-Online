/* Native private foreground work. No elapsed/amount arguments, storage, timer,
 * reward, global clock replacement, or authority from caller-owned receipts.
 * At most 2500 REAL ms are retained; one drain is at most 2500 logical ms.
 * 2500 REAL in an actual GS window admits 3750 logical, retaining the tail. */
(function(root){'use strict';
 const brands=new WeakSet(),wall=Date.now.bind(Date),mono=performance.now.bind(performance);
 const check=(ok,message)=>{if(!ok)throw Error('Native observed work: '+message)};
 const sum=q=>q.reduce((n,s)=>n+s.left,0),real=q=>q.reduce((n,s)=>n+s.realLeft,0);
 function create(source,mode='interest'){
  check(typeof source==='function'&&['interest','overlap'].includes(mode),'original owner callbacks required');
  const tokens=new WeakMap();let queue=[],anchor=null,binding=null,version=0,paused=false;
  function clocks(){const at=wall(),mt=mono();check(Number.isSafeInteger(at)&&at>=0&&Number.isFinite(mt)&&mt>=0,'invalid REAL clocks');return {at,mt};}
  function same(a,b){return !!a&&!!b&&a.owner===b.owner&&a.epoch===b.epoch&&a.key===b.key&&a.profile===b.profile&&a.run===b.run;}
  function witness(a,b){return same(a,b)&&a.profileRaw===b.profileRaw&&a.runRaw===b.runRaw&&a.profileJSON===b.profileJSON&&a.runJSON===b.runJSON;}
  function clear(){queue=[];anchor=null;binding=null;version++;}
  function observe(){
   check(arguments.length===0,'observation takes no public clock/budget');if(paused)return false;
   const t=clocks(),c=source();
   if(!c?.eligible||!c.owner){anchor=null;return false;}
   if(binding&&!witness(binding,c))clear();binding=c;
   const previous=anchor;anchor={...t,c};if(!previous)return false;
   const dt=t.mt-previous.mt,dw=t.at-previous.at;
   if(dt===0&&dw===0)return false;
   if(dt<=0||dw<=0||dt>2500||Math.abs(dt-dw)>50){clear();binding=c;anchor={...t,c};return false;}
   const G=root.BOGameSpeed,s=c.gameSpeed;
   if(s!==undefined)check(G?.validate(s),'whole native Game Speed receipt required');
   // Preserve admitted FIFO carry; excess NEW work is not banked.
   const accepted=Math.min(dt,Math.max(0,2500-real(queue)));if(!(accepted>0))return false;
   const until=accepted===dt?t.at:previous.at+dw*accepted/dt;
   const left=Math.max(previous.at,s?.startedAt??until),right=Math.min(until,s?.activeUntil??previous.at),overlap=Math.max(0,right-left);
   const amount=mode==='overlap'?overlap:accepted+overlap/2;
   if(amount<=0)return false;
   // The REAL queue cap never discards an already admitted prefix.
   queue.push({left:amount,realLeft:accepted,from:previous.at,to:Math.floor(mode==='overlap'?right:until)});return true;
  }
  function lease(){
   check(arguments.length===0,'lease takes no public amount');const c=source(),t=clocks(),amount=Math.min(2500,sum(queue));
   if(paused||!c?.eligible||!witness(binding,c)||!(amount>0))return null;
   const token=Object.freeze({}),details=Object.freeze({amount,at:t.at,mono:t.mt,until:queue[queue.length-1].to});
   tokens.set(token,{version,c,t,details,spent:false});return token;
  }
  function details(token){const e=tokens.get(token);check(e&&!e.spent,'private original lease required');return e.details;}
  function assert(token){
   const e=tokens.get(token),c=source({nativeTransaction:true}),t=clocks();
   check(e&&!e.spent&&e.version===version&&c?.eligible&&witness(e.c,c)&&sum(queue)+1e-7>=e.details.amount&&t.mt>=e.t.mt&&t.mt-e.t.mt<=2500&&Math.abs(t.at-e.t.at-(t.mt-e.t.mt))<=50,'owner/slot/epoch/whole banks/GS/foreground/clock changed');return true;
  }
  function consume(token,amount){
   const e=tokens.get(token),c=source({nativeTransaction:true,confirmedNative:true});
   check(e&&!e.spent&&e.version===version&&Number.isFinite(amount)&&amount>=0&&amount<=e.details.amount&&c?.eligible&&same(e.c,c),'confirmed publication lost its private source');
   let left=amount;while(left>1e-9&&queue.length){const first=queue[0],n=Math.min(left,first.left),fraction=n/first.left;first.realLeft*=1-fraction;first.left-=n;left-=n;if(first.left<1e-9)queue.shift();}
   check(left<=1e-7,'confirmed FIFO prefix changed');e.spent=true;version++;binding=c;if(anchor)anchor.c=c;return true;
  }
  function hold(){anchor=null;}
  function resume(){anchor=null;observe();}
  function reset(){clear();}
  function fail(){paused=true;anchor=null;}
  const api=Object.freeze({observe,lease,details,assert,consume,hold,resume,reset,fail,amount:()=>sum(queue)});brands.add(api);return api;
 }
 root.BONativeObservedWork=Object.freeze({create,isNative:cap=>brands.has(cap)});
})(typeof globalThis!=='undefined'?globalThis:this);
