/* Bounded, ephemeral text-only presentation. One accessible complete string,
 * one aria-hidden visual text node: never one DOM node per letter. No rewards. */
(function(root,factory){'use strict';const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldTypewriter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 function create(options={}){const active=new Map(),now=options.now||(()=>root.performance?.now?.()??Date.now()),request=options.request||(fn=>root.requestAnimationFrame(fn)),cancel=options.cancel||(id=>root.cancelAnimationFrame(id));let raf=null,destroyed=false;
  function eligible(element,state){if(!element.isConnected||element.ownerDocument?.hidden||element.closest?.('[hidden],[inert],[aria-hidden="true"]'))return false;try{if(options.eligible?.()===false||state.eligible?.()===false)return false}catch(_){return false}return true}
  function schedule(){if(raf===null&&active.size&&!destroyed)raf=request(tick)}
  function tick(){raf=null;const at=now();for(const [element,s]of active){if(!element.isConnected){active.delete(element);continue}const delta=s.last===null?0:Math.max(0,Math.min(100,at-s.last));s.last=at;if(!eligible(element,s))continue;s.elapsed+=delta;const count=Math.min(s.letters.length,Math.floor(s.elapsed/s.step));if(count!==s.count){s.count=count;s.visual.textContent=s.letters.slice(0,count).join('')}if(count===s.letters.length)active.delete(element)}schedule()}
  const states=new WeakMap();
  function paint(element,raw,key,opts={}){if(!element||destroyed)return false;const text=String(raw??'').slice(0,32768),reduced=opts.motion===false||root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;let s=states.get(element);
   if(!s||s.key!==key||s.text!==text||s.visual.parentNode&&s.visual.parentNode!==element||!element.children?.length){const doc=element.ownerDocument||options.document||root.document,visual=doc.createElement('span'),accessible=doc.createElement('span');visual.setAttribute('aria-hidden','true');visual.className='emerald-typed-visible';accessible.className='emerald-typed-accessible';accessible.textContent=text;element.replaceChildren(visual,accessible);const letters=Array.from(text);s={key,text,letters,visual,accessible,count:0,elapsed:0,last:now(),step:Math.max(8,Math.min(26,6000/Math.max(1,letters.length))),eligible:opts.eligible};states.set(element,s);active.set(element,s);if(active.size>128)active.delete(active.keys().next().value)}
   if(reduced){s.visual.textContent=text;s.count=s.letters.length;active.delete(element)}else if(s.count<s.letters.length){s.eligible=opts.eligible;active.set(element,s);schedule()}return true;
  }
  return Object.freeze({paint,clear(){for(const s of active.values())s.last=null;active.clear();if(raf!==null)cancel(raf);raf=null},destroy(){destroyed=true;active.clear();if(raf!==null)cancel(raf);raf=null},size:()=>active.size});
 }
 return Object.freeze({create});
});
