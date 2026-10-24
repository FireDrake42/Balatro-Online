/* Save-local display names only. Pure helpers: no storage, RNG, DOM, accounts or network. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOPlayerIdentity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const constants=Object.freeze({UNLOCK_LEVEL:2,USERNAME_MIN:3,USERNAME_MAX:24,SLOT_NAME_MAX:24});
 const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
 const FIRST=Object.freeze(['Sunny','Lucky','Brave','Cozy','Merry','Swift','Jolly','Clever','Happy','Gentle','Bright','Daring','Nimble','Calm','Silver','Golden']);
 const LAST=Object.freeze(['Moth','Bee','Otter','Panda','Finch','Gecko','Fox','Robin','Badger','Lynx','Newt','Wren','Bunny','Koala','Owl','Turtle']);
 function validateUsername(value){return typeof value==='string'&&value.length>=3&&value.length<=24&&/^[A-Za-z0-9_-]+$/.test(value)}
 function normalizeUsername(value){return validateUsername(value)?value:null}
 function normalizeSlotName(value){
  if(typeof value!=='string'||value.length>256||/[\p{C}\p{Zl}\p{Zp}]/u.test(value))return null;
  const name=value.trim();return name.length>=1&&name.length<=constants.SLOT_NAME_MAX?name:null;
 }
 function validateSlotName(value){return typeof value==='string'&&normalizeSlotName(value)===value}
 // Read only plain own data, never getters, coercion hooks or inherited identity.
 function usernameField(settings){
  try{
   if(!settings||typeof settings!=='object'||Array.isArray(settings))return null;
   const proto=Object.getPrototypeOf(settings);if(proto!==null&&proto!==Object.prototype)return null;
   const d=Object.getOwnPropertyDescriptor(settings,'username');return d&&d.enumerable&&own(d,'value')?normalizeUsername(d.value):null;
  }catch(_){return null}
 }
 // Slot generation already contains local random entropy. Hash it without drawing
 // from either crypto or the game RNG; absence stays an in-memory fallback only.
 function defaultUsername(generation){
  const seed=typeof generation==='string'&&/^[A-Za-z0-9_-]{1,160}$/.test(generation)?generation:'unavailable';
  let hash=2166136261;for(let i=0;i<seed.length;i++)hash=Math.imul(hash^seed.charCodeAt(i),16777619)>>>0;
  return FIRST[hash&15]+LAST[(hash>>>4)&15]+'_'+hash.toString(36).padStart(7,'0');
 }
 function displayUsername(settings,generation){return usernameField(settings)||defaultUsername(generation)}
 function slotLabel(id,name){return [1,2,3].includes(id)?'Slot '+id+(validateSlotName(name)?' · '+name:''):'Slot'}
 function unlocked(level){return Number.isSafeInteger(level)&&level>=constants.UNLOCK_LEVEL}
 return Object.freeze({constants,validateUsername,normalizeUsername,defaultUsername,displayUsername,validateSlotName,normalizeSlotName,slotLabel,unlocked});
});
