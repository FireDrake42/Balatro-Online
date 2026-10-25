/* Fictional in-run predictions. Pure deterministic model: no network, clocks, RNG or engine calls. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BOStockMarket=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SOURCE='Binance public market data',SYMBOL='BTCUSDT',DURATION_MS=600000,QUOTE_MAX_AGE_MS=15000;
const copy=x=>JSON.parse(JSON.stringify(x)),object=x=>!!x&&typeof x==='object'&&!Array.isArray(x),time=x=>Number.isSafeInteger(x)&&x>=0;
function requireThat(ok,message){if(!ok)throw new Error(message)}
function identifier(x){return typeof x==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(x)&&!['__proto__','constructor','prototype'].includes(x)}
function priceUnits(value){requireThat(typeof value==='string'&&/^\d{1,12}(?:\.\d{1,18})?$/.test(value),'Invalid Binance price.');const [whole,fraction='']=value.split('.');const n=BigInt(whole)*10n**18n+BigInt(fraction.padEnd(18,'0'));requireThat(n>0n,'Invalid Binance price.');return n}
function comparePrices(a,b){const x=priceUnits(a),y=priceUnits(b);return x>y?1:x<y?-1:0}
function deadlineOpenTime(deadline){requireThat(time(deadline)&&deadline>=1000,'Invalid deadline.');return Math.floor(deadline/1000)*1000-1000}
function maxStake(level){requireThat(Number.isInteger(level)&&level>=1&&level<=100,'Invalid actual player level.');return level>=47?20:10}
function stakeReceipt(a){if(!object(a))return false;const marked=Object.prototype.hasOwnProperty.call(a,'stakeLevel'),d=marked?Object.getOwnPropertyDescriptor(a,'stakeLevel'):null;return (!marked||d&&d.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&Number.isInteger(d.value)&&d.value>=47&&d.value<=100)&&Number.isInteger(a.stake)&&a.stake>=1&&a.stake<=(marked?20:10)}
function create(){return {version:1,revision:0,active:null,history:[],receipts:{},graph:null,blockedReason:''}}
function normalize(value){
 if(!object(value))return create();
 for(const a of [value.active,...(Array.isArray(value.history)?value.history:[]),...(object(value.receipts)?Object.values(value.receipts):[])])if(a&&(!stakeReceipt(a)))return {...create(),blockedReason:'Prediction stake provenance needs recovery. No payment was made.'};
 const s=copy(value);
 if(s.version!==1||!time(s.revision)||!Array.isArray(s.history)||!object(s.receipts))return {...create(),blockedReason:'Market save is unreadable. Export a backup before resetting progress.'};
 s.blockedReason=typeof s.blockedReason==='string'?s.blockedReason:'';
 if(s.active){const a=s.active;try{requireThat(identifier(a.id)&&identifier(a.runId)&&['call','put'].includes(a.direction)&&stakeReceipt(a)&&time(a.startedAt)&&a.deadlineAt===a.startedAt+DURATION_MS&&time(a.serverDeadlineAt),'Unreadable pending prediction.');priceUnits(a.entryPrice)}catch(e){s.blockedReason='Pending prediction save needs recovery. No new prediction or automatic payment is allowed.'}}
 return s;
}
function recover(profileState,runMirror){const a=normalize(profileState),b=normalize(runMirror);return b.revision>a.revision?b:a}
function next(state){const s=copy(state);requireThat(!s.blockedReason,s.blockedReason);requireThat(time(s.revision)&&s.revision<Number.MAX_SAFE_INTEGER,'Market revision overflow.');s.revision++;return s}
function status(state,now){requireThat(time(now),'Invalid clock.');const a=state.active;return {phase:state.blockedReason?'unavailable':!a?'idle':now<a.deadlineAt?'active':'awaiting-data',remainingMs:a?Math.max(0,a.deadlineAt-now):0,active:a?copy(a):null}}
function baseQuote(q){requireThat(object(q)&&q.source===SOURCE&&q.symbol===SYMBOL,'Binance public data is unavailable.');priceUnits(q.price);requireThat(time(q.openTime)&&q.openTime%1000===0&&q.closeTime===q.openTime+999&&time(q.serverTime)&&time(q.observedAt),'Invalid Binance source timestamp.');requireThat(q.closeTime<q.serverTime,'Binance candle is not yet closed.')}
function validateFreshQuote(q,now){baseQuote(q);requireThat(time(now)&&now-q.observedAt>=-1000&&now-q.observedAt<=QUOTE_MAX_AGE_MS&&Math.abs(q.serverTime-q.observedAt)<=10000&&q.serverTime-q.closeTime<=5000,'Fresh Binance quote required; stale data cannot start a prediction.');return true}
function validHalf(x){return Number.isFinite(x)&&Number.isSafeInteger(x*2)}
// Deliberately NOT engine.addMoney (which floors): gross returns can end in .5.
// Only balance and real gross earnings change; never XP, shop spend, RNG or Joker triggers.
function applyBalance(run,delta){
 requireThat(object(run)&&object(run.stats)&&validHalf(run.money)&&validHalf(run.stats.moneyEarned)&&validHalf(delta),'Game cash must use exact half-dollar units.');
 const balance=run.money+delta,earned=run.stats.moneyEarned+Math.max(0,delta);
 requireThat(validHalf(balance)&&validHalf(earned),'Game cash overflow.');
 if(delta<0)requireThat(balance>=0,'Predictions require available cash; credit and debt cannot be used.');
 run.money=balance;run.stats.moneyEarned=earned;return run;
}
function start(state,run,p){
 requireThat(!state.blockedReason,state.blockedReason);requireThat(Number.isInteger(p.level)&&p.level>=21&&p.level<=100,'Stock Market unlocks at actual player Level 21.');
 requireThat(!state.active,'Only one prediction can be active.');requireThat(identifier(p.id)&&!Object.hasOwn(state.receipts,p.id)&&!state.history.some(x=>x.id===p.id),'Prediction ID already used.');
 requireThat(identifier(run?._uiId),'This run needs a stable save ID.');requireThat(['call','put'].includes(p.direction),'Choose Call (up) or Put (down).');
 requireThat(Number.isInteger(p.stake)&&p.stake>=1&&p.stake<=maxStake(p.level),'Stake must be a whole game$ amount from 1 to '+maxStake(p.level)+'.');
 requireThat(validHalf(run.money)&&run.money>=p.stake,'Predictions require available cash; credit and debt cannot be used.');validateFreshQuote(p.quote,p.now);
 const s=next(state),serverNow=p.quote.serverTime+(p.now-p.quote.observedAt);
 s.active={id:p.id,runId:run._uiId,direction:p.direction,stake:p.stake,...(p.stake>10?{stakeLevel:p.level}:{}),entryPrice:p.quote.price,entryOpenTime:p.quote.openTime,entryCloseTime:p.quote.closeTime,startedAt:p.now,deadlineAt:p.now+DURATION_MS,serverDeadlineAt:serverNow+DURATION_MS,source:SOURCE,symbol:SYMBOL,dataError:'',lastAttemptAt:0};
 return {state:s,balanceDelta:-p.stake};
}
function settle(state,run,p){
 if(Object.hasOwn(state.receipts,p.id))return {state,balanceDelta:0,receipt:copy(state.receipts[p.id]),duplicate:true};
 const a=state.active;requireThat(a&&a.id===p.id,'Prediction is no longer pending.');requireThat(run?._uiId===a.runId,'Only the origin run can receive this prediction.');requireThat(time(p.now)&&p.now>=a.deadlineAt,'The ten-minute deadline has not arrived.');baseQuote(p.quote);
 const open=deadlineOpenTime(a.serverDeadlineAt);requireThat(p.quote.kind==='deadline'&&p.quote.openTime===open&&p.quote.closeTime===open+999&&p.quote.serverTime>=a.serverDeadlineAt,'Exact historical deadline data is not yet available.');
 const comparison=comparePrices(p.quote.price,a.entryPrice),won=a.direction==='call'?comparison>0:comparison<0,status=comparison===0?'tie':won?'won':'lost',payout=status==='tie'?a.stake:won?a.stake*1.5:0;
 const receipt={...copy(a),status,payout,endPrice:p.quote.price,endOpenTime:open,endCloseTime:open+999,settledAt:p.now,reason:status==='tie'?'Equal deadline price: stake refunded.':won?'Correct direction: 1.5× gross return.':'Wrong direction: stake lost.'};
 const s=next(state);s.active=null;s.history.push(receipt);s.receipts[a.id]=copy(receipt);return {state:s,balanceDelta:payout,receipt};
}
function awaitData(state,id,error,now){if(!state.active||state.active.id!==id||state.blockedReason)return state;const s=next(state);s.active.dataError=String(error||'Historical deadline data unavailable.').slice(0,240);s.active.lastAttemptAt=now;return s}
function forfeit(state,reason,now){if(!state.active)return state;requireThat(typeof reason==='string'&&reason.trim().length>0&&time(now),'A readable forfeit reason is required.');const s=next(state),a=s.active,receipt={...a,status:'forfeited',payout:0,endPrice:null,settledAt:now,reason};s.active=null;s.history.push(receipt);s.receipts[a.id]=copy(receipt);return s}
function graphEligible(state,bossesWon){requireThat(time(bossesWon),'Invalid cumulative Boss count.');return !state.blockedReason&&(!state.graph||Math.floor(bossesWon/2)>state.graph.threshold)}
function recordGraph(state,graph,bossesWon){requireThat(graphEligible(state,bossesWon),'Graph refresh is not eligible.');requireThat(object(graph)&&graph.source===SOURCE&&graph.symbol===SYMBOL&&Array.isArray(graph.candles)&&graph.candles.length>=2&&time(graph.observedAt),'Invalid public chart data.');const s=next(state);s.graph={...copy(graph),threshold:Math.floor(bossesWon/2)};return s}
return Object.freeze({SOURCE,SYMBOL,DURATION_MS,QUOTE_MAX_AGE_MS,maxStake,stakeReceipt,create,normalize,recover,status,deadlineOpenTime,comparePrices,validateFreshQuote,applyBalance,start,settle,awaitData,forfeit,graphEligible,recordGraph});
});
