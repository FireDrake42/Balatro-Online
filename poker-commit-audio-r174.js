/* Presentation only: classify the public before/after pair at the one durable audio leaf.
 * No cards, chips, timers, save state, or transaction authority are owned here.
 */
(function (root) {
  'use strict';
  const count = n => Number.isSafeInteger(n) && n >= 0;
  const length = (a, n) => Array.isArray(a) && a.length === n;
  const dealt = Object.freeze({sample:'card-draw',result:false});
  const redrawn = Object.freeze({sample:'card-draw',result:true});
  const settled = Object.freeze({sample:null,result:true});
  const bet = Object.freeze({sample:'chip-bet',result:false});
  const stack = Object.freeze({sample:'chip-stack',result:false});

  function classify(event) {
    if (!event || event.resumed || event.replayed || event.ok === false || event.committed === false) return null;
    const {game,action,before,after,completed} = event;
    if (typeof completed !== 'boolean' || !count(after?.revision) ||
        !(before === null ? after.revision === 1 : count(before?.revision) && after.revision === before.revision+1)) return null;
    const id = after.roundId, hasRound = typeof id === 'string' && id.startsWith(game+':');
    const sameRound = hasRound && before?.roundId === id;
    if (game === 'poker') {
      if (action === 'draw' && !completed && hasRound && !sameRound &&
          (before === null || ['idle','settled'].includes(before.phase)) && after.phase === 'holding' &&
          length(after.hand,5) && after.deckRemaining === 47) return dealt;
      if (action === 'redraw' && completed && sameRound && before.phase === 'holding' && after.phase === 'settled' &&
          length(after.hand,5) && before.deckRemaining === 47 && count(after.deckRemaining)) {
        // Redraw can settle with all five held; never count the resulting hand as new cards.
        const drawn = before.deckRemaining - after.deckRemaining;
        if (drawn === 0) return settled;
        if (drawn > 0 && drawn <= 5) return redrawn;
      }
      return null; // Existing dedicated hold cue is a separate successful UI action.
    }
    if (game !== 'strict-poker') return null;
    if (action === 'deal' && !completed && hasRound && !sameRound &&
        (before === null || ['idle','settled'].includes(before.phase)) && after.phase === 'playing' &&
        after.street === 'preflop' && length(after.player,2) && length(after.community,0) &&
        after.emerald === null && after.lastAction === null) return dealt; // 2 + 2 hidden, one batch; blinds are not voluntary.
    if (!sameRound || before.phase !== 'playing' || !Array.isArray(before.community) || !Array.isArray(after.community)) return null;
    const from = before.community.length, to = after.community.length;
    const ended = completed && ['settled','match-over'].includes(after.phase);
    if (action === 'reveal') {
      if (before.actor !== 'dealer') return null;
      if (ended && from === 5 && to === 5 && before.street === 'river' && after.street === 'showdown') return settled;
      if (!completed && after.phase === 'playing' &&
          ((from === 0 && to === 3 && before.street === 'preflop' && after.street === 'flop') ||
           (from === 3 && to === 4 && before.street === 'flop' && after.street === 'turn') ||
           (from === 4 && to === 5 && before.street === 'turn' && after.street === 'river'))) return dealt;
      return null;
    }
    if (from !== to || ![0,3,4,5].includes(from) || !['call','raise','fold','emerald'].includes(action)) return null;
    const actor = action === 'emerald' ? 'emerald' : 'player', seat = actor === 'player' ? 0 : 1;
    const last = after.lastAction;
    if (before.actor !== actor || last?.actor !== actor || (action !== 'emerald' && last.type !== action)) return null;
    if (ended && last.type === 'fold' && last.amount === 0) return settled;
    if (completed || after.phase !== 'playing' || !['call','raise'].includes(last.type) || !count(last.amount) || last.amount === 0) return null;
    const debit = last.amount;
    if (![before.stacks,after.stacks,before.streetBets,after.streetBets].every(a=>length(a,2) && count(a[seat])) ||
        before.stacks[seat]-after.stacks[seat] !== debit || after.streetBets[seat]-before.streetBets[seat] !== debit) return null;
    return debit > 500 ? stack : bet;
  }
  root.BOPokerCommitAudio = Object.freeze({classify});
})(typeof window !== 'undefined' ? window : globalThis);
