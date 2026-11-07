/* Exact FINAL native button/physical-dart rewards. No shadow balance, click
 * ledger, RNG, passive loop, storage or trusted:true message. The real owner
 * commits detached projections; the document coordinator consumes DOM Events. */
(function(root,factory){'use strict';const n=typeof module==='object'&&module.exports,api=factory(root,n?require('./progression'):root.BOProgress,n?require('./darts-501'):root.BODarts501,()=>n?require('./darts-native'):root.BODartsNative);if(n)module.exports=api;else root.BONativePlayerXP=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root,PG,D501,darts){'use strict';
 const copy=v=>JSON.parse(JSON.stringify(v)),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const check=(ok,message)=>{if(!ok)throw Error('Native Player XP: '+message)};
 function binding(slot){check(slot&&Number.isInteger(slot.id)&&slot.id>=1&&slot.id<=3&&typeof slot.generation==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(slot.generation),'invalid selected slot generation');return {id:slot.id,generation:slot.generation};}
 function context(c){check(c&&Number.isSafeInteger(c.at)&&c.at>=0&&c.at<=8640000000000000,'invalid native source time');binding(c.slot);check(Number.isInteger(c.levelAtIntent)&&c.levelAtIntent>=1&&c.levelAtIntent<=100,'invalid actual activation level');return c;}
 function exactConfig(before,c,kind,configuration){context(c);check(configuration&&typeof configuration==='object'&&!Array.isArray(configuration),'whole native XP configuration required');return {...configuration,now:c.at,sourceKind:kind,xpSource:kind,extraRewardMultiplier:1,costContext:{beforeProfile:copy(before),slot:binding(c.slot),at:c.at}};}
 function prepareButton(before,c,configuration){context(c);check(Number.isInteger(before?.progression?.level)&&before.progression.level>=c.levelAtIntent&&before.progression.level<=100,'actual activation level changed before capture');const profile=copy(before);if(c.levelAtIntent<60)return {profile,summary:null,id:null};check(typeof c.session==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(c.session)&&Number.isSafeInteger(c.sequence)&&c.sequence>0,'invalid consumed native intent');const id='native-button:'+c.slot.id+':'+c.slot.generation+':'+c.session+':'+c.sequence,summary=PG.addAwardedXp(profile.progression,5,id,exactConfig(before,c,'native-button',configuration));check(summary.awardedXp===(summary.duplicate?0:5),'final button award was not exact5');return {profile,summary,id};}
 function prepareDart(before,request,c,configuration){context(c);const model=darts(),state=before?.emeraldDarts;check(model&&model.validate(state),'invalid saved physical dart source');check(request?.action==='throw','physical throw source required');const next=model.throwDart(state,request.dart,request.expectedRevision,c),profile=copy(before);profile.emeraldDarts=next;
  // Reaching62 through this button does not make its own dart face-eligible.
  check(c.levelAtIntent<=before.progression.level,'invalid future activation level');if(c.levelAtIntent<62)return {profile,summary:null,id:null};
  const actor=state.state.turn,index=state.pending.length+1,id='physical-dart:'+c.slot.id+':'+c.slot.generation+':'+state.leg+':'+next.revision+':'+actor+':'+index,face=D501.scoreDart(request.dart);
  const summary=PG.addAwardedXp(profile.progression,face,id,exactConfig(before,c,'physical-dart',configuration));check(!summary.duplicate&&summary.awardedXp===face,'physical dart receipt was already consumed or not exact');return {profile,summary,id};
 }
 const semantic='button,input[type="button"],input[type="submit"],input[type="reset"],[role="button"],summary',inputs=new WeakMap(),disclosures=new WeakSet();
 function observeDocument(doc){
  if(!doc?.defaultView||inputs.has(doc))return inputs.get(doc)||null;const state={key:null,pointer:null},w=doc.defaultView;inputs.set(doc,state);
  // Bookkeeping only: releases are synchronous. Never XP, cooldown, busy state
  // or a delayed revived hold. A new physical press clears its predecessor.
  doc.addEventListener('keydown',e=>{if(!e.isTrusted)return;state.pointer=null;if(['Enter',' '].includes(e.key)){const button=e.target.closest?.(semantic),prior=e.repeat&&state.key?.button===button&&state.key.key===e.key?state.key:null;state.key={button,key:e.key,repeat:e.repeat===true,down:true,intent:prior?.intent||null,expectClick:prior?.expectClick||false};}},true);
  doc.addEventListener('keyup',e=>{if(e.isTrusted&&state.key?.key===e.key){state.key.down=false;state.key.repeat=false;}},true);
  doc.addEventListener('pointerdown',e=>{if(e.isTrusted){state.key=null;state.pointer={event:e,button:e.target.closest?.(semantic),id:e.pointerId,charged:false};}},true);
  doc.addEventListener('pointercancel',e=>{if(e.isTrusted&&state.pointer?.id===e.pointerId)state.pointer=null;},true);
  w.addEventListener('blur',()=>{state.key=null;});return state;
 }
 function trustedControl(event,sourceWindow){
  check(sourceWindow&&typeof sourceWindow.Event==='function'&&event instanceof sourceWindow.Event&&event.isTrusted===true,'an actual trusted source DOM Event is required');
  // Native platform-brand calls reject Object.create(Event.prototype) too.
  const prototype=sourceWindow.Event.prototype,type=Object.getOwnPropertyDescriptor(prototype,'type').get.call(event),path=prototype.composedPath.call(event),doc=sourceWindow.document;
  check(doc&&doc.defaultView===sourceWindow&&!doc.hidden&&doc.visibilityState==='visible','source document is not foreground');check(['click','pointerdown','keydown'].includes(type),'unsupported physical activation');if(type==='keydown')check(['Enter',' '].includes(event.key),'not a semantic button key activation');if(type==='pointerdown')check(event.button===0&&event.isPrimary!==false,'not a primary physical activation');
  check(Array.isArray(path)&&path.includes(doc)&&path[0]?.ownerDocument===doc,'event does not belong to its actual source document');const button=path.find(n=>n?.ownerDocument===doc&&typeof n.matches==='function'&&n.matches(semantic));
  check(button&&button.isConnected&&!button.disabled&&!button.matches(':disabled')&&button.getAttribute('aria-disabled')!=='true'&&!button.closest('[inert]')&&button.getClientRects().length>0,'no actual enabled semantic button');observeDocument(doc);return button;
 }
 function createCoordinator(options){
  check(options&&['capture','award','assertIntent'].every(k=>typeof options[k]==='function'),'native coordinator host incomplete');const session=options.session||root.crypto?.randomUUID?.();check(typeof session==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(session),'native coordinator session required');observeDocument(root.document);
  const seen=new WeakMap();let sequence=0,tail=Promise.resolve(),current=null,paused=false;
  function invoke(command,intent){const old=current;current=intent;try{return command(intent)}finally{current=old}}
  function unavailable(error,command,adapter){if(error.reloadRequired)paused=true;options.unavailable?.(error,adapter);if(adapter.onUnavailable==='continue')return invoke(command,null);return {ok:false,reason:error.message};}
  function unpaid(command,adapter,intent){const result=tail.then(()=>{try{options.assertIntent(intent);}catch(error){return unavailable(error,command,adapter);}return invoke(command,intent);},error=>unavailable(error,command,adapter));tail=result.catch(()=>{});return result;}
  function dispatch(ticket,command,adapter){
   if(ticket.handlers.has(adapter.owner))return ticket.handlers.get(adapter.owner);ticket.pending++;
   const result=tail.then(()=>ticket.accepted).then(intent=>{try{check(!paused,'native button XP is paused');options.assertIntent(intent);}catch(error){return unavailable(error,command,adapter);}return invoke(command,intent);},error=>unavailable(error,command,adapter)).finally(()=>{if(--ticket.pending===0&&ticket.paid)try{options.finished?.(ticket.intent);}catch(_){/* UI publication never undoes a confirmed source. */}});
   ticket.handlers.set(adapter.owner,result);tail=result.catch(()=>{});return result;
  }
  function follow(event,command,adapter,origin,fresh){
   const repeat=arguments.length===5,previous=seen.get(origin.event);
   if(!previous)return unpaid(command,adapter,repeat?{...(fresh||origin),event,button:origin.button,sourceWindow:origin.sourceWindow}:origin);
   const intent={...origin,event},observed=repeat?fresh:origin;
   const ticket={handlers:new Map(),intent,pending:0,paid:false,accepted:tail.then(()=>previous.accepted).then(()=>{check(!paused,'native button XP is paused');options.assertIntent(origin);check(observed,'native repeat capture unavailable');options.assertIntent(observed);return intent;})};
   seen.set(event,ticket);return dispatch(ticket,command,adapter);
  }
  function handle(event,command,adapter={}){
   check(typeof command==='function'&&typeof adapter.owner==='string'&&adapter.owner.length>0,'real native handler owner required');let button;
   try{button=trustedControl(event,adapter.sourceWindow||root);}catch(error){if(adapter.onUnavailable==='continue'||event?.isTrusted!==true)return command();options.unavailable?.(error,adapter);return Promise.resolve({ok:false,reason:error.message});}
   let ticket=seen.get(event);
   if(!ticket){const input=inputs.get(button.ownerDocument),key=input?.key,pointer=input?.pointer;
    // A browser may click the default submit control for Enter in a text
    // field. Preserve that original submission, but typing is not a paid
    // physical activation of the different semantic button.
    if(event.type==='click'&&event.detail===0&&key?.down&&key.button!==button)return command();
    const repeat=event.type==='keydown'&&event.repeat||event.type==='click'&&event.detail===0&&key?.key==='Enter'&&key.repeat&&key.button===button;
    if(repeat){try{check(key?.intent,'auto-repeat has no accepted originating press');options.assertIntent(key.intent);const captured=options.capture(event,button,adapter);return follow(event,command,adapter,key.intent,captured);}catch(error){return unavailable(error,command,adapter);}}
    if(event.type==='click'&&event.detail===0&&key?.expectClick&&key.button===button){key.expectClick=false;return follow(event,command,adapter,key.intent);}
    if(event.type==='click'&&pointer?.charged&&pointer.button===button&&(event.pointerId===pointer.id||event.pointerId===undefined&&event.detail>0)){input.pointer=null;return follow(event,command,adapter,pointer.intent);}
    let captured;try{captured=options.capture(event,button,adapter);}catch(error){return unavailable(error,command,adapter);}if(!captured)return command();const origin={...captured,event,button,sourceWindow:adapter.sourceWindow||root};
    const identified=captured.levelAtIntent>=50;let intent=origin;
    if(identified){check(sequence<Number.MAX_SAFE_INTEGER,'native intent counter is full');intent={...origin,session,sequence:++sequence};const paid=captured.levelAtIntent>=60;
     ticket={handlers:new Map(),intent,pending:0,paid,accepted:tail.then(async()=>{check(!paused,'native button XP is paused');options.assertIntent(intent);if(!paid)return intent;const reward=await options.award(intent);options.assertIntent(intent);return {...intent,reward};})};seen.set(event,ticket);}
    if(event.type==='keydown'&&key){key.intent=intent;key.expectClick=!event.defaultPrevented;}else if(event.type==='click'&&event.detail===0&&key?.button===button)key.intent=intent;
    if(event.type==='pointerdown'&&pointer?.event===event){pointer.charged=true;pointer.intent=intent;}
    if(!identified)return unpaid(command,adapter,intent);
   }
   return dispatch(ticket,command,adapter);
  }
  return Object.freeze({handle,current:()=>current,settled:()=>tail,status:()=>({paused,sequence,session})});
 }
 function bindDisclosures(host,selector,owner){for(const summary of host?.querySelectorAll(selector)||[]){if(disclosures.has(summary))continue;disclosures.add(summary);summary.addEventListener('click',event=>{if(event.target.closest('summary')!==summary||event.target.closest('button,a,input,select,textarea'))return;event.preventDefault();event.stopPropagation();return handle(event,()=>{summary.parentElement.open=!summary.parentElement.open;},{owner,sourceWindow:summary.ownerDocument.defaultView});});}}
 let coordinator=null;
 function connect(options){check(!coordinator,'one activation coordinator per document');coordinator=createCoordinator(options);return coordinator;}
 function handle(event,command,adapter){return coordinator?coordinator.handle(event,command,adapter):command();}
 return Object.freeze({binding,exactConfig,prepareButton,prepareDart,trustedControl,createCoordinator,connect,handle,observeDocument,bindDisclosures,current:()=>coordinator?.current()||null,status:()=>coordinator?.status()||null,settled:()=>coordinator?.settled()||Promise.resolve()});
});
