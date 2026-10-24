/* Read-only Binance Spot market-data API. No keys, accounts, writes or synthetic fallback. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./stock-market.js'));else root.BOStockMarketData=factory(root.BOStockMarket)})(typeof globalThis!=='undefined'?globalThis:this,function(M){
'use strict';
const BASE='https://data-api.binance.vision',BASES=Object.freeze([BASE,'https://api.binance.com','https://api1.binance.com']),DOCS='https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints';
function create(options={}){
 const fetcher=options.fetch||globalThis.fetch?.bind(globalThis),now=options.now||Date.now,timeoutMs=options.timeoutMs||8000;
 let preferred=0;
 async function request(path,parameters={}){
  if(!fetcher)throw new Error('Network fetch is unavailable in this browser.');
  const suffix=path+(Object.keys(parameters).length?'?'+new URLSearchParams(parameters):''),order=BASES.map((_,i)=>(preferred+i)%BASES.length);let lastError;
  for(const index of order){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
   try{const response=await fetcher(BASES[index]+suffix,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});if(!response.ok)throw new Error('Binance public data unavailable (HTTP '+response.status+').');const data=await response.json();if(!data||typeof data!=='object')throw new Error('Invalid Binance data.');preferred=index;return data}catch(e){lastError=e.name==='AbortError'?'Binance request timed out.':e.message}finally{clearTimeout(timer)}
  }
  throw new Error('Binance public market endpoints are unreachable. Wi-Fi may be connected while the provider is blocked. Retry after reconnecting; no fictional price will be used. '+String(lastError||''));
 }
 async function clock(){const before=now(),data=await request('/api/v3/time'),observedAt=now();if(!Number.isSafeInteger(data.serverTime)||Math.abs(data.serverTime-observedAt)>10000||observedAt-before>timeoutMs*BASES.length||observedAt<before)throw new Error('Binance clock is stale, or this device clock is inaccurate. Fresh data is required.');return {serverTime:data.serverTime,observedAt}}
 function serverAt(c,at){return c.serverTime+(at-c.observedAt)}
 function candle(row,interval){
  if(!Array.isArray(row)||row.length<7||!Number.isSafeInteger(row[0])||row[0]%interval!==0||row[6]!==row[0]+interval-1)throw new Error('Binance returned the wrong candle timestamp.');
  for(const value of row.slice(1,5))M.comparePrices(value,value);
  return {openTime:row[0],closeTime:row[6],open:row[1],high:row[2],low:row[3],close:row[4]};
 }
 async function second(c,openTime,kind){
  const rows=await request('/api/v3/klines',{symbol:M.SYMBOL,interval:'1s',startTime:openTime,endTime:openTime+999,limit:1});
  if(!Array.isArray(rows)||rows.length!==1)throw new Error('Exact Binance historical second is not yet available.');const row=candle(rows[0],1000),observedAt=now(),serverTime=serverAt(c,observedAt);
  if(row.openTime!==openTime||row.closeTime>=serverTime||observedAt-c.observedAt>timeoutMs)throw new Error('Exact closed Binance second is unavailable; waiting for data.');
  return {source:M.SOURCE,symbol:M.SYMBOL,price:row.close,openTime:row.openTime,closeTime:row.closeTime,observedAt,serverTime,kind};
 }
 async function freshQuote(){const c=await clock(),q=await second(c,M.deadlineOpenTime(c.serverTime),'entry');M.validateFreshQuote(q,now());return q}
 async function historicalQuote(serverDeadlineAt){const c=await clock();if(c.serverTime<serverDeadlineAt)throw new Error('Binance has not confirmed the ten-minute deadline yet.');return second(c,M.deadlineOpenTime(serverDeadlineAt),'deadline')}
 async function graph(){
  const c=await clock(),endTime=Math.floor(c.serverTime/60000)*60000-1,rows=await request('/api/v3/klines',{symbol:M.SYMBOL,interval:'1m',endTime,limit:60});
  if(!Array.isArray(rows)||rows.length<2||rows.length>60)throw new Error('Recent Binance chart candles unavailable.');const candles=rows.map(row=>candle(row,60000)),observedAt=now();
  if(candles.at(-1).closeTime!==endTime||observedAt-c.observedAt>timeoutMs||candles.some((row,i)=>i>0&&row.openTime!==candles[i-1].openTime+60000))throw new Error('Binance chart is stale or incomplete.');
  return {source:M.SOURCE,symbol:M.SYMBOL,interval:'1m',candles,observedAt,serverTime:serverAt(c,observedAt)};
 }
 return Object.freeze({freshQuote,historicalQuote,graph});
}
return Object.freeze({BASE,BASES,DOCS,create});
});
