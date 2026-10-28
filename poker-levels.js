/* Shared EMB metadata only. No save reads/writes, clocks, RNG or reward calls.
 * PXP/SXP are cumulative; initial table cap40, distinct from player cap100. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOPokerLevels=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const MAX_LEVEL=40,THRESHOLDS=Object.freeze([0,100,1000,2000,3000,4000,5000,7000,9000,...Array.from({length:25},(_,i)=>11000+2000*i),80000,100000,150000,200000,250000,300000]);
 function info(total){if(typeof total!=='number'||!Number.isFinite(total)||total<0||total>Number.MAX_SAFE_INTEGER||Object.is(total,-0))throw Error('Cumulative EMB experience must be a finite nonnegative safe value.');let index=0;while(index<39&&total>=THRESHOLDS[index+1])index++;const max=index===39,floor=THRESHOLDS[index],next=max?null:THRESHOLDS[index+1],required=max?0:next-floor,progress=max?0:total-floor;return Object.freeze({level:index+1,total,floor,next,required,progress,remaining:max?0:required-progress,percent:max?100:100*progress/required,multiplier:1+index/100,multiplierHundredths:100+index,max})}
 function multiplier(level){if(!Number.isInteger(level)||level<1||level>MAX_LEVEL)throw Error('EMB level must be 1–40.');return 1+(level-1)/100}
 return Object.freeze({MAX_LEVEL,THRESHOLDS,info,multiplier});
});
