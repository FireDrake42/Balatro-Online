/* Full supplied 1280×1216 frame/beetle, original archived unchanged.
 * Only the baked lettering was locally blanked, losslessly and reversibly.
 * Canonical OWN progress is supplied by each native presenter, not read here.
 * No saves, model normalization, clocks, RNG or progression writes.
 */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports,api=factory(root,node?require('./emerald-progress'):root.BOEmeraldProgress);if(node)module.exports=api;else{root.BOEmeraldAsset=api.source;root.BOEmeraldPortrait=api;}})(typeof window!=='undefined'?window:globalThis,function(root,P){'use strict';
 const source='emerald-framed-portrait.png',LEVEL_KEY='aux.emerald.ui.3a522cc25197',NAME_KEY='aux.levels.ui.22a33b4ef0b3';
 const own=n=>Number.isInteger(n)&&n>=1&&n<=10?n:null;
 const revealed=n=>Number.isInteger(n)&&n>=10&&n<=100;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function label(level,playerLevel){if(!Number.isInteger(playerLevel)||playerLevel<=5||playerLevel>100)return '???';const key=!revealed(playerLevel)?NAME_KEY:own(level)?LEVEL_KEY:null,fallback=!revealed(playerLevel)?'a green beetle':own(level)?'Emerald Level '+level:'Emerald',text=key&&root.BOTranslation?.t?.(key,{value1:level});return typeof text==='string'&&text!==key?text:fallback;}
 function html(level,playerLevel,kind=''){
  const text=label(level,playerLevel),appearance=P?.appearance?.(revealed(playerLevel)?own(level)||0:0)?.css||'',extra=kind==='blackjack'?' blackjack-emerald-photo':'';
  return '<span class="emerald-framed-portrait'+extra+'" role="img" aria-label="'+esc(text)+'" data-own-level="'+(revealed(playerLevel)?own(level)||'':'')+'" data-player-level="'+(Number.isInteger(playerLevel)?playerLevel:'')+'" style="'+esc(appearance)+'"><img src="'+source+'" width="1280" height="1216" alt="" aria-hidden="true" draggable="false"><svg viewBox="0 0 1280 1216" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet"><text x="640" y="1033" text-anchor="middle" textLength="700" lengthAdjust="spacingAndGlyphs" font-family="Georgia, Times New Roman, serif" font-size="82" font-weight="700" fill="#fffdf2">'+esc(text)+'</text></svg></span>';
 }
 function set(element,key,value){if(element.getAttribute(key)!==value)element.setAttribute(key,value);}
 function update(element,level,playerLevel){if(!element)return;const text=label(level,playerLevel),leaf=element.querySelector('text');
  set(element,'data-own-level',String(revealed(playerLevel)?own(level)||'':''));set(element,'data-player-level',String(Number.isInteger(playerLevel)?playerLevel:''));set(element,'aria-label',text);if(leaf&&leaf.textContent!==text)leaf.textContent=text;
  const appearance=P?.appearance?.(revealed(playerLevel)?own(level)||0:0)?.css;if(appearance&&element.style.cssText!==appearance)element.style.cssText=appearance;
 }
 function create(document,level,playerLevel,kind=''){const holder=document.createElement('span');holder.innerHTML=html(level,playerLevel,kind);const element=holder.firstElementChild;update(element,level,playerLevel);return element;}
 // SVG remains excluded from generic i18n. This narrowly scoped read-only
 // presentation listener refreshes ONLY these owned portrait labels/ARIA;
 // it never renders the app or touches any save/controller/question content.
 root.BOI18n?.onChange?.(()=>{for(const element of root.document?.querySelectorAll('.emerald-framed-portrait')||[])update(element,Number(element.dataset.ownLevel),Number(element.dataset.playerLevel));});
 return Object.freeze({source,label,html,create,update});
});
