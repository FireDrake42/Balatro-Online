/* Presentation-only staged PUBLIC cards. It receives no private table/shoe.
 * The guarded native action commits once; frames never award or write saves. */
(function(root,factory){'use strict';const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldCardFrames=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function frames(game,before,after){if(!after)return [after];const result=[],slots=[];
  if(game==='blackjack'){for(const side of ['player','emerald'])for(let i=0;i<(after[side]?.cards?.length||0);i++){const c=after[side].cards[i],old=before?.roundId===after.roundId?before?.[side]?.cards?.[i]:null;if(!c.hidden&&!same(c,old))slots.push([side,i])}}
  else if(game==='baccarat'&&after.round){for(let i=0;i<3;i++)for(const side of ['player','banker'])if(after.round[side]?.[i])slots.push([side,i]);}
  else if(game==='high-low'&&after.phase==='result'){slots.push(['next',0]);}
  if(!slots.length)return [copy(after)];
  for(let shown=0;shown<=slots.length;shown++){const s=copy(after);s.dealing=true;s.frame=shown;s.phase=game==='baccarat'?s.phase:'dealing';const revealedCount=side=>Math.max(0,...slots.slice(0,shown).filter(slot=>slot[0]===side).map(slot=>slot[1]+1));
   if(game==='blackjack'){s.score=copy(before?.score||{player:0,emerald:0});s.events=[];s.message='';delete s.winner;delete s.pointAwarded;delete s.matchWinner;for(const side of ['player','emerald']){s[side].total=null;s[side].visibleTotal=null;s[side].soft=false;s[side].bust=false}for(const [side,index]of slots.slice(shown))s[side].cards[index]={hidden:true};for(const side of ['player','emerald'])s[side].cards=s[side].cards.slice(0,Math.max(2,before?.roundId===after.roundId?before?.[side]?.cards?.length||0:0,revealedCount(side)))}
   else if(game==='baccarat'){delete s.round.winner;delete s.round.natural;s.round.playerTotal=null;s.round.bankerTotal=null;for(const [side,index]of slots.slice(shown))s.round[side][index]={hidden:true};for(const side of ['player','banker'])s.round[side]=s.round[side].slice(0,Math.max(2,revealedCount(side)))}
   else{const r=s.round;s.current={hidden:true};s.round={id:r.id,from:copy(r.from),next:shown?copy(r.next):{hidden:true}}}
   result.push(s);
  }
  result.push(copy(after));return result;
 }
 function create(options={}){let sequence=[],index=0,raf=null,last=null,elapsed=0,destroyed=false;const now=options.now||(()=>root.performance.now()),request=options.request||(fn=>root.requestAnimationFrame(fn)),cancel=options.cancel||(id=>root.cancelAnimationFrame(id)),step=options.stepMs||420;
  function stop(){if(raf!==null)cancel(raf);raf=null;sequence=[];index=0;last=null;elapsed=0}
  function tick(){raf=null;if(destroyed||!sequence.length)return;if(options.eligible?.()===false){stop();options.cancelled?.();return}const at=now(),delta=last===null?0:Math.max(0,Math.min(100,at-last));last=at;elapsed+=delta;if(elapsed>=step){elapsed-=step;index++;const current=sequence[index];options.frame?.(current);if(index===sequence.length-1){stop();options.complete?.();return}}raf=request(tick)}
  function start(game,before,after,motion=true){stop();sequence=frames(game,before,after);if(motion===false||root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||sequence.length===1){const value=sequence.at(-1);stop();options.frame?.(value);options.complete?.();return false}index=0;last=now();options.frame?.(sequence[0]);raf=request(tick);return true}
  return Object.freeze({start,cancel(){const active=sequence.length>0;stop();if(active)options.cancelled?.()},active:()=>sequence.length>0,current:()=>sequence[index]||null,destroy(){destroyed=true;stop()}});
 }
 return Object.freeze({frames,create});
});
