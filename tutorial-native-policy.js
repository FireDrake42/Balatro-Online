/* Pure legal52-card generation plans. Native engine applies them BEFORE draw;
 * no created cards, replenished resources, IO, RNG, rewards or saved authority. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOTutorialNativePolicy=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const PLANS=Object.freeze({
  small:Object.freeze(['H14','H13','H12','H11','H10','C2','D3','S4']),
  big:Object.freeze(['H14','H13','H12','H11','C2','D3','C4','D5','H10','C6','D7','C8']),
  boss:Object.freeze(['H14','H13','H12','H11','H10','H9','H8','H7','S14','S13','S12','C2','D3','S11','C4','D5','C6','D7','S10','C8','D9','C10'])
 });
 function check(ok,message){if(!ok)throw Error('Tutorial generation: '+message);}
 function data(object,key){const d=Object.getOwnPropertyDescriptor(object,key);check(d&&Object.hasOwn(d,'value'),'native cards must contain data fields.');return d.value;}
 function order(cards,kind){
  check(Object.hasOwn(PLANS,kind),'unknown native lesson stage.');
  check(Array.isArray(cards)&&cards.length===52,'the lesson requires the actual52-card starting deck.');
  const byToken=new Map(),ids=new Set();
  for(const card of cards){
   check(card&&typeof card==='object','malformed native card.');
   const rank=data(card,'rank'),suit=data(card,'suit'),id=data(card,'id');
   check(Number.isInteger(rank)&&rank>=2&&rank<=14&&['H','D','C','S'].includes(suit)&&typeof id==='string'&&id.length>0,'invalid native rank/suit/identity.');
   check(!data(card,'enhancement')&&!data(card,'edition')&&!data(card,'seal'),'ordinary unmodified starting cards are required.');
   const token=suit+rank;check(!byToken.has(token)&&!ids.has(id),'duplicate native card identity or rank/suit.');byToken.set(token,card);ids.add(id);
  }
  const front=PLANS[kind].map(token=>{check(byToken.has(token),'required native card is missing.');return byToken.get(token)});
  const used=new Set(front),remaining=cards.filter(card=>!used.has(card));
  // Native drawPile.pop() consumes the requested front in its listed order.
  return front.concat(remaining).reverse();
 }
 return Object.freeze({order});
});
