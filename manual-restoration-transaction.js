/* Pure preparation only. The separate guarded storage host owns backup,
 * user consent, writer locks and journal. Never invoked by ordinary import. */
(function(root,factory){'use strict';const n=typeof module==='object'&&module.exports,api=factory(n?require('./manual-restoration-model'):root.BOManualRestoration,n?require('./progression'):root.BOProgress,n?require('./emerald-progress'):root.BOEmeraldProgress,n?require('./emerald-friendship'):root.BOEmeraldFriendship,n?require('./emerald-poker'):root.BOEmeraldPoker,n?require('./emerald-slots'):root.BOEmeraldSlots,n?require('./cloud-save'):root.BOCloudSave);if(n)module.exports=api;else root.BOManualRestorationTransaction=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M,PG,EP,EF,P,SL,CS){'use strict';
 const clone=o=>JSON.parse(JSON.stringify(o)),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),CONFIG={level25Cost:27500,exponentialBase:100000,exponentialFactor:1.15};
 const COUNTERS=['runs','wins','losses','hands','discards','cardsPlayed','cardsDiscarded','blinds','money','best','ante'];
 function check(v,s){if(!v)throw Error('Manual recovery: '+s)}
 function freshProfile(){return {...Object.fromEntries(COUNTERS.map(k=>[k,0])),handCounts:{},deckWins:{},deckStakeWins:{},originalDeckStakeWins:{},jokerStakeWins:{},challengeWins:{},achievements:[],progression:PG.create()}}
 function assertEmptyProfile(p){
  check(!own(p,'manualRestoration'),'this target already has a manual restoration.');
  check(COUNTERS.every(k=>p[k]===0)&&p.achievements.length===0&&['handCounts','deckWins','deckStakeWins','originalDeckStakeWins','jokerStakeWins','challengeWins'].every(k=>!p[k]||Object.values(p[k]).every(v=>v===0)),'nonempty target gameplay/history needs separate explicit authorization; choose a truly empty slot.');
  const g=PG.normalize(p.progression,CONFIG),f=g.faucet;
  check(g.level===1&&g.xp===0&&g.totalXp===0&&g.coinsHalf===0&&g.cap===10&&f.level===1&&f.totalClaims===0&&f.claims===0&&!f.coinRemainderHundredths&&!f.lastClaimAt&&!f.nextClaimAt&&!f.earnedLifetimeHundredths,'nonempty progression conflicts with this empty-target recovery.');
  if(p.emerald)check(EP.validate(p.emerald)&&p.emerald.winRunIds.length===0&&p.emerald.speech.sequence===0,'nonempty Emerald history conflicts with the baseline.');
  if(p.emeraldFriendship)check(EF.validate(p.emeraldFriendship)&&p.emeraldFriendship.revision===0&&EF.totals(p.emeraldFriendship).totalFP===0,'nonempty Friendship history conflicts with the baseline.');
  if(p.emeraldPoker)check(P.validate(p.emeraldPoker)&&p.emeraldPoker.phase==='idle'&&p.emeraldPoker.completedRounds===0,'nonempty or pending Poker table conflicts with the baseline.');
  if(p.emeraldSlots)check(SL.validate(p.emeraldSlots)&&p.emeraldSlots.spinsStarted===0,'nonempty or pending Slots history conflicts with the baseline.');
  if(p.economy)check(p.economy.earnedMedalsHalf===0&&p.economy.spentMedalsHalf===0&&p.economy.receipts.length===0&&p.economy.history.length===0,'nonempty Medal economy needs separate consent.');
  for(const k of ['emeraldBlackjack','emeraldBaccarat','emeraldHighLow','emeraldStrictPoker','emeraldDarts','pokerLevelRewards','emeraldPokerEvents','expansionCurrency','gameOffers','gameOfferRewards','gameOfferAccess','nativeTutorial','nativeQuietStory'])check(!own(p,k),'existing '+k+' needs conflict review; no model will be reset.');
  return true;
 }
 function prepareProfile(existing,request,context){
  check(M&&M.validateRequest(request),'use the exact supported explicit recovery JSON.');
  check(!M.protectedIdentity(context.identity)&&!M.protectedIdentity(context.slotName),'protected LuckyMoth target cannot be overwritten.');
  const p=existing===null?freshProfile():clone(existing);if(existing!==null)CS.validateBank(CS.KEYS[0],JSON.stringify(p));assertEmptyProfile(p);
  const d=request.declaration,g=PG.normalize(p.progression,CONFIG),f=g.faucet;
  // These are declared counters, NOT invented historical claim payouts/times.
  g.level=d.playerLevel;g.xp=d.playerXp;g.cap=100;g.coinsHalf=d.coinsHalf;
  f.level=d.faucetLevel;f.claims=d.faucetClaims;f.totalClaims=d.faucetClaims;
  delete f.earnedLifetimeHundredths;delete f.lifetimeEarningsKnown;
  p.progression=PG.normalize(g,CONFIG);
  const seed=k=>{const v=context.seeds?.[k];check(Number.isInteger(v)&&v>0&&v<=4294967295,'new future-only '+k+' seed is unavailable.');return v};
  p.emerald=p.emerald?clone(p.emerald):EP.create(seed('emerald'));p.emerald.version=3;p.emerald.bonusWinRunIds=p.emerald.bonusWinRunIds||[];p.emerald.manualRestoration=M.baseline(request,'emeraldWins');
  p.emeraldFriendship=p.emeraldFriendship?clone(p.emeraldFriendship):EF.create();p.emeraldFriendship.version=4;p.emeraldFriendship.level=10;p.emeraldFriendship.fp=0;p.emeraldFriendship.manualRestoration=M.baseline(request,'friendshipFp');
  p.emeraldPoker=p.emeraldPoker?clone(p.emeraldPoker):clone(P.create(seed('poker')));p.emeraldPoker.version=2;p.emeraldPoker.manualRestoration=M.baseline(request,'pokerPxp');
  p.emeraldSlots=p.emeraldSlots?clone(p.emeraldSlots):SL.create(seed('slots'),context.now);p.emeraldSlots.version=2;p.emeraldSlots.manualRestoration=M.baseline(request,'slotsSxp10');
  p.manualRestoration=M.audit(request,context);M.assertProfile(p);CS.validateBank(CS.KEYS[0],JSON.stringify(p));return p;
 }
 return Object.freeze({CONFIG,COUNTERS,freshProfile,assertEmptyProfile,prepareProfile});
});
