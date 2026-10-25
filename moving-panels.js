/* Whole-panel Moving Mode. No engine, storage, economy, text editing or card APIs. */
(function(root,factory){'use strict';const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BOMovingPanels=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
// Finite keyed presentation only: lookup at call time; canonical models and receipts stay untouched.

function _aux(key,fallback,params){const rt=globalThis.BOTranslation,values=params||{},plain=()=>fallback.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(all,name)=>Object.prototype.hasOwnProperty.call(values,name)?String(values[name]):all);if(!rt)return plain();const text=rt.t(key,values);return text===key?plain():text;}
function _auxEsc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const _auxKeys=Object.freeze({"Moving Mode panel controls":"aux.moving.panels.8d3220f41193","Moving Mode":"aux.moving.panels.6147adfc7f10","Save":"common.save","Reset":"common.reset","Cancel":"common.cancel"});
function _auxSource(source){if(typeof source!=='string')return source;const key=_auxKeys[source]||globalThis.BOTranslation?.keyFor?.(source);return key?_aux(key,source):source;}


// Source-explicit text/attribute bindings: no scanning English text, DOM-source recovery or user-data inference.
const _auxDisplayValues=new WeakMap();
function _auxInline(key,fallback,params){return '<span data-i18n-inline="true" data-i18n="'+_auxEsc(key)+'"'+(params?' data-i18n-params="'+_auxEsc(JSON.stringify(params))+'"':'')+'>'+_auxEsc(_aux(key,fallback,params))+'</span>';}
function _auxAttribute(attribute,quote,key,fallback,params){return _auxEsc(_aux(key,fallback,params))+quote+' data-i18n-'+attribute+'='+quote+_auxEsc(key)+(params?quote+' data-i18n-params='+quote+_auxEsc(JSON.stringify(params)):'');}
function _auxValue(key,fallback,params){const value=new String(_aux(key,fallback,params));_auxDisplayValues.set(value,{key,fallback,params});return value;}
function _auxSourceValue(source){if(typeof source!=='string')return source;const key=_auxKeys[source]||globalThis.BOTranslation?.keyFor?.(source);return key?_auxValue(key,source):source;}
function _auxValueHTML(value){const binding=value&&typeof value==='object'&&_auxDisplayValues.get(value);return binding?_auxInline(binding.key,binding.fallback,binding.params):_auxEsc(value);}

// Exact keyed projection of source-explicit bindings, before native equality checks.
// Never traverses the live document and never invokes an economy/controller/render callback.
function _auxMarkup(html){return globalThis.BOI18n?.projectHTML?.("moving-panels",html)??html;}
function _auxSetText(element,key,fallback,params){const text=_aux(key,fallback,params);element.textContent=text;element.setAttribute?.('data-i18n',key);if(params)element.setAttribute?.('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindText?.(element,key,params||{});return text;}
function _auxSetAttribute(element,attribute,key,fallback,params){const text=_aux(key,fallback,params);if(element.nodeType===9&&attribute==='title'){element.title=text;const leaf=element.querySelector('title');if(leaf)_auxSetText(leaf,key,fallback,params);return text;}element.setAttribute(attribute,text);element.setAttribute('data-i18n-'+attribute,key);if(params)element.setAttribute('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindAttribute?.(element,attribute,key,params||{});return text;}


 const PANEL_IDS=Object.freeze(['blind','hands','discards','bank','round','jokers','tags','consumables','phase-select','phase-play','phase-cashout','phase-shop','phase-pack','phase-won','phase-lost']);
 const allowedIDs=new Set(PANEL_IDS),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),empty=()=>({version:1,panels:{}});
 function record(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const proto=Object.getPrototypeOf(value);if(proto!==null&&proto!==Object.prototype)return false;
  const names=Reflect.ownKeys(value);if(names.some(k=>typeof k!=='string'))return false;
  for(const k in value)if(!own(value,k))return false;
  if(keys&&(names.length!==keys.length||names.some(k=>!keys.includes(k))))return false;
  return names.every(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&own(d,'value')&&d.enumerable});
 }
 function validate(value){
  try{
   if(!record(value,['version','panels'])||value.version!==1||!record(value.panels))return false;
   const ids=Object.keys(value.panels);if(ids.length>15)return false;
   return ids.every(id=>{const p=value.panels[id];return allowedIDs.has(id)&&record(p,['x','y'])&&typeof p.x==='number'&&typeof p.y==='number'&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=4000&&Math.abs(p.y)<=4000});
  }catch(_){return false}
 }
 function normalize(value){
  const result=empty();if(validate(value))for(const id of PANEL_IDS)if(own(value.panels,id))result.panels[id]={x:value.panels[id].x,y:value.panels[id].y};return result;
 }
 const signature=value=>JSON.stringify(value),clamp=(n,lo,hi)=>Math.min(4000,Math.max(-4000,hi<lo?lo:Math.min(hi,Math.max(lo,n))));
 const label=id=>id.replace(/^phase-/,'').replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
 function init(options){
  const opts=options||{},doc=root.document;if(!doc?.createElement)throw new Error('Moving Mode requires a document.');
  const view=doc.defaultView||root,records=new Map(),displayed=new Map(),buttons=new Map();
  let editing=false,draft=null,snapshot=null,drag=null,error='',toolbar=null,message=null,canvas=null,saving=false,destroyed=false,lastFocus=null;
  function saved(){try{return normalize(opts.getLayout?.())}catch(_){return empty()}}
  function unlocked(){try{const level=opts.getLevel?.();return typeof level==='number'&&Number.isFinite(level)&&level>=10}catch(_){return false}}
  function panels(){
   const grid=doc.querySelector('#app .game-grid'),found=new Map();if(!grid)return {grid:null,items:new Map()};
   for(const el of grid.querySelectorAll('[data-move-panel]')){
    const id=el.getAttribute('data-move-panel');
    if(!allowedIDs.has(id)||el.closest('.game-grid')!==grid||el.closest('[data-card],[data-joker],[data-consumable]')||el.parentElement?.closest('[data-move-panel]'))continue;
    if(found.has(id))found.set(id,null);else found.set(id,el);
   }
   return {grid,items:new Map([...found].filter(([,el])=>el))};
  }
  function modalOpen(){const overlay=doc.querySelector('#overlay');return !!(overlay&&!overlay.hidden&&view.getComputedStyle(overlay).display!=='none')}
  function allowed(found,continuing=false){try{const permit=continuing&&opts.canContinue!==undefined?opts.canContinue:opts.canEdit;return !destroyed&&unlocked()&&permit?.call(opts)===true&&!!found.grid&&found.items.size>0&&!modalOpen()}catch(_){return false}}
  function notify(text){try{opts.notify?.(text)}catch(_){/* A toast cannot decide whether a durable write succeeded. */}}
  function stop(event,prevent=true){if(prevent&&event.cancelable!==false)event.preventDefault();event.stopImmediatePropagation()}
  function stopDrag(){
   const old=drag;drag=null;if(old){old.el.removeAttribute('data-moving-dragged');try{if(old.handle.hasPointerCapture?.(old.pointerId))old.handle.releasePointerCapture(old.pointerId)}catch(_){/* Removed DOM or already-lost capture. */}}
  }
  function clearOffset(el){el.removeAttribute('data-moving-offset');el.style.removeProperty('--bo-move-x');el.style.removeProperty('--bo-move-y')}
  function cleanRecord(el,entry){clearOffset(el);el.removeAttribute('data-moving-edit');el.removeAttribute('data-moving-positioned');el.removeAttribute('data-moving-dragged');entry.handle?.remove()}
  function clearCanvas(){if(canvas){canvas.removeAttribute('data-moving-canvas');canvas.style.removeProperty('--bo-moving-room');canvas=null}}
  function finish(){stopDrag();editing=false;draft=null;snapshot=null;error=''}
  function restoreFocus(){const target=doc.querySelector('[data-moving-action="start"]')||lastFocus;if(target&&doc.body.contains(target))target.focus({preventScroll:true});lastFocus=null}
  function focusControl(el){if(!el)return;el.focus({preventScroll:true});if(el.hasAttribute('data-move-handle'))try{el.scrollIntoView?.({block:'center',inline:'nearest',behavior:'instant'})}catch(_){/* Older browsers still retain keyboard focus. */}}
  function node(tag,text,attrs){const el=doc.createElement(tag);if(text){const binding=typeof text==='object'&&_auxDisplayValues.get(text);if(binding)_auxSetText(el,binding.key,binding.fallback,binding.params);else el.textContent=text;}for(const [k,v]of Object.entries(attrs||{})){const binding=v&&typeof v==='object'&&_auxDisplayValues.get(v);if(binding&&['aria-label','title','placeholder','alt','aria-description'].includes(k))_auxSetAttribute(el,k,binding.key,binding.fallback,binding.params);else el.setAttribute(k,v);}return el}
  function paintToolbar(){
   if(!editing){toolbar?.remove();toolbar=null;message=null;buttons.clear();return}
   if(!toolbar){
    toolbar=node('section','',{'data-moving-toolbar':'','class':'bo-moving-toolbar','role':'region','aria-label':_auxValue("aux.moving.panels.8d3220f41193","Moving Mode panel controls")});
    const copy=node('div','',{'class':'bo-moving-copy'});copy.append(node('strong',_auxValue("aux.moving.panels.6147adfc7f10","Moving Mode")));
    message=node('span','',{'class':'bo-moving-message','aria-live':'polite'});copy.append(message);toolbar.append(copy);
    for(const [action,text]of [['save',_auxValue("common.save","Save")],['reset',_auxValue("common.reset","Reset")],['cancel',_auxValue("common.cancel","Cancel")]]){const b=node('button',text,{'type':'button','data-moving-action':action,'class':'bo-moving-button'});buttons.set(action,b);toolbar.append(b)}
    doc.body.append(toolbar);
   }
   message.setAttribute('role',error?'alert':'status');if(error){message.removeAttribute('data-i18n');message.removeAttribute('data-i18n-params');message.textContent=error;}else _auxSetText(message,"aux.moving.helper","Drag handles or use arrow keys. Shift = 1px. Only panel movement is enabled.");
  }
  function bounds(grid){
   const rect=grid.getBoundingClientRect(),app=doc.querySelector('#app'),a=app?.getBoundingClientRect()||rect,style=app?view.getComputedStyle(app):null;
   const width=doc.documentElement.clientWidth||view.innerWidth||rect.right,hud=doc.querySelector('.level-hud')?.getBoundingClientRect();
   return {left:Math.max(0,rect.left,a.left+(parseFloat(style?.paddingLeft)||0)),right:Math.min(width,rect.right,a.right-(parseFloat(style?.paddingRight)||0)),top:rect.top>=0?Math.max(rect.top,hud?.bottom||rect.top):rect.top,bottom:rect.bottom};
  }
  function paint(){
   if(destroyed)return;
   const found=panels(),layout=unlocked()?(editing?draft:saved()):empty(),active=editing||Object.values(layout.panels).some(p=>p.x!==0||p.y!==0);
   if(canvas!==found.grid)clearCanvas();
   if(found.grid&&active){canvas=found.grid;canvas.setAttribute('data-moving-canvas','');canvas.style.setProperty('--bo-moving-room',Math.max(320,Math.min(800,(view.innerHeight||640)*.75))+'px')}else clearCanvas();
   const current=new Set(found.items.values());
   for(const [el,entry]of records)if(!current.has(el)){if(drag?.handle===entry.handle)stopDrag();cleanRecord(el,entry);records.delete(el)}
   displayed.clear();
   for(const [id,el]of found.items){
    if(!records.has(el))records.set(el,{id,handle:null});
    clearOffset(el);
    const entry=records.get(el);
    if(editing){
     el.setAttribute('data-moving-edit','');
     if(view.getComputedStyle(el).position==='static')el.setAttribute('data-moving-positioned','');
     if(!entry.handle){entry.handle=node('button',_auxValue('aux.moving.handle.'+id,'↕ Move '+label(id)),{'type':'button','data-move-handle':id,'class':'bo-moving-handle','aria-label':_auxValue('aux.moving.handleAria.'+id,'Move '+label(id)+' panel. Arrow keys move 10 pixels; Shift and arrow moves 1 pixel.')});el.append(entry.handle)}
    }else{el.removeAttribute('data-moving-edit');el.removeAttribute('data-moving-positioned');entry.handle?.remove();entry.handle=null}
   }
   if(found.grid){
    const area=bounds(found.grid);
    // All eligible panels are siblings in transform space: measure natural boxes first.
    const base=new Map([...found.items].map(([id,el])=>[id,el.getBoundingClientRect()]));
    for(const [id,el]of found.items){
     const p=layout.panels[id]||{x:0,y:0},b=base.get(id);
     // Clamping is display-only. It never normalizes or writes stored preferences.
     const x=active?clamp(p.x,area.left-b.left,area.right-b.right):0,y=active?clamp(p.y,area.top-b.top,area.bottom-b.bottom):0;
     displayed.set(id,{x,y});
     if(x!==0||y!==0){el.style.setProperty('--bo-move-x',x+'px');el.style.setProperty('--bo-move-y',y+'px');el.setAttribute('data-moving-offset','')}
    }
   }
   paintToolbar();
  }
  function refresh(){
   if(destroyed)return status();
   if(editing&&(!allowed(panels(),true)||!saving&&signature(saved())!==signature(snapshot))){finish();paint();restoreFocus()}else paint();
   return status();
  }
  function start(){
   if(destroyed)return false;if(editing)return ensureEditing();refresh();if(!allowed(panels()))return false;
   snapshot=saved();draft=normalize(snapshot);editing=true;error='';lastFocus=doc.activeElement;paint();
   const first=[...records.values()].find(r=>r.handle)?.handle;focusControl(first);return true;
  }
  function ensureEditing(){
   if(!editing||destroyed)return false;
   if(!allowed(panels(),true)||!saving&&signature(saved())!==signature(snapshot)){finish();paint();restoreFocus();return false}return true;
  }
  function cancel(){if(!editing||destroyed)return false;finish();paint();restoreFocus();return true}
  function persist(value){
   if(saving||destroyed)return false;
   if(editing?!ensureEditing():!allowed(panels()))return false;
   if(!allowed(panels())){error='Wait for the current action to finish before saving the panel layout.';paint();return false}
   const copy=normalize(value);let ok=false;saving=true;
   try{ok=opts.saveLayout?.(copy)===true}catch(_){ok=false}finally{saving=false}
   if(ok){finish();paint();restoreFocus();return true}
   error='Could not confirm saved panel layout. Keep this tab open; Retry or Cancel.';paint();notify(error);return false;
  }
  function save(){if(!ensureEditing())return false;return persist(draft)}
  function reset(){return persist(empty())}
  function status(){return {editing,dragging:!!drag,dirty:editing&&signature(draft)!==signature(snapshot),available:allowed(panels()),error,layout:normalize(editing?draft:saved())}}
  function move(id,x,y){
   if(!Number.isFinite(x)||!Number.isFinite(y)||!ensureEditing())return;
   draft.panels[id]={x:clamp(x,-4000,4000),y:clamp(y,-4000,4000)};error='';paint();
   // Explicit movement stores the chosen on-canvas position, not a stale offscreen offset.
   const p=displayed.get(id);if(p)draft.panels[id]={x:p.x,y:p.y};
  }
  function handleFor(target){for(const [el,entry]of records)if(entry.handle===target||entry.handle?.contains(target))return {el,...entry};return null}
  function tab(event){
   const stops=[...records.values()].map(r=>r.handle).filter(Boolean).concat([...buttons.values()]),index=stops.indexOf(doc.activeElement);
   if(stops.length)focusControl(stops[(index+(event.shiftKey?-1:1)+stops.length)%stops.length]);stop(event);
  }
  function capture(event){
   if(!editing)return;
   if(!ensureEditing()){stop(event);return}
   const type=event.type,target=event.target,entry=handleFor(target),inToolbar=!!toolbar?.contains(target);
   if(type==='keydown'){
    if(event.key==='Escape'){stop(event);cancel();return}
    if(event.key==='Tab'){tab(event);return}
    if(entry&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
     stop(event);const p=displayed.get(entry.id)||{x:0,y:0},step=event.shiftKey?1:10;
     move(entry.id,p.x+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),p.y+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0));return;
    }
    // Native button activation generates a click, which is handled in this capture phase.
    if(inToolbar&&(event.key==='Enter'||event.key===' ')){stop(event,false);return}
    stop(event);return;
   }
   if(type==='click'){
    stop(event);if(inToolbar){const action=target.closest?.('[data-moving-action]')?.getAttribute('data-moving-action');if(action==='save')save();else if(action==='reset')reset();else if(action==='cancel')cancel()}return;
   }
   if(type==='pointerdown'){
    stop(event,!inToolbar);
    if(!entry||drag||event.button!==0||event.isPrimary===false||!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return;
    const p=displayed.get(entry.id)||{x:0,y:0};drag={id:entry.id,el:entry.el,handle:entry.handle,pointerId:event.pointerId,clientX:event.clientX,clientY:event.clientY,x:p.x,y:p.y};entry.el.setAttribute('data-moving-dragged','');
    entry.handle.focus({preventScroll:true});try{entry.handle.setPointerCapture(event.pointerId)}catch(_){/* Document capture listeners still end an on-page gesture safely. */}return;
   }
   if(type==='pointermove'){
    if(!drag)return;stop(event);
    if(event.pointerId===drag.pointerId)move(drag.id,drag.x+event.clientX-drag.clientX,drag.y+event.clientY-drag.clientY);return;
   }
   if(type==='pointerup'||type==='pointercancel'||type==='lostpointercapture'){
    if(drag){stop(event);if(event.pointerId===drag.pointerId)stopDrag()}return;
   }
   // Compatibility mouse events must not reach native card/long-press/button handlers.
   stop(event,!inToolbar);
  }
  const events=['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','mousedown','mouseup','click','dblclick','auxclick','contextmenu','keydown'];
  for(const type of events)doc.addEventListener(type,capture,{capture:true,passive:false});
  view.addEventListener('resize',refresh);
  function destroy(){
   if(destroyed)return;finish();destroyed=true;
   for(const [el,entry]of records)cleanRecord(el,entry);records.clear();displayed.clear();clearCanvas();toolbar?.remove();toolbar=null;buttons.clear();
   for(const type of events)doc.removeEventListener(type,capture,true);view.removeEventListener('resize',refresh);
  }
  paint();return Object.freeze({refresh,start,save,reset,cancel,status,destroy});
 }
 return Object.freeze({PANEL_IDS,validate,normalize,init});
});
