/* Optional PROFILE-owned real-time Poker events. Pure independent UMD: no clocks,
 * storage, expiry writes, RNG or offline earnings. The host commits this ledger
 * atomically with its validated Poker/category and native reward sources. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldPokerEvents=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const VERSION=1,MAX=Number.MAX_SAFE_INTEGER,MAX_TIME=8640000000000000,own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const DURATIONS=Object.freeze({'zero-cooldowns':604800000,'double-faucet':86400000,'double-score':3600000,'double-xp':1800000}),IDS=Object.freeze(Object.keys(DURATIONS));
 const CATEGORIES=Object.freeze({'royal-flush':'zero-cooldowns','straight-flush':'double-faucet','four-of-a-kind':'double-score','full-house':'double-xp'}),ALL=['royal-flush','straight-flush','four-of-a-kind','full-house','flush','straight','three-of-a-kind','two-pair','one-pair','high-card','none'];
 const count=n=>Number.isSafeInteger(n)&&n>=0,time=n=>count(n)&&n<=MAX_TIME;
 function check(v,m){if(!v)throw Error('Poker events: '+m)}
 function fields(o,keys){if(!o||typeof o!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(o)))return false;const names=Reflect.ownKeys(o);return names.length===keys.length&&names.every(k=>typeof k==='string'&&keys.includes(k)&&(()=>{const d=Object.getOwnPropertyDescriptor(o,k);return d&&d.enumerable&&own(d,'value')})())}
 function freeze(s){IDS.forEach(id=>Object.freeze(s.effects[id]));Object.freeze(s.effects);return Object.freeze(s)}
 function create(){const effects={};IDS.forEach(id=>effects[id]={count:0,lastSerial:0,startedAt:0,expiresAt:0});return freeze({version:VERSION,revision:0,lastSerial:0,effects})}
 function validate(s){try{
  if(!fields(s,['version','revision','lastSerial','effects'])||s.version!==VERSION||!count(s.revision)||!count(s.lastSerial)||!fields(s.effects,IDS))return false;
  let revision=0,last=0;const serials=new Set();for(const id of IDS){const r=s.effects[id];if(!fields(r,['count','lastSerial','startedAt','expiresAt'])||![r.count,r.lastSerial].every(count)||![r.startedAt,r.expiresAt].every(time))return false;
   if(!r.count){if(r.lastSerial||r.startedAt||r.expiresAt)return false}else{if(r.lastSerial<r.count||r.expiresAt-r.startedAt<DURATIONS[id]||serials.has(r.lastSerial))return false;serials.add(r.lastSerial)}
   revision+=r.count;if(!count(revision))return false;last=Math.max(last,r.lastSerial);
  }
  // Prefix counts must fit before the corresponding distinct source serial.
  let prefix=0;for(const r of IDS.map(id=>s.effects[id]).filter(r=>r.count).sort((a,b)=>a.lastSerial-b.lastSerial)){prefix+=r.count;if(prefix>r.lastSerial)return false}
  return revision===s.revision&&last===s.lastSerial&&s.lastSerial>=revision;
 }catch(_){return false}}
 function copy(s){check(validate(s),'invalid strict v1 ledger.');const effects={};IDS.forEach(id=>effects[id]={...s.effects[id]});return freeze({version:VERSION,revision:s.revision,lastSerial:s.lastSerial,effects})}
 function effectsAt(s,now){check(time(now),'supply an absolute safe timestamp.');if(s!==undefined)check(validate(s),'invalid strict v1 ledger.');const active=id=>!!s&&s.effects[id].count>0&&now>=s.effects[id].startedAt&&now<s.effects[id].expiresAt,r=s?.effects['double-xp'];return Object.freeze({zeroCooldowns:active('zero-cooldowns'),faucetMultiplier:active('double-faucet')?2:1,scoreMultiplier:active('double-score')?2:1,xpMultiplier:active('double-xp')?2:1,xpWindow:r&&r.count?Object.freeze({startedAt:r.startedAt,expiresAt:r.expiresAt}):null})}
 function credit(s,receipt,now,expectedRevision){
  check(s===undefined||validate(s),'invalid strict v1 ledger.');check(time(now),'supply an absolute safe timestamp.');check(count(expectedRevision)&&expectedRevision===(s?.revision||0),'stale event revision.');
  check(fields(receipt,['roundId','serial','category'])&&count(receipt.serial)&&receipt.serial>0&&receipt.roundId==='poker:'+receipt.serial&&ALL.includes(receipt.category),'invalid source receipt.');
  check(receipt.serial>(s?.lastSerial||0),'source serial already credited or out of order.');const id=CATEGORIES[receipt.category];if(!id)return Object.freeze({state:s===undefined?undefined:copy(s),changed:false,event:null});
  const before=s||create(),row=before.effects[id],expiresAt=Math.max(row.expiresAt,now+DURATIONS[id]);check(time(expiresAt)&&before.revision<MAX&&row.count<MAX,'event counters or expiry overflow.');
  const effects={};IDS.forEach(key=>effects[key]={...before.effects[key]});effects[id]={count:row.count+1,lastSerial:receipt.serial,startedAt:row.count&&now<row.expiresAt?row.startedAt:now,expiresAt};
  const state={version:VERSION,revision:before.revision+1,lastSerial:receipt.serial,effects};check(validate(state),'source cannot produce a valid event ledger.');return Object.freeze({state:freeze(state),changed:true,event:id});
 }
 // Dependency-free adapter: callers supply the authoritative Poker core, which
 // validates the private seeded replay BEFORE any paired category/source reads.
 function validateAgainstPoker(s,poker,core){try{
  if(poker===undefined)return s===undefined||validate(s)&&s.revision===0;
  if(!core||typeof core.validate!=='function'||core.validate(poker)!==true||s!==undefined&&!validate(s))return false;
  const maxSerial=poker.phase==='holding'?poker.roundCounter-1:poker.roundCounter;
  for(const category of Object.keys(CATEGORIES)){const row=s?.effects[CATEGORIES[category]],n=row?.count||0;if(n!==poker.results[category]||row&&row.lastSerial>maxSerial)return false}
  if(poker.phase==='settled'&&own(CATEGORIES,poker.round.receipt.category)&&s?.effects[CATEGORIES[poker.round.receipt.category]].lastSerial!==poker.round.receipt.serial)return false;
  return true;
 }catch(_){return false}}
 return Object.freeze({VERSION,DURATIONS,IDS,CATEGORIES,create,validate,copy,credit,effectsAt,validateAgainstPoker});
});
