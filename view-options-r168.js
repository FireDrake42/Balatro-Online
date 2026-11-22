/* Per-slot presentation preferences; not the Feature Power/economy policy. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOViewOptions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const LEVEL=20, MEMBER='viewOptions';
 const GROUPS=Object.freeze([
  ['Background and extras',{emeraldPanel:'Emerald panel',automaticTips:'Automatic tips',interestGraphs:'Live Interest Graphs',effects:'Motion effects',pets:'Pet Shop catalogue',faucet:'Faucet',faucetCooldown:'Faucet countdown',arcade:'Arcade offers (Games tab)',fpsCounter:'FPS counter',dailyStreak:'Daily Streak'}],
  ['Personalization',{languages:'Languages (off = English)',sound:'Sound',movingMode:'Moving Mode',customImages:'Custom Images',textAppearance:'Text Appearance',basicStyle:'Basic style',lessText:'Less Text'}],
  ['Table and shortcuts',{bank:'Bank',hands:'Hands',discards:'Discards',antes:'Antes',rounds:'Rounds',run:'Run',tools:'Tools',comboLab:'Combo Lab',howToPlay:'How to Play',bossRush:'Boss Rush',resetProgress:'Reset Progress available'}],
  ['Catalogs',{collection:'Collection',achievements:'Achievements',potions:'Potions'}]
 ].map(([title,rows])=>Object.freeze([title,Object.freeze(rows)])));
 const MODES=Object.freeze(['lessText','basicStyle']);
 const KEYS=Object.freeze('emeraldPanel automaticTips interestGraphs effects pets faucet faucetCooldown arcade languages sound movingMode customImages textAppearance resetProgress fpsCounter bank hands discards antes rounds run tools dailyStreak comboLab howToPlay bossRush collection achievements potions'.split(' '));
 const EMPTY=Object.freeze({version:1,off:Object.freeze([]),lessText:false,basicStyle:false});
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k), record=o=>!!o&&typeof o==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
 function fail(){throw new TypeError('Display settings need attention. No saved choices were replaced.');}
 function field(o,k){const d=Object.getOwnPropertyDescriptor(o,k);if(!d||!d.enumerable||!own(d,'value'))fail();return d.value;}
 function read(prefs){
  if(!record(prefs))fail();if(!own(prefs,MEMBER))return EMPTY;
  const v=field(prefs,MEMBER);if(!record(v)||Reflect.ownKeys(v).length!==4||field(v,'version')!==1)fail();
  const off=field(v,'off'),lessText=field(v,'lessText'),basicStyle=field(v,'basicStyle');
  if(typeof lessText!=='boolean'||typeof basicStyle!=='boolean'||!Array.isArray(off)||Object.getPrototypeOf(off)!==Array.prototype||off.length>KEYS.length||Reflect.ownKeys(off).length!==off.length+1)fail();
  const values=[];for(let i=0;i<off.length;i++){const k=field(off,String(i));if(!KEYS.includes(k)||values.includes(k))fail();values.push(k);}
  return Object.freeze({version:1,off:Object.freeze(values),lessText,basicStyle});
 }
 const unlocked=level=>Number.isInteger(level)&&level>=LEVEL&&level<=100;
 function enabled(state,level,key){if(!KEYS.includes(key))throw new TypeError('Unsupported display switch.');return !unlocked(level)||!state.off.includes(key);}
 function selected(state,level,key){return MODES.includes(key)?unlocked(level)&&state[key]:enabled(state,level,key);}
 function change(prefs,key,checked){
  if(typeof checked!=='boolean'||!KEYS.includes(key)&&!MODES.includes(key))fail();
  const v=read(prefs);if(MODES.includes(key)?v[key]===checked:!v.off.includes(key)===checked)return prefs;
  const next=MODES.includes(key)?{...v,[key]:checked}:{...v,off:KEYS.filter(k=>k===key?!checked:v.off.includes(k))};
  return {...prefs,[MEMBER]:next};
 }
 // Writer binds the actual control and original whole-bank witnesses. No async
 // interleave/retry, no economy actions, no derived defaults in the write.
 function commit(port,key,checked){
  let reading=false,attempted=false,unchanged=false,next,expected;
  try{
   port.assert(port.expected,false);reading=true;const before=port.read();
   if(before!==port.expected)return {ok:false,reason:'Settings changed. Reopen the active Settings before trying again.'};
   const base=before===null?{}:JSON.parse(before);next=change(base,key,checked);reading=false;
   if(next===base)return {ok:true,changed:false};
   expected=JSON.stringify(next);port.assert(before,false);reading=true;const current=port.read();reading=false;
   if(current!==before)throw Error('Settings changed before writing. Reopen Settings.');
   attempted=true;let confirmed=false,quota=false;try{confirmed=port.write(next,expected)===true;}catch(error){quota=error?.name==='QuotaExceededError';}
   reading=true;const raw=port.read();reading=false;
   if(!confirmed||raw!==expected){if(quota&&raw===before){port.assert(before,true);reading=true;unchanged=port.read()===before;reading=false;}throw Error(unchanged?'Browser storage is full. The switch was not saved.':'Display setting could not be confirmed.');}
   port.assert(expected,true);reading=true;const durable=port.read();reading=false;
   if(durable!==expected)throw Error('Stored Settings changed during confirmation.');
  }catch(error){return {ok:false,uncertain:reading||error?.viewFenceUncertain===true||attempted&&!unchanged,reason:error.message};}
  try{port.apply(next,expected);}catch(error){return {ok:true,changed:true,refreshRequired:true,reason:error.message};}
  return {ok:true,changed:true};
 }
 function html(state,level,available,disabled=false){if(!unlocked(level))return '';
  const groups=GROUPS.map(([title,rows])=>[title,Object.entries(rows).filter(([key])=>available.includes(key))]).filter(([,rows])=>rows.length);
  return '<section id="view-options" class="bo-view-options" aria-labelledby="view-options-title"><h3 id="view-options-title">Display and extras · Level 20</h3><p class="build-note bo-copy-short">Your save and reward clocks stay active.</p><p class="build-note bo-copy-full">These switches don’t change your saved levels, items or reward clocks. Other features still need their own unlocks. Hiding Arcade offers does not stop started games or verified rewards.</p><div class="bo-view-groups">'+groups.map(([title,rows])=>'<fieldset'+(disabled?' disabled':'')+'><legend>'+title+'</legend>'+rows.map(([key,label])=>'<label><input type="checkbox" data-view-option="'+key+'"'+(selected(state,level,key)?' checked':'')+'><span>'+label+'</span></label>').join('')+'</fieldset>').join('')+'</div><p id="view-options-feedback" class="build-note" role="status" aria-live="polite"></p></section>';
 }
 return Object.freeze({LEVEL,MEMBER,KEYS,MODES,read,unlocked,enabled,selected,change,commit,html});
});
