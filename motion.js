/* Presentation only: never calls the rules engine, RNG or storage. */
(function(root){'use strict';
let current=null;
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function enabled(prefs){return !!prefs.motion&&!reduced()}
function durationMultiplier(){return (root.BOApp?.getProgress?.().level>=22?.8:1)*(current?.scoringDurationMultiplier||1)}
 function animate(el,frames,options){options={...options,duration:options.duration*durationMultiplier(),...(options.delay?{delay:options.delay*durationMultiplier()}: {})};if(!el||typeof el.animate!=='function')return null;try{return el.animate(frames,{fill:'both',...options})}catch(e){return null}}
function skip(){window.BOAudio?.cancelEffects();if(!current)return;current.skipped=true;clearCritBursts(current);for(const resolve of [...current.waiters])resolve();for(const a of current.animations){try{a.finish()}catch(e){a.cancel()}}}
function wait(session,ms){if(session.skipped)return Promise.resolve();return new Promise(resolve=>{let timer;const done=()=>{clearTimeout(timer);session.waiters.delete(done);resolve()};session.waiters.add(done);timer=setTimeout(done,ms*durationMultiplier()/session.speed)})}
function pop(el,colour){if(!el)return;animate(el,[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.11)',filter:'brightness(1.4)',color:colour||'inherit'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:270,fill:'none',easing:'ease-out'})}
function floating(text,target,colour){if(!target)return;const r=target.getBoundingClientRect(),el=document.createElement('div');el.className='fx-floating';el.textContent=text;el.style.cssText=`left:${r.left+r.width/2}px;top:${r.top}px;color:${colour||'#edc878'}`;document.body.append(el);const a=animate(el,[{transform:'translate(-50%,4px) scale(.8)',opacity:0},{transform:'translate(-50%,-12px) scale(1)',opacity:1,offset:.25},{transform:'translate(-50%,-55px) scale(1.05)',opacity:0}],{duration:800});if(a)a.finished.catch(()=>{}).finally(()=>el.remove());else el.remove()}
function confetti(target){if(!target)return;const r=target.getBoundingClientRect();for(let i=0;i<22;i++){const p=document.createElement('span');p.className='fx-confetti';p.style.cssText=`left:${r.left+r.width/2}px;top:${r.top+Math.min(r.height/2,140)}px;background:${['#edc878','#91d6ac','#68b9e0','#ec8a83'][i%4]}`;document.body.append(p);const angle=(i/22)*Math.PI*2,dx=Math.cos(angle)*(70+i%5*25),dy=Math.sin(angle)*90;const a=animate(p,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${dx}px,${dy+150}px) rotate(${i*83}deg)`,opacity:0}],{duration:1100+i%4*80,easing:'cubic-bezier(.1,.6,.5,1)'});if(a)a.finished.catch(()=>{}).finally(()=>p.remove());else p.remove()}}
// CRIT ownership comes only from native scorer metadata, never rank/suit labels.
// One smooth burst per physical card; every real retrigger remains in the count.
function clearCritBursts(session){if(!session?.crit)return;for(const node of session.crit.bursts)node.remove();session.crit.bursts.clear();for(const group of session.crit.groups.values())group.target.classList.remove('fx-critical-card')}
function prepareCrit(session,stage,played,result){
 const groups=new Map(),targets=new Map(played.map(el=>[el.dataset.card,el])),seen=new Set();
 if(Array.isArray(result.critEvents))for(const event of result.critEvents){
  if(!event||!['string','number'].includes(typeof event.cardId)||!Number.isSafeInteger(event.lineIndex)||event.lineIndex<0||seen.has(event.lineIndex))continue;
  const id=String(event.cardId),target=targets.get(id);if(!target)continue;seen.add(event.lineIndex);
  let group=groups.get(id);if(!group){group={id,target,count:0,firstLine:event.lineIndex,shown:false};groups.set(id,group)}group.count++;group.firstLine=Math.min(group.firstLine,event.lineIndex);
 }
 const totals=result.critTotals,trace=result.critEvents;
 if(Array.isArray(totals)&&totals.length>0&&totals.length<=5&&Array.isArray(trace)&&trace.length===512&&seen.size===512&&trace.every((event,i)=>!i||event.lineIndex>trace[i-1].lineIndex)){
  const aggregate=new Map(),firsts=new Set();let total=0,valid=true;
  for(const item of totals){
   if(!item||!['string','number'].includes(typeof item.cardId)||!Number.isSafeInteger(item.firstLine)||item.firstLine<0||!Number.isSafeInteger(item.totalCount)||item.totalCount<1){valid=false;break}
   const id=String(item.cardId),target=targets.get(id),group=groups.get(id);
   if(!target||aggregate.has(id)||firsts.has(item.firstLine)||(group&&(item.firstLine!==group.firstLine||item.totalCount<group.count))||(!group&&item.firstLine<=trace[511].lineIndex)){valid=false;break}
   total+=item.totalCount;firsts.add(item.firstLine);aggregate.set(id,{id,target,count:item.totalCount,firstLine:item.firstLine,shown:false});
  }
  if(valid&&Number.isSafeInteger(total)&&total>512&&[...groups.keys()].every(id=>aggregate.has(id))){groups.clear();for(const [id,group]of aggregate)groups.set(id,group)}
 }
 if(!groups.size)return;stage.classList.add('fx-has-crits');const layer=document.createElement('div');layer.className='fx-crit-layer';stage.append(layer);session.crit={stage,layer,groups,bursts:new Set()};
}
function critBurst(session,group,lineIndex,late){
 const crit=session.crit;if(!crit||current!==session||session.skipped||group.shown||!enabled(session.prefs)||!crit.stage.isConnected||!group.target.isConnected)return;
 const card=group.target.getBoundingClientRect(),stage=crit.stage.getBoundingClientRect(),width=Math.min(76,Math.max(0,stage.width-12));if(!width||!card.width)return;
 const leftEdge=Math.max(6,-stage.left+6),rightEdge=Math.min(stage.width-6,document.documentElement.clientWidth-stage.left-6),centre=Math.max(leftEdge+width/2,Math.min(rightEdge-width/2,card.left+card.width/2-stage.left));
 const node=document.createElement('div');node.className='fx-crit-burst';node.dataset.card=group.id;node.dataset.lineIndex=String(lineIndex);node.dataset.critLate=String(late);node.setAttribute('aria-hidden','true');node.style.cssText=`left:${centre-width/2}px;top:${Math.max(6,card.top-stage.top-61)}px;width:${width}px`;
 const halo=document.createElement('span');halo.className='fx-crit-halo';const label=document.createElement('strong');label.textContent='CRIT!';const detail=document.createElement('small');detail.textContent=late?'Total '+group.count+' ×2':'×2 Mult';node.append(halo,label,detail);
 group.shown=true;crit.layer.append(node);crit.bursts.add(node);group.target.classList.add('fx-critical-card');
 const finish=()=>{node.remove();crit.bursts.delete(node);group.target.classList.remove('fx-critical-card')};
 const a=animate(node,[{transform:'translateY(4px) scale(.86)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1,offset:.2},{transform:'translateY(-2px) scale(1.02)',opacity:1,offset:.62},{transform:'translateY(-8px) scale(1.04)',opacity:0}],{duration:620/session.speed,easing:'cubic-bezier(.16,.7,.28,1)',fill:'none'});
 if(a){session.animations.push(a);a.finished.catch(()=>{}).finally(finish)}else finish();
}
function critAtLine(session,lineIndex){if(!session.crit)return;for(const group of session.crit.groups.values())if(group.firstLine===lineIndex)critBurst(session,group,lineIndex,false)}
function finishCrit(session,eventEl){
 const crit=session.crit;if(!crit||current!==session||!crit.stage.isConnected)return;let total=0;
 for(const group of crit.groups.values()){
  total+=group.count;if(!group.shown)critBurst(session,group,group.firstLine,true);
  const card=group.target.getBoundingClientRect(),stage=crit.stage.getBoundingClientRect(),badge=document.createElement('span');badge.className='fx-crit-count';badge.dataset.card=group.id;badge.dataset.critCount=String(group.count);badge.textContent=group.count+' CRIT'+(group.count===1?'':'s');badge.setAttribute('aria-label',group.count+' actual ×2 CRIT trigger'+(group.count===1?'':'s')+' on this card');badge.style.cssText=`left:${card.left-stage.left}px;top:${Math.max(3,card.top-stage.top-20)}px;width:${card.width}px`;crit.layer.append(badge);
 }
 const summary=document.createElement('p');summary.className='fx-crit-summary';summary.textContent='CRIT! '+total+' ×2 trigger'+(total===1?'':'s')+' across '+crit.groups.size+' card'+(crit.groups.size===1?'':'s')+'.';crit.stage.insertBefore(summary,eventEl);
}
function capture(run,selected){return {score:run?.score||0,money:run?.money||0,phase:run?.phase,handIds:(run?.hand||[]).map(c=>String(c.id)),cards:(run?.hand||[]).filter(c=>selected.includes(String(c.id))).map(c=>({...c})),cardRects:[...document.querySelectorAll('[data-context="hand"]')].map(el=>({id:el.dataset.card,rect:el.getBoundingClientRect(),html:el.outerHTML})),jokers:(run?.jokers||[]).map(j=>({...j})),jokerUids:(run?.jokers||[]).map(j=>j.uid),scrollY:window.scrollY}}
function entrance(kind,before,run,prefs){if(!enabled(prefs))return;const speed=Number(prefs.speed)||1;
 if(kind==='discard'){for(const old of before.cardRects.filter(c=>before.cards.some(x=>String(x.id)===c.id))){const holder=document.createElement('div');holder.innerHTML=old.html;const el=holder.firstElementChild;el.classList.remove('selected');el.classList.add('fx-ghost');el.dataset.context='ghost';el.removeAttribute('data-card');el.disabled=true;Object.assign(el.style,{left:old.rect.left+'px',top:old.rect.top+'px',width:old.rect.width+'px',height:old.rect.height+'px'});document.body.append(el);const a=animate(el,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate(90px,-100px) rotate(25deg)',opacity:0}],{duration:330/speed,easing:'ease-in'});if(a)a.finished.catch(()=>{}).finally(()=>el.remove());else el.remove()}}
 if(['deal','discard','play'].includes(kind)){let i=0;for(const el of document.querySelectorAll('[data-context="hand"]'))if(kind==='deal'||!before.handIds.includes(el.dataset.card)){animate(el,[{transform:'translate(45px,-40px) rotate(12deg)',opacity:0},{transform:'translate(0,0) rotate(0)',opacity:1}],{duration:340/speed,delay:(kind==='discard'?100:0)+(i++*42)/speed,easing:'cubic-bezier(.15,.8,.25,1)',fill:'none'})}}
 if(['purchase','cashout','pack'].includes(kind)){pop(document.querySelector('.resource.cash'));const delta=(run.money||0)-before.money;if(delta)floating((delta>0?'+':'−')+'$'+Math.abs(delta),document.querySelector('.resource.cash'),delta>0?'#91d6ac':'#edc878');let i=0;for(const el of document.querySelectorAll('.shop-item,.cashout-line'))animate(el,[{transform:'translateY(15px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:260/speed,delay:(i++*30)/speed,fill:'none'});for(const el of document.querySelectorAll('[data-context="owned"]')){const j=run.jokers[Number(el.dataset.joker)];if(j&&!before.jokerUids.includes(j.uid))animate(el,[{transform:'scale(.6) rotate(-9deg)',opacity:0},{transform:'scale(1.08) rotate(2deg)',opacity:1,offset:.7},{transform:'scale(1) rotate(0)',opacity:1}],{duration:450/speed,fill:'none'})}}
}
async function play(ctx){skip();const {before,run,cardHTML,fmt,esc,formatLine,prefs,jokerName}=ctx;if(!enabled(prefs))return;const session={skipped:false,waiters:new Set(),animations:[],speed:Number(prefs.speed)||1,prefs,scoringDurationMultiplier:root.BOApp?.potionInfo?.()?.effects?.scoringDurationMultiplier||1};current=session;const result=run.lastResult;if(!result)return;const surface=document.querySelector('.table-surface');if(!surface)return;
 const cards=before.cards.map(c=>({...c,faceDown:false}));
 surface.innerHTML=`<div class="fx-scoring" aria-live="polite"><div class="eyebrow">Scoring your hand</div><h2>${esc(result.name)} ${ctx.handLevelHTML?ctx.handLevelHTML(result.handLevel):''}</h2><div class="score-pair"><span class="chips-pill" id="fx-chips">0</span><span>×</span><span class="mult-pill" id="fx-mult">0</span></div><div class="hand-row fx-played-row">${cards.map((c,i)=>cardHTML(c,'scored',i)).join('')}</div><div class="fx-event" id="fx-event">Cards on the table.</div><div class="fx-hand-total" id="fx-total">0</div><button class="btn ghost small" data-action="skip-animation">Skip animation →</button></div>`;
 const eventEl=document.getElementById('fx-event'),chipsEl=document.getElementById('fx-chips'),multEl=document.getElementById('fx-mult'),totalEl=document.getElementById('fx-total');const scoreEl=document.querySelector('.score-total');if(scoreEl)scoreEl.textContent=fmt(before.score);
 try{
  const played=[...surface.querySelectorAll('[data-context="scored"]')];prepareCrit(session,surface.querySelector('.fx-scoring'),played,result);for(let i=0;i<played.length;i++){const el=played[i],to=el.getBoundingClientRect(),from=before.cardRects.find(c=>c.id===el.dataset.card)?.rect;const a=animate(el,[{transform:from?`translate(${from.left-to.left}px,${from.top-to.top}px) rotate(-8deg)`:'translateY(60px) rotate(-8deg)',opacity:.5},{transform:'translate(0,0) rotate(0)',opacity:1}],{duration:350/session.speed,delay:i*55/session.speed,easing:'cubic-bezier(.2,.8,.2,1)',fill:'none'});if(a)session.animations.push(a)}
  await wait(session,380+cards.length*45);
  let chips=0,mult=0;const lines=result.lines||[],limit=40,step=Math.max(1,Math.ceil(lines.length/limit));
  for(let i=0;i<lines.length&&!session.skipped;i++){
   const line=String(lines[i]);const base=line.match(/: ([\d.e+\-]+) Chips × ([\d.e+\-]+) Mult/);const increment=line.match(/^(.*?) ([+X])([\d.e+\-]+) (Chips|Mult)$/);
   if(base){chips=Number(base[1]);mult=Number(base[2])}else if(increment){const n=Number(increment[3]);if(increment[4]==='Chips')chips+=n;else mult=increment[2]==='X'?mult*n:mult+n}
   const isCrit=/\bCRIT\b/.test(line);if(i%step!==0&&i!==lines.length-1&&!isCrit)continue;
   chipsEl.textContent=fmt(chips);multEl.textContent=fmt(mult);const displayLine=formatLine?formatLine(line):line;eventEl.innerHTML=ctx.effectTextHTML?ctx.effectTextHTML(displayLine):esc(displayLine);if(increment)window.BOAudio?.sfx(increment[2]==='X'?'xmult':increment[4]==='Mult'?'mult':'chip',{pitch:Math.min(i,24),intensity:.6});
   if(isCrit)critAtLine(session,i);
   const isMult=increment?.[4]==='Mult';pop(isMult?multEl:chipsEl,isMult?'#ffd6d2':'#c5efff');
   const label=increment?.[1]||line;const jokerNodes=[...document.querySelectorAll('[data-context="owned"]')];for(const el of jokerNodes){const j=before.jokers[Number(el.dataset.joker)],name=j&&jokerName(j);if(name&&label.toLowerCase().includes(name.toLowerCase()))pop(el)}
   let hit=played.find((el,n)=>{const c=cards[n],rank={11:'Jack',12:'Queen',13:'King',14:'Ace'}[c.rank]||String(c.rank),suit={S:'Spades',H:'Hearts',D:'Diamonds',C:'Clubs'}[c.suit];return label.startsWith(rank+' '+suit)});if(hit)pop(hit);
   if(isMult&&increment[2]==='X')floating((isCrit?'CRIT! ':'')+'×'+increment[3],multEl,'#edc878');
   await wait(session,Math.max(38,Math.min(135,2100/Math.min(lines.length,limit))));
  }
  finishCrit(session,eventEl);chipsEl.textContent=fmt(result.chips);multEl.textContent=fmt(result.mult);eventEl.textContent='Hand scored';
  const duration=650*durationMultiplier()/session.speed,start=performance.now();let soundTick=-1;
  await new Promise(resolve=>{const frame=now=>{if(session.skipped){totalEl.textContent='+'+fmt(result.total);if(scoreEl)scoreEl.textContent=fmt(run.score);resolve();return}const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,3);const bucket=Math.floor(t*7);if(bucket>soundTick){soundTick=bucket;window.BOAudio?.sfx('chip',{pitch:bucket+3,intensity:.22})}totalEl.textContent='+'+fmt(Math.floor(result.total*ease));if(scoreEl)scoreEl.textContent=fmt(before.score+Math.floor((run.score-before.score)*ease));if(t<1)requestAnimationFrame(frame);else resolve()};requestAnimationFrame(frame)});
  if(!session.skipped&&run.phase==='lost')window.BOAudio?.sfx('lose');if(!session.skipped)pop(totalEl);if(!session.skipped&&['cashout','won'].includes(run.phase)){window.BOAudio?.sfx('win');eventEl.textContent='BLIND DEFEATED!';surface.classList.add('fx-victory');confetti(surface);await wait(session,550)}else await wait(session,210);
 }finally{clearCritBursts(session);for(const a of session.animations){try{a.cancel()}catch(e){}}for(const resolve of [...session.waiters])resolve();if(current===session)current=null;}
}
root.BOMotion={enabled,capture,entrance,play,skip};
})(window);
