/* Read-only, runner-owned companion. No game/controller startup, answers, RNG,
 * storage writes, gifts, chat, timers, survey decisions or reward callbacks. */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports,api=factory(root,node?{SS:require('./save-slots'),EP:require('./emerald-progress'),PG:require('./progression'),EC:require('./emerald-conduct'),SR:require('./survey-runner'),RM:require('./emerald-roadmap')}:{SS:root.BOSaveSlots,EP:root.BOEmeraldProgress,PG:root.BOProgress,EC:root.BOEmeraldConduct,SR:root.BOSurveyRunner,RM:root.BOEmeraldRoadmap});if(node)module.exports=api;else root.BOEmeraldSurvey=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root,M){'use strict';
 const PROFILE='danis-table.profile.v1',SETTINGS='danis-table.settings.v1',MAX=4*1024*1024;
 const record=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 function readSnapshot(storage,id,now=Date.now()){try{
  const {SS,EP,PG,EC,SR}=M;if(!SS||!EP||!PG||!EC||!SR||!SS.sessionKey(SS.SESSION_PREFIX+id))return null;
  if(storage.getItem(SS.JOURNAL_KEY)!==null||storage.getItem(SS.CLOUD_JOURNAL_KEY)!==null)return null;
  const keys=[SS.META_KEY,PROFILE,SETTINGS,SS.SESSION_PREFIX+id,EC.KEY],raw=keys.map(k=>storage.getItem(k));
  if(raw.some((v,i)=>v!==null&&(typeof v!=='string'||v.length>(i===0?4*MAX:MAX))))return null;
  if(raw[0]===null||raw[1]===null||raw[3]===null||EC.read(storage,now).active)return null;
  const meta=SS.validateMeta(JSON.parse(raw[0]));if(meta.slots[meta.active-1].profileSeen!==true)return null;
  const profile=JSON.parse(raw[1]),settings=raw[2]===null?{}:JSON.parse(raw[2]);
  if(!record(profile)||!record(profile.progression)||!record(settings))return null;
  const level=profile.progression.level;if(!Number.isInteger(level)||level<39||level>100||!EP.validate(profile.emerald))return null;
  // Validate strict present ledgers using the canonical pure validator. Discard
  // its normalized/default model: only the saved raw level grants presentation.
  PG.normalize(profile.progression);
  if(Object.prototype.hasOwnProperty.call(settings,'motion')&&typeof settings.motion!=='boolean')return null;
  SR.normalizeSession(JSON.parse(raw[3]),id);
  // Double-read exact canonical bytes, including slot/generation and recovery
  // gates; no inactive archive, cached RUN level or newly created default model.
  if(keys.some((k,i)=>storage.getItem(k)!==raw[i])||storage.getItem(SS.JOURNAL_KEY)!==null||storage.getItem(SS.CLOUD_JOURNAL_KEY)!==null)return null;
  return Object.freeze({level,identity:JSON.stringify([meta.active,meta.slots[meta.active-1].generation]),motion:settings.motion===true,progress:Object.freeze(EP.progress(profile.emerald,level))});
 }catch(_){return null}}
 function message(snapshot,question){if(!snapshot||!Number.isInteger(snapshot.level)||snapshot.level<39||snapshot.level>100)return null;return question?.type==='attention'?'Trick Question!!!':'Take your time and read each question carefully.'}
 function render(document,parent,snapshot,question){const line=message(snapshot,question);if(!line||!M.RM)return null;
  const stage=document.createElement('aside');stage.id='emerald-survey-companion';stage.className='emerald-survey-companion';stage.setAttribute('aria-label','Emerald survey companion');
  const details=document.createElement('details'),summary=document.createElement('summary');summary.className='emerald-survey-summary';
  const photo=document.createElement('img');if(typeof root.BOEmeraldAsset==='string'&&root.BOEmeraldAsset.startsWith('data:image/'))photo.src=root.BOEmeraldAsset;photo.alt='Emerald, your green beetle companion';photo.width=snapshot.progress.level>=3?118:98;photo.height=snapshot.progress.level>=3?77:64;photo.draggable=false;
  const label=document.createElement('span');label.className='emerald-survey-level';label.textContent=M.RM.label(snapshot.progress);summary.setAttribute('aria-label',label.textContent+'. Open Emerald’s own level roadmap');summary.append(photo,label);details.appendChild(summary);
  const roadmap=document.createElement('div');roadmap.className='emerald-survey-roadmap';roadmap.innerHTML=M.RM.html(snapshot.progress);details.appendChild(roadmap);stage.appendChild(details);
  const speech=document.createElement('p');speech.className='emerald-survey-speech';speech.textContent=line;if(question?.type==='attention'){speech.id='emerald-survey-trick-warning';speech.setAttribute('role','status')}stage.appendChild(speech);parent.appendChild(stage);return stage;
 }
 return Object.freeze({PROFILE,SETTINGS,readSnapshot,message,render});
});
