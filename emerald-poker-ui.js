/* Pure Emerald-owned Poker presentation. state is ONLY BOEmeraldPoker.publicState
 * (or null). Never authenticate/replay, inspect private order, seed, award, save,
 * schedule, play audio or query the DOM here. Parent owns all guarded actions.
 */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports,api=factory(node?require('./emerald-poker'):root.BOEmeraldPoker,node?require('./emerald-asset'):root.BOEmeraldPortrait,node?require('./poker-levels'):root.BOPokerLevels,node?require('./emerald-cardgame-dialogue'):root.BOCardgameDialogue);if(node)module.exports=api;else root.BOEmeraldPokerUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(P,Portrait,Levels,D){'use strict';
 const EN=Object.freeze({
  title:'Emerald’s Poker',eyebrow:'Emerald’s table · no wagers',leave:'Leave · your table is saved',
  bank:'Current poker Bank',noRun:'No active poker run',native:'Native player XP bonuses and caps apply once. Compound interest, Passive Money and the fictional battery keep their existing eligibility rules.',
  friendship:'Friendship Lv {level}',ownLevel:'Emerald Lv {level}',pokerLevel:'Poker Lv {level}',totalFP:'MAX · {total} total FP',
  pxp:'{total} cumulative PXP · next {next}',pxpMax:'{total} cumulative PXP · MAX',faucetMultiplier:'×{multiplier} Poker rewards · never faucet coins',
  levels:'All 40 Poker levels · cumulative PXP and reward bonuses',level:'Level',required:'Cumulative PXP',multiplier:'Poker rewards',inferred:'Exact supplied EMB cumulative requirements. The initial Poker cap and photos stop at 40; player levels remain separate.',
  rewards:'Hand rewards · highest category only',scroll:'Poker hand rewards; scroll horizontally for every currency and event',hand:'Hand',xp:'XP',fp:'Shared FP',medals:'Medals',coins:'Coins',claims:'Faucet-level claims',pokerXP:'PXP',event:'Timed event',
  exactBonus:'Exact selected target: +100 XP +5 FP once, added to the attained hand reward. One shared Friendship payout, not one per seat.',
  rewardPolicy:'Quoted hand rewards are base amounts before authenticated Poker-only reward bonuses, never faucet-level bonuses. Already-saved legacy hands keep their exact earned payouts. All coins and medals are fictional. The highest standard hand pays once; a lower no-pair hand below 10 pays nothing.',
  eventPolicy:'Event time continues while closed. Repeating an event refreshes to the later expiry, not a stacked multiplier. Royal’s 100 claims advance faucet-level progression only: no 100 claim payouts, daily tasks or streaks. Gameplay restart cooldowns only; CAPTCHA, consent, security, animation, daily resets, gift and earning cadences remain.',
  noEvent:'—',royalEvent:'Gameplay cooldowns = 0 · 7 real days',straightFlushEvent:'×2 faucet coins · 1 real day',fourKindEvent:'×2 Balatro score · 1 real hour',fullHouseEvent:'×2 earned XP · 30 real minutes',
  deck:'Deck',cardsRemaining:'{count} cards',deckLabel:'Deck: {count} cards remaining. Hidden order is never shown.',
  draw:'Draw 5',redraw:'Redraw once',submitHeld:'Submit held 5',hold:'HOLD',held:'HELD',holdCard:'Hold {card} in position {position}',unholdCard:'Unhold {card} in position {position}',placeholder:'Card {position} · draw five to begin',
  you:'You · five ordered cards',shared:'One shared five-card round · no opponent’s hidden hand',instructions:'Draw 5 to reveal a target. Tap cards to HOLD; redraw exactly once. Only unheld positions change. Holding all five is a valid submit. Next Draw 5 starts a new shuffled round.',
  ready:'Draw five when you’re ready. I’ll announce our target after the draw.',target:'Our selected target is {hand}. Hold what you like, then redraw once.',actual:'The final hand is {hand}.',matched:'We matched our selected target.',missed:'Our selected target was {hand}.',
  targetCaption:'Selected target:',resultCaption:'Final hand:',savedReward:'Saved round reward:',bonusIncluded:'Exact-target bonus included once.',noReward:'No reward for this hand.',
  persisted:'Leaving or reloading preserves this round, held positions and saved result. Opening the table, holding a card and reading a result never pay again.',
  'hand.royal-flush':'Royal Flush','hand.straight-flush':'Straight Flush','hand.four-of-a-kind':'Four of a Kind','hand.full-house':'Full House','hand.flush':'Flush','hand.straight':'Straight','hand.three-of-a-kind':'Three of a Kind','hand.two-pair':'Two Pair','hand.one-pair':'One Pair','hand.high-card':'High Card (10+)','hand.none':'No Winning Hand'
 });
 const LEVEL_COPY=Object.freeze({rewardMultiplier:'×{multiplier} Poker rewards · never faucet coins',rewardLevels:'All 40 Poker levels · cumulative PXP and reward bonuses',rewardColumn:'Poker rewards',exactLevels:'Exact supplied EMB requirements. Level 40 is the initial Poker cap; player levels remain separate. Photos stop at 40.',levelBadge:'LEVEL {level}',baseRewardPolicy:'Base hand rewards shown. Poker-level reward bonuses belong only to authenticated Poker reward receipts, never the faucet. Already-saved legacy hands keep their exact earned payouts.'});
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const finite=(v,f=0)=>typeof v==='number'&&Number.isFinite(v)?v:f;
 const pct=v=>Math.max(0,Math.min(100,finite(v)));
 const count=(v,f=0)=>Number.isSafeInteger(v)&&v>=0?v:f;
 const number=v=>finite(v).toLocaleString('en-US',{maximumFractionDigits:3});
 function label(k,params={}){
  const key='poker.'+k,text=globalThis.BOTranslation?.t?.(key,params),source=typeof text==='string'&&text&&text!==key?text:LEVEL_COPY[k]||EN[k]||k;
  return source.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(all,name)=>Object.prototype.hasOwnProperty.call(params,name)?String(params[name]):all);
 }
 const t=(k,p)=>esc(label(k,p));
 function categoryName(c){const id=c?.id||c?.category;return id?label('hand.'+id):c&&typeof c.name==='string'?c.name:label('hand.none')}
 function reaction(s){
   const contextual=D?.line('poker',s);if(contextual)return contextual;
  if(!s?.target||s.phase==='idle')return label('ready');
  if(s.phase!=='settled'||!s.result)return label('target',{hand:categoryName(s.target)});
  return label('actual',{hand:categoryName(s.result)})+' '+label(s.receipt?.matchedTarget?'matched':'missed',{hand:categoryName(s.target)});
 }
 function meter(kind,title,text,percent){
  const p=pct(percent);
  return '<div class="poker-progress '+kind+'"><div><strong>'+title+' · '+number(p)+'%</strong><span>'+text+'</span></div><div class="poker-meter" role="progressbar" aria-label="'+esc(stripLabel(title))+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p+'"><i style="width:'+p+'%"></i></div></div>';
 }
 function stripLabel(title){return title.replace(/<[^>]*>/g,'')}
 function companionBars(f,e){
  const friend=f||{},pet=e||{},level=Math.max(1,Math.min(15,Math.trunc(finite(friend.level,1)))),fpct=friend.capped?100:pct(friend.percent),epct=pet.max?100:pet.nextWins>0?pct(100*finite(pet.wins)/pet.nextWins):0;
  return meter('poker-friendship',t('friendship',{level}),friend.capped?t('totalFP',{total:number(friend.totalFP??friend.fp)}):number(friend.fp)+'/'+number(friend.required??100)+' FP',fpct)+meter('poker-own',t('ownLevel',{level:count(pet.level)}),esc(pet.bar??(pet.max?'MAX':number(pet.wins)+'/'+number(pet.nextWins))),epct);
 }
 const experience=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=Number.MAX_SAFE_INTEGER&&!Object.is(v,-0);
 function pokerLevelInfo(s){
  // Public checkpoints may include authenticated fractional bonus PXP. Never
  // send those totals through legacy integer-only model levelInfo.
  const thresholds=Levels?.THRESHOLDS||P.LEVEL_THRESHOLDS;
  function info(total){if(Levels)return Levels.info(total);let i=0;while(i<39&&total>=thresholds[i+1])i++;const max=i===39,floor=thresholds[i],next=max?null:thresholds[i+1],required=max?0:next-floor,progress=max?0:total-floor;return {level:i+1,total,floor,next,required,progress,remaining:max?0:required-progress,percent:max?100:100*progress/required,multiplier:1+i/100,multiplierHundredths:100+i,max}}
  const supplied=s?.level,checkpoint=supplied?.totalPXP??supplied?.total;
  if(experience(checkpoint)){const candidate=info(checkpoint);if(supplied.level===candidate.level)return candidate}
  return info(experience(s?.totalPXP)?s.totalPXP:0);
 }
 function levelProgress(s){
  // Pure metadata from public cumulative PXP; never use a faucet multiplier.
  const l=pokerLevelInfo(s),total=l.total,thresholds=Levels?.THRESHOLDS||P.LEVEL_THRESHOLDS,multiplier=l.multiplier.toFixed(2);
  const progress=meter('poker-level-progress',t('pokerLevel',{level:l.level}),l.max?t('pxpMax',{total:number(total)}):t('pxp',{total:number(total),next:number(l.next)}),l.max?100:l.percent);
  const rows=thresholds.map((required,index)=>'<tr data-poker-level="'+(index+1)+'"'+(index+1===l.level?' class="is-current" aria-current="true"':'')+'><th scope="row"><span class="poker-level-ribbon" data-tier="'+Math.min(4,Math.floor(index/10))+'">'+(index+1)+'</span>'+(index+1===l.level?'<span class="poker-level-badge">'+t('levelBadge',{level:l.level})+'</span>':'')+'</th><td>'+number(required)+'</td><td>×'+(1+index*.01).toFixed(2)+'</td></tr>').join('');
  return '<div class="poker-level-block">'+progress+'<p class="poker-multiplier">'+t('rewardMultiplier',{multiplier})+'</p><details class="poker-levels"><summary>'+t('rewardLevels')+'</summary><p>'+t('exactLevels')+'</p><div class="poker-levels-scroll" role="region" tabindex="0" aria-label="'+t('rewardLevels')+'"><table><thead><tr><th>'+t('level')+'</th><th>'+t('required')+'</th><th>'+t('rewardColumn')+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></details></div>';
 }
 function eventText(id){return label({'zero-cooldowns':'royalEvent','double-faucet':'straightFlushEvent','double-score':'fourKindEvent','double-xp':'fullHouseEvent'}[id]||'noEvent')}
 function rewardsTable(s){
  const actual=s?.phase==='settled'?s.result?.category:null;
  const rows=P.CATEGORIES.map(c=>{
   const p=P.PAYOUTS[c.id],fields=['xp','fp','medals','coins','faucetClaims','pxp'];
   return '<tr class="poker-reward-row'+(actual===c.id?' is-actual':'')+'" data-category="'+c.id+'"'+fields.map(k=>' data-reward-'+k+'="'+p[k]+'"').join('')+'><th scope="row">'+t('hand.'+c.id)+'</th>'+fields.map(k=>'<td>+'+number(p[k])+'</td>').join('')+'<td'+(p.events[0]?' data-event="'+p.events[0].id+'"':'')+'>'+esc(p.events.length?eventText(p.events[0].id):label('noEvent'))+'</td></tr>';
  }).join('');
  return '<section class="poker-rewards" aria-labelledby="poker-rewards-title"><h2 id="poker-rewards-title">'+t('rewards')+'</h2><div class="poker-rewards-scroll" role="region" tabindex="0" aria-label="'+t('scroll')+'"><table><thead><tr>'+['hand','xp','fp','medals','coins','claims','pokerXP','event'].map(k=>'<th scope="col">'+t(k)+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div><p class="poker-target-bonus">'+t('exactBonus')+'</p><details class="poker-reward-notes"><summary>'+t('baseRewardPolicy')+'</summary><p>'+t('eventPolicy')+'</p></details></section>';
 }
 function cardHTML(c,index,held,highlighted,enabled,revision,dealing=false){
  if(!c)return '<div class="poker-card-slot" data-index="'+index+'"><div class="poker-card poker-card-placeholder" role="img" aria-label="'+t('placeholder',{position:index+1})+'"><span aria-hidden="true">'+(index+1)+'</span></div></div>';
  const suits={S:'♠',H:'♥',D:'♦',C:'♣'},suit=suits[c.suit]||'?',rank=c.rank===14?'A':({11:'J',12:'Q',13:'K'}[c.rank]||c.rank||'?'),name=rank+suit,title=label(held?'unholdCard':'holdCard',{card:name,position:index+1});
  return '<div class="poker-card-slot'+(dealing?' poker-dealing':'')+'" style="--poker-reveal-index:'+index+'" data-index="'+index+'"><button type="button" class="poker-card'+(['H','D'].includes(c.suit)?' poker-red':'')+(held?' is-held':'')+(highlighted?' poker-contributing':'')+'" data-action="emerald-poker" data-poker-action="toggle-hold" data-index="'+index+'" data-revision="'+revision+'" data-card-id="'+count(c.id)+'" data-highlighted="'+highlighted+'" aria-pressed="'+held+'" aria-label="'+esc(title)+'" title="'+esc(title)+'"'+(enabled?'':' disabled')+'><span class="poker-card-corner" aria-hidden="true">'+esc(rank)+'<small>'+suit+'</small></span><strong aria-hidden="true">'+suit+'</strong><span class="poker-card-bottom" aria-hidden="true">'+esc(rank)+suit+'</span><span class="poker-hold">'+t(held?'held':'hold')+'</span></button></div>';
 }
 function settlement(s){
  if(s?.phase!=='settled'||!s.result)return '';
  const r=s.receipt?.rewards,parts=r?['xp','fp','medals','coins','faucetClaims','pxp'].map(k=>'+'+number(r[k])+' '+label({xp:'xp',fp:'fp',medals:'medals',coins:'coins',faucetClaims:'claims',pxp:'pokerXP'}[k])):[];
  return '<div class="poker-settlement" role="status"><p><strong>'+t('resultCaption')+'</strong> '+esc(categoryName(s.result))+'</p><p><strong>'+t('savedReward')+'</strong> '+(s.result.category==='none'?t('noReward'):esc(parts.join(' · ')))+'</p>'+(s.receipt?.matchedTarget?'<small>'+t('bonusIncluded')+'</small>':'')+'</div>';
 }
 function html(o={}){
  const s=o.state||null,e=o.emerald||{},revision=count(s?.revision),holding=s?.phase==='holding',disabled=o.disabled===true,can=s?.can||{draw:true,toggleHold:false,redraw:false};
  const portrait=typeof o.portraitHTML==='string'?o.portraitHTML:Portrait?.html(e.unlocked===false?0:e.level||0,o.playerLevel,'poker')||'<span class="poker-portrait-fallback" aria-hidden="true">♣</span>';
  const action=(a,text,allowed)=>'<button type="button" class="btn poker-'+a+'" title="'+text+'" aria-label="'+text+'" data-action="emerald-poker" data-poker-action="'+a+'" data-revision="'+revision+'"'+(!disabled&&allowed?'':' disabled')+'>'+text+'</button>';
  const cards=Array.from({length:5},(_,i)=>cardHTML(s?.hand?.[i],i,s?.held?.[i]===true,s?.phase==='settled'&&Array.isArray(s.result?.highlight)&&s.result.highlight.includes(i),!disabled&&holding&&can.toggleHold===true,revision,o.animate===true&&s?.hand?.[i]?.id!==o.before?.hand?.[i]?.id)).join('');
  const countRemaining=count(s?.deckRemaining,52),bank=typeof o.bankText==='string'?esc(o.bankText):Number.isFinite(o.bank)?'$'+number(o.bank):t('noRun');
  return '<section id="emerald-poker-table" class="emerald-poker-table" aria-labelledby="poker-title"><header class="poker-heading"><div><p class="poker-eyebrow">'+t('eyebrow')+'</p><h1 id="poker-title">'+t('title')+'</h1></div><button type="button" class="icon-button poker-close" data-action="close-poker" aria-label="'+t('leave')+'" title="'+t('leave')+'">×</button></header><div class="poker-modes" role="group" aria-label="Poker mode"><button type="button" data-action="poker-mode" data-poker-mode="chill" aria-pressed="true">Chill Poker</button><button type="button" data-action="poker-mode" data-poker-mode="strict" aria-pressed="false"'+(o.strictAvailable===true?'':' disabled aria-disabled="true"')+'>Strict Poker'+(o.strictAvailable===true?'':' · Player Level 50')+'</button></div><p class="poker-bank">'+t('bank')+': <strong id="poker-bank">'+bank+'</strong></p><div class="poker-felt">'+levelProgress(s)+'<section class="poker-companion" aria-label="Emerald’s seat"><div class="poker-playing-portrait" data-playing-portrait="true">'+portrait+'</div><h2>Emerald</h2>'+companionBars(o.friendship,e)+'</section>'+rewardsTable(s)+'<div class="poker-center"><p class="poker-dialogue" role="status" aria-live="polite"><strong class="poker-speaker">Emerald: </strong><span class="poker-reaction">'+esc(reaction(s))+'</span></p>'+(s?.target?'<p class="poker-target" data-selected-target="'+esc(s.target.id)+'"><strong>'+t('targetCaption')+'</strong> '+esc(categoryName(s.target))+'</p>':'')+'</div><section class="poker-player-seat" aria-labelledby="poker-player-title"><h2 id="poker-player-title">'+t('you')+'</h2><div class="poker-deal-row"><div class="poker-deck" role="img" aria-label="'+t('deckLabel',{count:countRemaining})+'"><span>'+t('deck')+'</span><b aria-hidden="true">♠</b><small>'+t('cardsRemaining',{count:countRemaining})+'</small></div><div class="poker-hand">'+cards+'</div></div><p class="poker-shared">'+t('shared')+'</p><div class="poker-actions">'+(holding?action('redraw',t(s?.held?.every(x=>x===true)?'submitHeld':'redraw'),can.redraw===true):action('draw',t('draw'),can.draw===true))+'</div>'+settlement(s)+'</section></div><footer class="poker-footer"><p>'+t('instructions')+'</p><p>'+t('persisted')+'</p><small>'+t('native')+'</small></footer></section>';
 }
 return Object.freeze({html,reaction,label,EN,levelProgress,pokerLevelInfo,companionBars});
});
