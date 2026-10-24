/* Actual Level 30 text cosmetics. Fixed local fonts only; no storage, listeners or game mutations. */
(function(root,factory){'use strict';const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BOTextCustomization=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const constants=Object.freeze({VERSION:1,UNLOCK_LEVEL:30});
 const DEFAULTS=Object.freeze({version:1,font:'default',color:null});
 const FONTS=Object.freeze({
  default:Object.freeze({label:'Game default',family:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}),
  system:Object.freeze({label:'System',family:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}),
  sans:Object.freeze({label:'Sans serif',family:'ui-sans-serif,system-ui,sans-serif'}),
  serif:Object.freeze({label:'Serif',family:'ui-serif,serif'}),
  monospace:Object.freeze({label:'Monospace',family:'ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace'}),
  arial:Object.freeze({label:'Arial',family:'Arial,Helvetica,sans-serif'}),
  georgia:Object.freeze({label:'Georgia',family:'Georgia,"Times New Roman",serif'}),
  verdana:Object.freeze({label:'Verdana',family:'Verdana,Geneva,sans-serif'}),
  courier:Object.freeze({label:'Courier',family:'"Courier New",Courier,monospace'}),
  'comic-sans':Object.freeze({label:'Comic Sans',family:'"Comic Sans MS","Comic Sans",Chalkboard,cursive,sans-serif'})
 });
 const FONT_IDS=Object.freeze(Object.keys(FONTS)),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function defaults(){return {...DEFAULTS}}
 // Inspect data descriptors, never candidate properties: hostile getters cannot run.
 function checked(value){
  try{
   if(!value||typeof value!=='object'||Array.isArray(value))return null;
   const proto=Object.getPrototypeOf(value);if(proto!==null&&proto!==Object.prototype)return null;
   const keys=Reflect.ownKeys(value);if(keys.length!==3||keys.some(k=>typeof k!=='string'||!['version','font','color'].includes(k)))return null;
   for(const k in value)if(!own(value,k))return null;
   const d=Object.create(null);for(const key of keys){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor||!descriptor.enumerable||!own(descriptor,'value'))return null;d[key]=descriptor.value}
   if(d.version!==1||typeof d.font!=='string'||!FONT_IDS.includes(d.font)||!(d.color===null||typeof d.color==='string'&&d.color.length===7&&/^#[0-9a-fA-F]{6}$/.test(d.color)))return null;
   return {version:1,font:d.font,color:d.color};
  }catch(_){return null}
 }
 function validate(value){return checked(value)!==null}
 function normalize(value){return checked(value)||defaults()}
 function unlocked(level){return Number.isSafeInteger(level)&&level>=constants.UNLOCK_LEVEL}
 function backdrop(color){
  if(typeof color!=='string'||color.length!==7||!/^#[0-9a-fA-F]{6}$/.test(color))return '#000000';
  const rgb=[1,3,5].map(i=>{const n=parseInt(color.slice(i,i+2),16)/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)}),luminance=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
  return (luminance+.05)/.05>=1.05/(luminance+.05)?'#000000':'#FFFFFF';
 }
 function apply(value,level,body=root.document?.body){
  if(!body?.classList||!body.style)return false;
  const v=unlocked(level)&&!body.classList.contains('bo-survey-page')?checked(value):null,font=!!v&&v.font!=='default',color=!!v&&v.color!==null;
  body.classList.toggle('bo-custom-font',font);body.classList.toggle('bo-custom-text-color',color);
  if(font)body.style.setProperty('--bo-text-font',FONTS[v.font].family);else body.style.removeProperty('--bo-text-font');
  if(color){body.style.setProperty('--bo-text-color',v.color);body.style.setProperty('--bo-text-backdrop',backdrop(v.color))}else{body.style.removeProperty('--bo-text-color');body.style.removeProperty('--bo-text-backdrop')}
  return font||color;
 }
 const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function settingsHTML(options={}){
  const active=unlocked(options.level),v=active?normalize(options.value):defaults(),disabled=!active||options.disabled===true,lock=disabled?' disabled':'',color=v.color||'#F2EEE1';
  return '<fieldset id="text-customization-settings" class="text-customization" data-unlocked="'+active+'" aria-labelledby="text-customization-title"'+lock+'><h3 id="text-customization-title">Text appearance · Level 30</h3><p>'+(active?'Choose a local font and an optional color for all game text. Changes below are a draft until you press Save appearance.':'Unlocks at Level 30. Reach actual Player Level 30 to customize all game text. Stored choices stay saved but inactive below Level 30.')+'</p><label for="text-font-select">Text font</label><select id="text-font-select" data-text-style-setting'+lock+'>'+FONT_IDS.map(id=>'<option value="'+id+'"'+(v.font===id?' selected':'')+'>'+FONTS[id].label+'</option>').join('')+'</select><label class="text-color-toggle" for="text-color-enabled"><input id="text-color-enabled" type="checkbox" data-text-style-setting'+(v.color!==null?' checked':'')+lock+'>Use one custom color for all text</label><label for="text-color-input">Custom text color</label><input id="text-color-input" type="color" value="'+color+'" data-text-style-setting'+(disabled||v.color===null?' disabled':'')+' aria-describedby="text-contrast-warning"><p id="text-contrast-warning">A single text color replaces normal rank, suit, XP, money and probability colors. Some backgrounds may have poor contrast. Reset text always restores the original fonts and colors.</p><div id="text-style-preview" class="text-style-preview" aria-label="Draft text preview" style="font-family:'+escape(FONTS[v.font].family)+'!important;color:'+color+'!important;background-color:'+backdrop(color)+'">Draft preview · Aa 123 · ♠ ♥ ♣ ♦ · $10 · +5 XP · 1 in 6</div><div class="sheet-actions"><button type="button" class="btn" data-action="save-text-appearance"'+lock+'>Save appearance</button><button type="button" class="btn" data-action="reset-text-appearance"'+lock+'>Reset text</button></div><p id="text-style-feedback" role="status" aria-live="polite"></p></fieldset>';
 }
 return Object.freeze({constants,DEFAULTS,FONT_IDS,FONTS,defaults,validate,normalize,unlocked,backdrop,apply,settingsHTML});
});
