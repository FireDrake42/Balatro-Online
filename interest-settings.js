/* One interest stream, eleven explicit per-PAYMENT choices. Missing optional
 * choice retains the current level's legacy timing/rate; reads never save. */
(function(root,factory){'use strict';const api=factory(typeof module==='object'&&module.exports?require('./late-level-rules'):root.BOLateLevels);if(typeof module==='object'&&module.exports)module.exports=api;else root.BOInterestSettings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(LL){'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),record=o=>!!o&&typeof o==='object'&&!Array.isArray(o)&&[null,Object.prototype].includes(Object.getPrototypeOf(o));
 const CHOICES=Object.freeze([[1000,.0004,'0.04'],[900,.00035,'0.035'],[800,.00025,'0.025'],[700,.0002,'0.02'],[600,.00017,'0.017'],[500,.00014,'0.014'],[500,.0001,'0.01'],[400,.00007,'0.007'],[300,.00005,'0.005'],[200,.00003,'0.003'],[100,.00001,'0.001']].map(([intervalMs,rateFraction,percent],index)=>Object.freeze({index,intervalMs,rateFraction,percent})));
 const UNLOCK_ROWS=Object.freeze([42,44,46,48,50]);
 function validate(s){try{if(!record(s))return false;const keys=Reflect.ownKeys(s);if(keys.length!==2||!keys.every(k=>k==='version'||k==='index'))return false;for(const k of keys){const d=Object.getOwnPropertyDescriptor(s,k);if(!d||!own(d,'value')||!d.enumerable)return false}return s.version===1&&Number.isInteger(s.index)&&s.index>=0&&s.index<CHOICES.length}catch(_){return false}}
 function read(prefs){if(prefs===undefined)return null;if(!record(prefs))throw new TypeError('Interest choice needs plain saved settings.');const d=Object.getOwnPropertyDescriptor(prefs,'interestChoice');if(!d)return null;if(!own(d,'value')||!d.enumerable||!validate(d.value))throw new TypeError('Saved interest choice needs attention; it was not reset.');return {version:1,index:d.value.index}}
 function validLevel(level){if(!Number.isInteger(level)||level<1||level>100)throw new RangeError('Use actual saved player level1–100 for interest settings.')}
 function legacyInterval(level){validLevel(level);return level>=50?500:level>=48?600:level>=46?700:level>=44?800:level>=42?900:1000}
 function effective(level,config){validLevel(level);const choice=read(config),earned=LL.interest(level);if(earned)return earned;if(level>=44&&choice)return CHOICES[choice.index];return {index:null,intervalMs:legacyInterval(level),rateFraction:level>=30?.00025:level>=26?.00015:level>=20?.0001:0,percent:level>=30?'0.025':level>=26?'0.015':level>=20?'0.01':'0'}}
 function select(index){const result={version:1,index};if(!validate(result))throw new RangeError('Choose one of the eleven interest options.');return result}
 return Object.freeze({CHOICES,UNLOCK_ROWS,validate,read,effective,legacyInterval,select});
});
