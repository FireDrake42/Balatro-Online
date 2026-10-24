/* Three local save slots. The active slot remains the canonical working set:
 * existing modules keep their native Storage keys, quota checks and events.
 * Only an explicit allowlist is archived; account credentials/leases are NEVER
 * read into an archive. No Storage monkeypatch, automatic cloud or transfers.
 *
 * Host contract: hold the existing exclusive game writer permit AND Web Locks
 * (SURVEY_LOCK, PROFILE, streak, tasks) across initialize recovery/exchanges;
 * quiesce controllers before exchanging, then reload. assertOwner is checked
 * before and after EVERY mutation. A prepared journal rolls back; a committed
 * journal rolls forward. Failed recovery retains the complete journal. */
(function(root,factory){'use strict';const api=factory(root,typeof module==='object'&&module.exports?require('./player-identity'):root?.BOPlayerIdentity);if(typeof module==='object'&&module.exports)module.exports=api;else root.BOSaveSlots=api;})(typeof window!=='undefined'?window:null,function(root,PI){'use strict';
 const META_KEY='danis-table.save-slots.v1',MIGRATION_KEY='danis-table.save-slots.legacy.v1',JOURNAL_KEY='danis-table.save-slots.journal.v1',CLOUD_JOURNAL_KEY='danis-table.cloud-restore-journal.v1',SURVEY_LOCK='danis-table.save-slots.survey-gate.v1';
 const PROFILE='danis-table.profile.v1',RESET_KEY='danis-table.survey-reset.v1',SESSION_PREFIX='danis-table.survey-session.';
 const KEYS=Object.freeze([PROFILE,'danis-table.run.v1','danis-table.settings.v1','danis-table.daily-streak.v1','danis-table.daily-tasks.v1',RESET_KEY,'danis-table.cloud-local-backup.v1']);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),record=o=>!!o&&typeof o==='object'&&!Array.isArray(o),clone=o=>JSON.parse(JSON.stringify(o));
 function check(ok,message){if(!ok)throw new Error('Save slots: '+message)}
 function fields(o,list,label){check(record(o)&&Object.keys(o).length===list.length&&list.every(k=>own(o,k)),label+' is malformed. Stored data has not been overwritten.');}
 function sessionKey(k){return typeof k==='string'&&k.startsWith(SESSION_PREFIX)&&/^[a-zA-Z0-9_-]{1,128}$/.test(k.slice(SESSION_PREFIX.length))}
 function sessionKeys(storage){const out=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(sessionKey(k))out.push(k)}return out.sort()}
 function validateKeys(keys){check(record(keys)&&KEYS.every(k=>own(keys,k))&&Object.keys(keys).every(k=>KEYS.includes(k)||sessionKey(k)),'archive is partial or contains unsupported keys.');for(const [k,v]of Object.entries(keys))check(typeof v==='string'||v===null&&KEYS.includes(k),'archive raw values are malformed.');return keys}
 function snapshot(storage){const out={};for(const k of KEYS)out[k]=storage.getItem(k);for(const k of sessionKeys(storage))out[k]=storage.getItem(k);return validateKeys(out)}
 function empty(){return Object.fromEntries(KEYS.map(k=>[k,null]))}
 function parse(raw,label){try{return JSON.parse(raw)}catch(_){throw new Error('Save slots: '+label+' is unreadable. Keep browser data and backups; reload after freeing storage.')}}
 function validateMeta(m){
  fields(m,['version','revision','active','slots'],'metadata');check(m.version===1&&Number.isSafeInteger(m.revision)&&m.revision>=0&&[1,2,3].includes(m.active)&&Array.isArray(m.slots)&&m.slots.length===3,'unsupported or invalid metadata.');
  for(let i=0;i<3;i++){const s=m.slots[i];fields(s,own(s,'name')?['id','generation','profileSeen','archive','name']:['id','generation','profileSeen','archive'],'slot metadata');if(own(s,'name')){const d=Object.getOwnPropertyDescriptor(s,'name');check(d&&own(d,'value')&&PI?.validateSlotName(d.value)===true,'invalid slot name.');}check(typeof s.profileSeen==='boolean','profile presence evidence is malformed.');check(s.id===i+1&&typeof s.generation==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(s.generation),'invalid slot identity.');if(s.id===m.active)check(s.archive===null,'active slot must use the live canonical save.');else validateKeys(s.archive)}check(new Set(m.slots.map(s=>s.generation)).size===3,'slot identities are not unique.');return m;
 }
 function peek(storage){const raw=storage.getItem(META_KEY);return raw===null?null:validateMeta(parse(raw,'metadata'))}
 // Exact raw bytes are the authority. This conservative gate only distinguishes
 // terminal/banked sessions; it never normalizes, discards or awards a receipt.
 function assertNoPendingSurvey(keys){
  let p=null;try{p=keys[PROFILE]===null?null:JSON.parse(keys[PROFILE])}catch(_){throw new Error('Save slots: profile needs attention before switching; its original bytes are retained.');}
  const sessions=new Map();for(const k of Object.keys(keys).filter(sessionKey)){let s;try{s=JSON.parse(keys[k])}catch(_){throw new Error('Save slots: a saved survey needs attention. Continue in this slot; nothing was removed.');}check(record(s)&&s.id===k.slice(SESSION_PREFIX.length)&&['qualified','in-progress','completed','disqualified'].includes(s.status),'a saved survey needs attention. Continue in this slot.');sessions.set(s.id,s);check(s.status==='disqualified'||s.status==='completed'&&p?.economy?.receipts?.some(r=>r.id===s.id),'finish or pause back to the original survey and bank its reward before switching slots.');}
  for(const a of p?.economy?.attempts||[])check(a.status!=='started'||sessions.get(a.sessionId)?.status==='disqualified','a pending survey belongs to this slot. Continue it here and bank its reward before switching.');
 }
 function create(options){
  const storage=options?.storage;check(storage&&typeof options.assertOwner==='function','a guarded storage host is required.');let bound=null,paused=false;
  const assertOwner=()=>options.assertOwner(),token=()=>{const t=options.token?options.token():root?.crypto?.randomUUID?.()||'slot-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);check(typeof t==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(t),'invalid generated identity.');return t};
  function put(key,raw){assertOwner();if(raw===null)storage.removeItem(key);else storage.setItem(key,raw);check(storage.getItem(key)===raw,'browser storage did not confirm the complete write. Keep this tab and reload to recover.');assertOwner()}
  function assertCurrent(){check(!paused,'profile presence could not be confirmed. Keep this tab and reload before saving again.');check(bound!==null,'choose a local slot before saving.');check(storage.getItem(JOURNAL_KEY)===null,'an interrupted exchange needs recovery. Reload before saving.');check(storage.getItem(META_KEY)===bound,'the selected slot changed in another tab. Close other game tabs and reload before saving.');return true}
  function read(){assertCurrent();return clone(validateMeta(parse(bound,'metadata')))}
  function confirmProfileWrite(raw){assertOwner();const m=read();check(typeof raw==='string'&&storage.getItem(PROFILE)===raw,'profile write has not been verified or does not match.');if(m.slots[m.active-1].profileSeen)return true;check(m.revision<Number.MAX_SAFE_INTEGER-1,'slot revision is full.');m.slots[m.active-1].profileSeen=true;m.revision++;const next=JSON.stringify(validateMeta(m));try{put(META_KEY,next);bound=next;return true}catch(error){paused=true;throw error}}
  function apply(keys){validateKeys(keys);const desired={...keys};for(const k of sessionKeys(storage))if(!own(desired,k))desired[k]=null;for(const [k,v]of Object.entries(desired))put(k,v)}
  function validateLegacy(raw){check(raw===null||typeof raw==='string','legacy backup is malformed.');if(raw!==null){const b=parse(raw,'legacy backup');fields(b,['version','keys'],'legacy backup');check(b.version===1,'legacy backup version needs attention.');validateKeys(b.keys)}}
  function validateImage(image){fields(image,['meta','keys','legacy'],'journal image');check(typeof image.meta==='string','journal metadata is partial.');validateMeta(parse(image.meta,'journal metadata'));validateKeys(image.keys);validateLegacy(image.legacy)}
  function applyImage(image){apply(image.keys);if(storage.getItem(MIGRATION_KEY)!==image.legacy)put(MIGRATION_KEY,image.legacy);put(META_KEY,image.meta)}
  function recover(){
   const raw=storage.getItem(JOURNAL_KEY);if(raw===null)return {recovered:false};assertOwner();check(storage.getItem(CLOUD_JOURNAL_KEY)===null,'cloud recovery must finish before slot recovery.');const j=parse(raw,'exchange journal');fields(j,['version','phase','before','after'],'exchange journal');check(j.version===1&&['prepared','committed'].includes(j.phase),'exchange journal version/phase needs attention.');validateImage(j.before);validateImage(j.after);
   const before=parse(j.before.meta,'before metadata'),after=parse(j.after.meta,'after metadata');check(after.revision===before.revision+1,'journal revisions do not match.');const current=storage.getItem(META_KEY);check(current===j.before.meta||current===j.after.meta,'journal and slot metadata disagree. Keep all backups; no game was loaded.');
   check(j.after.legacy===j.before.legacy||j.after.legacy===null,'legacy backup was changed unexpectedly.');const target=j.phase==='committed'?j.after:j.before;applyImage(target);put(JOURNAL_KEY,null);bound=target.meta;return {recovered:true,phase:j.phase};
  }
  function initialize({readOnly=false}={}){
   check(storage.getItem(CLOUD_JOURNAL_KEY)===null,'cloud recovery must finish before choosing a slot.');if(storage.getItem(JOURNAL_KEY)!==null){check(!readOnly,'close the tab that owns progress, then reload to recover the interrupted slot exchange.');recover()}
   let raw=storage.getItem(META_KEY);if(raw!==null){validateMeta(parse(raw,'metadata'));bound=raw;return read()}
   check(!readOnly,'another tab owns progress. Close it and reload here before choosing a slot.');assertOwner();const keys=snapshot(storage),backup=storage.getItem(MIGRATION_KEY);
   if(backup===null)put(MIGRATION_KEY,JSON.stringify({version:1,keys}));else {const b=parse(backup,'legacy backup');fields(b,['version','keys'],'legacy backup');check(b.version===1,'legacy backup version needs attention.');validateKeys(b.keys);check(JSON.stringify(b.keys)===JSON.stringify(keys),'legacy backup differs from the live save. Keep both; no progress was overwritten.');}
   const m=validateMeta({version:1,revision:0,active:1,slots:[1,2,3].map(id=>({id,generation:token(),profileSeen:id===1&&keys[PROFILE]!==null,archive:id===1?null:empty()}))});raw=JSON.stringify(m);put(META_KEY,raw);bound=raw;return read();
  }
  function exchange(next,keys,eraseLegacy=false){
   assertOwner();assertCurrent();check(storage.getItem(CLOUD_JOURNAL_KEY)===null,'cloud recovery must finish first.');check(next.revision<Number.MAX_SAFE_INTEGER,'slot revision is full. Export backups before continuing.');validateMeta(next);validateKeys(keys);
   const before={meta:bound,keys:snapshot(storage),legacy:storage.getItem(MIGRATION_KEY)},after={meta:JSON.stringify(next),keys,legacy:eraseLegacy?null:before.legacy},j={version:1,phase:'prepared',before,after};validateImage(before);validateImage(after);let armed=false;
   try{put(JOURNAL_KEY,JSON.stringify(j));armed=true;applyImage(after);j.phase='committed';put(JOURNAL_KEY,JSON.stringify(j));put(JOURNAL_KEY,null);bound=after.meta;return {changed:true,active:next.active,deleted:false};}
   catch(error){ // Never guess which subset succeeded, or roll back after lock loss.
    const visible=storage.getItem(JOURNAL_KEY)!==null;throw Object.assign(new Error('Save slots: '+(armed||visible?'exchange interrupted. Reload to recover the complete save; all beforeimages are retained. ':'exchange could not start. The live save is unchanged. ')+(error.message||'')),{reloadRequired:armed||visible});
   }
  }
  function select(id){
   check([1,2,3].includes(id),'choose Slot 1, 2 or 3.');assertOwner();const m=read();if(id===m.active)return {changed:false,active:id};const current=snapshot(storage);assertNoPendingSurvey(current);const next=clone(m),incoming=clone(next.slots[id-1].archive);next.slots[m.active-1].archive=current;next.slots[id-1].archive=null;next.active=id;next.revision++;incoming[RESET_KEY]=token();return exchange(next,incoming);
  }
  // Rename only metadata: no canonical bank, archive, journal or generation changes.
  function rename(id,name){
   check([1,2,3].includes(id),'choose Slot 1, 2 or 3.');const clean=PI?.normalizeSlotName(name);check(typeof clean==='string','use a printable slot name of 1–24 characters without controls or bidi marks.');
   assertOwner();const m=read(),before=bound;check(storage.getItem(CLOUD_JOURNAL_KEY)===null,'cloud recovery must finish first.');
   if(m.slots[id-1].name===clean){assertOwner();assertCurrent();return {changed:false,active:m.active,renamedSlot:id};}
   check(m.revision<Number.MAX_SAFE_INTEGER-1,'slot revision is full.');m.slots[id-1].name=clean;m.revision++;const raw=JSON.stringify(validateMeta(m));let attempted=false;
   try{
    assertOwner();assertCurrent();check(storage.getItem(CLOUD_JOURNAL_KEY)===null,'cloud recovery must finish first.');check(storage.getItem(META_KEY)===before,'metadata changed before renaming. Reload before retrying.');
    attempted=true;storage.setItem(META_KEY,raw);check(storage.getItem(META_KEY)===raw,'metadata write could not be verified.');assertOwner();check(storage.getItem(META_KEY)===raw&&storage.getItem(JOURNAL_KEY)===null&&storage.getItem(CLOUD_JOURNAL_KEY)===null,'metadata changed during rename verification.');
    bound=raw;return {changed:true,active:m.active,renamedSlot:id};
   }catch(error){if(!attempted)throw error;paused=true;throw Object.assign(new Error('Save slots: the rename could not be confirmed. Stored metadata may have changed; no rollback is guaranteed. Saving is paused in this tab. Reload to check before retrying. '+(error.message||'')),{reloadRequired:true});}
  }
  function remove(id){
   check([1,2,3].includes(id),'choose Slot 1, 2 or 3.');assertOwner();const m=read(),next=clone(m);next.slots[id-1].generation=token();next.slots[id-1].profileSeen=false;delete next.slots[id-1].name;next.revision++;
   const active=id===m.active,keys=active?empty():snapshot(storage);if(active){assertNoPendingSurvey(snapshot(storage));keys[RESET_KEY]=token()}else next.slots[id-1].archive=empty();return {...exchange(next,keys,id===1),deleted:true,deletedSlot:id};
  }
  return Object.freeze({initialize,recover,read,assertCurrent,confirmProfileWrite,select,rename,delete:remove});
 }
 return Object.freeze({META_KEY,MIGRATION_KEY,JOURNAL_KEY,CLOUD_JOURNAL_KEY,SURVEY_LOCK,PROFILE,RESET_KEY,SESSION_PREFIX,KEYS,sessionKey,snapshot,peek,validateMeta,assertNoPendingSurvey,create});
});
