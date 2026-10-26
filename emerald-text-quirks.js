/* Ephemeral, text-only Emerald presentation. Independent WebCrypto entropy;
 * no gameplay state, persistence, timing, rewards or audible effects. */
(function(root,factory){'use strict';const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldTextQuirks=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const KINDS=Object.freeze(['clicking','squeaking','humming','hissing','knocking','whirring']);
 const TOKENS=Object.freeze(['(clicks)','(squeaks)','(hums)','(hiss)','(knocks)','(whirs)']);
 // 2^32 has a remainder of four modulo six. Reject those four values rather
 // than biasing either the one-in-six gate or the independent six-way choice.
 function uint32(){if(!root.crypto?.getRandomValues)throw Error('Presentation entropy unavailable');return root.crypto.getRandomValues(new Uint32Array(1))[0]}
 function six(draw=uint32){for(;;){const n=draw();if(!Number.isInteger(n)||n<0||n>4294967295)throw Error('Expected uint32 presentation entropy');if(n<4294967292)return n%6}}
 function sample(level,draw=uint32){if(!Number.isInteger(level)||level<6||level>100)return null;return six(draw)===0?KINDS[six(draw)]:null}
 function decorate(raw,kind,translate){const text=String(raw??''),index=KINDS.indexOf(kind);if(index<0||!text)return text;
  if(kind==='hissing'){
   // Only a small set of ordinary, non-numeric words; never names, amounts,
   // player input or negations. Otherwise an authored hiss marker is safer.
   const safe=/\b(?:uses|this|is|yes|us|es|somos|suis|nous)\b(?!['’])/i,match=safe.exec(text);
   if(match){const at=match.index+match[0].toLowerCase().lastIndexOf('s');return text.slice(0,at+1)+text[at].repeat(4)+text.slice(at+1)}
  }
  const key='emerald.quirk.'+kind,rt=translate||((k)=>root.BOTranslation?.t(k)),localized=rt?.(key),token=typeof localized==='string'&&localized!==key?localized:TOKENS[index];return text+' '+token;
 }
 function displayed(element){if(!element?.isConnected||element.ownerDocument?.hidden||element.closest?.('[hidden],[inert],[aria-hidden="true"]'))return false;
  if(element.getClientRects&&!element.getClientRects().length)return false;const style=element.ownerDocument?.defaultView?.getComputedStyle?.(element);return !style||style.display!=='none'&&style.visibility!=='hidden'&&style.visibility!=='collapse';
 }
 function create(options={}){const choices=new Map(),limit=Number.isInteger(options.limit)&&options.limit>0?Math.min(options.limit,256):128,draw=options.uint32||uint32,writer=root.BOEmeraldTypewriter&&root.requestAnimationFrame?root.BOEmeraldTypewriter.create({eligible:options.eligible}):null;
  function choice(key,level){if(!Number.isInteger(level)||level<6||level>100){if(!choices.has(key)){choices.set(key,null);if(choices.size>limit)choices.delete(choices.keys().next().value)}return null}if(choices.has(key)){const value=choices.get(key);choices.delete(key);choices.set(key,value);return value}let value=null;try{value=sample(level,draw)}catch(_){/* No entropy: leave the actual message unchanged. */}choices.set(key,value);if(choices.size>limit)choices.delete(choices.keys().next().value);return value}
  function paint(element,raw,key,level,translate){if(!displayed(element))return false;const text=String(raw??'');if(!text.trim()){if(element.textContent!==text)element.textContent=text;return false}const value=decorate(text,choice(key,level),translate);if(writer)writer.paint(element,value,key,{motion:options.motion?.()!==false,eligible:options.eligible});else if(element.textContent!==value)element.textContent=value;return true}
  return Object.freeze({choice,paint,clear:()=>{choices.clear();writer?.clear()},size:()=>choices.size});
 }
 return Object.freeze({KINDS,six,sample,decorate,displayed,create});
});
