/* Read-only maximum-level presentation. Slot exchanges stay in the existing
   guarded save-slots owner/journal API. This module never creates/resets saves. */
(function(root,factory){'use strict';const api=factory(typeof module==='object'&&module.exports?require('./save-slots'):root.BOSaveSlots);if(typeof module==='object'&&module.exports)module.exports=api;else root.BOLevel100Choice=api;})(typeof globalThis!=='undefined'?globalThis:this,function(S){'use strict';
 const TEXT='Congrats! You’ve experienced through all of the levels in Balatro Online!!! You can now either start again or the all of the achievements, get everything to MAX level, etc. What do you do?';
 const BUTTONS=Object.freeze(['Start from save file 2','Continue']);
 function eligible(level){return Number.isSafeInteger(level)&&level===100;}
 function html(level){return eligible(level)?'<section class="save-slot-scope level100-choice" aria-labelledby="level100-choice-message"><p class="level100-kicker">MAX PLAYER LEVEL · 100</p><p id="level100-choice-message">'+TEXT+'</p><div class="sheet-actions"><button type="button" class="btn primary" data-action="level100-save-two">'+BUTTONS[0]+'</button><button type="button" class="btn ghost" data-action="level100-continue">'+BUTTONS[1]+'</button></div></section>':null;}
 function target(meta){S.validateMeta(meta);const slot=meta.slots[1],occupied=meta.active===2||slot.profileSeen||Object.values(slot.archive).some(v=>v!==null);return Object.freeze({id:2,active:meta.active,generation:slot.generation,occupied,signature:JSON.stringify([meta.active,meta.slots[meta.active-1].generation,slot.generation,slot.profileSeen,slot.archive])});}
 function identity(meta,reset=null){S.validateMeta(meta);if(reset!==null&&typeof reset!=='string')throw Error('Invalid maximum-level presentation identity.');return JSON.stringify([meta.active,meta.slots[meta.active-1].generation,reset]);}
 return Object.freeze({TEXT,BUTTONS,eligible,html,target,identity});
});
