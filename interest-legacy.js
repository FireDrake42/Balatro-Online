/* Exact immutable-format v1–4 codec; economic caps here validate LEGACY receipts only. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOInterestLegacy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const INTERVAL_MS=1000,record=x=>!!x&&typeof x==='object'&&!Array.isArray(x),finite=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0,check=(ok,message)=>{if(!ok)throw new Error('Exp Interest: '+message)};
 function create(){return {version:1,revision:0,totalXp:0,lastTickAt:0}}
 function normalize(value){
  if(value===undefined)return create();
  const extended=record(value)&&Reflect.ownKeys(value).includes('rng'),keys=['version','revision','totalXp','lastTickAt',...(extended?['rng','criticalPayments']:[])];
  check(record(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value))&&Reflect.ownKeys(value).length===keys.length&&keys.every(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&d.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')}),'invalid saved ledger; stored data was not overwritten.');
  check([1,2,3,4].includes(value.version)&&extended===(value.version===4)&&Number.isSafeInteger(value.revision)&&value.revision>=0&&finite(value.totalXp)&&Number.isSafeInteger(value.lastTickAt)&&value.lastTickAt>=0,'invalid saved ledger values.');
  // V1/V2 remain strict on read. V3 is born only on a paid <500ms
  // tick; its highwater is a logical receipt clock, not offline entitlement.
  // V4:1ms logical grid supports987/876ms; real minimum50ms. Legacy strict.
   const grid=value.version===4?1:value.version===1?INTERVAL_MS:100,minInterval=value.version===4?50:value.version===1?INTERVAL_MS:value.version===2?500:100,maxPayment=value.version===4?1500000:10;
  check(value.revision===0?value.version===1&&value.totalXp===0&&value.lastTickAt===0:value.totalXp>0&&value.totalXp<=value.revision*maxPayment&&value.lastTickAt>0&&value.lastTickAt%grid===0&&value.lastTickAt>=value.revision*minInterval,'saved income does not match its highwater.');
  if(extended)check(Number.isInteger(value.rng)&&value.rng>0&&value.rng<=4294967295&&Number.isSafeInteger(value.criticalPayments)&&value.criticalPayments>=0&&value.criticalPayments<=value.revision,'invalid saved critical-payment stream.');
  return {version:value.version,revision:value.revision,totalXp:value.totalXp,lastTickAt:value.lastTickAt,...(extended?{rng:value.rng,criticalPayments:value.criticalPayments}:{})};
 }
 return Object.freeze({create,normalize});
});
