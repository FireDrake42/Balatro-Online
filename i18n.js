/* Keyed, text-only presentation. This module has NO Storage writer, network or game model access. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOI18n=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const LANGUAGES=Object.freeze([{id:'en-US',label:'English'},{id:'es',label:'Español'},{id:'fr',label:'Français'}].map(Object.freeze));
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),record=o=>!!o&&typeof o==='object'&&!Array.isArray(o),validLanguage=id=>typeof id==='string'&&LANGUAGES.some(x=>x.id===id),resolveLanguage=id=>validLanguage(id)?id:'en-US';
 const placeholders=text=>[...new Set([...String(text).matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(m=>m[1]))].sort();
 const ATTRIBUTES=Object.freeze(['aria-label','aria-description','title','placeholder','alt']);
 const SCOPES=Object.freeze(['levels','faucet','survey-runner','surveys','daily-streak','daily-tasks','potions','stock-market','emerald','blackjack','stats','audio','images','text','moving-panels']);let activeRuntime=null;
 const listeners=new Set();
 // Exact-source rules are restricted a second time here, even if a manifest is accidentally broadened.
 const NEVER='script,style,svg,math,textarea,input:not([type="button"]),[contenteditable]:not([contenteditable="false"]),[data-i18n-skip],[translate="no"],[data-player-username],.local-badge,#seed-input,#username-input,#slot-rename-input,#slot-delete-confirm,#reset-confirm-input,#cloud-identity,#cloud-password,#cloud-new-password,#cloud-confirm-password,#music-track,#soundtrack-credits,[class*="receipt"],[class*="transcript"],.score-breakdown,.log,.survey-history,.surveys-history,.surveys-receipts,[data-survey-receipt],.survey-receipt,.survey-answer,.survey-transcript,.emerald-chat-message,.emerald-chat-log,.emerald-transcript,.save-slot-card h3,.faucet-answers';
 function validateCatalogs(catalogs){
  if(!record(catalogs)||!record(catalogs['en-US']))throw Error('The canonical en-US language catalog is missing.');
  const source=catalogs['en-US'],keys=Object.keys(source).sort();
  for(const id of Object.keys(catalogs)){
   if(!validLanguage(id)||!record(catalogs[id]))throw Error('Unsupported language catalog: '+id);
   const pack=catalogs[id];if(JSON.stringify(Object.keys(pack).sort())!==JSON.stringify(keys))throw Error('Language catalog key parity failed: '+id);
   for(const key of keys){if(typeof pack[key]!=='string'||typeof source[key]!=='string')throw Error('Language messages must be text: '+key);if(JSON.stringify(placeholders(pack[key]))!==JSON.stringify(placeholders(source[key])))throw Error('Language placeholder parity failed: '+id+' '+key);}
  }
  return true;
 }
 function savePreference(host,id,expected){
  let attempted=false;
  try{
   if(!validLanguage(id))throw Error('Choose one of the listed languages.');if(typeof host.available==='function'&&!host.available(id))throw Error('The selected language file is unavailable. Keep all game files together and reload.');
   const context=expected===undefined?host.context():expected;
   const assert=()=>{host.assert();if(host.context()!==context)throw Error('The selected slot, owner or settings editor changed. Reopen Settings before changing language.');};
   assert();const before=host.read();assert();if(before!==null&&(typeof before!=='string'||before.length>4*1024*1024))throw Error('Stored settings cannot be read safely. Reload before changing language.');
   let base;try{base=before===null?{}:JSON.parse(before)}catch(_){throw Error('Stored settings cannot be read safely. Reload before changing language.');}
   if(!record(base))throw Error('Stored settings cannot be read safely. Reload before changing language.');
   const next={...base,preferredLanguage:id},raw=JSON.stringify(next);
   assert();if(host.read()!==before)throw Error('Settings changed in another tab. Reload before changing language.');assert();
   if(raw!==before){attempted=true;if(host.write(next)!==true)throw Error('The browser could not verify the language preference write.');}
   if(host.read()!==raw)throw Error('The browser could not verify the language preference write.');
   assert();if(host.read()!==raw)throw Error('Settings changed during language preference verification.');assert();
   host.apply(id,next);return {ok:true,language:id};
  }catch(error){
   const detail=error?.message||'The language could not be saved. No language change was applied in this tab.';
   const message=attempted?'The language was not applied in this tab. Stored settings may have changed; no rollback is guaranteed. Saving is paused. Reload to check before retrying. '+detail:detail;
   if(attempted)host.pause(message);return {ok:false,uncertain:attempted,message};
  }
 }
 function create(options={}){
  const catalogs=options.catalogs,doc=options.document===undefined?(typeof document==='undefined'?null:document):options.document;
  validateCatalogs(catalogs);let locale='en-US',observer=null,scheduled=false,working=false;
  const source=catalogs['en-US'],rules=Array.isArray(options.rules)?options.rules:[],bindings=new Map(),sourceKeys=new Map(),pending=new Set(),compiled=new Map(),keyedState=new WeakMap(),descriptionBindings=new Map();
  const descriptionSources=new Map(),descriptionDynamic=[],descriptionTokens=new Map();for(const item of [...(rules.descriptions||[]),...(rules.currentDescriptions||[])]){if(!item||!own(source,item.key)||typeof item.source!=='string'||typeof item.template!=='string')continue;const rule={...item,original:item.source,source:item.template,parameters:record(item.parameters)?{...item.parameters}:Object.fromEntries(placeholders(item.template).map(name=>[name,'[0-9]+(?:\\.[0-9]+)?']))};if(record(item.tokens))descriptionTokens.set(item.key,item.tokens);if(!descriptionSources.has(item.source))descriptionSources.set(item.source,[]);descriptionSources.get(item.source).push(rule);if(item.dynamic)descriptionDynamic.push(rule);}
  for(const [key,value]of Object.entries(source)){if(!sourceKeys.has(value))sourceKeys.set(value,key);}
  const grouped=new Map();for(const rule of rules){if(!rule||typeof rule.selector!=='string'||!own(source,rule.key))continue;let group=grouped.get(rule.selector);if(!group){group={text:new Map(),dynamic:[],attributes:[]};grouped.set(rule.selector,group);}if(rule.attribute)group.attributes.push(rule);else if(rule.parameters)group.dynamic.push(rule);else if(!group.text.has(rule.source??source[rule.key]))group.text.set(rule.source??source[rule.key],rule);}
  const t=(key,params={})=>{const value=catalogs[locale]?.[key]??source[key];return typeof value==='string'?value.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(whole,name)=>own(params,name)?String(params[name]):whole):String(key);};
  const descriptionT=(key,params={})=>{const maps=descriptionTokens.get(key);if(!maps)return t(key,params);const rendered={...params};for(const [name,choices]of Object.entries(maps))if(record(choices)&&own(params,name)&&own(choices,String(params[name]))&&own(source,choices[String(params[name])]))rendered[name]=t(choices[String(params[name])]);return t(key,rendered);};
  const keyFor=text=>sourceKeys.get(text)||null;
  const integritySurface=element=>!!element?.closest?.('.faucet-answers')||(!!element?.closest?.('#dialog-title')&&!!element.ownerDocument?.querySelector('#dialog-body .faucet-answers,#dialog-body #faucet-captcha-input,#dialog-body .faucet-page'));
  const forbidden=element=>!!element?.closest?.(NEVER)||integritySurface(element);
  const ATTRIBUTE_NEVER='script,style,svg,math,textarea,input[type="password"],[contenteditable]:not([contenteditable="false"]),[data-i18n-skip],[translate="no"],[data-player-username],.local-badge,#username-input,#slot-rename-input,#slot-delete-confirm,#reset-confirm-input,#cloud-identity,#cloud-password,#cloud-new-password,#cloud-confirm-password,#music-track,#soundtrack-credits,[class*="receipt"],[class*="transcript"],.score-breakdown,.log,.survey-history,.surveys-history,.surveys-receipts,[data-survey-receipt],.survey-receipt,.survey-answer,.survey-transcript,.emerald-chat-message,.emerald-chat-log,.emerald-transcript,.save-slot-card h3,.faucet-answers';
  const attributeForbidden=(element,attribute)=>!!element?.closest?.(ATTRIBUTE_NEVER)||integritySurface(element)||(element?.matches?.('input:not([type="button"])')&&!element.matches('#seed-input,#catalog-search')&&!element.hasAttribute('data-i18n-'+attribute));
  const RULE_PROTECTED='#bo-survey-host,.surveys-history,.surveys-receipts,[data-survey-receipt],.faucet-answers';
  function bindingTrusted(node,binding){const element=binding.attribute?node:node.parentElement,trust=binding.trust;if(!element||(binding.attribute?attributeForbidden(element,binding.attribute):forbidden(element))||trust?.element!==element)return false;if(trust.kind==='rule')return element.matches(trust.selector)&&!element.closest(RULE_PROTECTED);if(trust.kind==='keyed')return element.getAttribute('data-i18n')===binding.key&&element.childNodes.length===1&&element.firstChild===node;if(trust.kind==='keyedAttribute')return element.getAttribute('data-i18n-'+binding.attribute)===binding.key;return trust.kind==='manual';}
  function bindText(target,key,params={},trust=null){
   if(!own(source,key)||!target)return false;
   let node=target;
   if(node.nodeType===1){if(forbidden(node)||node.childNodes.length!==1||node.firstChild.nodeType!==3)return false;node=node.firstChild;}
   if(node.nodeType!==3||forbidden(node.parentElement))return false;
   const previous=bindings.get(node);if(previous&&previous.key===key&&JSON.stringify(previous.params)===JSON.stringify(params)){if(trust)previous.trust=trust;return paint(node,previous)!==false;}
   const raw=node.nodeValue,leading=raw.match(/^\s*/)[0],trailing=raw.match(/\s*$/)[0],binding={key,params:{...params},leading,trailing,last:raw,attribute:null,trust:trust||{kind:'manual',element:node.parentElement}};bindings.set(node,binding);paint(node,binding);return true;
  }
  function bindAttribute(element,attribute,key,params={},trust=null){
   if(!element||!ATTRIBUTES.includes(attribute)||!own(source,key)||attributeForbidden(element,attribute))return false;
   // Form values are never translated. Only an explicitly-approved accessibility/placeholder attribute.
   const name='i18n-attribute:'+attribute;let slots=bindings.get(element);if(!slots||!slots.attributes){slots={attributes:new Map()};bindings.set(element,slots);}
   const raw=element.getAttribute(attribute);if(raw===null)return false;const binding={key,params:{...params},attribute,last:raw,trust:trust||{kind:'manual',element}};slots.attributes.set(name,binding);paint(element,binding);return true;
  }
  function paint(node,binding){
   if(binding.attributes){for(const [name,entry]of binding.attributes){if(!bindingTrusted(node,entry)){binding.attributes.delete(name);continue;}paint(node,entry);}return;}
   if(!bindingTrusted(node,binding)){if(node.nodeType===3)bindings.delete(node);return false;}
   const rendered=(binding.leading||'')+t(binding.key,binding.params)+(binding.trailing||'');
   if(binding.attribute){if(node.getAttribute(binding.attribute)!==rendered)node.setAttribute(binding.attribute,rendered);}
   else{if(node.nodeValue!==rendered)node.nodeValue=rendered;const state=keyedState.get(node.parentElement);if(state&&state.key===binding.key)state.last=rendered;}
   binding.last=rendered;
  }
  const matches=(root,selector)=>{const result=[];if(root.nodeType===1&&root.matches(selector))result.push(root);if(root.querySelectorAll)result.push(...root.querySelectorAll(selector));return result;};
  const parameters=element=>{try{const value=JSON.parse(element.getAttribute('data-i18n-params')||'{}');return record(value)?value:{}}catch(_){return {}}};
  function matchRule(rule,text){
   const template=rule.source??source[rule.key];if(!rule.parameters)return text===template?(rule.params||{}):null;
   let pattern=compiled.get(rule);if(!pattern){let position=0,regex='^',names=[];for(const match of template.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)){if(!own(rule.parameters,match[1]))return null;regex+=template.slice(position,match.index).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'('+rule.parameters[match[1]]+')';names.push(match[1]);position=match.index+match[0].length;}regex+=template.slice(position).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$';pattern={regex:new RegExp(regex),names};compiled.set(rule,pattern);}
   const match=pattern.regex.exec(text);if(!match)return null;const values={};for(let i=0;i<pattern.names.length;i++){const name=pattern.names[i],value=match[i+1];if(own(values,name)&&values[name]!==value)return null;values[name]=value;}return values;
  }
  function projectDescription(original,canonical,subject){
   const id=typeof subject==='string'?subject:subject?.id||subject?.enhancement||subject?.card?.enhancement,candidates=descriptionSources.get(String(original))||descriptionDynamic;
   const ordered=id?[...candidates].sort((a,b)=>Number(b.key.split('.').at(-2)===id)-Number(a.key.split('.').at(-2)===id)):candidates;
   for(const rule of ordered){const params=matchRule(rule,String(canonical));if(params)return {key:rule.key,params,text:descriptionT(rule.key,params)};}return null;
  }
  function paintDescription(element,binding){if(forbidden(element)||element.getAttribute('data-i18n-description')!==binding.key||element.querySelector('button,input,select,textarea,a,[tabindex],[contenteditable]')){descriptionBindings.delete(element);return false;}const html=options.renderDescription(descriptionT(binding.key,binding.params));if(html!==binding.last){element.innerHTML=html;binding.last=html;}}
  function bindDescription(element,key,params={}){
   if(typeof options.renderDescription!=='function'||!element.matches('span[data-i18n-description]')||forbidden(element)||!own(source,key)||!key.startsWith('catalog.')||element.querySelector('button,input,select,textarea,a,[tabindex],[contenteditable]'))return false;
   let entry=descriptionBindings.get(element);if(!entry||entry.key!==key||JSON.stringify(entry.params)!==JSON.stringify(params)){entry={key,params:{...params},last:null};descriptionBindings.set(element,entry);}paintDescription(element,entry);return true;
  }
  function bindKeyed(element){
   const key=element.getAttribute('data-i18n');if(!own(source,key)||element.childNodes.length!==1||element.firstChild.nodeType!==3||forbidden(element))return false;
   let params=parameters(element),raw=JSON.stringify(params);const previous=keyedState.get(element),text=element.firstChild.nodeValue;
   if(previous&&previous.key===key&&previous.raw===raw&&text!==previous.last){
    let rule=previous.numeric;if(!rule){rule={key,parameters:Object.fromEntries(placeholders(source[key]).map(name=>[name,'[+−-]?[0-9][0-9,]*(?:\\.[0-9]+)?']))};previous.numeric=rule;}
    const updated=matchRule(rule,text.trim());if(!updated){bindings.delete(element.firstChild);return false;}params=updated;raw=JSON.stringify(params);element.setAttribute('data-i18n-params',raw);
   }
   if(!bindText(element,key,params,{kind:'keyed',element}))return false;keyedState.set(element,{key,raw,last:element.firstChild.nodeValue,numeric:previous?.numeric});return true;
  }
  function apply(root=doc){
   if(!root||working)return 0;working=true;let count=0;
   try{
    for(const element of matches(root,'[data-i18n]'))if(bindKeyed(element))count++;
    for(const element of matches(root,'span[data-i18n-description]'))if(bindDescription(element,element.getAttribute('data-i18n-description'),parameters(element)))count++;
    for(const attribute of ATTRIBUTES)for(const element of matches(root,'[data-i18n-'+attribute+']'))if(bindAttribute(element,attribute,element.getAttribute('data-i18n-'+attribute),parameters(element),{kind:'keyedAttribute',element}))count++;
    // No unknown text is translated: every candidate must match a finite audited selector AND source message.
    for(const [selector,group]of grouped)for(const element of matches(root,selector)){
     if(element.closest(RULE_PROTECTED))continue;
     for(const rule of group.attributes){const raw=element.getAttribute(rule.attribute),params=raw===null?null:matchRule(rule,raw);if(params&&bindAttribute(element,rule.attribute,rule.key,params,{kind:'rule',element,selector}))count++;}
     if(forbidden(element))continue;
     for(const node of element.childNodes){if(node.nodeType!==3)continue;const existing=bindings.get(node);if(existing&&node.nodeValue===existing.last){paint(node,existing);continue;}if(existing)bindings.delete(node);
      const text=node.nodeValue.trim(),fixed=group.text.get(text);if(fixed){if(bindText(node,fixed.key,fixed.params||{},{kind:'rule',element,selector}))count++;continue;}
      for(const rule of group.dynamic){const params=matchRule(rule,text);if(params){if(bindText(node,rule.key,params,{kind:'rule',element,selector}))count++;break;}}
     }
    }
   }finally{working=false;}
   return count;
  }
  function refresh(){for(const [node,binding]of bindings){if(node.isConnected===false){bindings.delete(node);continue;}if(node.nodeType===3&&(forbidden(node.parentElement)||node.nodeValue!==binding.last)){bindings.delete(node);continue;}if(binding.attributes){for(const [name,entry]of binding.attributes)if(node.getAttribute(entry.attribute)!==entry.last)binding.attributes.delete(name);}paint(node,binding);}for(const [element,binding]of descriptionBindings){if(!element.isConnected||forbidden(element)){descriptionBindings.delete(element);continue;}paintDescription(element,binding);}apply(doc);}
  function dropDetached(node){if(node.isConnected)return;bindings.delete(node);descriptionBindings.delete(node);for(const child of node.childNodes||[])dropDetached(child);}
  function setLocale(id){const previous=locale;const requested=resolveLanguage(id);locale=own(catalogs,requested)?requested:'en-US';if(doc?.documentElement)doc.documentElement.lang=locale;refresh();if(previous!==locale)for(const listener of listeners)try{listener(locale)}catch(error){if(typeof console!=='undefined')console.error('Language presentation listener failed.',error)}return locale;}
  function projectHTML(scope,canonicalHTML){
   if(!SCOPES.includes(scope)||!doc?.createElement)return String(canonicalHTML);
   const template=doc.createElement('template');template.innerHTML=String(canonicalHTML);
   // Detached trusted presentation template only. No generic source rules, state bindings or game/controller calls.
   for(const element of template.content.querySelectorAll('[data-i18n]')){const key=element.getAttribute('data-i18n');if(own(source,key)&&!forbidden(element)&&!element.children.length)element.textContent=t(key,parameters(element));}
   for(const attribute of ATTRIBUTES)for(const element of template.content.querySelectorAll('[data-i18n-'+attribute+']')){const key=element.getAttribute('data-i18n-'+attribute);if(own(source,key)&&!attributeForbidden(element,attribute))element.setAttribute(attribute,t(key,parameters(element)));}
   return template.innerHTML;
  }
  function projectText(scope,canonical){if(!SCOPES.includes(scope))return String(canonical);const key=keyFor(String(canonical));return key?t(key):String(canonical);}
  function observe(){
   if(observer||!doc?.documentElement||typeof MutationObserver==='undefined')return;
   observer=new MutationObserver(records=>{
    for(const record of records){
     if(record.type==='characterData'){
      const binding=bindings.get(record.target);if(binding&&record.target.nodeValue===binding.last)continue;
      if(record.target.parentElement)pending.add(record.target.parentElement);
     }else if(record.type==='attributes'){
      const slots=bindings.get(record.target),entry=slots?.attributes?.get('i18n-attribute:'+record.attributeName);if(entry&&record.target.getAttribute(record.attributeName)===entry.last)continue;
      pending.add(record.target);
     }else{for(const node of record.removedNodes)dropDetached(node);for(const node of record.addedNodes)if(node.nodeType===1)pending.add(node);else if(node.nodeType===3&&node.parentElement)pending.add(node.parentElement);}
    }
    if(pending.size&&!scheduled){scheduled=true;queueMicrotask(()=>{scheduled=false;const roots=[...pending];pending.clear();for(const root of roots)if(root.isConnected)apply(root);});}
   });
   observer.observe(doc.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:[...ATTRIBUTES,'data-i18n','data-i18n-params','data-i18n-description',...ATTRIBUTES.map(name=>'data-i18n-'+name)]});
  }
  const api=Object.freeze({t,keyFor,projectDescription,bindDescription,bindText,bindAttribute,apply,setLocale,getLocale:()=>locale,availableLanguage:id=>validLanguage(id)&&own(catalogs,id),projectHTML,projectText,observe,onChange:listener=>{if(typeof listener!=='function')throw Error('Language listener must be a function.');listeners.add(listener);return ()=>listeners.delete(listener);},destroy(){observer?.disconnect();observer=null;bindings.clear();descriptionBindings.clear();pending.clear();if(activeRuntime===api)activeRuntime=null;},coverage:()=>({locale,loaded:Object.keys(catalogs),keys:Object.keys(source).length,bound:bindings.size,descriptions:descriptionBindings.size})});
  if(doc)activeRuntime=api;return api;
 }
 return Object.freeze({LANGUAGES,ATTRIBUTES,SCOPES,validLanguage,resolveLanguage,placeholders,validateCatalogs,savePreference,create,t:(key,params)=>activeRuntime?activeRuntime.t(key,params):String(key),getLocale:()=>activeRuntime?.getLocale()||'en-US',availableLanguage:id=>activeRuntime?.availableLanguage(id)||false,projectHTML:(scope,html)=>activeRuntime?.projectHTML(scope,html)??String(html),projectText:(scope,text)=>activeRuntime?.projectText(scope,text)??String(text),onChange:listener=>{if(typeof listener!=='function')throw Error('Language listener must be a function.');listeners.add(listener);return ()=>listeners.delete(listener);}});
});
