/* Detached native tutorial FSM. No IO/timers/DOM. Every state/reward is part of
 * the host's exact PROFILE/RUN candidate journal. A RUN JSON flag is not authority.
 * Lessons only bind positive, witnessed native fresh slot generations at Level 1.
 */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports;const api=factory(node?require('./engine.js'):root.BO,node?require('./progression.js'):root.BOProgress,node?require('./stats.js'):root.BOStats,node?require('./collection-tracking.js'):root.BOCollection,node?require('./emerald-runtime.js'):root.BOEmeraldRuntime);if(node)module.exports=api;else root.BOTutorialNativeModel=api;})(typeof window!=='undefined'?window:null,function(E,PG,Stats,Collection,ER){'use strict';
 const KEY='nativeTutorial',own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k),clone=x=>JSON.parse(JSON.stringify(x));
 const entries=[
  ['welcome','Welcome to your real table','This optional guide uses your actual native cards, money, XP and saves. Next never grants a reward. Pause, export or exit safely at any time.','next','#app'],
  ['basics','Cards, Jokers and Player Level','Playing cards make poker hands. Jokers change their score. Player Level is separate from poker-hand levels. This lesson earns real XP, not a pretend Level 2.','next','#level-hud'],
  ['red','Choose the Red Deck','Tap the actual Red Deck. At your current level, Red gives +1 discard: four discards each blind.','select-red','[data-deck="red"]'],
  ['white','Choose White Stake','Tap the actual White Stake: the normal starting difficulty.','select-white','#stake-select'],
  ['start','Start your practice run','Use Start New Run. One real Red Deck / White Stake run will be saved. No reward is granted just for starting.','new-run','[data-action="new-run"]'],
  ['small','The Small Blind','Each of eight Antes has a Small, Big and Boss Blind. Select the real Small Blind. You have four hands and four Red Deck discards. Your hand has eight cards; select at most five.','start-blind','[data-action="start-blind"]'],
  ['small-cards','Your first Royal Flush','Select the highlighted A, K, Q, J and 10 of Hearts, then Play. The three fillers stay unselected. Selected lesson cards stay selected; no accidental deselect.','play','.playing-card[data-context="hand"]'],
  ['small-result','A real native score','The result is your actual Chips × Mult, not a scripted award. A Royal Flush is the top Straight Flush. Inspect the scoring log if you like.','next','[data-action="score-log"]'],
  ['small-cash','Bank the real payout','Press Cash Out. Blind reward plus remaining hands enter your native Bank. Player XP was earned by the real play and Blind win.','cashout','[data-action="cashout"]'],
  ['shop','Your actual shop','These are two real offers, a real $10 voucher and real packs. Bank dollars pay for purchases; the voucher stays for this Ante unless bought. Do not buy an extra first-shop Joker for this guide.','next','[data-action="leave-shop"]'],
  ['packs','Buffoon and Standard packs','The native tutorial shop offers a Buffoon Pack (Jokers) and a Standard Pack (playing cards), at their real prices. You do not need to buy either. Ordinary shops remain random.','next','[data-action="leave-shop"]'],
  ['leave-first','Keep your money for later','Use Next Round / Leave Shop. Your real Bank should now show $10 at the native baseline.','leave-shop','[data-action="leave-shop"]'],
  ['big','The Big Blind','Start the actual Big Blind. Four Royal Hearts are ready; the 10 is still in the deck.','start-blind','[data-action="start-blind"]'],
  ['big-discard','Discard the four nonmatching cards','Keep A, K, Q and J of Hearts. Select all four highlighted junk cards, then Discard. One normal discard draws four real cards, including 10 of Hearts.','discard','.playing-card[data-context="hand"]'],
  ['big-cards','Finish the Royal Hearts','Select A, K, Q, J and 10 of Hearts and Play. Discarding did not invent cards or replenish your discards.','play','.playing-card[data-context="hand"]'],
  ['big-result','Another real Blind win','Your native scoring result and counters are saved together. Next itself gives no XP.','next','[data-action="score-log"]'],
  ['big-cash','Collect your Big Blind payout','Use Cash Out to reach the actual second shop. No full eight-Ante game has been won.','cashout','[data-action="cashout"]'],
  ['droll-inspect','Inspect Droll Joker','Tap the real Droll Joker offer. Read its actual description and price before buying.','inspect-droll','[data-joker="0"][data-context="shop"]'],
  ['droll-buy','Buy the real Droll Joker','Use the real Buy button: $4. Droll adds +10 Mult when a hand CONTAINS a Flush, so your Royal Flush also qualifies. Purchases use native money and native XP events.','buy-droll','[data-action="buy"][data-index="0"], [data-action="buy-item"][data-index="0"]'],
  ['droll','Jokers shape a run','Droll changes your next Royal from 151 × 8 to 151 × 18 at this baseline. Other Jokers have different rules: always read the description. You now have $13, not a fake bonus.','next','[data-joker="0"][data-context="owned"]'],
  ['leave-second','Meet the Boss Blind','Leave this shop. Your next opponent is the real The Head.','leave-shop','[data-action="leave-shop"]'],
  ['boss','Read the real boss rule','Start The Head. It debuffs Hearts: their card Chips and card-triggered effects are suppressed. Hearts remain playable; the rule does not mean they can never win.','start-blind','[data-action="start-blind"]'],
  ['hearts','Change suits, not the rules','These eight Hearts really are debuffed. We will use three legal native discards to collect Royal Spades, without resetting resources.','next','.playing-card[data-context="hand"]'],
  ['boss-discard-one','Discard five Hearts','Select the five highlighted lower Hearts and Discard. Keep A, K and Q of Hearts for now. You will draw three Royal Spades and two fillers.','discard','.playing-card[data-context="hand"]'],
  ['boss-discard-two','Keep your three Royal Spades','Select the remaining five non-Spades and Discard. The next native draw adds Jack of Spades plus four fillers.','discard','.playing-card[data-context="hand"]'],
  ['boss-discard-three','One last native discard','Keep A, K, Q and J of Spades. Discard the four highlighted fillers to draw 10 of Spades plus three fillers. One Red Deck discard remains.','discard','.playing-card[data-context="hand"]'],
  ['boss-cards','Play Royal Spades','Select the five Royal Spades and Play. The Head does not debuff Spades; Droll still adds its real +10 Mult.','play','.playing-card[data-context="hand"]'],
  ['boss-result','You beat the Ante 1 Boss','That native result is real. This is one Ante, not a complete eight-Ante win, and grants no Emerald full-game win.','next','[data-action="score-log"]'],
  ['boss-cash','Save the real Boss payout','Use Cash Out. At this baseline your Bank reaches $21; total earned Player XP is 40, so you are correctly still Player Level 1.','cashout','[data-action="cashout"]'],
  ['tip-one','Tip 1 · Chips × Mult','Your final hand score is Chips multiplied by Mult. Improve both rather than reading a large number in isolation.','next','#app'],
  ['tip-two','Tip 2 · Jokers change scoring','Read the condition on each Joker. Droll needs a Flush contained in the hand; a Royal Flush qualifies too.','next','#app'],
  ['tip-three','Tip 3 · Joker order matters','A useful starting arrangement is utility/economy, Chips, +Mult, then ×Mult. Read each ability: some depend on neighbours, timing or retriggers.','next','#app'],
  ['tip-four','Tip 4 · Native cash interest','Cash interest unlocks at actual Player Level 3: $1 for each $5 held at payout. This lesson did not pretend you already unlocked it.','next','#app'],
  ['tip-five','Tip 5 · The base interest cap','The normal base cap is $5 interest at $25 held. Extra cash does not raise that base cap by itself; later real upgrades may change the rule.','next','#app'],
  ['tip-six','Tip 6 · Planets level poker hands','Jupiter upgrades Flush: base 35 Chips × 4 Mult becomes 50 × 6 at hand Level 2. It does NOT upgrade a Royal / Straight Flush; that is a different hand.','next','#app'],
  ['tip-seven','Tip 7 · Build for Ante 2','Aim for two useful Jokers before tackling Ante 2 when the actual shop and your money allow it. It is advice, not an extra required first-shop purchase.','next','#app'],
  ['tip-eight','Tip 8 · Inspect every boss','Boss rules can change suits, hands, discards or scoring. Read the actual rule before committing cards.','next','#app'],
  ['tip-nine','Tip 9 · Player Level 5','Your normal Joker slots are three now, four at actual Player Level 4 and five at Level 5. Level 5 also unlocks the companion. No slots were fabricated for practice.','next','#app'],
  ['tip-ten','Tip 10 · Good luck!','Keep experimenting and taking breaks whenever you like. Next opens the real clean-run handoff; earned XP and native milestones stay saved.','next','#app'],
  ['handoff','Start a clean ordinary run','Press Start New Run (Red Deck). This replaces the practice run once, keeps your real 40 XP and starts an ordinary Red/White run with no tutorial dealing or forced shop.','new-run','[data-action="new-run"]']
 ];
 const STEPS=Object.freeze(entries.map((e,index)=>Object.freeze({index,id:e[0],title:e[1],text:e[2],command:e[3],anchor:e[4]})));
 const STATE_FIELDS=['version','id','slot','generation','runId','handoffId','step','seq','paused','status'];
 function check(ok,message){if(!ok)throw Error('Tutorial: '+message);}
 function fields(value,names){check(value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value)),'malformed state record.');const ds=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(ds),out={};check(keys.length===names.length&&keys.every(k=>typeof k==='string'&&names.includes(k)),'unexpected or missing state fields.');for(const k of names){const d=ds[k];check(d&&own(d,'value')&&d.enumerable===true,'only own enumerable data fields are accepted.');out[k]=d.value;}return out;}
 function identifier(value){return typeof value==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(value);}
 function validate(value){const s=fields(value,STATE_FIELDS);check(s.version===1&&identifier(s.id)&&Number.isInteger(s.slot)&&s.slot>=1&&s.slot<=3&&identifier(s.generation),'invalid version or native slot binding.');check((s.runId===null||identifier(s.runId))&&(s.handoffId===null||identifier(s.handoffId))&&Number.isInteger(s.step)&&s.step>=0&&s.step<=40&&Number.isSafeInteger(s.seq)&&s.seq>=0&&typeof s.paused==='boolean'&&['active','completed','exited'].includes(s.status),'invalid tutorial state.');check((s.step<5)===(s.runId===null),'missing or unexpected paired native run.');check(s.status==='completed'?s.step===40&&s.handoffId!==null&&!s.paused:s.step<40&&s.handoffId===null,'invalid once-only handoff state.');check(s.status==='active'||!s.paused,'inactive guides cannot be paused.');return value;}
 function context(value){const c=fields(value,['slot','generation']);check(Number.isInteger(c.slot)&&c.slot>=1&&c.slot<=3&&identifier(c.generation),'invalid native context.');return c;}
 function stateOf(p){const d=Object.getOwnPropertyDescriptor(p||{},KEY);check(d&&own(d,'value')&&d.enumerable===true,'paired PROFILE tutorial authority is missing.');validate(d.value);return d.value;}
 function bound(p,c){try{c=context(c);const s=stateOf(p);return s.status==='active'&&s.slot===c.slot&&s.generation===c.generation;}catch(_){return false;}}
 function expectation(n){if(n===5)return ['select',1,0,0,0,4];if(n===6)return ['play',1,0,1,0,4];if(n<=8)return ['cashout',1,0,1,8,4];if(n<=11)return ['shop',1,1,1,8,10];if(n===12)return ['select',1,1,1,8,10];if(n<=14)return ['play',1,1,2,8,10];if(n<=16)return ['cashout',1,1,2,18,10];if(n<=18)return ['shop',1,2,2,18,17];if(n<=20)return ['shop',1,2,2,25,13];if(n===21)return ['select',1,2,2,25,13];if(n<=26)return ['play',1,2,3,25,13];if(n<=28)return ['cashout',1,2,3,40,13];return ['shop',2,0,3,40,21];}
 function authorized(p,r,c){try{if(!bound(p,c))return false;const s=stateOf(p);if(s.step<5)return r===null&&p.runs===0&&p.progression?.level===1&&p.progression.totalXp===0;const ex=expectation(s.step);return !!(r&&r._uiId===s.runId&&r.seed==='BO-TUTORIAL-'+s.id&&r.deckId==='red'&&r.stake==='white'&&r.bossId===(s.step<=28?'head':r.bossId)&&r.phase===ex[0]&&r.ante===ex[1]&&r.blindIndex===ex[2]&&r.round===ex[3]&&r.money===ex[5]&&r.cards?.length===52&&p.runs===1&&p.progression?.level===1&&p.progression.totalXp===ex[4]&&(p.progression.cursors[r._uiId]||0)===r.progressSeq);}catch(_){return false;}}
 function begin(input){const c=context(input.context),proof=fields(input.proof,['fresh','slot','generation']);check(proof.fresh===true&&proof.slot===c.slot&&proof.generation===c.generation,'positive witnessed native fresh-generation proof is required.');check(identifier(input.id)&&!own(input.profile,KEY)&&input.run===null&&input.profile.runs===0&&input.profile.progression?.level===1&&input.profile.progression.totalXp===0,'an existing/imported profile is not a new lesson.');const p=clone(input.profile);p[KEY]={version:1,id:input.id,...c,runId:null,handoffId:null,step:0,seq:0,paused:false,status:'active'};validate(p[KEY]);return {profile:p,run:null,settings:clone(input.settings)};}
 function step(index){check(Number.isInteger(index)&&index>=0&&index<STEPS.length,'unknown lesson step.');return STEPS[index];}
 function targets(p,r,c){if(!authorized(p,r,c)||!r)return [];const n=stateOf(p).step;let cards=[];if([6,14,26].includes(n)){const suit=n===26?'S':'H';cards=[14,13,12,11,10].map(rank=>r.hand.find(x=>x.rank===rank&&x.suit===suit));check(cards.every(Boolean),'the paired native Royal is missing.');}else if(n===13)cards=r.hand.filter(x=>!(x.suit==='H'&&x.rank>=11));else if(n===23)cards=r.hand.filter(x=>x.suit==='H'&&x.rank<=11);else if(n===24||n===25)cards=r.hand.filter(x=>x.suit!=='S');return cards.map(x=>String(x.id));}
 function newNative(p,settings,input,guided){check(identifier(input.newRunId),'a fresh native run identity is required.');const seed=guided?'BO-TUTORIAL-'+p[KEY].id:settings.seed||'BO-'+input.now+'-'+input.newRunId;const r=E.newRun('red',seed,{stake:'white',playerLevel:p.progression.level,coinUnlocks:p.progression.unlockedJokers||[],handSortMode:settings.handSortMode||'rank',level10Deal:false});r._uiId=input.newRunId;r._uiSeeded=guided||!!settings.seed;ER.seedRun(p,r);if(p.stockMarket)r._stockMarket=p.stockMarket;p.runs++;if(guided)E.withTutorialPolicy(r,'prepare',()=>E.prepareTutorial(r));return r;}
 function sync(p,r,input,before,effect,statsMeta){
  if(Stats)Stats.recordAction(p,before,Stats.capture(r),{effect,...statsMeta});
  if(r.progressEvents?.length){const cursor=p.progression.cursors[r._uiId]||0;PG.applyEvents(p.progression,r._uiId,r.progressEvents,input.xpConfig||{},input.now);if(Stats)Stats.recordEvents(p,r._uiId,r.progressEvents,cursor,p.progression.cursors[r._uiId]||cursor);}
  if(r.playerLevel!==p.progression.level)E.setPlayerLevel(r,p.progression.level);
  const stats=r.stats||{},old=r._uiStats||{};
  for(const [field,key]of [['handsPlayed','hands'],['discardsUsed','discards'],['cardsPlayed','cardsPlayed'],['cardsDiscarded','cardsDiscarded'],['blindsWon','blinds'],['moneyEarned','money']])p[key]+=Math.max(0,(Number(stats[field])||0)-(Number(old[field])||0));
  p.best=Math.max(p.best,Number(stats.bestHand)||0,Number(r.lastResult?.total)||0);p.ante=Math.max(p.ante,r.ante||1);
  for(const [key,value]of Object.entries(stats.handCounts||{}))p.handCounts[key]=(p.handCounts[key]||0)+Math.max(0,value-(old.handCounts?.[key]||0));r._uiStats=clone(stats);
  // At fresh Player1, these three real Royals only satisfy the native Royale
  // milestone. They are not a full run win, deck win or Emerald game completion.
  if((r._uiRoyal||r.lastResult?.name==='Royal Flush')&&!p.achievements.includes('royale'))p.achievements.push('royale');
  if(p.stockMarket)r._stockMarket=p.stockMarket;ER.mirror(p,r);
 }
 function reduce(input,command){
  const old=stateOf(input.profile),c=context(input.context);check(bound(input.profile,c),'the current slot/generation does not authorize this saved lesson.');
  check(command&&command.expectedSeq===old.seq&&typeof command.kind==='string','stale lesson command; use the current controls.');check(old.seq<Number.MAX_SAFE_INTEGER,'lesson sequence is full; export safely.');
  check(command.kind==='exit'||authorized(input.profile,input.run,c),'the complete paired native run no longer matches this lesson. Export or exit the guide without replaying anything.');
  const p=clone(input.profile),settings=clone(input.settings),s=p[KEY];let r=clone(input.run);
  if(['pause','resume','exit'].includes(command.kind)){if(command.kind==='exit'){s.status='exited';s.paused=false;}else{check(s.paused===(command.kind==='resume'),'pause state changed.');s.paused=command.kind==='pause';}s.seq++;return {profile:p,run:r,settings};}
  check(!s.paused,'resume or exit this paused guide first.');check(command.kind===step(s.step).command,'that native action is not the current lesson step.');
  if(['play','discard'].includes(command.kind)){const required=targets(input.profile,input.run,c),chosen=input.selected||[];check(Array.isArray(chosen)&&chosen.length===required.length&&new Set(chosen.map(String)).size===required.length&&chosen.every(id=>required.includes(String(id))),'select exactly the highlighted native cards.');}
  check(Number.isSafeInteger(input.now)&&input.now>=0,'invalid native action clock.');
  const nativeEffect={ 'start-blind':'deal',play:'play',discard:'discard',cashout:'cashout','buy-droll':'purchase'}[command.kind]||'';
  const metricsBefore=Stats?.capture(r),before=ER.capture(r,1,nativeEffect,E.hands);let effect='',statsMeta={};
  if(command.kind==='new-run'){
   const guided=s.step===4;r=newNative(p,settings,input,guided);effect='';if(guided)s.runId=r._uiId;else{s.status='completed';s.handoffId=r._uiId;}
  }else if(command.kind==='start-blind'){const kind=s.step===5?'small':s.step===12?'big':'boss';E.withTutorialPolicy(r,kind,()=>E.startBlind(r));r._uiRoundsStarted=(r._uiRoundsStarted||0)+1;effect='deal';
  }else if(command.kind==='play'){const cards=r.hand.filter(x=>(input.selected||[]).map(String).includes(String(x.id))),evaluation=E.evaluate(cards);E.play(r,input.selected,{actualLevel:1,now:input.now},{emeraldLevel:ER.progress(p,1).level,batteryPercent:100});if(evaluation.key==='straight_flush'&&cards.length===5&&new Set(cards.map(x=>x.rank)).size===5&&cards.every(x=>x.rank>=10))r._uiRoyal=true;effect='play';
  }else if(command.kind==='discard'){E.discard(r,input.selected,{actualLevel:1});effect='discard';
  }else if(command.kind==='cashout'){const kind=s.step===8?'shop1':s.step===16?'shop2':null;if(kind)E.withTutorialPolicy(r,kind,()=>E.cashout(r));else E.cashout(r);effect='cashout';
  }else if(command.kind==='leave-shop'){E.leaveShop(r);effect='';
  }else if(command.kind==='buy-droll'){check(r.shop.items[0]?.id==='droll_joker'&&r.shop.items[0].price===4&&!r.shop.items[0].sold,'the real native Droll offer changed.');E.buy(r,0);Collection?.add(p,'jokers','droll_joker');effect='purchase';statsMeta={action:'buy',index:0,itemType:'joker'};}
  if(command.kind==='select-white')settings.stake='white';
  const native=['new-run','start-blind','play','discard','cashout','leave-shop','buy-droll'].includes(command.kind);
  if(native){ER.afterAction(p,r,before);sync(p,r,input,metricsBefore,effect,statsMeta);}
  s.step++;s.seq++;validate(s);if(s.status==='active')check(authorized(p,r,c),'native transition did not produce the exact next paired lesson state.');
  return {profile:p,run:r,settings};
 }
 return Object.freeze({KEY,STEPS,begin,validate,bound,authorized,step,targets,reduce});
});
