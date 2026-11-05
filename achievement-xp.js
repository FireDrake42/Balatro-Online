/* Exact200 for genuinely NEW supported native unlocks. A finite per-catalog
 * ledger, not a historical diff, observer reward or extra currency. Evaluation
 * is pure and frozen before payout; the existing whole owner commits it once. */
(function(root,factory){'use strict';const n=typeof module==='object'&&module.exports,api=factory({PG:n?require('./progression'):root.BOProgress,XP:n?require('./xp-cost-policy'):root.BOXPCostPolicy,C:n?require('./collection-tracking'):root.BOCollection,E:n?require('./engine'):root.BO,A:n?require('./achievements-data'):root.BOAchievements,get SU(){return n?require('./surveys-ui'):root.BOSurveysUI},get PK(){return n?require('./emerald-poker-profile'):root.BOEmeraldPokerProfile}});if(n)module.exports=api;else root.BOAchievementXP=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){'use strict';
 const NATIVE=new Set(['ante_up','ante_upper','heads_up','card_player','card_discarder','nest_egg','royale','retrograde','score_10k','score_1000k','score_100000k','tiny_hands','big_hands','speedrunner','you_get_what_you_get','roi','flushed','shattered','legendary','astronomy','cartomancy','clairvoyance','extreme_couponer']);
 // The same executable guards as the original app, not the reference catalog.
 if((M.E?.stakes||[]).length>=8)for(const id of ['low_stakes','mid_stakes','high_stakes','completionist_plus'])NATIVE.add(id);
 if((M.E?.jokers||[]).length>=150)NATIVE.add('completionist_plus_plus');
 if((M.E?.jokers||[]).length>=150&&(M.E?.packs||[]).length>=15)NATIVE.add('completionist');
 const SUPPORTED=Object.freeze((M.A||[]).filter(a=>NATIVE.has(a.id)).map(a=>a.id).concat(['medals_250','medals_500','medals_1000'])),SUPPORTED_SET=new Set(SUPPORTED);
 const SOURCE_KINDS=new Set(['balatro','survey','check-in','daily-task','emerald-poker','emerald-strict-poker','emerald-slots','game-offer','faucet','passive','interest','physical-dart']);
 const copy=v=>JSON.parse(JSON.stringify(v)),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const check=(ok,m)=>{if(!ok)throw Error('Achievement XP: '+m)};
 function fields(o,names){M.XP.fields(o,names);return o;}
 function where(slot){check(slot&&Number.isInteger(slot.id)&&slot.id>=1&&slot.id<=3&&typeof slot.generation==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(slot.generation),'invalid actual slot binding');return {slot:slot.id,generation:slot.generation};}
 function savedWhere(s){fields(s,['slot','generation']);return where({id:s.slot,generation:s.generation});}
 function policyId(origin){return 'new-achievement200:'+origin.slot+':'+origin.generation;}
 function receiptId(origin,id){return 'achievement:'+origin.slot+':'+origin.generation+':'+id;}
 function source(s){fields(s,['kind','id','at']);check(SOURCE_KINDS.has(s.kind)&&typeof s.id==='string'&&/^[A-Za-z0-9_.:-]{1,1024}$/.test(s.id)&&Number.isSafeInteger(s.at)&&s.at>=0&&s.at<=8640000000000000,'invalid genuine native unlock source');return s;}
 function validateProfile(profile){
  const ledger=profile.achievementXp;if(ledger===undefined){check(!own(profile,'achievementXp'),'present missing policy');check(!Object.keys(profile.progression?.receipts||{}).some(id=>id.startsWith('achievement:')),'paid receipt is missing its achievement policy');return true;}
  M.XP.data(ledger);fields(ledger,['version','policyId','origin','host','baseline','paid']);check(ledger.version===1,'unsupported policy version');savedWhere(ledger.origin);savedWhere(ledger.host);check(ledger.policyId===policyId(ledger.origin),'policy origin changed');
  check(Array.isArray(ledger.baseline)&&ledger.baseline.length<=SUPPORTED.length&&new Set(ledger.baseline).size===ledger.baseline.length&&ledger.baseline.every(id=>SUPPORTED_SET.has(id)),'invalid finite legacy baseline');check(same(ledger.baseline,SUPPORTED.filter(id=>ledger.baseline.includes(id))),'baseline catalog order changed');
  check(Array.isArray(ledger.paid)&&ledger.paid.length<=SUPPORTED.length&&Array.isArray(profile.achievements),'invalid finite paid catalog');const paid=new Set();
  for(const p of ledger.paid){fields(p,['id','origin','source','receiptId','amount']);check(SUPPORTED_SET.has(p.id)&&!paid.has(p.id)&&!ledger.baseline.includes(p.id),'unknown,duplicate or legacy paid ID');savedWhere(p.origin);source(p.source);check(p.amount===200&&p.receiptId===receiptId(p.origin,p.id)&&profile.achievements.includes(p.id),'paid unlock,origin,receipt or final amount disagrees');paid.add(p.id);}
  for(const id of Object.keys(profile.progression?.receipts||{}))if(id.startsWith('achievement:'))check(ledger.paid.some(p=>p.receiptId===id),'canonical receipt has no paid achievement provenance');return true;
 }
 function assertPreserved(before,after){validateProfile(before);validateProfile(after);if(!own(before,'achievementXp'))return true;check(own(after,'achievementXp'),'existing achievement policy was stripped');const b=before.achievementXp,a=after.achievementXp;check(a.policyId===b.policyId&&same(a.origin,b.origin)&&same(a.host,b.host)&&same(a.baseline,b.baseline)&&a.paid.length>=b.paid.length&&b.paid.every((p,i)=>same(p,a.paid[i])),'existing achievement policy or paid provenance changed');return true;}
 function assertHost(profile,slot){validateProfile(profile);if(profile.achievementXp)check(same(profile.achievementXp.host,where(slot)),'policy host needs explicit supported destination rebind');return true;}
 function validateMirror(mirror){check(mirror&&typeof mirror==='object','invalid achievement profile mirror');const profile={progression:mirror.progression,achievements:Array.isArray(mirror.achievementXp?.paid)?mirror.achievementXp.paid.map(p=>p?.id):[]};if(own(mirror,'achievementXp'))profile.achievementXp=mirror.achievementXp;return validateProfile(profile);}
 function validateMirrors(profile,run){validateProfile(profile);const mirror=run?._potionProfile;if(profile.achievementXp){if(run!==null&&run!==undefined)check(mirror&&same(mirror.achievementXp,profile.achievementXp)&&same(mirror.progression,profile.progression),'whole paid-achievement mirror disagrees with its PROFILE');}else check(!mirror||!own(mirror,'achievementXp'),'partial mirror has no whole achievement policy');return true;}
 function rebind(profile,slot){validateProfile(profile);const next=copy(profile);if(next.achievementXp)next.achievementXp.host=where(slot);validateProfile(next);return next;}
 function eligible(profile,run,sources){
  const p=copy(profile),checks={};if(!run||!('runMode' in run)){
   check(M.C?.milestones&&Array.isArray(M.E?.decks)&&Array.isArray(M.E?.jokers),'actual native collection predicate models unavailable');
   // Lifetime PROFILE facts do not become new just because RUN was absent.
   Object.assign(checks,{card_player:p.cardsPlayed>=2500,card_discarder:p.cardsDiscarded>=2500,score_10k:p.best>=10000,score_1000k:p.best>=1000000,score_100000k:p.best>=100000000,completionist_plus:M.E.decks.every(d=>p.deckStakeWins?.[d.id]>=7),completionist_plus_plus:M.E.jokers.length>=150&&M.E.jokers.every(j=>p.jokerStakeWins?.[j.id]>=7)});
   if(run)Object.assign(checks,{ante_up:run.ante>=4,ante_upper:run.ante>=8,heads_up:run._uiOutcome==='won',nest_egg:run.money>=400,royale:!!run._uiRoyal||run.lastResult?.name==='Royal Flush',retrograde:Object.values(run.levels||{}).some(n=>n>=10),tiny_hands:run.cards.length<=20,big_hands:run.cards.length>=80,speedrunner:run._uiOutcome==='won'&&(run._uiRoundsStarted??99)<=12,you_get_what_you_get:run._uiOutcome==='won'&&(run._uiRerolls||0)===0,roi:(run._uiVouchersByAnte4||0)>=5,flushed:!!run._uiFlushed,shattered:(run.lastResult?.glassBroken||0)>=2,low_stakes:!run.challengeId&&run._uiOutcome==='won'&&run.stakeIndex>=1,mid_stakes:!run.challengeId&&run._uiOutcome==='won'&&run.stakeIndex>=3,high_stakes:!run.challengeId&&run._uiOutcome==='won'&&run.stakeIndex>=7});
   Object.assign(checks,M.C.milestones(p,run?copy(run):null,M.E));
  }
  check(M.SU?.walletFrom&&M.PK?.medalsMilliText,'actual native Medal wallet validators unavailable');
  const economy=p.economy===undefined?M.SU.createEconomy('achievement-baseline'):p.economy,streakHalf=sources?.streakHalf??p.dailyStreak?.medalsHalf??0,tasksHalf=sources?.tasksHalf??p.dailyTasks?.earnedMedalsHalf??0;
  const wallet=M.SU.walletFrom(economy,streakHalf,tasksHalf,0,M.PK.medalsMilliText(p)),life=BigInt(wallet.lifetimeMilliText);
  for(const n of [250,500,1000])checks['medals_'+n]=life>=BigInt(n)*1000n||wallet.milestones.includes(n);
  return SUPPORTED.filter(id=>checks[id]===true);
 }
 // First accepted5/face records ONLY actual BEFORE eligibility. It cannot
 // discover a NEW unlock, change badges or pay200; the source still owns that.
 function prepareBaseline(before,after,c){
  const host=where(c.slot);validateProfile(before);assertPreserved(before,after);assertHost(before,c.slot);assertHost(after,c.slot);const profile=copy(after),oldIds=Array.isArray(before.achievements)?before.achievements:[];check(oldIds.every(id=>(profile.achievements||[]).includes(id)),'native legacy unlocks were stripped');
  if(!profile.achievementXp){const was=eligible(before,c.beforeRun&&'runMode' in c.beforeRun?null:c.beforeRun,c.beforeSources);profile.achievementXp={version:1,policyId:policyId(host),origin:copy(host),host:copy(host),baseline:SUPPORTED.filter(id=>oldIds.includes(id)||was.includes(id)),paid:[]};}validateProfile(profile);return {profile};
 }
 // Source proofs are single-use and ephemeral. Original source and payout
 // MUST be detached together BEFORE ANY original durable source write.
 // No observer, refresh, retry, debt or import can reconstruct a proof.
 const acceptedSources=new WeakMap();
 function capture(before,after,c){
  check(c&&c.source&&SOURCE_KINDS.has(c.source.kind),'a real accepted native source is required');const host=where(c.slot),nativeSource=copy(source({...c.source,at:c.at}));validateProfile(before);assertPreserved(before,after);assertHost(before,c.slot);assertHost(after,c.slot);
  const was=eligible(before,c.beforeRun&&'runMode' in c.beforeRun?null:c.beforeRun,c.beforeSources),now=eligible(after,c.afterRun,c.afterSources),oldIds=Array.isArray(before.achievements)?before.achievements:[];check(oldIds.every(id=>(after.achievements||[]).includes(id)),'native legacy unlocks were stripped');
  const ids=SUPPORTED.filter(id=>now.includes(id)&&!was.includes(id)&&!oldIds.includes(id)),proof=Object.freeze({ids:Object.freeze(ids.slice())});
  acceptedSources.set(proof,{host,nativeSource,before:copy(before),now,oldIds:oldIds.slice(),baseline:SUPPORTED.filter(id=>oldIds.includes(id)||was.includes(id)),afterRun:c.afterRun===undefined?null:copy(c.afterRun),afterSources:c.afterSources===undefined?undefined:copy(c.afterSources)});return proof;
 }
 function prepareCaptured(current,proof,c,configuration){
  const accepted=acceptedSources.get(proof);check(accepted,'an unconsumed accepted source capture is required');acceptedSources.delete(proof);const host=where(c.slot);check(same(host,accepted.host),'the captured source slot/host changed');assertPreserved(accepted.before,current);assertHost(current,c.slot);
  const profile=copy(current);profile.achievements=Array.isArray(profile.achievements)?profile.achievements:[];check(accepted.oldIds.every(id=>profile.achievements.includes(id)),'native legacy unlocks were stripped');const qualified=eligible(profile,c.afterRun===undefined?accepted.afterRun:c.afterRun,c.afterSources===undefined?accepted.afterSources:c.afterSources);check(proof.ids.every(id=>qualified.includes(id)||profile.achievements.includes(id)),'the accepted source unlock is no longer qualified');
  const ledger=profile.achievementXp||(profile.achievementXp={version:1,policyId:policyId(host),origin:copy(host),host:copy(host),baseline:accepted.baseline.slice(),paid:[]});check(same(ledger.host,host),'native destination host needs explicit supported rebind');
  const ids=proof.ids.filter(id=>!ledger.baseline.includes(id)&&!ledger.paid.some(p=>p.id===id));for(const id of accepted.now)if(!profile.achievements.includes(id))profile.achievements.push(id);
  // Preserve ORIGINAL other-domain headers through a source's Player-first
  // pipeline. Only the current confirmed Player state advances between 200s.
  let rewardBefore=copy(accepted.before);rewardBefore.progression=copy(profile.progression);if(own(profile,'potions'))rewardBefore.potions=copy(profile.potions);const summaries=[];
  for(const id of ids){const receipt=receiptId(host,id),cfg={...configuration,now:c.at,sourceKind:'achievement',xpSource:'achievement',extraRewardMultiplier:1,costContext:{beforeProfile:rewardBefore,slot:{id:host.slot,generation:host.generation},at:c.at}},summary=M.PG.addAwardedXp(profile.progression,200,receipt,cfg);check(!summary.duplicate&&summary.awardedXp===200,'new unlock canonical receipt was already consumed or not exact200');ledger.paid.push({id,origin:copy(host),source:copy(accepted.nativeSource),receiptId:receipt,amount:200});summaries.push(summary);rewardBefore={...rewardBefore,progression:copy(profile.progression)};}
  validateProfile(profile);return {profile,ids,summaries};
 }
 function prepare(before,after,c,configuration){return prepareCaptured(after,capture(before,after,c),c,configuration);}
 return Object.freeze({SUPPORTED,validateProfile,assertHost,validateMirror,validateMirrors,assertPreserved,rebind,eligible,prepareBaseline,capture,prepareCaptured,prepare});
});
