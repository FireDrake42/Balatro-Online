/* Optional battery presentation only. Pure strict data; no storage, DOM, clocks,
 * progression, default writes or fictional battery activation on reads. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOBatteryDisplay=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),KEYS=['version','decimals','compact'],DEFAULTS=Object.freeze({version:1,decimals:0,compact:false});
 function check(ok){if(!ok)throw Error('Battery display settings need attention; stored settings were not replaced.')}
 function plain(o){return !!o&&typeof o==='object'&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o))}
 function validate(value){try{if(!plain(value)||Reflect.ownKeys(value).length!==KEYS.length)return false;const fields={};for(const key of KEYS){const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!own(d,'value')||d.enumerable!==true)return false;fields[key]=d.value}return fields.version===1&&Number.isSafeInteger(fields.decimals)&&fields.decimals>=0&&fields.decimals<=5&&typeof fields.compact==='boolean'}catch(_){return false}}
 function normalize(value){if(value===undefined)return {...DEFAULTS};check(validate(value));return {version:1,decimals:value.decimals,compact:value.compact}}
 function preferences(prefs){check(plain(prefs));if(!own(prefs,'batteryDisplay'))return normalize(undefined);const d=Object.getOwnPropertyDescriptor(prefs,'batteryDisplay');check(d&&own(d,'value')&&d.enumerable===true&&d.value!==undefined);return normalize(d.value)}
 // Geometry only, in layout CSS pixels. Visual-viewport offsets are supplied by
 // the presentation host; no global screen/device access or saved state changes.
 function compactAnchor(badge,size,viewport){
  const finite=n=>typeof n==='number'&&Number.isFinite(n);
  check(badge&&size&&viewport&&['left','right','top','bottom'].every(k=>finite(badge[k]))&&['width','height'].every(k=>finite(size[k])&&size[k]>0)&&['left','top','width','height'].every(k=>finite(viewport[k]))&&viewport.width>16&&viewport.height>16);
  const gap=4,pad=8,right=viewport.left+viewport.width,bottom=viewport.top+viewport.height;
  const maxWidth=viewport.width-pad*2,width=Math.min(size.width,maxWidth);
  const left=Math.max(viewport.left+pad,Math.min(badge.right-width,right-width-pad));
  const top=Math.max(viewport.top+pad,Math.min(badge.bottom+gap,bottom-size.height-pad));
  return {left,top,maxWidth,below:top>=badge.bottom+gap};
 }
 return Object.freeze({validate,normalize,preferences,compactAnchor});
});
