/* Optional, per-slot feature power policy. Pure reads never create settings,
 * delete history or grant time. Charging/saving/recovery are never features. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOFeaturePower=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const KEYS=Object.freeze(['interest','passiveMoney','passiveXp','username','cardGames','statistics','surveys','market']);
 const BACKGROUND=Object.freeze(['interest','passiveMoney','passiveXp','market']);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function record(o){return !!o&&typeof o==='object'&&!Array.isArray(o)&&[null,Object.prototype].includes(Object.getPrototypeOf(o))}
 function data(o,k){if(!record(o))throw new TypeError('Feature power needs a plain data record.');const d=Object.getOwnPropertyDescriptor(o,k);if(!d)return undefined;if(!own(d,'value')||!d.enumerable)throw new TypeError('Feature power does not accept accessors or hidden values.');return d.value}
 function exact(o,names){if(!record(o))return false;const keys=Reflect.ownKeys(o);return keys.length===names.length&&keys.every(k=>typeof k==='string'&&names.includes(k)&&own(Object.getOwnPropertyDescriptor(o,k),'value')&&Object.getOwnPropertyDescriptor(o,k).enumerable)}
 function plainList(a){if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length>KEYS.length)return false;const keys=Reflect.ownKeys(a);if(keys.length!==a.length+1||!keys.includes('length'))return false;for(let i=0;i<a.length;i++){const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d||!own(d,'value')||!d.enumerable||!KEYS.includes(d.value))return false}return new Set(a).size===a.length}
 function validate(s){try{return exact(s,['version','disabled'])&&data(s,'version')===1&&plainList(data(s,'disabled'))}catch(_){return false}}
 function settings(prefs){if(prefs===undefined)return {version:1,disabled:[]};const value=data(prefs,'featurePower');if(value===undefined&&!own(prefs,'featurePower'))return {version:1,disabled:[]};if(!validate(value))throw new TypeError('Feature power settings need attention; no disabled feature was reset.');return {version:1,disabled:KEYS.filter(k=>value.disabled.includes(k))}}
 function level(profile){const n=data(data(profile,'progression'),'level');if(!Number.isInteger(n)||n<1||n>100)throw new RangeError('Use the actual saved player level for feature power.');return n}
 function lowPower(profile){if(level(profile)<25)return false;const battery=data(profile,'battery');if(battery===undefined&&!own(profile,'battery'))return false;if(!record(battery)||data(battery,'version')!==1||typeof data(battery,'lowPower')!=='boolean')throw new TypeError('The fictional battery power policy needs attention.');return data(battery,'lowPower')}
 function disabledCount(profile,prefs){const l=level(profile),s=settings(prefs);return l>=51?s.disabled.length:0}
 function enabled(profile,prefs,key){if(!KEYS.includes(key))throw new RangeError('Unknown battery-saving feature.');const l=level(profile),s=settings(prefs);if(lowPower(profile)&&BACKGROUND.includes(key))return false;return l<51||!s.disabled.includes(key)}
 function background(profile,prefs){settings(prefs);return !lowPower(profile)}
 function change(prefs,key,disabled){if(!KEYS.includes(key)||typeof disabled!=='boolean')throw new TypeError('Choose a known feature and an explicit disabled boolean.');const s=settings(prefs),set=new Set(s.disabled);if(disabled)set.add(key);else set.delete(key);return {version:1,disabled:KEYS.filter(k=>set.has(k))}}
 return Object.freeze({KEYS,BACKGROUND,validate,settings,level,lowPower,disabledCount,enabled,background,change});
});
