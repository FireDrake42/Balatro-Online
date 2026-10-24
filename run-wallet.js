/* Fictional run-owned Wallet. Pure: no storage, DOM, clocks, RNG, accounts or network.
 * Only a genuine new-run boundary resets to $100. initialize() is an explicit
 * one-time legacy/unlock plan, never a read/hydration side effect. A caller must
 * save cash + inventory + this field in the SAME RUN write before applying it.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BORunWallet=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const MAX_BALANCE=100,UNLOCK_LEVEL=33,ACTIVE=Object.freeze(['select','play','cashout','shop','pack']),ENDED=Object.freeze(['won','lost']);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function check(ok,message){if(!ok)throw new Error(message)}
 function fields(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const proto=Object.getPrototypeOf(value);if(proto!==null&&proto!==Object.prototype)return false;
  const names=Reflect.ownKeys(value);if(names.length!==keys.length||!names.every(k=>typeof k==='string'&&keys.includes(k)))return false;
  return names.every(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&own(d,'value')&&d.enumerable===true});
 }
 function level(n){return Number.isInteger(n)&&n>=1&&n<=100}
 function unlocked(actualLevel){return level(actualLevel)&&actualLevel>=UNLOCK_LEVEL}
 function half(n){return typeof n==='number'&&Number.isFinite(n)&&Number.isSafeInteger(n*2)}
 function validate(wallet){try{return fields(wallet,['version','balance','revision'])&&wallet.version===1&&half(wallet.balance)&&wallet.balance>=0&&wallet.balance<=MAX_BALANCE&&Number.isSafeInteger(wallet.revision)&&wallet.revision>=0}catch(_){return false}}
 function copy(wallet){check(validate(wallet),'Wallet save needs attention. No balance was changed.');return {version:1,balance:wallet.balance,revision:wallet.revision}}
 function create(){return {version:1,balance:MAX_BALANCE,revision:0}}
 function closed(){return {version:1,balance:0,revision:0}}
 function validRun(run){check(run&&run.version===1&&[...ACTIVE,...ENDED].includes(run.phase),'Invalid Wallet origin run.');if(own(run,'wallet'))copy(run.wallet);return run}
 function initialize(run,actualLevel){
  validRun(run);check(level(actualLevel),'Invalid actual player level.');
  if(own(run,'wallet'))return copy(run.wallet);
  if(!unlocked(actualLevel))return undefined;
  return ENDED.includes(run.phase)?closed():create();
 }
 // Seal a pre-Wallet win BEFORE continuing it into endless; otherwise it could
 // appear to be an active ungranted legacy run on the next reconciliation.
 function sealEnded(run){validRun(run);check(ENDED.includes(run.phase),'Only an ended run can be sealed.');return own(run,'wallet')?copy(run.wallet):closed()}
 function pay(run,amount,payment,creditLimit){
  validRun(run);check(ACTIVE.includes(run.phase),'This run has ended.');
  check(half(amount)&&amount>=0,'Invalid purchase price.');check(half(run.money),'Invalid Bank balance.');
  check(fields(payment,['source','actualLevel'])&&['bank','card'].includes(payment.source)&&level(payment.actualLevel),'Choose Bank or Card with the current actual player level.');
  const result={money:run.money};if(own(run,'wallet'))result.wallet=copy(run.wallet);
  if(payment.source==='bank'){
   check(half(creditLimit)&&creditLimit>=0,'Invalid Bank credit limit.');
   const money=run.money-amount;check(half(money)&&money>=-creditLimit,'Not enough Bank money.');result.money=money;
  }else{
   check(unlocked(payment.actualLevel)&&run.progressionEnabled===true&&unlocked(run.playerLevel),'Wallet unlocks at actual player Level 33.');
   check(result.wallet,'Wallet has not been durably initialized for this run.');
   check(result.wallet.balance>=amount,'Not enough Wallet money.');
   check(result.wallet.revision<Number.MAX_SAFE_INTEGER,'Wallet revision overflow.');
   result.wallet.balance-=amount;result.wallet.revision++;
  }
  return result;
 }
 function affordability(run,amount,actualLevel,creditLimit){
  const result={bank:false,card:false};for(const source of ['bank','card'])try{pay(run,amount,{source,actualLevel},creditLimit);result[source]=true}catch(_){}return result;
 }
 return Object.freeze({MAX_BALANCE,UNLOCK_LEVEL,ACTIVE,ENDED,unlocked,validate,copy,create,closed,initialize,sealEnded,pay,affordability});
});
