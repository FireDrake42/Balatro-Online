/* View-only native GS adapter: no rewards, storage, event minting or clock scaling. */
(function(root){'use strict';
 let receipt;const wall=Date.now.bind(Date);
 const multiplier=()=>root.BOGameSpeed.info(receipt,wall()).multiplier;
 function update(state,level,writable){
  receipt=state;const d=root.document;if(!d)return;
  const stack=d.querySelector('#passive-earnings-stack');if(!stack)return;
  let button=d.querySelector('#game-speed-button');
  if(!button){button=d.createElement('button');button.id='game-speed-button';button.type='button';button.dataset.action='game-speed';button.className='game-speed-button';stack.append(button);}
  const info=root.BOGameSpeed.info(receipt,wall()),ms=info.activeRemainingMs||info.cooldownRemainingMs,seconds=Math.ceil(ms/1000),clock=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  button.hidden=level<50;button.disabled=!writable||info.phase!=='ready';button.dataset.phase=info.phase;
  button.textContent=info.phase==='active'?'Game Speed ×1.5 · '+clock:info.phase==='ready'?'Game Speed ×1.5 · Ready':'Game Speed · '+clock;
  button.title='1.5× for 60 seconds, then a 10-minute cooldown. Effects and potion expiry use real time.';
  button.setAttribute('aria-label',button.textContent);
 }
 root.BOGameSpeedPresentation=Object.freeze({update,multiplier});
})(typeof globalThis!=='undefined'?globalThis:this);
