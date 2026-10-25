/* Balatro Online rules engine. Original code; no DOM, network or assets. */
(function (root, factory) {
  'use strict';
  var BO = factory(typeof module === 'object' && module.exports ? require('./potions.js') : root && root.BOPotions, typeof module === 'object' && module.exports ? require('./run-wallet.js') : root && root.BORunWallet, typeof module === 'object' && module.exports ? require('./frenzy.js') : root && root.BOFrenzy, typeof module === 'object' && module.exports ? require('./passive-money.js') : root && root.BOPassiveMoney);
  if (typeof module === 'object' && module.exports) module.exports = BO;
  if (root) root.BO = BO;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Potions, Wallet, Frenzy, PassiveMoney) {
  'use strict';
  // The absent-model fallback only keeps historical vanilla UMD consumers valid.
  // Potion actions require BOPotions, loaded before this engine in the browser.
  var NO_POTIONS={potionId:null,xpMultiplier:1,luckMultiplier:1,cardMult:0,cardChips:0,roundMoney:0,interestDivisor:5,baseCritChance:0,knowledgeXpPerSecond:null,cooldownMultiplier:1,daylightMult:0,planetBonusLevels:0,allSuits:false,bossDisableChance:0,handSizeBonus:0,xpCostMultiplier:1,gamingHP:null,scoringDurationMultiplier:1};
  // Optional Frenzy is strict even on legacy actions. Validate before atomic's
  // JSON clone so it cannot silently erase forged fields, accessors or undefined.
  function validateFrenzy(s) {
    if(!s||!('frenzy' in s))return;
    var d=Object.getOwnPropertyDescriptor(s,'frenzy');
    check(d&&d.enumerable&&Object.prototype.hasOwnProperty.call(d,'value'),'Invalid optional Frenzy state.');
    check(Frenzy,'Load the Frenzy model before the engine.');Frenzy.validate(d.value);
  }
  // Passive Money is optional, strict run data. Inspect before cloning can erase
  // forged fields or execute accessors. Ordinary native actions never pay it.
  function validatePassiveMoney(s) {
    if(!s||!('passiveMoney' in s))return;
    var d=Object.getOwnPropertyDescriptor(s,'passiveMoney');
    check(d&&d.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&d.value!==undefined&&PassiveMoney&&PassiveMoney.validate(d.value)===true,'Passive Money save needs attention. No balance was changed.');
  }
  // Retired Wallet metadata is validation-only: never grant, spend or rewrite it.
  // Validate its wrapper before JSON cloning can execute a getter or drop a field.
  function validateLegacyWallet(s) {
    if(!s||!('wallet' in s))return;
    var d=Object.getOwnPropertyDescriptor(s,'wallet');
    check(d&&d.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&Wallet&&Wallet.validate(d.value),'Wallet save needs attention. No balance was changed.');
  }
  function frenzyInfo(s,actualLevel,now) {check(Frenzy,'Load the Frenzy model before the engine.');validateFrenzy(s);return Frenzy.info(s?s.frenzy:undefined,actualLevel,now);}
  function commitFrenzy(s,context,scoringTriggers,scoringCards) {
    var next=Frenzy.commit(s.frenzy,context.actualLevel,context.now,scoringTriggers),receipt=next.receipt;
    if(scoringTriggers>0)s.frenzy=next.state;
    receipt.activationCardId=null;
    if(receipt.activationTrigger!==null){var row=scoringCards.find(function(c){return receipt.activationTrigger>=c.firstTrigger&&receipt.activationTrigger<c.firstTrigger+c.triggers;});receipt.activationCardId=row?row.cardId:null;}
    return receipt;
  }
  function potionEffects(s) {return s&&s.potions&&Potions?Potions.effectsAt(s.potions,s.potionNow===undefined?0:s.potionNow):NO_POTIONS;}
  function potionEligible(s) {return s.progressionEnabled===true&&Number.isInteger(s.playerLevel)&&s.playerLevel>=12&&s.playerLevel<=100;}
  function potionBossSuppressed(s) {
    var source=s.potionBossDisable,e=s.potions&&Potions&&Potions.current(s.potions,s.potionNow===undefined?0:s.potionNow);
    return !!(source&&source.success&&s.phase==='play'&&s.blindIndex===2&&source.round===s.round&&source.bossId===s.bossId&&e&&Potions.hasEffect(e,'boss_disabler')&&e.uid===source.uid);
  }
  var SUITS = ['S', 'H', 'D', 'C'];
  var SUIT_NAMES = {S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs'};
  var RANK_NAMES = {11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace'};
  var HANDS = {
    high: ['High Card', 5, 1, 10, 1], pair: ['Pair', 10, 2, 15, 1],
    two_pair: ['Two Pair', 20, 2, 20, 1], three: ['Three of a Kind', 30, 3, 20, 2],
    straight: ['Straight', 30, 4, 30, 3], flush: ['Flush', 35, 4, 15, 2],
    full_house: ['Full House', 40, 4, 25, 2], four: ['Four of a Kind', 60, 7, 30, 3],
    straight_flush: ['Straight Flush', 100, 8, 40, 4], five: ['Five of a Kind', 120, 12, 35, 3],
    flush_house: ['Flush House', 140, 14, 40, 4], flush_five: ['Flush Five', 160, 16, 50, 3],
    double_triple: ['Double-Triple of a Kind', 120, 10, 20, 4], six: ['Six of a Kind', 150, 10, 30, 3]
  };
  var ENHANCEMENTS = {
    bonus: 'Bonus: +30 Chips when scored.', mult: 'Mult: +4 Mult when scored.',
    wild: 'Wild: counts as every suit, but retains its rank.',
    glass: 'Glass: X2 Mult when scored; 1 in 4 chance to break after the hand.',
    steel: 'Steel: X1.5 Mult while held in hand.',
    stone: 'Stone: +50 Chips; no rank or suit; always scores when played.',
    gold: 'Gold: $3 if held at the end of a winning round.',
    lucky: 'Lucky: independent 1 in 5 chance for +20 Mult and 1 in 15 chance for $20 each scoring trigger.'
  };
  var EDITIONS = {foil: 'Foil: +50 Chips when scored.', holo: 'Holographic: +10 Mult when scored.', poly: 'Polychrome: X1.5 Mult when scored.', negative: 'Negative: +1 inventory slot for this item.'};
  var SEALS = {red: 'Red Seal: retriggers this card once, including held-in-hand effects.', blue: 'Blue Seal: creates the Planet for the last played hand when held at round end, if there is room.', gold: 'Gold Seal: earns $3 each time this card scores.', purple: 'Purple Seal: creates a random Tarot when discarded, if there is room.'};
  // Vanilla cumulative stakes / Ante 1-8 tables:
  // https://balatrowiki.org/w/Stakes and /w/Blinds_and_Antes#List_of_Antes
  var STAKE_TARGETS = [
    [300,800,2000,5000,11000,20000,35000,50000],
    [300,900,2600,8000,20000,36000,60000,100000],
    [300,1000,3200,9000,25000,60000,110000,200000]
  ];
  var stakes = [
    ['white','White Stake','#eeeeee','Base difficulty.'],
    ['red','Red Stake','#dd554d','Small Blinds give no reward money; unused hands and interest still pay.'],
    ['green','Green Stake','#5aa574','Required scores scale faster each Ante.'],
    ['black','Black Stake','#555563','Shop and Buffoon Jokers can be Eternal: cannot be sold or destroyed.'],
    ['blue','Blue Stake','#5597ee','-1 discard every round.'],
    ['purple','Purple Stake','#a678d6','Required scores scale faster again each Ante.'],
    ['orange','Orange Stake','#ee9548','Shop and Buffoon Jokers can be Perishable: debuffed after 5 winning rounds.'],
    ['gold','Gold Stake','#e4bd44','Shop and Buffoon Jokers can be Rental: cost $1 up front and $3 at each round end.'],
    ['sapphire','Sapphire Stake','#63aaf4','All Gold rules; required scores are 20% higher. Unlocks at player Level 29.'],
    ['obsidian','Obsidian Stake','#464055','All Gold rules; required scores are 50% higher and -1 hand each round. Unlocks at player Level 29.']
  ].map(function(d,i){return {id:d[0],name:d[1],colour:d[2],description:d[3],index:i,smallBlindReward:i>=1?0:3,discardPenalty:i>=4?1:0,eternal:i>=3,perishable:i>=6,rental:i>=7,anteTargets:STAKE_TARGETS[i>=5?2:i>=2?1:0].slice()};});
  stakes.slice(8).forEach(function(d){d.anteTargets=d.anteTargets.map(function(n){return Math.ceil(n*(d.index===8?1.2:1.5));});d.handPenalty=d.index===9?1:0;d.unlockLevel=29;});
  var stakeById={};stakes.forEach(function(d){stakeById[d.id]=d;});
  function runStake(s) {return Object.prototype.hasOwnProperty.call(stakeById,s.stake)?stakeById[s.stake]:stakes[0];} // Pre-stake saves are White.
  var decks = [
    ['red', 'Red Deck', '#dd554d', '+1 discard every round.'], ['blue', 'Blue Deck', '#5597ee', '+1 hand every round.'],
    ['yellow', 'Yellow Deck', '#e4bd44', 'Start with $10 extra.'], ['green', 'Green Deck', '#5aa574', 'No interest. At cashout, earn $2 per remaining hand and $1 per remaining discard.'],
    ['black', 'Black Deck', '#555563', '+1 Joker slot; -1 hand every round.'], ['magic', 'Magic Deck', '#a678d6', 'Start with Crystal Ball and two copies of The Fool.'],
    ['nebula', 'Nebula Deck', '#547cbb', 'Start with Telescope; -1 consumable slot.'], ['ghost', 'Ghost Deck', '#bac8cb', 'Spectral cards may appear in the shop. Start with Hex.'],
    ['abandoned', 'Abandoned Deck', '#ad8d68', 'Start with 40 cards: no Jacks, Queens or Kings.'], ['checkered', 'Checkered Deck', '#9daab7', 'Start with 26 Spades and 26 Hearts.'],
    ['zodiac', 'Zodiac Deck', '#b68ac9', 'Start with Tarot Merchant, Planet Merchant and Overstock.'], ['painted', 'Painted Deck', '#d79081', '+2 hand size; -1 Joker slot.'],
    ['anaglyph', 'Anaglyph Deck', '#6cb7ba', 'Gain a Double Tag after each Boss Blind.'], ['plasma', 'Plasma Deck', '#9b8bdd', 'Balance Chips and Mult to their average before multiplication. Blind requirements are doubled.'],
    ['erratic', 'Erratic Deck', '#bbab79', 'Starting ranks and suits are randomized by the saved seed.'],
    ['copper','Copper Deck','#bd8b61','Earn $2 extra at every winning round cashout.'],
    ['scholar','Scholar Deck','#718fd9','Every poker hand starts at Level 2.'],
    ['twilight','Twilight Deck','#a18bd5','+1 hand size and +1 consumable slot.'],
    ['prism','Prism Deck','#76cfc6','All 52 starting cards are Wild: they count as every suit.'],
    ['sprout','Sprout Deck','#86b66c','All starting ranks 2–5 are Bonus cards: +30 Chips when scored.']
  ].map(function (d) { return {id: d[0], name: d[1], colour: d[2], description: d[3]}; });
  decks.slice(15).forEach(function(d){d.unlockLevel=29;});
  var jokers = [];
  function J(id, name, rarity, price, description) { jokers.push({id: id, name: name, rarity: rarity, price: price, description: description}); }
  J('joker', 'Joker', 'common', 2, '+4 Mult.');
  [['greedy_joker','Greedy Joker','D'],['lusty_joker','Lusty Joker','H'],['wrathful_joker','Wrathful Joker','S'],['gluttonous_joker','Gluttonous Joker','C']].forEach(function (x) { J(x[0], x[1], 'common', 5, '+3 Mult for each scoring '+SUIT_NAMES[x[2]]+' card.'); });
  [['jolly_joker','Jolly Joker','Pair',8],['zany_joker','Zany Joker','Three of a Kind',12],['mad_joker','Mad Joker','Two Pair',10],['crazy_joker','Crazy Joker','Straight',12],['droll_joker','Droll Joker','Flush',10]].forEach(function (x) { J(x[0], x[1], 'common', 4, '+'+x[3]+' Mult if played hand contains '+x[2]+'.'); });
  [['sly_joker','Sly Joker','Pair',50],['wily_joker','Wily Joker','Three of a Kind',100],['clever_joker','Clever Joker','Two Pair',80],['devious_joker','Devious Joker','Straight',100],['crafty_joker','Crafty Joker','Flush',80]].forEach(function (x) { J(x[0], x[1], 'common', 4, '+'+x[3]+' Chips if played hand contains '+x[2]+'.'); });
  J('half_joker','Half Joker','common',5,'+20 Mult if 3 or fewer cards are played.');
  J('joker_stencil','Joker Stencil','uncommon',8,'X1 Mult for each empty Joker slot; Joker Stencils also count as empty. Minimum X1.');
  J('four_fingers','Four Fingers','uncommon',7,'Flushes and Straights can be made with 4 cards.');
  J('mime','Mime','uncommon',5,'Retrigger all held-in-hand card effects once.');
  J('credit_card','Credit Card','common',1,'Purchases may put you up to $20 in debt.');
  J('banner','Banner','common',5,'+30 Chips for each remaining discard.');
  J('mystic_summit','Mystic Summit','common',5,'+15 Mult when no discards remain.');
  J('loyalty_card','Loyalty Card','uncommon',5,'X4 Mult every sixth hand played while owned.');
  J('eight_ball','8 Ball','common',5,'Each scoring 8 has a 1 in 4 chance to create a Tarot, if there is room.');
  J('misprint','Misprint','common',4,'Random +0 to +23 Mult each hand, using the saved random stream.');
  J('raised_fist','Raised Fist','common',5,'The rightmost lowest-ranked card held in hand adds twice its rank chip value to Mult on each held trigger. Ace ranks high.');
  J('chaos_the_clown','Chaos the Clown','common',4,'One free shop reroll each shop, per copy.');
  J('fibonacci','Fibonacci','uncommon',8,'Each scoring Ace, 2, 3, 5 or 8 gives +8 Mult.');
  J('steel_joker','Steel Joker','uncommon',7,'X1 Mult plus X0.2 for every Steel card in your full deck.');
  J('scary_face','Scary Face','common',4,'Each scoring face card gives +30 Chips.');
  J('abstract_joker','Abstract Joker','common',4,'+3 Mult for each owned Joker, including this one.');
  J('delayed_gratification','Delayed Gratification','common',4,'If no discards were used this round, earn $2 per remaining discard at cashout.');
  J('hack','Hack','uncommon',6,'Retrigger each scoring 2, 3, 4 and 5 once.');
  J('pareidolia','Pareidolia','uncommon',5,'All ranked cards are considered face cards. Stone cards have no rank.');
  J('gros_michel','Gros Michel','common',5,'+15 Mult. 1 in 6 chance to be destroyed at round end; then Cavendish can appear.');
  J('even_steven','Even Steven','common',4,'Each scoring 2, 4, 6, 8 or 10 gives +4 Mult.');
  J('odd_todd','Odd Todd','common',4,'Each scoring Ace, 3, 5, 7 or 9 gives +31 Chips.');
  J('scholar','Scholar','common',4,'Each scoring Ace gives +20 Chips and +4 Mult.');
  J('business_card','Business Card','common',4,'Each scoring face card has a 1 in 2 chance to earn $2.');
  J('supernova','Supernova','common',5,'Add the number of times this poker hand has been played this run to Mult, including the current hand.');
  J('ride_the_bus','Ride the Bus','common',6,'Gain +1 Mult per consecutive hand without a scoring face card. Resets when a face card scores.');
  J('space_joker','Space Joker','uncommon',5,'1 in 4 chance to level up the played poker hand before scoring.');
  J('egg','Egg','common',4,'Gain $3 extra sell value at each round end.');
  J('burglar','Burglar','uncommon',6,'At the start of each Blind, gain +3 hands and lose all discards.');
  J('blackboard','Blackboard','uncommon',6,'X3 Mult if every card held in hand is a Spade or Club. Wild counts as black; Stone does not.');
  J('runner','Runner','common',5,'Gains +15 Chips when played hand contains a Straight. Starts at +0 Chips.');
  J('ice_cream','Ice Cream','common',5,'Starts at +100 Chips; loses 5 Chips after each played hand. Disappears at 0.');
  J('dna','DNA','rare',8,'If first hand of the round is a single card, permanently copy that card into your hand.');
  J('splash','Splash','common',3,'Every played card counts in scoring, not only the poker hand.');
  J('blue_joker','Blue Joker','common',5,'+2 Chips per card remaining in the draw pile.');
  J('sixth_sense','Sixth Sense','uncommon',6,'If first hand is a single 6, destroy it and create a Spectral card if there is room.');
  J('constellation','Constellation','uncommon',6,'Starts at X1 Mult; gains X0.1 whenever you use a Planet.');
  J('hiker','Hiker','uncommon',5,'Every scoring card permanently gains +5 Chips each time it triggers.');
  J('faceless_joker','Faceless Joker','common',4,'Earn $5 when discarding at least 3 face cards together.');
  J('green_joker','Green Joker','common',4,'Gain +1 Mult per played hand; lose 1 Mult per discard action. Cannot go below 0.');
  J('superposition','Superposition','common',4,'Create a Tarot if the played hand contains a Straight and an Ace, if there is room.');
  J('to_do_list','To Do List','common',4,'Earn $4 when the specified hand is played. Target changes after each round. Inspect targetHand.');
  J('cavendish','Cavendish','common',4,'X3 Mult. 1 in 1000 chance to be destroyed at round end. Only available after Gros Michel goes extinct.');
  J('card_sharp','Card Sharp','uncommon',6,'X3 Mult if this poker hand was already played this round.');
  J('red_card','Red Card','common',5,'Gain +3 Mult whenever you skip the remaining choices in a Booster Pack.');
  J('madness','Madness','uncommon',7,'At Small/Big Blind start, gains X0.5 Mult and destroys a random other Joker if one exists. Starts at X1.');
  J('square_joker','Square Joker','common',4,'Gain +4 Chips whenever exactly 4 cards are played.');
  J('seance','Séance','uncommon',6,'Create a Spectral card when a Straight Flush is played, if there is room.');
  J('riff_raff','Riff-Raff','common',6,'At Blind start, create up to 2 Common Jokers if there is room.');
  J('vampire','Vampire','uncommon',7,'Before scoring, remove enhancements from scoring cards. Gain X0.1 Mult per enhancement removed; starts at X1.');
  J('shortcut','Shortcut','uncommon',7,'Straights may contain gaps of one rank (for example 2, 4, 6, 8, 10).');
  J('hologram','Hologram','uncommon',7,'Starts at X1 Mult; gains X0.25 each time a playing card is added to your deck.');
  J('vagabond','Vagabond','rare',8,'Create a Tarot when a hand is played with $4 or less, if there is room.');
  J('baron','Baron','rare',8,'Each King held in hand gives X1.5 Mult.');
  J('cloud_nine','Cloud 9','uncommon',7,'Earn $1 per 9 in your full deck at round end.');
  J('rocket','Rocket','uncommon',6,'Earn $1 at round end; payout grows by $2 after each Boss Blind.');
  J('midas_mask','Midas Mask','uncommon',7,'Before scoring, turn all scoring face cards into Gold cards.');
  J('luchador','Luchador','uncommon',5,'Sell during a Boss Blind to disable its effect for this Blind.');
  J('photograph','Photograph','common',5,'The first scoring face card gives X2 Mult each time it triggers.');
  J('gift_card','Gift Card','uncommon',6,'At round end, all Jokers and consumables gain $1 extra sell value.');
  J('turtle_bean','Turtle Bean','uncommon',6,'Starts at +5 hand size, losing 1 after each round. Disappears at 0.');
  J('erosion','Erosion','uncommon',6,'+4 Mult per card below your starting deck size.');
  J('reserved_parking','Reserved Parking','common',6,'Each face card held in hand has a 1 in 2 chance to earn $1 on each held trigger.');
  J('mail_in_rebate','Mail-In Rebate','common',4,'Earn $5 per discarded card of its target rank. Rank changes after each round. Inspect targetRank.');
  J('to_the_moon','To the Moon','uncommon',5,'Double the normal capped interest payout (each copy adds another normal payout). Does not override Green Deck.');
  J('hallucination','Hallucination','common',4,'1 in 2 chance to create a Tarot when opening a Booster Pack, if there is room.');
  J('fortune_teller','Fortune Teller','common',6,'+1 Mult for every Tarot used this run.');
  J('juggler','Juggler','common',4,'+1 hand size.');
  J('drunkard','Drunkard','common',4,'+1 discard each round.');
  J('stone_joker','Stone Joker','uncommon',6,'+25 Chips for every Stone card in your full deck.');
  J('golden_joker','Golden Joker','common',6,'Earn $4 at round end.');
  J('lucky_cat','Lucky Cat','uncommon',6,'Starts at X1 Mult; gains X0.25 whenever a Lucky card successfully triggers either reward.');
  J('baseball_card','Baseball Card','rare',8,'Each owned Uncommon Joker gives X1.5 Mult after its own scoring effect.');
  J('bull','Bull','uncommon',6,'+2 Chips per dollar you have; debt grants no Chips.');
  J('diet_cola','Diet Cola','uncommon',6,'Selling this Joker grants a Double Tag.');
  J('trading_card','Trading Card','uncommon',6,'If the first discard of the round contains exactly 1 card, destroy it and earn $3.');
  J('flash_card','Flash Card','uncommon',5,'Gain +2 Mult every time you reroll the shop.');
  J('popcorn','Popcorn','common',5,'Starts at +20 Mult; loses 4 Mult after each round. Disappears at 0.');
  J('spare_trousers','Spare Trousers','uncommon',6,'Gain +2 Mult whenever played hand contains Two Pair.');
  J('ramen','Ramen','uncommon',6,'Starts at X2 Mult; loses X0.01 per discarded card. Disappears at X1.');
  J('walkie_talkie','Walkie Talkie','common',4,'Each scoring 10 or 4 gives +10 Chips and +4 Mult.');
  J('seltzer','Seltzer','uncommon',6,'Retrigger every scoring card once for 10 played hands, then disappears.');
  J('castle','Castle','uncommon',6,'Gain +3 Chips per discarded card of its target suit. Suit changes each round. Inspect targetSuit.');
  J('smiley_face','Smiley Face','common',4,'Each scoring face card gives +5 Mult.');
  J('campfire','Campfire','rare',9,'Starts at X1 Mult; gains X0.25 per sold card/Joker/consumable. Resets after defeating a Boss Blind.');
  J('golden_ticket','Golden Ticket','common',5,'Each scoring Gold card earns $4.');
  J('mr_bones','Mr. Bones','uncommon',5,'Prevents death if at least 25% of the Blind target was scored. Self-destructs and allows cashout.');
  J('acrobat','Acrobat','uncommon',6,'X3 Mult on the last hand of the round.');
  J('sock_and_buskin','Sock and Buskin','uncommon',6,'Retrigger all scoring face cards once.');
  J('swashbuckler','Swashbuckler','common',4,'Add the total sell value of all other Jokers to Mult.');
  J('troubadour','Troubadour','uncommon',6,'+2 hand size; -1 hand each round.');
  J('certificate','Certificate','uncommon',6,'At Blind start, add a random playing card with a random Seal to your hand.');
  J('smeared_joker','Smeared Joker','uncommon',7,'Hearts and Diamonds count as the same suit; Spades and Clubs count as the same suit.');
  J('throwback','Throwback','uncommon',6,'X1 Mult plus X0.25 per Blind skipped this run.');
  J('hanging_chad','Hanging Chad','common',4,'Retrigger the first scoring card twice.');
  J('rough_gem','Rough Gem','uncommon',7,'Each scoring Diamond earns $1.');
  J('bloodstone','Bloodstone','uncommon',7,'Each scoring Heart has a 1 in 2 chance to give X1.5 Mult.');
  J('arrowhead','Arrowhead','uncommon',7,'Each scoring Spade gives +50 Chips.');
  J('onyx_agate','Onyx Agate','uncommon',7,'Each scoring Club gives +7 Mult.');
  J('glass_joker','Glass Joker','uncommon',6,'Starts at X1 Mult; gains X0.75 for every Glass card destroyed.');
  J('showman','Showman','uncommon',5,'Duplicate Jokers and consumables may appear in shops and packs.');
  J('flower_pot','Flower Pot','uncommon',6,'X3 Mult if scoring cards can supply all four suits. Each Wild card supplies one missing suit.');
  J('wee_joker','Wee Joker','rare',8,'Gain +8 Chips whenever a 2 scores.');
  J('merry_andy','Merry Andy','uncommon',7,'+3 discards each round; -1 hand size.');
  J('oops_all_sixes','Oops! All 6s','uncommon',4,'Double every listed probability. Multiple copies stack; probabilities cap at 100%.');
  J('seeing_double','Seeing Double','uncommon',6,'X2 Mult if scoring cards include a Club and a card of another suit. Requires two different cards.');
  J('hit_the_road','Hit the Road','rare',8,'Gain X0.5 Mult per discarded Jack this round. Starts at X1 and resets each round.');
  [['the_duo','The Duo','Pair',2],['the_trio','The Trio','Three of a Kind',3],['the_family','The Family','Four of a Kind',4],['the_order','The Order','Straight',3],['the_tribe','The Tribe','Flush',2]].forEach(function (x) { J(x[0],x[1],'rare',8,'X'+x[3]+' Mult if played hand contains '+x[2]+'.'); });
  J('stuntman','Stuntman','rare',7,'+250 Chips; -2 hand size.');
  J('satellite','Satellite','uncommon',6,'Earn $1 per unique Planet type used this run at round end.');
  J('shoot_the_moon','Shoot the Moon','common',5,'Each Queen held in hand gives +13 Mult.');
  J('drivers_license',"Driver's License",'rare',7,'X3 Mult if at least 16 playing cards in your deck are enhanced.');
  J('cartomancer','Cartomancer','uncommon',6,'Create a Tarot at Blind start if there is room.');
  J('astronomer','Astronomer','uncommon',8,'Planet cards and Celestial Packs in the shop are free.');
  J('burnt_joker','Burnt Joker','rare',8,'Level up the poker hand of the first discard each round.');
  J('bootstraps','Bootstraps','uncommon',7,'+2 Mult for each $5 you have; debt grants no Mult.');
  J('canio','Canio','legendary',20,'Starts at X1 Mult; gains X1 when a face card is destroyed.');
  J('triboulet','Triboulet','legendary',20,'Each scoring King or Queen gives X2 Mult.');
  J('yorick','Yorick','legendary',20,'Starts at X1 Mult; gains X1 for every 23 cards discarded while owned.');
  J('chicot','Chicot','legendary',20,'Disables every Boss Blind while owned.');
  J('perkeo','Perkeo','legendary',20,'When leaving the shop, create a Negative copy of a random held consumable. Negative copies grant their own slot.');
  J('ceremonial_dagger','Ceremonial Dagger','uncommon',6,'At Blind start, destroy the Joker immediately to its right and permanently add twice that Joker\'s sell value to Mult.');
  J('marble_joker','Marble Joker','uncommon',6,'At Blind start, permanently add a Stone card to the shuffled draw pile.');
  J('dusk','Dusk','uncommon',5,'Retrigger all scoring cards once on the final hand of the round.');
  J('ancient_joker','Ancient Joker','rare',8,'Each scoring card of its target suit gives X1.5 Mult. Suit changes after each round; inspect targetSuit.');
  J('obelisk','Obelisk','rare',8,'Starts at X1 Mult. Gain X0.2 per consecutive hand that is not tied for your most-played hand before playing; resets to X1 when you play a most-played hand.');
  J('the_idol','The Idol','uncommon',6,'Scoring cards of the target rank and suit each give X2 Mult. Target is chosen from ranked cards in your deck after each round; inspect targetRank and targetSuit.');
  J('matador','Matador','uncommon',7,'Earn $8 when a would-score card is debuffed by a Boss, the Boss blocks this hand, The Arm lowers its level, The Flint halves base score, or The Ox takes money. The Hook, The Tooth, face-down effects and large targets do not trigger it.');
  J('invisible_joker','Invisible Joker','rare',8,'After 2 winning rounds, sell to duplicate a random other Joker if there is room. Negative edition is not copied.');
  // Compatibility lists: https://balatrowiki.org/w/Eternal and /w/Perishable
  var NO_ETERNAL=['gros_michel','ice_cream','cavendish','luchador','turtle_bean','diet_cola','popcorn','ramen','seltzer','mr_bones','invisible_joker','mothim'];
  var NO_PERISHABLE=['ceremonial_dagger','ride_the_bus','runner','constellation','green_joker','red_card','madness','square_joker','vampire','hologram','rocket','obelisk','lucky_cat','flash_card','spare_trousers','castle','glass_joker','wee_joker','venipede_joker','mantis'];
  // Released only after all 43 direct copy-event acceptance groups passed.
  J('blueprint','Blueprint','rare',10,'Copies compatible abilities of the Joker immediately to the right. Keeps its own edition, rarity and stickers; never copies private counter growth.');
  J('brainstorm','Brainstorm','rare',10,'Copies compatible abilities of the physical leftmost Joker. Keeps its own edition, rarity and stickers; self-copy and loops have no effect.');
  // Coin prices are one-time profile unlocks, NOT run money or free ownership.
  // Native150 retain their order and original acquisition pool/distributions.
  [
    ['big_spender','The Big Spender','uncommon',6,500,'Adds +1 Mult per $5 of current debt, rounded down. Checks money live; nonnegative money gives +0.'],
    ['krillistic','Krillionistic','rare',8,2000,'Starts at +0 Chips. Each scoring rank 10 or rank 3 permanently adds +10 Chips per trigger, including retriggers. Stone and debuffed cards do not count. Copies score the current Chips without extra growth.'],
    ['double_green_joker','The Double Green Joker','uncommon',6,1000,'Starts at +0 Mult. Gain +2 per played hand; lose 2 per discard action, minimum 0. Copies score current Mult without extra growth.'],
    ['triplet_rhythm','Triplet Rhythm','uncommon',6,200,'X3 Mult only when exactly 3 cards are played and all are rank 3. Stone cards have no rank. Applies in the independent Joker phase.'],
    ['critical_joker','Critical Joker','rare',8,1000,'Each actual scoring-card trigger has a 1 in 25 chance to CRIT for X2 current Mult. Retriggers and compatible copies roll separately; listed probability modifiers apply.'],
    ['royal_joker','Royal Joker','rare',8,2000,'+30 Mult if the actual played hand contains all five ranks 10, Jack, Queen, King and Ace of one effective suit (Royal Flush). Wild and suit modifiers apply; Stone has no rank or suit.'],
    ['dragon','Dragon','rare',8,5000,'+400 Chips if the actual played hand contains all five ranks 10, Jack, Queen, King and Ace of one effective suit (Royal Flush). Wild and suit modifiers apply; Stone has no rank or suit.'],
    ['venipede_joker','Venipede Joker','uncommon',6,1000,'Starts at +0 Mult. Each scored rank 5 permanently adds +2 Mult per trigger, including retriggers. Stone and debuffed cards do not count. Copies score the current Mult without extra growth.'],
    ['mantis','Mantis','common',4,500,'Starts at +0 Chips. Each scored rank 6 permanently adds +6 Chips per trigger, including retriggers. Stone and debuffed cards do not count. Copies score the current Chips without extra growth.'],
    ['mothim','Mothim','rare',8,1000,'Starts with 3 HP. Manually attack an active Boss Blind during play: spend 1 HP to disable its ability for this Blind, not defeat it. At 0 HP, sell normally for its sell value. Cannot be Eternal or copied by Blueprint/Brainstorm.'],
    ['big_credit_card','The Big Credit Card','uncommon',6,500,'Purchases may put you up to $100 in total debt. Does not stack with itself or Credit Card.'],
    ['exp_joker','The Exp Joker','common',4,100,'All XP gains X1.2 while this physical owned Joker is active. Physical copies stack; Blueprint/Brainstorm cannot copy it. Compound interest keeps its actual XP/sec cap.']
  ].forEach(function(d){J(d[0],d[1],d[2],d[3],d[5]);var j=jokers[jokers.length-1];j.requiresCoinUnlock=true;j.unlockCoins=d[4];});
  var jokerById = {}; jokers.forEach(function (j) {j.eternalCompatible=NO_ETERNAL.indexOf(j.id)<0;j.perishableCompatible=NO_PERISHABLE.indexOf(j.id)<0;jokerById[j.id]=j;});
  // Explicit native150 partition plus eleven manifested coin extensions. Unknown future IDs are not
  // copyable. See COPY-JOKER-DESIGN.md for rules, sources and qualified limits.
  // Integration policies (not claims of unverified vanilla microtiming): captured
  // start topology + survivor guards; pre-score, physical-order Vagabond slot
  // competition; live same-event Perkeo selection pool; established frozen native
  // Loyalty clock on blocked/debuffed hands; synchronous round-end fresh Mime
  // bindings (no interactive animation/repositioning window added).
  var COPY_INCOMPATIBLE=('four_fingers credit_card chaos_the_clown delayed_gratification pareidolia egg splash sixth_sense shortcut cloud_nine rocket midas_mask gift_card turtle_bean to_the_moon juggler drunkard golden_joker trading_card mr_bones troubadour smeared_joker showman merry_andy oops_all_sixes invisible_joker satellite astronomer chicot mothim big_credit_card exp_joker').split(' ');
  var COPY_INDEPENDENT=('joker jolly_joker zany_joker mad_joker crazy_joker droll_joker sly_joker wily_joker clever_joker devious_joker crafty_joker half_joker joker_stencil banner mystic_summit loyalty_card misprint steel_joker abstract_joker gros_michel supernova ride_the_bus blackboard runner ice_cream blue_joker constellation green_joker cavendish card_sharp red_card madness square_joker vampire hologram erosion fortune_teller stone_joker lucky_cat bull flash_card popcorn spare_trousers ramen castle campfire acrobat swashbuckler throwback glass_joker flower_pot wee_joker seeing_double hit_the_road the_duo the_trio the_family the_order the_tribe stuntman drivers_license bootstraps canio yorick ceremonial_dagger obelisk').split(' ');
  var COPY_COIN_INDEPENDENT=['big_spender','krillistic','double_green_joker','triplet_rhythm','royal_joker','dragon','venipede_joker','mantis'];
  var COPY_EVENTS={
    onPlay:('space_joker dna to_do_list vagabond').split(' '),
    scored:('greedy_joker lusty_joker wrathful_joker gluttonous_joker eight_ball fibonacci scary_face even_steven odd_todd scholar business_card hiker photograph walkie_talkie smiley_face golden_ticket rough_gem bloodstone arrowhead onyx_agate triboulet ancient_joker the_idol critical_joker').split(' '),
    playedRetrigger:('hack sock_and_buskin hanging_chad seltzer dusk').split(' '),
    held:('raised_fist baron shoot_the_moon reserved_parking').split(' '),
    heldRetrigger:['mime'],roundEnd:['mime'],
    blindStart:('burglar marble_joker riff_raff cartomancer certificate').split(' '),
    discard:('faceless_joker mail_in_rebate burnt_joker').split(' '),
    packOpen:['hallucination'],shopExit:['perkeo'],soldSelf:['luchador','diet_cola'],baseball:['baseball_card'],
    independent:COPY_INDEPENDENT.concat(['superposition','seance','matador'],COPY_COIN_INDEPENDENT)
  };
  var COPY_COMPATIBILITY={};
  COPY_INCOMPATIBLE.forEach(function(id){COPY_COMPATIBILITY[id]={kind:'incompatible',events:[]};});
  COPY_INDEPENDENT.concat(COPY_COIN_INDEPENDENT).forEach(function(id){COPY_COMPATIBILITY[id]={kind:'independent',events:[]};});
  ['blueprint','brainstorm'].forEach(function(id){COPY_COMPATIBILITY[id]={kind:'chain',events:[]};});
  Object.keys(COPY_EVENTS).forEach(function(event){COPY_EVENTS[event].forEach(function(id){if(!COPY_COMPATIBILITY[id])COPY_COMPATIBILITY[id]={kind:'contextual',events:[]};COPY_COMPATIBILITY[id].events.push(event);});});
  var planets = [
    ['pluto','Pluto','high'],['mercury','Mercury','pair'],['uranus','Uranus','two_pair'],['venus','Venus','three'],
    ['saturn','Saturn','straight'],['jupiter','Jupiter','flush'],['earth','Earth','full_house'],['mars','Mars','four'],
    ['neptune','Neptune','straight_flush'],['planet_x','Planet X','five'],['ceres','Ceres','flush_house'],['eris','Eris','flush_five'],
    ['venus_rock','Venus Rock','double_triple'],['planet_y','Planet Y','six']
  ].map(function (p) { var h=HANDS[p[2]]; return {id:p[0], name:p[1], type:'planet', hand:p[2], price:3, description:'Level up '+h[0]+': +'+h[3]+' Chips and +'+h[4]+' Mult permanently.'}; });
  var tarots = [
    ['fool','The Fool','Create the last Tarot or Planet used this run, except The Fool.'],
    ['magician','The Magician','Enhance 1 or 2 selected cards to Lucky.'],['high_priestess','The High Priestess','Create up to 2 random Planets, if there is room.'],
    ['empress','The Empress','Enhance 1 or 2 selected cards to Mult.'],['emperor','The Emperor','Create up to 2 random Tarots, if there is room.'],
    ['hierophant','The Hierophant','Enhance 1 or 2 selected cards to Bonus.'],['lovers','The Lovers','Enhance 1 selected card to Wild.'],
    ['chariot','The Chariot','Enhance 1 selected card to Steel.'],['justice','Justice','Enhance 1 selected card to Glass.'],
    ['hermit','The Hermit','Double your positive money, gaining at most $20.'],['wheel_of_fortune','The Wheel of Fortune','1 in 4 chance to add Foil, Holographic or Polychrome to a random uneditioned Joker.'],
    ['strength','Strength','Increase rank of 1 or 2 selected cards by 1; Ace wraps to 2.'],['hanged_man','The Hanged Man','Destroy 1 or 2 selected playing cards.'],
    ['death','Death','Select exactly 2 cards. Transform the leftmost card into a copy of the rightmost; the leftmost keeps its stable ID. Hand order decides left/right; collection order is used outside play.'],
    ['temperance','Temperance','Gain the total sell value of your Jokers, up to $50.'],['devil','The Devil','Enhance 1 selected card to Gold.'],
    ['tower','The Tower','Enhance 1 selected card to Stone.'],['star','The Star','Convert 1 to 3 selected cards to Diamonds.'],
    ['moon','The Moon','Convert 1 to 3 selected cards to Clubs.'],['sun','The Sun','Convert 1 to 3 selected cards to Hearts.'],
    ['judgement','Judgement','Create a random non-Legendary Joker, if there is room.'],['world','The World','Convert 1 to 3 selected cards to Spades.']
  ].map(function (t) { return {id:t[0], name:t[1], description:t[2], type:'tarot', price:3}; });
  var spectrals = [
    ['familiar','Familiar','Destroy 1 random card from the current hand (or full deck outside play); add 3 random enhanced face cards.'],
    ['grim','Grim','Destroy 1 random card; add 2 random enhanced Aces.'],['incantation','Incantation','Destroy 1 random card; add 4 random enhanced number cards.'],
    ['talisman','Talisman','Add a Gold Seal to 1 selected card.'],['aura','Aura','Add Foil, Holographic or Polychrome to 1 selected card.'],
    ['wraith','Wraith','Create a random Rare Joker and set your money to $0. Requires a free Joker slot.'],
    ['sigil','Sigil','Convert the current hand (or full deck outside play) to one random suit.'],
    ['ouija','Ouija','Convert the current hand (or full deck outside play) to one random rank; permanently lose 1 hand size.'],
    ['ectoplasm','Ectoplasm','Make a random non-Negative Joker Negative; lose 1 hand size, plus 1 extra for each previous Ectoplasm used.'],
    ['immolate','Immolate','Destroy 5 random cards from the current hand (or deck outside play); gain $20. Requires 5 cards.'],
    ['ankh','Ankh','Duplicate a random Joker and destroy all other Jokers. Negative edition is not copied.'],
    ['deja_vu','Deja Vu','Add a Red Seal to 1 selected card.'],['hex','Hex','Give a random uneditioned Joker Polychrome and destroy all other Jokers.'],
    ['trance','Trance','Add a Blue Seal to 1 selected card.'],['medium','Medium','Add a Purple Seal to 1 selected card.'],
    ['cryptid','Cryptid','Add 2 permanent copies of 1 selected card.'],['soul','The Soul','Create a random Legendary Joker, if there is room.'],
    ['black_hole','Black Hole','Level up all 12 poker hands once.']
  ].map(function (t) { return {id:t[0], name:t[1], description:t[2], type:'spectral', price:4}; });
  var consumableById={}; planets.concat(tarots,spectrals).forEach(function (x) { consumableById[x.id]=x; });
  var vouchers = [
    ['overstock','Overstock','+1 item slot in every shop.'],['clearance_sale','Clearance Sale','Shop prices are 25% lower.'],['hone','Hone','Double the chance for shop Jokers and Standard cards to have an edition.'],
    ['reroll_surplus','Reroll Surplus','Shop rerolls cost $2 less.'],['crystal_ball','Crystal Ball','+1 consumable slot.'],['telescope','Telescope','Celestial Packs always include the Planet for your most played hand.'],
    ['grabber','Grabber','+1 hand each round.'],['wasteful','Wasteful','+1 discard each round.'],['tarot_merchant','Tarot Merchant','Tarots are twice as likely in the shop.'],['planet_merchant','Planet Merchant','Planets are twice as likely in the shop.'],
    ['seed_money','Seed Money','Raise the interest payout cap to $10.'],['blank','Blank','No immediate effect. Makes Antimatter eligible in future shops.'],['magic_trick','Magic Trick','Playing cards may appear in shop item slots.'],
    ['hieroglyph','Hieroglyph','Go back 1 Ante (minimum Ante 1); permanently lose 1 hand per round.'],['directors_cut',"Director's Cut",'May reroll the next Boss once per Ante for $10, using rerollBoss.'],['paint_brush','Paint Brush','+1 hand size.'],
    ['overstock_plus','Overstock Plus','Another +1 shop item slot.'],['liquidation','Liquidation','Replace the discount with 50% off.'],['glow_up','Glow Up','Edition chance is quadrupled instead of doubled.'],['reroll_glut','Reroll Glut','Shop rerolls cost another $2 less.'],
    ['omen_globe','Omen Globe','Arcana Pack choices have a 20% chance to become Spectral cards.'],['observatory','Observatory','Each held Planet for the played hand gives X1.5 Mult.'],['nacho_tong','Nacho Tong','Another +1 hand each round.'],['recyclomancy','Recyclomancy','Another +1 discard each round.'],
    ['tarot_tycoon','Tarot Tycoon','Tarots are four times as likely in the shop.'],['planet_tycoon','Planet Tycoon','Planets are four times as likely in the shop.'],['money_tree','Money Tree','Raise interest payout cap to $20.'],['antimatter','Antimatter','+1 Joker slot.'],
    ['illusion','Illusion','Shop playing cards can have enhancements and Seals.'],['petroglyph','Petroglyph','Go back 1 Ante (minimum Ante 1); permanently lose 1 discard per round.'],['retcon','Retcon','Reroll the next Boss any number of times for $10 each.'],['palette','Palette','Another +1 hand size.']
  ].map(function (v) { return {id:v[0],name:v[1],description:v[2],price:10}; });
  var voucherById={}; vouchers.forEach(function (v) { voucherById[v.id]=v; });
  var UPGRADES={overstock_plus:'overstock',liquidation:'clearance_sale',glow_up:'hone',reroll_glut:'reroll_surplus',omen_globe:'crystal_ball',observatory:'telescope',nacho_tong:'grabber',recyclomancy:'wasteful',tarot_tycoon:'tarot_merchant',planet_tycoon:'planet_merchant',money_tree:'seed_money',antimatter:'blank',illusion:'magic_trick',petroglyph:'hieroglyph',retcon:'directors_cut',palette:'paint_brush'};
  var tags = [
    ['uncommon','Uncommon Tag','The next shop has a free Uncommon Joker.'],['rare','Rare Tag','The next shop has a free Rare Joker.'],['negative','Negative Tag','The next generated shop Joker is free and Negative.'],
    ['foil','Foil Tag','The next generated shop Joker is free and Foil.'],['holo','Holographic Tag','The next generated shop Joker is free and Holographic.'],['poly','Polychrome Tag','The next generated shop Joker is free and Polychrome.'],
    ['investment','Investment Tag','Earn $25 after defeating the next Boss Blind.'],['voucher','Voucher Tag','Add another paid voucher to the next shop. Buying the current voucher reveals the next queued voucher.'],['boss','Boss Tag','Reroll the current Ante Boss.'],
    ['standard','Standard Tag','Add a free Mega Standard Pack to the next shop.'],['charm','Charm Tag','Add a free Mega Arcana Pack to the next shop.'],['meteor','Meteor Tag','Add a free Mega Celestial Pack to the next shop.'],['buffoon','Buffoon Tag','Immediately open a free Mega Buffoon Pack. Choose 2 Jokers, then return to Blind selection.'],
    ['handy','Handy Tag','Immediately earn $1 per hand played this run.'],['garbage','Garbage Tag','Immediately earn $1 per unused discard from completed rounds this run.'],['ethereal','Ethereal Tag','Add a free Spectral Pack to the next shop.'],
    ['coupon','Coupon Tag','All initial items and packs in the next shop are free. Vouchers and rerolled items are not free.'],['double','Double Tag','Duplicate the next non-Double Tag gained. Multiple Double Tags stack.'],
    ['juggle','Juggle Tag','+3 hand size for the next Blind only.'],['d6','D6 Tag','The next shop rerolls start at $0, then $1, $2 and so on.'],['top_up','Top-up Tag','Create up to 2 Common Jokers now, if there is room.'],
    ['speed','Speed Tag','Immediately earn $5 per Blind skipped this run, including this skip.'],['orbital','Orbital Tag','Immediately level up one seeded random poker hand 3 times.'],['economy','Economy Tag','Double positive money, gaining at most $40.']
  ].map(function (t) { return {id:t[0],name:t[1],description:t[2]}; });
  var tagById={}; tags.forEach(function (t) {tagById[t.id]=t;});
  var bosses = [
    ['hook','The Hook','Discard 2 random held cards after each played hand.',1,2],['ox','The Ox','Playing the most-used hand from Blind start sets money to $0.',6,2],
    ['house','The House','The initial hand is face down.',2,2],['wall','The Wall','An extra-large Blind: four times the Small Blind.',2,4],
    ['wheel','The Wheel','1 in 7 drawn cards are face down.',2,2],['arm','The Arm','Level down the played hand before scoring, never below level 1.',2,2],
    ['club','The Club','Club cards are debuffed.',1,2],['fish','The Fish','Cards drawn after playing are face down.',2,2],
    ['psychic','The Psychic','Must play exactly 5 cards.',1,2],['goad','The Goad','Spade cards are debuffed.',1,2],
    ['water','The Water','Start with no discards.',2,2],['window','The Window','Diamond cards are debuffed.',1,2],
    ['manacle','The Manacle','-1 hand size during this Blind.',1,2],['eye','The Eye','Cannot repeat a poker hand type in this Blind.',3,2],
    ['mouth','The Mouth','After the first hand, only that poker hand type may be played.',2,2],['plant','The Plant','Face cards are debuffed.',4,2],
    ['serpent','The Serpent','After playing or discarding, draw exactly 3 cards, even over hand size.',5,2],['pillar','The Pillar','Cards played earlier this Ante are debuffed.',1,2],
    ['needle','The Needle','Only 1 hand this Blind; target equals the Small Blind.',2,1],['head','The Head','Heart cards are debuffed.',1,2],
    ['tooth','The Tooth','Lose $1 per played card.',3,2],['flint','The Flint','Base Chips and Mult are halved before card effects.',2,2],
    ['mark','The Mark','Face cards are drawn face down.',2,2],['amber_acorn','Amber Acorn','Shuffle the order of your Jokers at Blind start.',8,2],
    ['verdant_leaf','Verdant Leaf','All cards are debuffed until you sell a Joker during this Blind.',8,2],['violet_vessel','Violet Vessel','An enormous target: six times the Small Blind.',8,6],
    ['crimson_heart','Crimson Heart','One random Joker is disabled before every hand.',8,2],['cerulean_bell','Cerulean Bell','One randomly chosen held card must be selected in every played hand.',8,2]
  ].map(function (b) {return {id:b[0],name:b[1],description:b[2],minAnte:b[3],factor:b[4]};});
  var bossById={}; bosses.forEach(function (b) {bossById[b.id]=b;});
  var PACKS=[
    ['arcana','Arcana Pack','tarot',3,1,4],['jumbo_arcana','Jumbo Arcana Pack','tarot',5,1,6],['mega_arcana','Mega Arcana Pack','tarot',5,2,8],
    ['celestial','Celestial Pack','planet',3,1,4],['jumbo_celestial','Jumbo Celestial Pack','planet',5,1,6],['mega_celestial','Mega Celestial Pack','planet',5,2,8],
    ['standard','Standard Pack','card',3,1,4],['jumbo_standard','Jumbo Standard Pack','card',5,1,6],['mega_standard','Mega Standard Pack','card',5,2,8],
    ['buffoon','Buffoon Pack','joker',2,1,4],['jumbo_buffoon','Jumbo Buffoon Pack','joker',4,1,6],['mega_buffoon','Mega Buffoon Pack','joker',4,2,8],['spectral','Spectral Pack','spectral',2,1,4],
    ['jumbo_spectral','Jumbo Spectral Pack','spectral',4,1,6],['mega_spectral','Mega Spectral Pack','spectral',4,2,8]
  ].map(function (p) {var size=p[0].indexOf('jumbo_')===0?1:p[0].indexOf('mega_')===0?2:0,weights=p[2]==='spectral'?[0.6,0.3,0.07]:p[2]==='joker'?[1.2,0.6,0.15]:[4,2,0.5];return {id:p[0],name:p[1],type:p[2],count:p[3],choose:p[4],price:p[5],weight:weights[size],description:'Choose '+p[4]+' of '+p[3]+' '+(p[2]==='card'?'playing cards':p[2]==='joker'?'Jokers':p[2]+' cards')+'. Consumables enter inventory; use them separately. Capacity is checked before choosing.'};});
  var packById={}; PACKS.forEach(function (p) {packById[p.id]=p;});
  function clone(x) {return JSON.parse(JSON.stringify(x));}
  function fail(message) {throw new Error(message);}
  function check(ok,message) {if(!ok) fail(message);}
  function hash(seed) {var h=2166136261; for(var i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619);} return (h>>>0)||1;}
  function random(s) {var x=s.rng>>>0; x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
  function int(s,n) {check(n>0,'There are no eligible items.');return Math.floor(random(s)*n);}
  function pick(s,a) {return a[int(s,a.length)];}
  function shuffle(s,a) {for(var i=a.length-1;i>0;i--){var j=int(s,i+1),v=a[i];a[i]=a[j];a[j]=v;}return a;}
  function uid(s,prefix) {return prefix+(s.nextId++);}
  // Boss disable is temporary; Perishable expiry survives every phase/reset/copy.
  // Always test the actual owned object, never a copied ability projection.
  function isJokerActive(j) {return !(j.disabled||j.permanentDisabled||j.perishable&&j.perishTally<=0);}
  function has(s,id) {return s.jokers.some(function (j) {return j.id===id && isJokerActive(j);});}
  // Read-only physical credit allowance shared by payment and UI affordability.
  function creditLimit(s) {return has(s,'big_credit_card')?100:has(s,'credit_card')?20:0;}
  function count(s,id) {return s.jokers.filter(function (j) {return j.id===id&&isJokerActive(j);}).length;}
  function xpMultiplier(s) {return Math.min(Number.MAX_SAFE_INTEGER,Math.pow(1.2,s&&s.phase!=='lost'&&Array.isArray(s.jokers)?count(s,'exp_joker'):0));}
  function permanentCrit(s) {return s&&s.progressionEnabled===true&&s.playerLevel>=32?.01:0;}
  function isCopyJoker(j) {return j.id==='blueprint'||j.id==='brainstorm';}
  // Pure UID graph traversal. No RNG, synthetic Jokers, mutation, skip-search,
  // recursive emissions or arbitrary depth limit. Path includes a closing cycle UID.
  function traceCopy(order,sourceUid) {
    var source=order.find(function(j){return j.uid===sourceUid;}),j=source,visited=new Set(),path=[],immediate=null;
    function result(status,terminal,binding){return {status:status,immediateTargetUid:immediate,terminalTargetUid:terminal?terminal.uid:null,terminalName:terminal&&jokerById[terminal.id]?jokerById[terminal.id].name:null,path:path,binding:binding||null};}
    if(!source)return result('no-target');
    while(j){
      path.push(j.uid);if(visited.has(j.uid))return result('cycle');visited.add(j.uid);
      if(!isJokerActive(j))return result('disabled');
      if(!jokerById[j.id]||!COPY_COMPATIBILITY[j.id])return result('incompatible',j);
      if(!isCopyJoker(j)){
        if(COPY_COMPATIBILITY[j.id].kind==='incompatible')return result('incompatible',j);
        return result('compatible',j,{source:source,ability:j,copied:source.uid!==j.uid,path:path});
      }
      var at=order.findIndex(function(x){return x.uid===j.uid;}),next=j.id==='blueprint'?order[at+1]:order[0];
      if(j===source)immediate=next?next.uid:null;
      if(!next)return result('no-target');j=next;
    }
    return result('no-target');
  }
  function resolveJokerAbility(order,sourceUid) {
    var source=order.find(function(j){return j.uid===sourceUid;});
    // Compatibility gates borrowed calls only; native incompatible Jokers still work.
    if(source&&!isCopyJoker(source)&&jokerById[source.id]&&isJokerActive(source))return {source:source,ability:source,copied:false,path:[source.uid]};
    return traceCopy(order,sourceUid).binding;
  }
  function copyInfo(s,sourceUid) {var info=traceCopy(s.jokers,sourceUid);delete info.binding;return info;}
  function captureJokerBindings(s) {var order=s.jokers.slice();return {order:order,bindings:order.map(function(j){return resolveJokerAbility(order,j.uid);})};}
  function bindingLive(s,binding) {return !!binding&&binding.path.every(function(id){var j=s.jokers.find(function(x){return x.uid===id;});return j&&isJokerActive(j);});}
  function eventAllowed(binding,event) {return !binding.copied||COPY_EVENTS[event].indexOf(binding.ability.id)>=0;}
  function eachAbility(s,snapshot,event,fn) {snapshot.bindings.forEach(function(b){if(bindingLive(s,b)&&eventAllowed(b,event))fn(b.ability,b);});}
  function abilityCount(s,snapshot,event,id) {var n=0;eachAbility(s,snapshot,event,function(j){if(j.id===id)n++;});return n;}
  function abilityLabel(b) {var name=jokerById[b.ability.id].name;return b.copied?jokerById[b.source.id].name+' → '+name:name;}
  function owned(s,id) {return !!s.vouchers[id];}
  function activeBoss(s,id) {return s.blindIndex===2 && s.phase==='play' && s.bossId===id && !s.bossDisabled && !has(s,'chicot') && !potionBossSuppressed(s);}
  // Pure legacy lookup: missing HP means the original 3, never write it during
  // queries/hydration. Present malformed HP fails closed instead of healing.
  function mothimHP(j) {return !j||j.id!=='mothim'?0:j.hp===undefined?3:Number.isInteger(j.hp)&&j.hp>=0&&j.hp<=3?j.hp:0;}
  function canMothimAttack(s,index) {
    if(!s||s.version!==1||!Array.isArray(s.jokers)||!Number.isInteger(index))return false;
    var j=s.jokers[index];return !!(j&&j.id==='mothim'&&!j.eternal&&isJokerActive(j)&&mothimHP(j)>0&&Object.prototype.hasOwnProperty.call(bossById,s.bossId)&&activeBoss(s,s.bossId));
  }
  function playerLuckMultiplier(s) {return s&&s.progressionEnabled===true&&Number.isInteger(s.playerLevel)&&s.playerLevel>=17&&s.playerLevel<=100?1.25:1;}
  function listedLuckMultiplier(s) {return playerLuckMultiplier(s)*Math.pow(2,count(s,'oops_all_sixes'))*potionEffects(s).luckMultiplier;}
  function listedProbability(s,denominator) {check(Number.isFinite(denominator)&&denominator>0,'Choose a positive probability denominator.');return Math.min(1,listedLuckMultiplier(s)/denominator);}
  function chance(s,denominator) {return random(s)<listedProbability(s,denominator);}
  // Read-only Settings data: never refresh/hydrate a save or advance its RNG.
  function probabilityInfo(s) {
    s=s||{jokers:[],vouchers:{},stake:'white'};var activeOops=count(s,'oops_all_sixes'),oopsMultiplier=Math.pow(2,activeOops),playerLuck=playerLuckMultiplier(s),potion=potionEffects(s),multiplier=playerLuck*oopsMultiplier*potion.luckMultiplier,stake=runStake(s),listed=[
      ['lucky_mult','Lucky +20 Mult',5],['lucky_money','Lucky $20',15],['glass','Glass break',4],['wheel_of_fortune','Wheel of Fortune success',4],
      ['space_joker','Space Joker',4],['eight_ball','8 Ball',4],['reserved_parking','Reserved Parking',2],['business_card','Business Card',2],
      ['bloodstone','Bloodstone',2],['critical_joker','Critical Joker CRIT',25],['hallucination','Hallucination',2],['gros_michel','Gros Michel extinction',6],['cavendish','Cavendish extinction',1000],['wheel_boss','The Wheel face down',7]
    ].map(function(x){return {id:x[0],label:x[1],denominator:x[2],numerator:Math.min(x[2],multiplier),baseline:1/x[2],effective:listedProbability(s,x[2])};});
    var packTotal=PACKS.reduce(function(n,p){return n+p.weight;},0),weights=shelfWeights(s),shelfTotal=weights.reduce(function(n,w){return n+w.w;},0);
    return {activeOops:activeOops,oopsMultiplier:oopsMultiplier,playerLuckMultiplier:playerLuck,multiplier:multiplier,listed:listed,potionLuckMultiplier:potion.luckMultiplier,baseCritChance:permanentCrit(s)+potion.baseCritChance,baseCritEffectiveChance:Math.min(1,(permanentCrit(s)+potion.baseCritChance)*multiplier),permanentCritChance:permanentCrit(s),potionDropChance:Math.min(.5,multiplier/10),potionDropEligible:potionEligible(s)&&!(s.potions&&s.potions.blockedReason)&&(!s.potions||s.potions.inventory.length<2),bossDisablePotionChance:potion.bossDisableChance,potionDrop:{unlocked:potionEligible(s),full:!!(s.potions&&s.potions.inventory.length>=2),blocked:!!(s.potions&&s.potions.blockedReason),denominator:10,numerator:Math.min(5,multiplier),effective:Math.min(.5,multiplier/10),maximum:.5},potionCrit:{baseline:potion.baseCritChance,effective:Math.min(1,potion.baseCritChance*multiplier)},shopJokerEditions:editionWeights(s,'joker'),standardCardEditions:editionWeights(s,'standard'),
      shopCardEditions:editionWeights(s,'shop_card'),wheelEditions:{foil:0.5,holo:0.35,poly:0.15},rarity:{common:0.7,uncommon:0.25,rare:0.05},
      shelf:weights.map(function(w){return {type:w.type,weight:w.w,probability:w.w/shelfTotal};}),packs:PACKS.map(function(p){return {id:p.id,weight:p.weight,probability:p.weight/packTotal};}),
      stickers:{eternal:stake.eternal?0.3:0,perishable:stake.perishable?0.3:0,rental:stake.rental?0.3:0,eternalPerishableDisjoint:true,rentalIndependent:true},
      notes:'Per eligible trigger; inventory capacity, rank/suit, debuffs and effect timing still apply. Each active physical Oops doubles listed odds; Level 17+ player luck multiplies them by 1.25 (+25%) in progression-enabled runs. Combined proc odds cap at 100%, including harmful listed effects such as Glass breaks and extinction; shop rarity, editions and fixed rates are unchanged. Sticker rates require a compatible non-Legendary. Wheel edition rates are conditional on success. Pack weights exclude the guaranteed first Buffoon; rarity is the unforced shop baseline. Illusion has 20% total editions but its conditional edition split is unverified; see PROBABILITY-REPORT.md.'};
  }
  function note(s,text) {s.log.push(text);if(s.log.length>30)s.log.shift();}
  function addMoney(s,n) {n=Math.floor(n);s.money+=n;if(n>0)s.stats.moneyEarned+=n;}
  // Per-action, transient receipts: capture eligibility at the actual mutation,
  // BEFORE play ends/ability suppression changes. Never infer events in queries,
  // hydration or level sync. See LEVEL19-BOSS-REWARDS.md for batch boundaries.
  var bossEffectActions=new WeakMap();
  function bossEffect(s,id,event) {
    return s.progressionEnabled===true&&Number.isInteger(s.playerLevel)&&s.playerLevel>=19&&s.playerLevel<=100&&activeBoss(s,id)?{bossId:id,event:event}:null;
  }
  function recordBossEffect(s,id,event) {var events=bossEffectActions.get(s),receipt=bossEffect(s,id,event);if(events&&receipt)events.push(receipt);}
  function finite(n) {return Math.max(0,Math.min(Number.MAX_VALUE,Number.isFinite(n)?n:Number.MAX_VALUE));}
  function face(s,c) {return c.enhancement!=='stone'&&(c.rank>=11&&c.rank<=13||has(s,'pareidolia'));}
  function rankChips(c) {return c.rank===14?11:Math.min(c.rank,10);}
  function suit(c,suit,s) {if(c.enhancement==='stone')return false;if(c.enhancement==='wild'||s&&potionEffects(s).allSuits)return true;if(s&&has(s,'smeared_joker'))return (c.suit==='S'||c.suit==='C')===(suit==='S'||suit==='C');return c.suit===suit;}
  function sellValue(item) {if(item.rental)return Math.max(1,1+(item.sellBonus||0));var base=jokerById[item.id]?jokerById[item.id].price+(item.edition==='foil'?2:item.edition==='holo'?3:item.edition==='poly'||item.edition==='negative'?5:0):item.price===undefined?3:item.price;return Math.max(1,Math.floor(base/2)+(item.sellBonus||0));}
  // Meta rules are opt-in. Legacy saves acquire a fresh event ledger only when
  // setPlayerLevel is called; historical cash/hand levels/wins never imply XP.
  function validPlayerLevel(n) {check(Number.isInteger(n)&&n>=1&&n<=100,'Choose a valid player level (1-100).');}
  function level10DealActive(s) {return s.level10Deal===true&&s.progressionEnabled===true&&Number.isInteger(s.playerLevel)&&s.playerLevel>=10&&s.playerLevel<=100;}
  function setLevel10Deal(s,on) {
    check(typeof on==='boolean','Choose ON or OFF for the Level 10 deal.');
    check(!on||s.progressionEnabled===true&&Number.isInteger(s.playerLevel)&&s.playerLevel>=10&&s.playerLevel<=100,'Reach player level 10 to enable this deal.');
    // Capacity changes now; only an ordinary draw/refill supplies extra cards.
    // OFF never destroys an existing card or replays any round-end settlement.
    s.level10Deal=on;refresh(s);
  }
  function setHandSort(s,mode) {check(mode==='rank'||mode==='suit','Choose Rank or Suit sorting.');s.handSortMode=mode;}
  // Only random-target selection needs deal-order bookkeeping. Held effects and
  // user selections retain their visible/manual-sort order, as before.
  function handInDrawOrder(s) {
    var result=[],byId=new Map(s.hand.map(function(c){return [c.id,c];}));
    (Array.isArray(s.handDrawOrder)?s.handDrawOrder:[]).forEach(function(id){if(byId.has(id)){result.push(byId.get(id));byId.delete(id);}});
    s.hand.forEach(function(c){if(byId.has(c.id)){result.push(c);byId.delete(c.id);}});return result;
  }
  function sortHand(s,preserveOrder) {
    s.handSortMode=s.handSortMode==='suit'?'suit':'rank';
    s.handDrawOrder=handInDrawOrder(s).map(function(c){return c.id;});
    if(preserveOrder)return;
    var mode=s.handSortMode,visible=s.hand.filter(function(c){return !c.faceDown;}).sort(function(a,b){
      return (mode==='suit'?a.suit.localeCompare(b.suit)||b.rank-a.rank:b.rank-a.rank||a.suit.localeCompare(b.suit))||String(a.id).localeCompare(String(b.id));
    }),i=0;
    // Hidden anchors never move or consult their secret rank/suit values.
    s.hand=s.hand.map(function(c){return c.faceDown?c:visible[i++];});
  }
  function playerBlindFactor(s) {return s.progressionEnabled===true&&Number.isInteger(s.playerLevel)&&s.playerLevel>=6&&s.playerLevel<=100?.975*(s.playerLevel>=8?.95:1):1;}
  function roundBlindFactor(s) {
    if(['play','cashout','lost','won'].indexOf(s.phase)>=0){
      var saved=s.roundBlindLevelFactor;
      if(saved&&saved.round===s.round&&saved.ante===s.ante&&saved.blindIndex===s.blindIndex)return saved.factor;
      // A pre-feature in-progress save keeps its original challenge this round.
      return 1;
    }
    return playerBlindFactor(s);
  }
  function validatedCoinUnlocks(ids) {
    check(Array.isArray(ids),'Choose an array of coin-unlocked Joker IDs.');var result=[];
    for(var i=0;i<ids.length;i++){var id=ids[i];check(typeof id==='string'&&Object.prototype.hasOwnProperty.call(jokerById,id)&&jokerById[id].requiresCoinUnlock===true,'Unknown coin-unlocked Joker ID.');if(result.indexOf(id)<0)result.push(id);}
    return result;
  }
  function coinJokerEligible(s,def) {return !def.requiresCoinUnlock||Array.isArray(s.coinUnlocks)&&s.coinUnlocks.indexOf(def.id)>=0;}
  function setCoinUnlocks(s,ids) {s.coinUnlocks=validatedCoinUnlocks(ids);}
  // Actual profile overrides are mandatory in the app; two-argument legacy
  // actions retain their synchronized run-level fallback. No query writes it.
  function selectionLimit(s,actualLevel) {
    if(actualLevel!==undefined){validPlayerLevel(actualLevel);return actualLevel>=35?6:5;}
    return s&&s.progressionEnabled===true&&Number.isInteger(s.playerLevel)&&s.playerLevel>=35&&s.playerLevel<=100?6:5;
  }
  function selectionActualLevel(options) {
    if(options===undefined)return undefined;
    check(options&&typeof options==='object'&&Object.getPrototypeOf(options)===Object.prototype,'Supply selection options with the actual player level.');
    var keys=Reflect.ownKeys(options),d=Object.getOwnPropertyDescriptor(options,'actualLevel');
    check(keys.length===1&&keys[0]==='actualLevel'&&d&&d.enumerable&&Object.prototype.hasOwnProperty.call(d,'value'),'Supply only the actual player level for selection.');
    validPlayerLevel(d.value);return d.value;
  }
  function availableHandKeys(s) {return Object.keys(HANDS).filter(function(k){return selectionLimit(s)===6||k!=='double_triple'&&k!=='six';});}
  function metaBaseSlots(s) {return s.progressionEnabled===true?(s.playerLevel>=35?6:s.playerLevel<4?3:s.playerLevel===4?4:5):5;}
  function nonnegativeSlots(s) {return metaBaseSlots(s)+(s.deckId==='black'?1:0)-(s.deckId==='painted'?1:0)+(owned(s,'antimatter')?1:0);}
  function normalizeProgression(s) {
    if(s.progressionEnabled!==true)return;
    validPlayerLevel(s.playerLevel);
    if(s.progressEvents===undefined)s.progressEvents=[];
    check(Array.isArray(s.progressEvents),'Invalid progression event ledger.');
    var last=s.progressEvents.reduce(function(n,e){check(e&&Number.isSafeInteger(e.seq)&&e.seq>0,'Invalid progression event sequence.');return Math.max(n,e.seq);},0);
    if(s.progressSeq===undefined)s.progressSeq=last;
    check(Number.isSafeInteger(s.progressSeq)&&s.progressSeq>=0,'Invalid progression event sequence.');s.progressSeq=Math.max(s.progressSeq,last);
    if(s.jokerReserve===undefined)s.jokerReserve=[];check(Array.isArray(s.jokerReserve),'Invalid Joker reserve.');
    s.metaBossDisableUsed=s.metaBossDisableUsed===true;
    if(s.metaBossBonusRound===undefined)s.metaBossBonusRound=null;
    if(s.stats.bossesWon===undefined)s.stats.bossesWon=0;
    if(s.stats.highestAnteDefeated===undefined)s.stats.highestAnteDefeated=0;
  }
  function enableProgression(s,n) {
    validPlayerLevel(n);s.progressionEnabled=true;s.playerLevel=n;s.progressEvents=[];s.progressSeq=0;
    normalizeProgression(s);
  }
  function progressEvent(s,kind,baseXp,context) {
    if(s.progressionEnabled!==true||baseXp<=0&&!(baseXp===0&&kind==='blind-win'&&context&&context.ante===0))return;
    check(Number.isFinite(baseXp)&&Number.isSafeInteger(s.progressSeq)&&s.progressSeq<Number.MAX_SAFE_INTEGER,'Invalid progression XP.');
    var event=Object.assign({seq:++s.progressSeq,kind:kind,baseXp:baseXp},context);
    if(s.potions)event.potionXpMultiplier=potionEffects(s).xpMultiplier;
    if(xpMultiplier(s)!==1)event.jokerXpMultiplier=xpMultiplier(s);
    s.progressEvents.push(event);
  }
  // A unified UID order retains parked positions, including interleaved Negative
  // items. Reconcile current active reordering, then bench rightmost ordinary
  // items; restoring objects never invokes acquire, sale, creation or game RNG.
  function rebalanceJokers(s) {
    if(s.progressionEnabled!==true)return;
    if(s.jokerReserve===undefined)s.jokerReserve=[];
    var active=s.jokers.slice(),reserve=s.jokerReserve.slice(),all=active.concat(reserve),byUid={},seen={};
    all.forEach(function(j){check(j&&j.uid&&!byUid[j.uid],'Invalid or duplicate owned Joker UID.');byUid[j.uid]=j;});
    var order=(s.jokerReserveOrder||[]).filter(function(id){if(!byUid[id]||seen[id])return false;seen[id]=true;return true;});
    all.forEach(function(j){if(!seen[j.uid]){order.push(j.uid);seen[j.uid]=true;}});
    var activeIds={},keep={},cursor=0;active.forEach(function(j){activeIds[j.uid]=true;keep[j.uid]=true;});
    order=order.map(function(id){return activeIds[id]?active[cursor++].uid:id;});
    reserve.forEach(function(j){if(j.edition==='negative')keep[j.uid]=true;});
    var ordinary=active.filter(function(j){return j.edition!=='negative';}),capacity=nonnegativeSlots(s);
    while(ordinary.length>capacity)delete keep[ordinary.pop().uid];
    var used=Object.keys(keep).filter(function(id){return byUid[id].edition!=='negative';}).length;
    order.forEach(function(id){if(!keep[id]&&used<capacity){keep[id]=true;if(byUid[id].edition!=='negative')used++;}});
    s.jokers=order.filter(function(id){return keep[id];}).map(function(id){return byUid[id];});
    s.jokerReserve=order.filter(function(id){return !keep[id];}).map(function(id){return byUid[id];});s.jokerReserveOrder=order;
  }
  function summary(s) {
    var n=s.jokers.filter(function(j){return j.edition==='negative';}).length;
    var hand=8+(s.progressionEnabled===true&&Number.isInteger(s.playerLevel)&&s.playerLevel>=43&&s.playerLevel<=100?1:0)+potionEffects(s).handSizeBonus+(level10DealActive(s)?1:0)+(s.deckId==='painted'?2:0)+(s.deckId==='twilight'?1:0)+(s.handSizeBonus||0)+(owned(s,'paint_brush')?1:0)+(owned(s,'palette')?1:0)+count(s,'juggler')+2*count(s,'troubadour')-count(s,'merry_andy')-2*count(s,'stuntman');
    s.jokers.forEach(function(j){if(j.id==='turtle_bean'&&isJokerActive(j))hand+=j.counter;});
    if(activeBoss(s,'manacle'))hand--;
    if(s.phase==='play')hand+=s.roundHandBonus||0;
    return {handSize:Math.max(1,hand),selectionLimit:selectionLimit(s),jokerSlots:nonnegativeSlots(s)+n,
      consumableSlots:2-(s.deckId==='nebula'?1:0)+(s.deckId==='twilight'?1:0)+(owned(s,'crystal_ball')?1:0)+s.consumables.filter(function(c){return c.edition==='negative';}).length,
      handsPerRound:Math.max(1,4-(runStake(s).handPenalty||0)+(s.deckId==='blue'?1:0)-(s.deckId==='black'?1:0)+(s.handsBonus||0)+(owned(s,'grabber')?1:0)+(owned(s,'nacho_tong')?1:0)-count(s,'troubadour')),
      discardsPerRound:Math.max(0,3-runStake(s).discardPenalty+(s.deckId==='red'?1:0)+(s.discardsBonus||0)+(owned(s,'wasteful')?1:0)+(owned(s,'recyclomancy')?1:0)+count(s,'drunkard')+3*count(s,'merry_andy')),
      sellValues:s.jokers.map(sellValue),consumableSellValues:s.consumables.map(sellValue),endless:!!s.endless};
  }
  function refresh(s) {rebalanceJokers(s);var v=summary(s);s.handSize=v.handSize;s.jokerSlots=v.jokerSlots;s.consumableSlots=v.consumableSlots;}
  function hydrate(s) {if(s.level10Deal===undefined)s.level10Deal=false;normalizeProgression(s);if(s.potions){check(Potions,'Load the potion model before the engine.');s.potions=Potions.recover(s.potions,null);}rebalanceJokers(s);if(s.stake===undefined)s.stake='white';if(s.stakeIndex===undefined)s.stakeIndex=runStake(s).index;var map={};s.cards.forEach(function(c){map[c.id]=c;});['hand','drawPile','discardPile'].forEach(function(k){s[k]=(s[k]||[]).map(function(c){check(map[c.id],'Save contains an unknown playing card.');return map[c.id];});});refreshPrices(s);}
  function atomic(fn) {return function(s){
    check(s&&s.version===1,'This save is not supported.');validateFrenzy(s);validateLegacyWallet(s);validatePassiveMoney(s);var args=Array.prototype.slice.call(arguments,1),next=clone(s),effects=[];bossEffectActions.set(next,effects);
    try{hydrate(next);fn.apply(null,[next].concat(args));refresh(next);
      // Settle AFTER native scoring/on-play/Matador/lifecycle evaluation: this
      // dollar cannot alter Vagabond/Bull/Ox eligibility midway through a hand.
      effects.forEach(function(){addMoney(next,1);});
      if(effects.length){note(next,'Level 19: +$'+effects.length+' from '+bossById[effects[0].bossId].name+' special effect'+(effects.length===1?'':'s')+'.');refreshPendingInterest(next);}
      sortHand(next,fn===setPotionState||fn===setPlayerLevel||fn===setCoinUnlocks||fn===setLevel10Deal||fn===abandon);
    }finally{bossEffectActions.delete(next);}
    Object.keys(s).forEach(function(k){delete s[k];});Object.keys(next).forEach(function(k){s[k]=next[k];});return s;
  };}
  function phase(s,list) {check(list.indexOf(s.phase)!==-1,'This action is not available during '+s.phase+'.');}
  function selected(s,ids,pool,max,min) {check(Array.isArray(ids),'Choose cards first.');check(ids.length>=(min===undefined?1:min)&&ids.length<=(max||5),'Choose '+(min||1)+' to '+(max||5)+' cards.');var seen={};return ids.map(function(id){check(!seen[id],'A card cannot be selected twice.');seen[id]=true;var c=pool.find(function(x){return x.id===id;});check(c,'A selected card is not available.');return c;});}
  function newCard(s,rank,whichSuit) {return {id:uid(s,'c'),rank:rank,suit:whichSuit,enhancement:null,edition:null,seal:null};}
  function copyCard(s,c) {var d=clone(c);d.id=uid(s,'c');delete d.debuffed;delete d.faceDown;return d;}
  function addCard(s,c,where) {s.cards.push(c);if(where==='hand')s.hand.push(c);else s.drawPile.push(c);s.jokers.forEach(function(j){if(j.id==='hologram'&&isJokerActive(j))j.counter+=0.25;});}
  function destroyCards(s,cards) {var ids={};cards.forEach(function(c){ids[c.id]=true;s.jokers.forEach(function(j){if(!isJokerActive(j))return;if(j.id==='glass_joker'&&c.enhancement==='glass')j.counter+=0.75;if(j.id==='canio'&&face(s,c))j.counter+=1;});});['cards','hand','drawPile','discardPile'].forEach(function(k){s[k]=s[k].filter(function(c){return !ids[c.id];});});}
  function retargetIdol(s,j) {var candidates=s.cards.filter(function(c){return c.enhancement!=='stone';}),target=candidates.length?pick(s,candidates):{rank:14,suit:'S'};j.targetRank=target.rank;j.targetSuit=target.suit;}
  function jokerInstance(s,id,edition) {check(jokerById[id],'Unknown Joker: '+id);var j={id:id,uid:uid(s,'j'),edition:edition||null,price:jokerById[id].price+(edition==='foil'?2:edition==='holo'?3:edition==='poly'||edition==='negative'?5:0),sellBonus:0,counter:0};
    if(['constellation','vampire','hologram','lucky_cat','campfire','glass_joker','hit_the_road','madness','canio','yorick','obelisk'].indexOf(id)>=0)j.counter=1;
    if(id==='ice_cream')j.counter=100;if(id==='popcorn')j.counter=20;if(id==='ramen')j.counter=2;if(id==='turtle_bean')j.counter=5;if(id==='seltzer')j.counter=10;if(id==='rocket')j.counter=1;if(id==='mothim')j.hp=3;
    if(id==='mail_in_rebate')j.targetRank=int(s,13)+2;if(id==='castle'||id==='ancient_joker')j.targetSuit=pick(s,SUITS);if(id==='the_idol')retargetIdol(s,j);if(id==='to_do_list')j.targetHand=pick(s,availableHandKeys(s));return j;
  }
  function addJoker(s,id,edition) {refresh(s);check(s.jokers.length<s.jokerSlots+(edition==='negative'?1:0),'No free Joker slots.');var j=jokerInstance(s,id,edition);s.jokers.push(j);refresh(s);return j;}
  function destroyJoker(s,j) {if(j.eternal)return false;var at=s.jokers.findIndex(function(x){return x.uid===j.uid;});if(at<0)return false;s.jokers.splice(at,1);return true;}
  function copyOwnedJoker(s,original) {var copy=clone(original);copy.uid=uid(s,'j');delete copy.disabled;delete copy.remove;if(copy.edition==='negative'){copy.edition=null;copy.price=copy.rental?1:jokerById[copy.id].price;}return copy;}
  function acquireStickers(j,item) {
    check(!(item.eternal&&item.perishable),'A Joker cannot be both Eternal and Perishable.');
    if(j.id==='mothim')check(!item.eternal,'Mothim cannot be Eternal: 0 HP must sell it.');
    if(j.id==='venipede_joker'||j.id==='mantis')check(!item.perishable,'This scaling Joker cannot be Perishable.');
    if(item.eternal)j.eternal=true;
    if(item.perishable){var tally=item.perishTally===undefined?5:item.perishTally;check(Number.isInteger(tally)&&tally>=0&&tally<=5,'Invalid Perishable lifespan.');j.perishable=true;j.perishTally=tally;if(tally===0||item.permanentDisabled)j.permanentDisabled=true;}
    if(item.rental){j.rental=true;j.price=1;}
    return j;
  }
  // Shop / Buffoon creation only. A single shared roll reserves disjoint 30%
  // ranges for Eternal and Perishable (no eligibility re-roll). Rental uses its
  // own 30% roll and stacks with either. Oops! All 6s does not affect stickers.
  function rollShopStickers(s,item) {
    var stake=runStake(s),def=jokerById[item.id];if(!stake.eternal||!def||def.rarity==='legendary')return item;
    var roll=random(s);if(roll>0.7){if(def.eternalCompatible)item.eternal=true;}
    else if(stake.perishable&&roll>0.4&&def.perishableCompatible){item.perishable=true;item.perishTally=5;}
    if(stake.rental&&random(s)>0.7){item.rental=true;item.price=1;}
    return item;
  }
  // Every random acquisition funnels through this pool, including fallback.
  // Ownership/copying never implicitly unlocks future generated custom copies.
  function randomJoker(s,rarity,exclude) {if(!rarity){var rarityRoll=random(s);rarity=rarityRoll<0.7?'common':rarityRoll<0.95?'uncommon':'rare';}var pool=jokers.filter(function(j){return coinJokerEligible(s,j)&&(!rarity?j.rarity!=='legendary':j.rarity===rarity)&&(j.id!=='cavendish'||s.grosMichelExtinct)&&(!exclude||exclude.indexOf(j.id)===-1)&&(has(s,'showman')||!s.jokers.some(function(x){return x.id===j.id;}));});if(!pool.length)pool=jokers.filter(function(j){return coinJokerEligible(s,j)&&(rarity?j.rarity===rarity:j.rarity==='common');});return pick(s,pool);}
  function consumable(s,id) {check(consumableById[id],'Unknown consumable: '+id);var c=clone(consumableById[id]);c.uid=uid(s,'u');return c;}
  function addConsumable(s,id,negative) {refresh(s);if(s.consumables.length>=s.consumableSlots&&!negative)return false;var c=consumable(s,id);if(negative)c.edition='negative';s.consumables.push(c);refresh(s);return true;}
  function randomConsumable(s,type,exclude) {var pool=type==='tarot'?tarots:type==='planet'?planets:spectrals.filter(function(c){return c.id!=='soul'&&c.id!=='black_hole';});if(type==='planet')pool=pool.filter(function(c){return (['double_triple','six'].indexOf(c.hand)<0||selectionLimit(s)===6)&&(['five','flush_house','flush_five','double_triple','six'].indexOf(c.hand)<0||s.stats.handCounts[c.hand]);});var eligible=pool.filter(function(c){return (!exclude||exclude.indexOf(c.id)<0)&&(has(s,'showman')||!s.consumables.some(function(x){return x.id===c.id;}));});return pick(s,eligible.length?eligible:pool);}
  // Old v1 runs have only twelve hand keys. Missing new keys mean Level1;
  // previews never normalize them, and only real uses/plays materialize them.
  function handLevel(s,key) {return s.levels[key]===undefined&&(key==='double_triple'||key==='six')?1:s.levels[key];}
  function level(s,key,n) {var before=handLevel(s,key);s.levels[key]=Math.max(1,before+n);var gained=s.levels[key]-before;if(gained>0)progressEvent(s,'hand-level',3*gained,{hand:key,levels:gained});}
  function topHand(s) {return Object.keys(HANDS).reduce(function(a,k){return (s.stats.handCounts[k]||0)>(s.stats.handCounts[a]||0)?k:a;},'high');}
  function evaluateSix(cards,opts,ranked,groups) {
    var key=groups[0]&&groups[0].length===6?'six':groups.length===2&&groups[0].length===3&&groups[1].length===3?'double_triple':null;
    var best=null,bestRank=-1,bestRanks=[],contains={pair:false,two_pair:false,three:false,four:false,straight:false,flush:false},order=Object.keys(HANDS);
    // Existing hands keep their original 1–5-card evaluator, including Four
    // Fingers/Shortcut. Six-card fallback is the strongest five-card subset;
    // ties prefer higher scoring ranks, then the original first-five order.
    for(var omitted=5;omitted>=0;omitted--){
      var mapping=cards.map(function(c,i){return i;}).filter(function(i){return i!==omitted;}),subset=mapping.map(function(i){return cards[i];}),r=evaluate(subset,opts),rank=order.indexOf(r.key);
      Object.keys(contains).forEach(function(k){contains[k]=contains[k]||r.contains[k];});
      var ranks=r.indices.filter(function(i){return subset[i].enhancement!=='stone';}).map(function(i){return subset[i].rank;});
      if((r.key==='straight'||r.key==='straight_flush')&&ranks.indexOf(14)>=0&&ranks.indexOf(2)>=0&&ranks.indexOf(13)<0)ranks=ranks.map(function(n){return n===14?1:n;});
      ranks.sort(function(a,b){return b-a;});var higher=false;
      for(var n=0;n<ranks.length;n++){if(ranks[n]!==bestRanks[n]){higher=ranks[n]>(bestRanks[n]||0);break;}}
      if(rank>bestRank||rank===bestRank&&higher){best=r;bestRank=rank;bestRanks=ranks;best.indices=r.indices.map(function(i){return mapping[i];});}
    }
    if(key){var h=HANDS[key];best={name:h[0],key:key,chips:h[1],mult:h[2],indices:ranked.slice()};}
    best.contains=contains;
    // Stone extras always score, even if omitted from the winning five.
    cards.forEach(function(c,i){if(c.enhancement==='stone'&&best.indices.indexOf(i)<0)best.indices.push(i);});best.indices.sort(function(a,b){return a-b;});
    if(best.key==='straight_flush'&&containsRoyalFlush(opts.state,cards))best.name='Royal Flush';
    return best;
  }
  function evaluate(cards,opts) {
    opts=opts||{};check(Array.isArray(cards)&&cards.length>0&&cards.length<=6,'A poker hand must contain 1 to 6 cards.');
    var ranked=[],groups={};cards.forEach(function(c,i){check(c&&Number.isInteger(c.rank)&&c.rank>=2&&c.rank<=14&&SUITS.indexOf(c.suit)>=0,'Invalid playing card.');if(c.enhancement!=='stone'){ranked.push(i);(groups[c.rank]||(groups[c.rank]=[])).push(i);}});
    var gs=Object.keys(groups).map(function(k){return groups[k];}).sort(function(a,b){return b.length-a.length||cards[b[0]].rank-cards[a[0]].rank;});
    if(cards.length===6)return evaluateSix(cards,opts,ranked,gs);
    var needed=opts.fourFingers?4:5,flush=[];
    SUITS.forEach(function(whichSuit){var f=ranked.filter(function(i){return suit(cards[i],whichSuit,opts.state);});if(f.length>=needed&&f.length>flush.length)flush=f;});
    function straightIndices(indices){var byRank={};indices.forEach(function(i){if(byRank[cards[i].rank]===undefined)byRank[cards[i].rank]=i;});if(byRank[14]!==undefined)byRank[1]=byRank[14];var ranks=Object.keys(byRank).map(Number).sort(function(a,b){return a-b;}),best=[];
      for(var a=0;a<ranks.length;a++){var seq=[ranks[a]];for(var b=a+1;b<ranks.length;b++){var gap=ranks[b]-seq[seq.length-1];if(gap>(opts.shortcut?2:1))break;seq.push(ranks[b]);}if(seq.length>=needed){var chosen=seq.slice(-5);if(chosen.length>best.length||chosen.length===best.length&&chosen[chosen.length-1]>best[best.length-1])best=chosen;}}
      return best.map(function(r){return byRank[r];});
    }
    var st=straightIndices(ranked),sf=[];SUITS.forEach(function(whichSuit){var q=straightIndices(ranked.filter(function(i){return suit(cards[i],whichSuit,opts.state);}));if(q.length>sf.length)sf=q;});
    var five=gs[0]&&gs[0].length===5,full=gs.length>=2&&gs[0].length===3&&gs[1].length>=2,key,indices;
    if(five&&flush.length===5){key='flush_five';indices=ranked;}else if(full&&flush.length===5){key='flush_house';indices=ranked;}else if(five){key='five';indices=gs[0];}
    else if(sf.length>=needed||opts.fourFingers&&st.length>=needed&&flush.length>=needed){key='straight_flush';indices=sf.length>=needed?sf:st.concat(flush.filter(function(i){return st.indexOf(i)<0;}));}else if(gs[0]&&gs[0].length>=4){key='four';indices=gs[0];}else if(full){key='full_house';indices=gs[0].concat(gs[1]);}
    else if(flush.length>=needed){key='flush';indices=flush;}else if(st.length>=needed){key='straight';indices=st;}else if(gs[0]&&gs[0].length>=3){key='three';indices=gs[0];}
    else if(gs[0]&&gs[0].length===2&&gs[1]&&gs[1].length===2){key='two_pair';indices=gs[0].concat(gs[1]);}else if(gs[0]&&gs[0].length===2){key='pair';indices=gs[0];}
    else {key='high';indices=gs.length?[gs[0][0]]:[];}
    cards.forEach(function(c,i){if(c.enhancement==='stone'&&indices.indexOf(i)<0)indices.push(i);});indices.sort(function(a,b){return a-b;});
    var h=HANDS[key];return {name:key==='straight_flush'&&containsRoyalFlush(opts.state,cards)?'Royal Flush':h[0],key:key,indices:indices,chips:h[1],mult:h[2],contains:{pair:gs.some(function(g){return g.length>=2;}),two_pair:gs.filter(function(g){return g.length>=2;}).length>=2,three:gs.some(function(g){return g.length>=3;}),four:gs.some(function(g){return g.length>=4;}),straight:st.length>=needed,flush:flush.length>=needed}};
  }
  function containsRoyalFlush(s,cards) {
    if(cards.length===6)return cards.some(function(c,omitted){return containsRoyalFlush(s,cards.filter(function(other,i){return i!==omitted;}));});
    if(cards.length!==5||cards.some(function(c){return c.enhancement==='stone';})||cards.map(function(c){return c.rank;}).sort(function(a,b){return a-b;}).join(',')!=='10,11,12,13,14')return false;
    return SUITS.some(function(whichSuit){return cards.every(function(c){
      // A debuffed Wild loses its enhancement, but independent suit modifiers
      // still apply. Keep this local: do not change historical vanilla scoring.
      return suit(c.debuffed&&c.enhancement==='wild'?{rank:c.rank,suit:c.suit,enhancement:null}:c,whichSuit,s);
    });});
  }
  function evaluateRun(s,cards) {var r=evaluate(cards,{fourFingers:has(s,'four_fingers'),shortcut:has(s,'shortcut'),state:s});r.royalFlush=containsRoyalFlush(s,cards);return r;}
  function preview(s,ids,options) {var cards=selected(s,ids,s.hand,selectionLimit(s,selectionActualLevel(options)),1),r=evaluateRun(s,cards),h=HANDS[r.key],l=handLevel(s,r.key)-1;return {name:r.name,key:r.key,chips:h[1]+h[3]*l,mult:h[2]+h[4]*l,indices:r.indices,royalFlush:r.royalFlush,baseOnly:true,description:'Base hand value only. Card effects, held cards, Jokers and random effects are resolved when played.'};}
  function pickBoss(s) {var finals=s.ante>0&&s.ante%8===0,pool=bosses.filter(function(b){return b.minAnte<=Math.max(1,s.ante)&&(finals?b.minAnte===8:b.minAnte!==8);});return pick(s,pool).id;}
  function blindInfo(s) {var stake=runStake(s),base=s.ante===0?100:stake.anteTargets[Math.min(s.ante,8)-1];if(s.ante>8)base=Math.floor(stake.anteTargets[7]*Math.pow(1.6+(s.ante-8)*0.5,s.ante-8));base=finite(base);var boss=bossById[s.bossId]||bosses[0],factor=s.blindIndex===0?1:s.blindIndex===1?1.5:boss.factor;if(s.blindIndex===2&&(boss.id==='wall'||boss.id==='violet_vessel')&&(has(s,'chicot')||s.phase==='play'&&(s.bossDisabled||potionBossSuppressed(s))))factor=2;return {name:s.blindIndex===0?'Small Blind':s.blindIndex===1?'Big Blind':boss.name,description:s.blindIndex===2?boss.description:'Score enough Chips before your hands run out.',target:finite(roundBlindFactor(s)===1?Math.floor(base*factor*(s.deckId==='plasma'?2:1)):Math.ceil(base*factor*(s.deckId==='plasma'?2:1)*roundBlindFactor(s))),reward:s.blindIndex===0?stake.smallBlindReward:s.blindIndex===1?4:5,canSkip:s.phase==='select'&&s.blindIndex<2,tag:clone(tagById[s.blindTags[s.blindIndex]||'handy'])};}
  function nextBlind(s) {if(s.blindIndex===2){s.ante++;s.blindIndex=0;s.bossId=pickBoss(s);s.blindTags=[pick(s,tags).id,pick(s,tags).id];s.antePlayed=[];s.bossRerolled=false;}else s.blindIndex++;s.stats.highestAnte=Math.max(s.stats.highestAnte,s.ante);}
  function newRun(deckId,seed,options) {
    check(decks.some(function(d){return d.id===deckId;}),'Choose a valid deck.');
    check(options===undefined||options!==null&&typeof options==='object'&&!Array.isArray(options),'Choose valid run options.');options=options||{};
    var stakeId=options.stake===undefined?'white':options.stake;check(typeof stakeId==='string'&&Object.prototype.hasOwnProperty.call(stakeById,stakeId),'Choose a valid stake.');
    var meta=Object.prototype.hasOwnProperty.call(options,'playerLevel');if(meta)validPlayerLevel(options.playerLevel);
    check((!decks.find(function(d){return d.id===deckId;}).unlockLevel&&stakeById[stakeId].index<8)||meta&&options.playerLevel>=29,'These decks and stakes unlock at actual player Level 29.');
    var coinUnlocks=Object.prototype.hasOwnProperty.call(options,'coinUnlocks')?validatedCoinUnlocks(options.coinUnlocks):null;
    seed=seed===undefined?'BO-'+Date.now():String(seed);
    var levels={};Object.keys(HANDS).forEach(function(k){levels[k]=deckId==='scholar'?2:1;});
    var s={version:1,seed:seed,rng:hash(seed),nextId:1,deckId:deckId,stake:stakeId,stakeIndex:stakeById[stakeId].index,phase:'select',ante:1,blindIndex:0,round:0,money:deckId==='yellow'?14:4,hands:0,discards:0,handSize:8,jokerSlots:5,consumableSlots:2,target:0,score:0,hand:[],drawPile:[],discardPile:[],cards:[],jokers:[],consumables:[],levels:levels,vouchers:{},tags:[],doubleTags:0,skips:0,unusedDiscards:0,handSizeBonus:0,handsBonus:0,discardsBonus:0,tarotsUsed:0,planetTypes:{},ectoplasms:0,antePlayed:[],roundHandBonus:0,endless:false,shop:{items:[],rerollCost:5,voucher:null,packs:[]},pack:null,payout:{lines:[],total:0},lastResult:{name:'',chips:0,mult:0,total:0,glassBroken:0,lines:[]},log:[],stats:{handsPlayed:0,discardsUsed:0,cardsPlayed:0,cardsDiscarded:0,blindsWon:0,moneyEarned:0,bestHand:0,highestAnte:1,handCounts:{}}};
    if(meta)enableProgression(s,options.playerLevel);
    setHandSort(s,Object.prototype.hasOwnProperty.call(options,'handSortMode')?options.handSortMode:'rank');
    setLevel10Deal(s,Object.prototype.hasOwnProperty.call(options,'level10Deal')?options.level10Deal:false);s.handDrawOrder=[];
    if(coinUnlocks!==null)s.coinUnlocks=coinUnlocks;
    if(deckId==='magic')s.vouchers.crystal_ball=true;if(deckId==='nebula')s.vouchers.telescope=true;if(deckId==='zodiac'){s.vouchers.tarot_merchant=true;s.vouchers.planet_merchant=true;s.vouchers.overstock=true;}
    SUITS.forEach(function(whichSuit){for(var rank=2;rank<=14;rank++){if(deckId==='abandoned'&&rank>=11&&rank<=13)continue;var c=newCard(s,deckId==='erratic'?int(s,13)+2:rank,deckId==='erratic'?pick(s,SUITS):deckId==='checkered'?(whichSuit==='C'?'S':whichSuit==='D'?'H':whichSuit):whichSuit);if(deckId==='prism')c.enhancement='wild';if(deckId==='sprout'&&rank<=5)c.enhancement='bonus';s.cards.push(c);}});
    s.startingDeckSize=s.cards.length;s.bossId=pickBoss(s);s.blindTags=[pick(s,tags).id,pick(s,tags).id];refresh(s);
    if(deckId==='magic'){addConsumable(s,'fool');addConsumable(s,'fool');}if(deckId==='ghost')addConsumable(s,'hex');note(s,'Started '+decks.find(function(d){return d.id===deckId;}).name+'. Seed: '+seed);return s;
  }
  function applyDebuffs(s,reward) {var newlyDebuffed=false;s.cards.forEach(function(c){var before=!!c.debuffed;c.debuffed=false;if(activeBoss(s,'club')&&suit(c,'C',s)||activeBoss(s,'goad')&&suit(c,'S',s)||activeBoss(s,'window')&&suit(c,'D',s)||activeBoss(s,'head')&&suit(c,'H',s)||activeBoss(s,'plant')&&face(s,c)||activeBoss(s,'pillar')&&s.antePlayed.indexOf(c.id)>=0||activeBoss(s,'verdant_leaf'))c.debuffed=true;if(c.debuffed&&!before)newlyDebuffed=true;});if(reward&&newlyDebuffed)recordBossEffect(s,s.bossId,'debuff-application');}
  function draw(s,n,afterPlay) {var concealed=false;for(var i=0;i<n&&s.drawPile.length;i++){var c=s.drawPile.pop(),before=!!c.faceDown;c.faceDown=!!(activeBoss(s,'house')&&s.roundHands===0&&s.roundDiscards===0||activeBoss(s,'fish')&&afterPlay||activeBoss(s,'wheel')&&chance(s,7)||activeBoss(s,'mark')&&face(s,c));if(c.faceDown&&!before)concealed=true;s.hand.push(c);}if(concealed)recordBossEffect(s,s.bossId,'face-down-draw');applyDebuffs(s,true);if(activeBoss(s,'cerulean_bell')&&s.hand.length){s.forcedCardId=pick(s,handInDrawOrder(s)).id;recordBossEffect(s,'cerulean_bell','forced-selection');}else s.forcedCardId=null;sortHand(s);}
  function refill(s,afterPlay) {refresh(s);var serpent=activeBoss(s,'serpent'),before=s.hand.length;draw(s,serpent?3:Math.max(0,s.handSize-s.hand.length),afterPlay);if(serpent&&s.hand.length>before)recordBossEffect(s,'serpent','draw-override');}
  function meaningfulPotionBoss(s) {
    if(!bossById[s.bossId]||!activeBoss(s,s.bossId))return false;
    if(s.bossId==='amber_acorn')return s.jokers.length>=2;
    if(s.bossId==='crimson_heart')return s.jokers.some(isJokerActive);
    if(s.bossId==='water')return s.discards>0;
    if(s.bossId==='needle')return s.hands>1;
    if(s.bossId==='manacle')return summary(Object.assign({},s,{bossDisabled:true})).handSize>1;
    if(s.bossId==='club'||s.bossId==='goad'||s.bossId==='window'||s.bossId==='head')return s.cards.some(function(c){return suit(c,{club:'C',goad:'S',window:'D',head:'H'}[s.bossId],s);});
    if(s.bossId==='plant'||s.bossId==='mark')return s.cards.some(function(c){return face(s,c);});
    if(s.bossId==='pillar')return s.cards.some(function(c){return s.antePlayed.indexOf(c.id)>=0;});
    if(s.bossId==='wall'||s.bossId==='violet_vessel')return blindInfo(s).target>blindInfo(Object.assign({},s,{bossDisabled:true})).target;
    return s.cards.length>0;
  }
  function tryPotionBossDisable(s) {
    var e=s.potions&&Potions&&Potions.current(s.potions,s.potionNow===undefined?0:s.potionNow);
    if(!e||!Potions.hasEffect(e,'boss_disabler')||!meaningfulPotionBoss(s))return;
    // Deliberately NOT chance(): this fixed rate ignores every listed luck source.
    var hit=random(s)<.05;
    s.potionBossDisable={uid:e.uid,round:s.round,bossId:s.bossId,expiresAt:e.expiresAt,success:hit};
    if(hit){s.target=blindInfo(s).target;refresh(s);note(s,'Boss Disabler Potion: temporarily disabled '+bossById[s.bossId].name+'.');}
  }
  function startBlind(s) {
    phase(s,['select']);if(s.potionBossDisable)delete s.potionBossDisable;s.phase='play';s.round++;s.roundBlindLevelFactor={round:s.round,ante:s.ante,blindIndex:s.blindIndex,factor:playerBlindFactor(s)};s.score=0;s.bossDisabled=false;s.target=blindInfo(s).target;s.roundHands=0;s.roundDiscards=0;s.roundTypes={};s.firstRoundHand=null;s.roundHandBonus=0;s.oxHand=topHand(s);s.payout={lines:[],total:0};s.forcedCardId=null;
    s.jokers.forEach(function(j){j.disabled=false;if(j.id==='hit_the_road'&&isJokerActive(j))j.counter=1;});
    s.tags=s.tags.filter(function(t){if(t.id==='juggle'){s.roundHandBonus+=3;return false;}return true;});refresh(s);var v=summary(s);s.hands=v.handsPerRound;s.discards=v.discardsPerRound;
    if(s.blindIndex===2)tryPotionBossDisable(s);
    s.cards.forEach(function(c){delete c.faceDown;delete c.debuffed;});s.drawPile=shuffle(s,s.cards.slice());s.hand=[];s.handDrawOrder=[];s.discardPile=[];
    if(s.progressionEnabled===true||has(s,'mothim'))s.metaBossStart={round:s.round,handPenalty:activeBoss(s,'needle')?Math.max(0,v.handsPerRound-1):0,discardPenalty:activeBoss(s,'water')?v.discardsPerRound:0};
    if(activeBoss(s,'water')){if(s.discards>0)recordBossEffect(s,'water','discard-limit');s.discards=0;}
    if(activeBoss(s,'needle')){if(s.hands>1)recordBossEffect(s,'needle','hand-limit');s.hands=1;}
    if(activeBoss(s,'amber_acorn')){shuffle(s,s.jokers);if(s.jokers.length>=2)recordBossEffect(s,'amber_acorn','joker-shuffle');}
    if((activeBoss(s,'wall')||activeBoss(s,'violet_vessel'))&&s.target>blindInfo(Object.assign({},s,{bossDisabled:true})).target)recordBossEffect(s,s.bossId,'target-increase');
    // Freeze topology after Amber Acorn. Generators do not enroll their new
    // Jokers; destroyed sources/targets/intermediates never retarget or execute.
    var startBindings=captureJokerBindings(s);
    eachAbility(s,startBindings,'blindStart',function(j){
      if(j.id==='ceremonial_dagger'){var at=s.jokers.findIndex(function(x){return x.uid===j.uid;}),victim=s.jokers[at+1];if(victim&&!victim.eternal){var value=sellValue(victim);if(destroyJoker(s,victim))j.counter+=2*value;}}
      if(j.id==='marble_joker'){var stone=newCard(s,int(s,13)+2,pick(s,SUITS));stone.enhancement='stone';addCard(s,stone);shuffle(s,s.drawPile);}
      if(j.id==='burglar'){s.hands+=3;s.discards=0;if(s.metaBossStart&&s.metaBossStart.round===s.round)s.metaBossStart.discardPenalty=0;}
      if(j.id==='madness'&&s.blindIndex<2){j.counter+=0.5;var others=s.jokers.filter(function(x){return x.uid!==j.uid&&!x.eternal;});if(others.length)destroyJoker(s,pick(s,others));}
      if(j.id==='riff_raff'){for(var k=0;k<2;k++){refresh(s);if(s.jokers.length<s.jokerSlots)addJoker(s,randomJoker(s,'common').id);}}
      if(j.id==='cartomancer')addConsumable(s,randomConsumable(s,'tarot').id);
      if(j.id==='certificate'){var c=newCard(s,int(s,13)+2,pick(s,SUITS));c.seal=pick(s,Object.keys(SEALS));addCard(s,c,'hand');}
    });
    applyMetaBossBonus(s);refresh(s);if(activeBoss(s,'manacle')&&s.handSize<summary(Object.assign({},s,{bossDisabled:true})).handSize)recordBossEffect(s,'manacle','hand-size-limit');draw(s,Math.max(0,s.handSize-s.hand.length),false);note(s,'Started '+blindInfo(s).name+' ($'+blindInfo(s).reward+').');
  }
  function applyMetaBossBonus(s) {
    if(s.progressionEnabled===true&&s.playerLevel>=20&&s.phase==='play'&&s.blindIndex===2&&s.metaBossBonusRound!==s.round){s.hands++;s.discards++;s.metaBossBonusRound=s.round;}
  }
  function rememberLegacyBossStart(s) {
    if(s.phase!=='play'||s.blindIndex!==2||s.metaBossStart&&s.metaBossStart.round===s.round)return;
    var v=summary(s),burglars=abilityCount(s,captureJokerBindings(s),'blindStart','burglar'),bonus=s.metaBossBonusRound===s.round?1:0,startHands=s.hands+(s.roundHands||0)-bonus;
    // Old saves lack start history. Refund only identifiable penalties, not
    // resources Chicot prevented removing or Burglars deliberately discarded.
    s.metaBossStart={round:s.round,handPenalty:activeBoss(s,'needle')&&startHands===1+3*burglars?Math.max(0,v.handsPerRound-1):0,discardPenalty:activeBoss(s,'water')&&!burglars&&s.discards===bonus&&startHands<=v.handsPerRound?v.discardsPerRound:0};
  }
  function setPlayerLevel(s,n) {
    validPlayerLevel(n);
    if(s.progressionEnabled!==true)enableProgression(s,n);
    rememberLegacyBossStart(s);s.playerLevel=n;refresh(s);applyMetaBossBonus(s);refreshPendingInterest(s);refreshPendingRoundBonus(s);
    if(s.phase==='play'){
      if(s.blindIndex===2&&(s.bossId==='wall'||s.bossId==='violet_vessel'))s.target=blindInfo(s).target;
      if(!activeBoss(s,'cerulean_bell'))s.forcedCardId=null;
      else if(!s.hand.some(function(c){return c.id===s.forcedCardId;}))s.forcedCardId=s.hand.length?s.hand[0].id:null;
      if(has(s,'chicot')){s.cards.forEach(function(c){c.faceDown=false;});s.jokers.forEach(function(j){j.disabled=false;});}
      applyDebuffs(s);
    }
    refreshPrices(s);
  }
  function refreshPotionMetadata(s,previousInterestDivisor) {
    refresh(s);refreshPrices(s);
    // Only a real 5↔3 potion transition reprices the pending bill. Neutral clock
    // sync must not award retroactive interest on unrelated market bank changes.
    if(previousInterestDivisor!==potionEffects(s).interestDivisor)refreshPendingInterest(s);
    if(s.phase!=='play')return;
    if(s.blindIndex===2&&(s.bossId==='wall'||s.bossId==='violet_vessel'))s.target=blindInfo(s).target;
    // Administrative expiry/restoration never draws, selects randomly, replays
    // start penalties, re-conceals cards, heals HP, or pays Level 19 batches.
    if(!activeBoss(s,'cerulean_bell'))s.forcedCardId=null;
    else if(!s.hand.some(function(c){return c.id===s.forcedCardId;}))s.forcedCardId=s.hand.length?s.hand[0].id:null;
    applyDebuffs(s);
  }
  function setPotionState(s,state,now) {
    check(Potions,'Load the potion model before the engine.');
    check(potionEligible(s)||Object.prototype.hasOwnProperty.call(s,'potions'),'Reach player level 12 to use potions.');
    var incoming=Potions.normalize(state),previousInterestDivisor=potionEffects(s).interestDivisor;Potions.effectsAt(incoming,now);
    s.potions=s.potions?Potions.recover(s.potions,incoming):incoming;s.potionNow=now;
    refreshPotionMetadata(s,previousInterestDivisor);
  }
  function drinkPotion(s,inventoryUid,now,options) {
    phase(s,['select','play','shop','pack','cashout','won','lost']);
    check(Potions,'Load the potion model before the engine.');
    check(potionEligible(s)||Object.prototype.hasOwnProperty.call(s,'potions'),'Reach player level 12 to use potions.');
    var previousInterestDivisor=potionEffects(s).interestDivisor,result=Potions.drink(s.potions,inventoryUid,now,options);
    s.potions=result.state;s.potionNow=now;refreshPotionMetadata(s,previousInterestDivisor);
    if(s.phase==='play'&&Potions.hasEffect(result.effect,'turtle'))draw(s,Math.max(0,s.handSize-s.hand.length),s.roundHands>0);
    note(s,'Drank '+Potions.CATALOG.find(function(p){return p.id===result.effect.potionId;}).name+'.');
  }
  // Shared restoration, not a victory or player-reward spend. Only the recorded
  // start penalties are refunded; expired Perishable stickers stay expired.
  function disableBossAndRestore(s) {
    rememberLegacyBossStart(s);s.bossDisabled=true;
    if(s.bossId==='needle')s.hands+=s.metaBossStart.handPenalty;
    if(s.bossId==='water')s.discards+=s.metaBossStart.discardPenalty;
    s.forcedCardId=null;s.jokers.concat(s.jokerReserve||[]).forEach(function(j){j.disabled=false;});
    s.cards.forEach(function(c){c.faceDown=false;});s.target=blindInfo(s).target;refresh(s);applyDebuffs(s);
    if(s.bossId==='manacle')draw(s,Math.max(0,s.handSize-s.hand.length),false);
    refreshPrices(s);
  }
  function disableBossOnce(s) {
    check(s.progressionEnabled===true&&s.playerLevel>=12,'Reach player level 12 to disable a Boss.');
    check(!s.metaBossDisableUsed,'The once-per-run Boss disable has already been used.');
    check(bossById[s.bossId]&&activeBoss(s,s.bossId),'Choose an active Boss Blind during play.');
    disableBossAndRestore(s);s.metaBossDisableUsed=true;note(s,'Disabled this Boss with the once-per-run player reward.');
  }
  function mothimAttack(s,index) {
    check(canMothimAttack(s,index),'Choose an active owned Mothim with HP during an active Boss Blind.');
    var j=s.jokers[index];j.hp=mothimHP(j)-1;disableBossAndRestore(s);
    note(s,'Mothim disabled '+bossById[s.bossId].name+': '+j.hp+' HP remaining.');
    // A true sale pays normal value and notifies Campfire. No destruction,
    // special cash shortcut, player-reward use, sell XP or free replacement.
    if(j.hp===0)sellJoker(s,s.jokers.findIndex(function(x){return x.uid===j.uid;}));
  }
  function queueBuffoonPack(s) {
    if(s.tagPackQueue===undefined)s.tagPackQueue=[];
    check(Array.isArray(s.tagPackQueue),'Invalid pending Tag pack queue.');
    s.tagPackQueue.push({packId:'mega_buffoon',tagId:'buffoon'});
  }
  function grantTag(s,id,noDouble,immediatePack) {var copies=1;if(id!=='double'&&!noDouble&&s.doubleTags){copies+=s.doubleTags;s.doubleTags=0;}for(var x=0;x<copies;x++){
    if(id==='double'){s.doubleTags++;continue;}if(id==='handy')addMoney(s,s.stats.handsPlayed);else if(id==='garbage')addMoney(s,s.unusedDiscards||0);else if(id==='speed')addMoney(s,5*s.skips);else if(id==='economy')addMoney(s,Math.min(40,Math.max(0,s.money)));
    else if(id==='orbital')level(s,pick(s,availableHandKeys(s)),3);else if(id==='boss')s.bossId=pickBoss(s);else if(id==='top_up'){for(var i=0;i<2;i++){refresh(s);if(s.jokers.length<s.jokerSlots)addJoker(s,randomJoker(s,'common').id);}}
    else if(id==='buffoon'&&immediatePack)queueBuffoonPack(s);
    else s.tags.push({id:id,uid:uid(s,'t')});note(s,'Gained '+tagById[id].name+'.');}}
  function skipBlind(s) {
    phase(s,['select']);check(Number.isInteger(s.blindIndex)&&s.blindIndex>=0&&s.blindIndex<2,'Only Small and Big Blinds can be skipped.');
    var id=s.blindTags[s.blindIndex];s.skips++;progressEvent(s,'blind-skip',5,{ante:s.ante,blindIndex:s.blindIndex});
    grantTag(s,id,false,true);nextBlind(s);
    if(id==='buffoon')openNextTagPack(s,'select');
  }
  function suppliesAllSuits(s,cards) {function match(i,used){if(i===4)return true;for(var k=0;k<cards.length;k++)if(!cards[k].debuffed&&used.indexOf(k)<0&&suit(cards[k],SUITS[i],s)&&match(i+1,used.concat(k)))return true;return false;}return match(0,[]);}
  // An affected hand pays each active Matador once, at its normal scoring turn.
  // Blocked hands bypass normal scoring and use the same idempotent hook.
  // Vanilla excludes The Hook/The Tooth and debuffed non-scoring kickers.
  function payMatador(s,r,b,lines) {if(!r.bossTriggered||r.matadorPaid[b.source.uid])return;r.matadorPaid[b.source.uid]=true;addMoney(s,8);lines.push(abilityLabel(b)+': +$8');}
  function scoreHand(s,cards,r,bindings,frenzyContext,batteryChips) {
    var scoringTriggers=0,scoringCards=[];
    var lines=[],critEvents=[],critTotals=null,chips,mult,potion=potionEffects(s),scored=r.indices.map(function(i){return cards[i];}),held=s.hand.filter(function(c){return cards.indexOf(c)<0;}),firstFace;
    function C(n,label){chips=finite(chips+n);if(n)lines.push(label+' +'+n+' Chips');}function M(n,label){mult=finite(mult+n);if(n)lines.push(label+' +'+n+' Mult');}function X(n,label){mult=finite(mult*n);if(n!==1)lines.push(label+' X'+Number(n.toFixed(4))+' Mult');}
    function addCritTotal(cardId,lineIndex){var group=critTotals.find(function(g){return g.cardId===cardId;});if(group)group.totalCount++;else critTotals.push({cardId:cardId,firstLine:lineIndex,totalCount:1});}
    function CRIT(card,label){var lineIndex=lines.length;X(2,label);if(critEvents.length<512)critEvents.push({cardId:card.id,lineIndex:lineIndex});else{if(!critTotals){critTotals=[];critEvents.forEach(function(event){addCritTotal(event.cardId,event.lineIndex);});}addCritTotal(card.id,lineIndex);}}
    if(has(s,'splash'))scored=cards.slice();
    // Boss effects precede on-play upgrades. One physical-order pass is crucial:
    // Vampire before DNA removes copied enhancement; DNA before Vampire retains it.
    if(activeBoss(s,'arm')){if(s.levels[r.key]>1){r.bossTriggered=true;recordBossEffect(s,'arm','hand-level-loss');}level(s,r.key,-1);}
    eachAbility(s,bindings,'onPlay',function(j,b){switch(j.id){
      case 'space_joker':if(chance(s,4)){level(s,r.key,1);lines.push(abilityLabel(b)+': level up');}break;
      case 'ride_the_bus':j.counter=scored.some(function(c){return face(s,c);})?0:j.counter+1;break;
      case 'runner':if(r.contains.straight)j.counter+=15;break;case 'green_joker':j.counter++;break;
      case 'double_green_joker':j.counter+=2;break;
      case 'square_joker':if(cards.length===4)j.counter+=4;break;case 'spare_trousers':if(r.contains.two_pair)j.counter+=2;break;
      // Preserve the established native clock policy: forbidden/debuffed hands
      // do not tick Loyalty. Copies read this real counter, never tick it.
      case 'loyalty_card':j.counter++;break;case 'obelisk':j.counter=r.previousCount>=r.previousMax?1:j.counter+0.2;break;
      case 'dna':if(s.roundHands===1&&cards.length===1)addCard(s,copyCard(s,cards[0]),'hand');break;
      case 'sixth_sense':if(s.roundHands===1&&cards.length===1&&cards[0].rank===6){destroyCards(s,cards);scored=[];addConsumable(s,randomConsumable(s,'spectral').id);}break;
      // Preserve pre-scoring Vagabond generation/slot competition; scoring-time
      // money cannot cancel eligibility. To Do List ordering remains physical.
      case 'vagabond':if(s.money<=4)addConsumable(s,randomConsumable(s,'tarot').id);break;
      case 'to_do_list':if(j.targetHand===r.key)addMoney(s,4);break;
      case 'midas_mask':scored.forEach(function(c){if(!c.debuffed&&face(s,c))c.enhancement='gold';});break;
      case 'vampire':scored.forEach(function(c){if(!c.debuffed&&c.enhancement){c.enhancement=null;j.counter+=0.1;}});break;
    }});
    var h=HANDS[r.key],lv=s.levels[r.key]-1;chips=h[1]+lv*h[3];mult=h[2]+lv*h[4];if(activeBoss(s,'flint')){chips=Math.max(1,Math.ceil(chips/2));mult=Math.max(1,Math.ceil(mult/2));r.bossTriggered=true;recordBossEffect(s,'flint','base-score-halved');}lines.unshift(r.name+' level '+s.levels[r.key]+': '+chips+' Chips × '+mult+' Mult');
    firstFace=scored.find(function(c){return !c.debuffed&&face(s,c);});
    scored.forEach(function(c,scoredIndex){if(c.debuffed){if(activeBoss(s,s.bossId)&&['club','goad','window','head','plant','pillar','verdant_leaf'].indexOf(s.bossId)>=0)r.bossTriggered=true;lines.push(describeCard(c).split('\n')[0]+': debuffed');return;}
      var triggers=1+(c.seal==='red'?1:0);
      // Queue additive repeats once, never recursively re-run the providers.
      eachAbility(s,bindings,'playedRetrigger',function(j){
        if(j.id==='hack'&&c.rank>=2&&c.rank<=5&&c.enhancement!=='stone'||j.id==='sock_and_buskin'&&face(s,c)||j.id==='seltzer'&&j.counter>0||j.id==='dusk'&&s.hands===0)triggers++;
        if(j.id==='hanging_chad'&&scoredIndex===0)triggers+=2;
      });
      // Only this physical scoring loop charges Frenzy. Keep at most one row
      // per selected/scoring card, not an unbounded per-retrigger receipt list.
      var scoringRow=frenzyContext?{cardId:c.id,firstTrigger:scoringTriggers+1,triggers:0}:null;if(scoringRow)scoringCards.push(scoringRow);
      for(var t=0;t<triggers;t++){
        if(scoringRow){check(scoringTriggers<Number.MAX_SAFE_INTEGER,'Physical scoring-trigger count is exhausted.');scoringTriggers++;scoringRow.triggers++;}
        var label=(RANK_NAMES[c.rank]||c.rank)+' '+SUIT_NAMES[c.suit]+(t?' retrigger':'');C(c.enhancement==='stone'?50:rankChips(c),label);C(c.bonusChips||0,'Permanent bonus');
        if(c.enhancement==='bonus')C(30,'Bonus');if(c.enhancement==='mult')M(4,'Mult card');if(c.enhancement==='glass')X(2,'Glass');
        if(c.enhancement==='lucky'){var lucky=false;if(chance(s,5)){M(20,'Lucky');lucky=true;}if(chance(s,15)){addMoney(s,20);lines.push('Lucky: +$20');lucky=true;}if(lucky)s.jokers.forEach(function(j){if(j.id==='lucky_cat'&&isJokerActive(j))j.counter+=0.25;});}
        if(c.seal==='gold'){addMoney(s,3);lines.push('Gold Seal: +$3');}
        if(c.edition==='foil')C(50,'Foil');if(c.edition==='holo')M(10,'Holographic');if(c.edition==='poly')X(1.5,'Polychrome');
        if(potion.cardMult)M(potion.cardMult,'Mult Potion');if(potion.cardChips)C(potion.cardChips,'Chips Potion');
        var baseCrit=permanentCrit(s)+potion.baseCritChance;if(baseCrit&&chance(s,1/baseCrit))CRIT(c,(permanentCrit(s)?'Level 32'+(potion.baseCritChance?' + Potion':''):potion.gamingHP!==null?'Gaming Potion':'Critical Potion')+' CRIT!');
        eachAbility(s,bindings,'scored',function(j,b){var ranked=c.enhancement!=='stone',label=abilityLabel(b);switch(j.id){
          case 'greedy_joker':if(suit(c,'D',s))M(3,label);break;case 'lusty_joker':if(suit(c,'H',s))M(3,label);break;case 'wrathful_joker':if(suit(c,'S',s))M(3,label);break;case 'gluttonous_joker':if(suit(c,'C',s))M(3,label);break;
          case 'eight_ball':if(ranked&&c.rank===8&&chance(s,4))addConsumable(s,randomConsumable(s,'tarot').id);break;
          case 'fibonacci':if(ranked&&[14,2,3,5,8].indexOf(c.rank)>=0)M(8,label);break;case 'scary_face':if(face(s,c))C(30,label);break;
          case 'even_steven':if(ranked&&[2,4,6,8,10].indexOf(c.rank)>=0)M(4,label);break;case 'odd_todd':if(ranked&&[14,3,5,7,9].indexOf(c.rank)>=0)C(31,label);break;
          case 'scholar':if(ranked&&c.rank===14){C(20,label);M(4,label);}break;case 'business_card':if(face(s,c)&&chance(s,2))addMoney(s,2);break;
          case 'hiker':c.bonusChips=(c.bonusChips||0)+5;lines.push(label+': card permanently gains +5 Chips');break;case 'photograph':if(c===firstFace)X(2,label);break;
          case 'walkie_talkie':if(ranked&&(c.rank===10||c.rank===4)){C(10,label);M(4,label);}break;case 'smiley_face':if(face(s,c))M(5,label);break;
          case 'golden_ticket':if(c.enhancement==='gold')addMoney(s,4);break;case 'rough_gem':if(suit(c,'D',s))addMoney(s,1);break;case 'bloodstone':if(suit(c,'H',s)&&chance(s,2))X(1.5,label);break;
          case 'arrowhead':if(suit(c,'S',s))C(50,label);break;case 'onyx_agate':if(suit(c,'C',s))M(7,label);break;
          // Native banks observe actual triggers; copies only read the final bank.
          case 'wee_joker':if(ranked&&c.rank===2)j.counter+=8;break;
          case 'krillistic':if(ranked&&(c.rank===10||c.rank===3))j.counter+=10;break;
          case 'venipede_joker':if(ranked&&c.rank===5)j.counter+=2;break;
          case 'mantis':if(ranked&&c.rank===6)j.counter+=6;break;
          case 'triboulet':if(ranked&&(c.rank===12||c.rank===13))X(2,label);break;
          case 'ancient_joker':if(suit(c,j.targetSuit,s))X(1.5,label);break;
          case 'the_idol':if(ranked&&c.rank===j.targetRank&&suit(c,j.targetSuit,s))X(2,label);break;
          // One seeded attempt per real card trigger/emitter, including copies.
          // This is not a held, on-play, independent or preview event.
          case 'critical_joker':if(chance(s,25))CRIT(c,label+' CRIT!');break;
        }});
      }
    });
    var lowestHeld=held.filter(function(c){return c.enhancement!=='stone';}).reduce(function(low,c){return !low||c.rank<=low.rank?c:low;},null);
    held.forEach(function(c){if(c.debuffed)return;var repeats=(c.seal==='red'?1:0)+abilityCount(s,bindings,'heldRetrigger','mime'),eligible=false;
      for(var t=0;t===0||eligible&&t<=repeats;t++){
        // A held repeat queue exists only if an initial effect actually fired.
        // Failed Parking rolls alone do not unlock Red Seal / Mime reroll attempts.
        if(c.enhancement==='steel'){X(1.5,'Held Steel');eligible=true;}
        eachAbility(s,bindings,'held',function(j,b){var label=abilityLabel(b);
          if(j.id==='raised_fist'&&c===lowestHeld){M(2*rankChips(c),label);eligible=true;}
          if(j.id==='baron'&&c.enhancement!=='stone'&&c.rank===13){X(1.5,label);eligible=true;}
          if(j.id==='shoot_the_moon'&&c.enhancement!=='stone'&&c.rank===12){M(13,label);eligible=true;}
          if(j.id==='reserved_parking'&&face(s,c)&&chance(s,2)){addMoney(s,1);eligible=true;}
        });
      }
    });
    var conds={jolly_joker:['pair',8],zany_joker:['three',12],mad_joker:['two_pair',10],crazy_joker:['straight',12],droll_joker:['flush',10]},chipConds={sly_joker:['pair',50],wily_joker:['three',100],clever_joker:['two_pair',80],devious_joker:['straight',100],crafty_joker:['flush',80]},xConds={the_duo:['pair',2],the_trio:['three',3],the_family:['four',4],the_order:['straight',3],the_tribe:['flush',2]};
    // https://balatrowiki.org/w/Guide:_Activation_Sequence : additive edition,
    // independent ability, Baseball (even on debuffed Uncommons), then Poly.
    bindings.order.forEach(function(source,index){var def=jokerById[source.id],sourceLabel=def.name,active=isJokerActive(source),b=bindings.bindings[index];
      if(active){if(source.edition==='foil')C(50,sourceLabel+' Foil');if(source.edition==='holo')M(10,sourceLabel+' Holographic');}
      if(bindingLive(s,b)&&eventAllowed(b,'independent')){
      var j=b.ability,label=abilityLabel(b);
      if(conds[j.id]&&r.contains[conds[j.id][0]])M(conds[j.id][1],label);if(chipConds[j.id]&&r.contains[chipConds[j.id][0]])C(chipConds[j.id][1],label);if(xConds[j.id]&&r.contains[xConds[j.id][0]])X(xConds[j.id][1],label);
      switch(j.id){case 'joker':M(4,label);break;case 'half_joker':if(cards.length<=3)M(20,label);break;case 'joker_stencil':X(Math.max(1,summary(s).jokerSlots-s.jokers.length+count(s,'joker_stencil')),label);break;
        case 'banner':C(30*s.discards,label);break;case 'mystic_summit':if(!s.discards)M(15,label);break;case 'loyalty_card':if(j.counter%6===0)X(4,label);break;case 'misprint':M(int(s,24),label);break;
        case 'steel_joker':X(1+0.2*s.cards.filter(function(c){return c.enhancement==='steel';}).length,label);break;case 'abstract_joker':M(3*s.jokers.length,label);break;case 'gros_michel':M(15,label);break;
        case 'supernova':M(s.stats.handCounts[r.key]||0,label);break;case 'ride_the_bus':case 'green_joker':case 'double_green_joker':case 'venipede_joker':case 'red_card':case 'flash_card':case 'popcorn':case 'spare_trousers':case 'ceremonial_dagger':M(j.counter,label);break;
        case 'runner':case 'ice_cream':case 'square_joker':case 'castle':case 'wee_joker':case 'krillistic':case 'mantis':C(j.counter,label);break;
        case 'royal_joker':if(r.royalFlush)M(30,label);break;
        case 'dragon':if(r.royalFlush)C(400,label);break;
        case 'big_spender':M(Math.floor(Math.max(0,-s.money)/5),label);break;
        case 'triplet_rhythm':if(cards.length===3&&cards.every(function(c){return c.rank===3&&c.enhancement!=='stone';}))X(3,label);break;
        case 'blackboard':if(held.every(function(c){return suit(c,'S',s)||suit(c,'C',s);}))X(3,label);break;case 'blue_joker':C(2*s.drawPile.length,label);break;
        case 'constellation':case 'madness':case 'vampire':case 'hologram':case 'lucky_cat':case 'ramen':case 'campfire':case 'glass_joker':case 'hit_the_road':case 'canio':case 'yorick':case 'obelisk':X(j.counter,label);break;
        case 'matador':payMatador(s,r,b,lines);break;
        case 'superposition':if(r.contains.straight&&scored.some(function(c){return !c.debuffed&&c.rank===14&&c.enhancement!=='stone';}))addConsumable(s,randomConsumable(s,'tarot').id);break;
        case 'seance':if(r.key==='straight_flush')addConsumable(s,randomConsumable(s,'spectral').id);break;
        case 'cavendish':X(3,label);break;case 'card_sharp':if((s.roundTypes[r.key]||0)>1)X(3,label);break;case 'erosion':M(4*Math.max(0,s.startingDeckSize-s.cards.length),label);break;
        case 'fortune_teller':M(s.tarotsUsed,label);break;case 'stone_joker':C(25*s.cards.filter(function(c){return c.enhancement==='stone';}).length,label);break;case 'bull':C(2*Math.max(0,s.money),label);break;
        case 'acrobat':if(s.hands===0)X(3,label);break;case 'swashbuckler':M(s.jokers.reduce(function(n,other){return n+(other.uid===j.uid?0:sellValue(other));},0),label);break;
        case 'throwback':X(1+0.25*s.skips,label);break;case 'flower_pot':if(suppliesAllSuits(s,scored))X(3,label);break;
        case 'seeing_double':var cs=scored.filter(function(c){return !c.debuffed;});if(cs.some(function(c,i){return suit(c,'C',s)&&cs.some(function(d,k){return i!==k&&(suit(d,'H',s)||suit(d,'D',s)||suit(d,'S',s));});}))X(2,label);break;
        case 'stuntman':C(250,label);break;case 'drivers_license':if(s.cards.filter(function(c){return !!c.enhancement;}).length>=16)X(3,label);break;case 'bootstraps':M(2*Math.floor(Math.max(0,s.money)/5),label);break;
      }
      }
      // Physical subjects retain their rarity, even when debuffed. Each real or
      // copied Baseball is a separate observer, not a new Uncommon subject.
      if(def.rarity==='uncommon')eachAbility(s,bindings,'baseball',function(observer,binding){if(observer.id==='baseball_card')X(1.5,abilityLabel(binding));});
      if(active&&source.edition==='poly')X(1.5,sourceLabel+' Polychrome');
    });
    if(owned(s,'observatory'))s.consumables.forEach(function(c){if(c.type==='planet'&&c.hand===r.key)X(1.5,'Observatory');});
    if(s.deckId==='plasma'){chips=mult=Math.floor(chips/2+mult/2);lines.push('Plasma balance: '+chips+' Chips × '+mult+' Mult');}
    if(potion.daylightMult)M(potion.daylightMult,'Daylight Potion');
    var deal=level10DealActive(s);
    if(deal){chips=finite(chips*1.05);lines.push('Level 10 deal X1.05 Chips');X(1.01,'Level 10 deal');}
    // Threshold crossing is an atomic hand event at the supplied start-of-play
    // clock. The triggering hand receives the final boost; excess scores are
    // ignored, not banked, and cannot restart its anchored ten-second window.
    var frenzyReceipt=frenzyContext?commitFrenzy(s,frenzyContext,scoringTriggers,scoringCards):null;
    if(frenzyReceipt&&frenzyReceipt.active){mult=finite(mult*1.5);lines.push('Frenzy X1.5 FINAL Mult');}
    // Flat Chips AFTER all chip transformations. Never a trigger or a Mult change.
    if(batteryChips)C(batteryChips,'Emerald battery '+batteryChips+'%');
    // Keep the original final stages AND battery visible in capped retrigger logs.
    var resultLines=deal&&lines.length>250?lines.slice(0,248).concat(lines.slice(-2)):lines.slice(0,250);
    if((frenzyReceipt||batteryChips)&&lines.length>250){var tail=(potion.daylightMult?1:0)+(deal?2:0)+(frenzyReceipt&&frenzyReceipt.active?1:0)+(batteryChips?1:0);if(tail)resultLines=lines.slice(0,250-tail).concat(lines.slice(-tail));}
    var total=finite(Math.floor(chips*mult)),result={name:r.name,key:r.key,handLevel:lv+1,chips:chips,mult:mult,total:total,lines:resultLines};
    if(frenzyReceipt){result.scoringTriggers=scoringTriggers;result.scoringCards=scoringCards;result.frenzy=frenzyReceipt;}
    if(critEvents.length)result.critEvents=critEvents;if(critTotals)result.critTotals=critTotals;return result;
  }
  // Cash-out bonuses occur AFTER Perishable expiry. Round-end lifecycle hooks
  // (e.g. fifth-round Popcorn destruction) still resolve on the final live round.
  function activeAtCashout(j) {return isJokerActive(j)&&!(j.perishable&&j.perishTally<=1);}
  function cashoutCount(s,id) {return s.jokers.filter(function(j){return j.id===id&&activeAtCashout(j);}).length;}
  function normalInterest(s,moons) {if(s.deckId==='green')return 0;var cap=owned(s,'money_tree')?20:owned(s,'seed_money')?10:5;return Math.min(cap,Math.floor(Math.max(0,s.money)/potionEffects(s).interestDivisor))*(1+moons);}
  function refreshPendingInterest(s) {
    if(s.progressionEnabled!==true&&!s.potions||s.phase!=='cashout')return;
    // Preserve the original Moon eligibility before Perishable expiry. Never
    // replay rental/lifecycle hooks or pay money while updating a pending bill.
    if(!s.metaCashoutInterest||s.metaCashoutInterest.round!==s.round)s.metaCashoutInterest={round:s.round,moons:count(s,'to_the_moon')};
    var old=0,at=-1,lines=s.payout.lines.filter(function(l,i){if(l.label!=='Interest')return true;old+=l.amount;if(at<0)at=i;return false;});
    var amount=s.progressionEnabled!==true||s.playerLevel>=3?normalInterest(s,s.metaCashoutInterest.moons):0;
    if(amount>0){if(at<0){at=1;while(at<lines.length&&(lines[at].label==='Remaining hands'||lines[at].label==='Remaining discards'))at++;}lines.splice(at,0,{label:'Interest',amount:amount});}
    s.payout.lines=lines;s.payout.total+=amount-old;
  }
  function level23RoundBonus(s) {return s.progressionEnabled===true&&s.playerLevel>=23?1:0;}
  function metaRoundBonus(s) {return s.progressionEnabled===true&&s.playerLevel>=35?2:0;}
  function refreshPendingRoundBonus(s) {
    if(s.progressionEnabled!==true||s.phase!=='cashout')return;
    // A pending bill only: no income, XP, RNG, Rental or lifecycle replay.
    var old=0,at=-1,lines=s.payout.lines.filter(function(l,i){if(l.label!=='Level 35 bonus'&&l.label!=='Level 23 bonus')return true;old+=l.amount;if(at<0)at=i;return false;}),amount=metaRoundBonus(s)+level23RoundBonus(s);
    if(amount>0){if(at<0){at=1;while(at<lines.length&&['Remaining hands','Remaining discards','Interest'].indexOf(lines[at].label)>=0)at++;}if(metaRoundBonus(s))lines.splice(at,0,{label:'Level 35 bonus',amount:metaRoundBonus(s)});if(level23RoundBonus(s))lines.splice(at,0,{label:'Level 23 bonus',amount:level23RoundBonus(s)});}
    s.payout.lines=lines;s.payout.total+=amount-old;
  }
  function receiveBossPotionDrop(s,probability) {
    if(!probability)return;
    var state=s.potions||Potions.create(),sequence=s.potionDropSeq||0;
    check(Number.isSafeInteger(sequence)&&sequence>=0&&sequence<Number.MAX_SAFE_INTEGER,'Invalid potion drop sequence.');s.potionDropSeq=sequence+1;
    // Last RNG work in round completion: native lifecycle rolls keep their old
    // position; eligibility/luck was captured before physical Perishable expiry.
    if(random(s)>=probability)return;
    var pool=Potions.DROP_CATALOG||Potions.CATALOG,def=pool[int(s,pool.length)],now=s.potionNow===undefined?0:s.potionNow;
    var receipt='boss:'+hash(String(s._uiId||s.seed))+':'+s.round+':'+s.potionDropSeq+':'+(state.sequence+1);
    var result=Potions.receiveDrop(state,def.id,receipt,now);
    s.potions=result.state;if(s.potionNow===undefined)s.potionNow=now;
    if(result.received)note(s,'Boss potion drop: '+def.name+'.');
  }
  function snapshotRoundDeal(s,outcome) {
    if(s.level10DealSettlement&&s.level10DealSettlement.round===s.round)return s.level10DealSettlement.amount;
    var amount=level10DealActive(s)?3:0;s.level10DealSettlement={round:s.round,outcome:outcome,amount:amount};
    if(outcome==='loss'&&amount){addMoney(s,-amount);note(s,'Level 10 deal: paid $3 at round end.');}
    return amount;
  }
  function finishRound(s) {
    var dealTax=snapshotRoundDeal(s,'win'),potion=potionEffects(s),drop=Potions&&potionEligible(s)&&s.blindIndex===2&&(!s.potions||!s.potions.blockedReason&&s.potions.inventory.length<Potions.MAX_INVENTORY)?Math.min(.5,listedLuckMultiplier(s)/10):0;
    s.phase='cashout';s.stats.blindsWon++;s.unusedDiscards=(s.unusedDiscards||0)+s.discards;var lines=[{label:'Blind reward',amount:blindInfo(s).reward}],boss=s.blindIndex===2,rentalCost=0;
    if(s.progressionEnabled===true){progressEvent(s,'blind-win',[3,5,10][s.blindIndex]*s.ante,{ante:s.ante,blindIndex:s.blindIndex});if(boss){s.stats.bossesWon++;s.stats.highestAnteDefeated=Math.max(s.stats.highestAnteDefeated,s.ante);}}
    // Rental charges are unconditional, before interest/payout, and can go into
    // debt. Charge before removing any end-round self-destructing rental Joker.
    // https://balatrowiki.org/w/Rental
    s.jokers.forEach(function(j){if(j.rental){addMoney(s,-3);rentalCost+=3;note(s,'Rental: paid $3 for '+jokerById[j.id].name+'.');}});
    function pay(label,amount){if(amount>0)lines.push({label:label,amount:Math.floor(amount)});}
    var moons=cashoutCount(s,'to_the_moon');if(s.progressionEnabled===true)s.metaCashoutInterest={round:s.round,moons:moons};
    pay('Remaining hands',s.hands*(s.deckId==='green'?2:1));if(s.deckId==='green')pay('Remaining discards',s.discards);else if(s.progressionEnabled!==true||s.playerLevel>=3)pay('Interest',normalInterest(s,moons));
    pay('Level 23 bonus',level23RoundBonus(s));pay('Level 35 bonus',metaRoundBonus(s));if(s.deckId==='copper')pay('Copper Deck',2);pay('Money Potion',potion.roundMoney);
    // Held-card end-of-round triggers resolve before expiry (the foundation
    // records Gold money in payout lines), unlike cash-out Joker dollar bonuses.
    var roundEndBindings=captureJokerBindings(s),mimes=abilityCount(s,roundEndBindings,'roundEnd','mime');
    s.hand.forEach(function(c){if(c.debuffed)return;var triggers=1+(c.seal==='red'?1:0)+mimes;if(c.enhancement==='gold')pay('Held Gold card',3*triggers);if(c.seal==='blue'&&s.lastResult.key){var p=planets.find(function(p){return p.hand===s.lastResult.key;});for(var t=0;t<triggers;t++)addConsumable(s,p.id);}});
    s.jokers.slice().forEach(function(j){if(!isJokerActive(j))return;var label=jokerById[j.id].name;switch(j.id){case 'delayed_gratification':if(activeAtCashout(j)&&s.roundDiscards===0)pay(label,2*s.discards);break;case 'golden_joker':if(activeAtCashout(j))pay(label,4);break;case 'cloud_nine':if(activeAtCashout(j))pay(label,s.cards.filter(function(c){return c.rank===9&&c.enhancement!=='stone';}).length);break;case 'rocket':if(boss)j.counter+=2;if(activeAtCashout(j))pay(label,j.counter);break;case 'satellite':if(activeAtCashout(j))pay(label,Object.keys(s.planetTypes).length);break;case 'egg':j.sellBonus+=3;break;case 'gift_card':s.jokers.concat(s.consumables).forEach(function(x){x.sellBonus=(x.sellBonus||0)+1;});break;case 'turtle_bean':j.counter--;break;case 'popcorn':j.counter-=4;break;case 'gros_michel':if(!j.eternal&&chance(s,6)){j.remove=true;s.grosMichelExtinct=true;note(s,'Gros Michel went extinct.');}break;case 'cavendish':if(!j.eternal&&chance(s,1000))j.remove=true;break;case 'campfire':if(boss)j.counter=1;break;case 'mail_in_rebate':j.targetRank=int(s,13)+2;break;case 'castle':j.targetSuit=pick(s,SUITS);break;case 'ancient_joker':j.targetSuit=pick(s,SUITS.filter(function(whichSuit){return whichSuit!==j.targetSuit;}));break;case 'the_idol':retargetIdol(s,j);break;case 'invisible_joker':j.counter++;break;case 'to_do_list':j.targetHand=pick(s,availableHandKeys(s));break;}});
    s.jokers.forEach(function(j){if(j.perishable){j.perishTally=Math.max(0,(j.perishTally===undefined?5:j.perishTally)-1);if(j.perishTally===0)j.permanentDisabled=true;}});
    s.jokers=s.jokers.filter(function(j){return j.eternal||!j.remove&&!((j.id==='popcorn'||j.id==='turtle_bean')&&j.counter<=0);});
    if(boss){s.tags=s.tags.filter(function(t){if(t.id==='investment'){pay('Investment Tag',25);return false;}return true;});if(s.deckId==='anaglyph')grantTag(s,'double',true);}
    if(dealTax)lines.push({label:'Level 10 deal',amount:-dealTax});
    s.payout={lines:lines,total:lines.reduce(function(n,l){return n+l.amount;},0)};if(rentalCost)s.payout.rentalCost=rentalCost;note(s,'Blind defeated. Cashout: $'+s.payout.total+'.');
    if(s.potionBossDisable)delete s.potionBossDisable;
    receiveBossPotionDrop(s,drop);
  }
  function abandon(s) {phase(s,['select','play','cashout','shop','pack']);if(s.phase==='play')snapshotRoundDeal(s,'loss');s.phase='lost';s.abandoned=true;note(s,'Run abandoned at Ante '+s.ante+'.');}
  function maybeLose(s) {if(s.hands<=0||s.hand.length===0&&s.drawPile.length===0){var bones=s.jokers.find(function(j){return j.id==='mr_bones'&&isJokerActive(j);});if(bones&&s.score>=s.target/4){note(s,'Mr. Bones prevented defeat.');finishRound(s);destroyJoker(s,bones);}else {s.phase='lost';snapshotRoundDeal(s,'loss');note(s,'Run ended at Ante '+s.ante+'.');}}}
  // Optional transient battery input is NOT part of Frenzy's strict context or a save.
  // Invalid/unavailable input contributes zero; never trust cached run.playerLevel.
  function finalBatteryChips(value,actualLevel){try{
    if(!Number.isInteger(actualLevel)||actualLevel<10||actualLevel>100||!value||Object.getPrototypeOf(value)!==Object.prototype)return 0;
    var keys=Reflect.ownKeys(value);if(keys.length!==2||keys.indexOf('emeraldLevel')<0||keys.indexOf('batteryPercent')<0)return 0;
    var e=Object.getOwnPropertyDescriptor(value,'emeraldLevel'),b=Object.getOwnPropertyDescriptor(value,'batteryPercent');
    if(!e||!b||!e.enumerable||!b.enumerable||!Object.prototype.hasOwnProperty.call(e,'value')||!Object.prototype.hasOwnProperty.call(b,'value'))return 0;
    return Number.isInteger(e.value)&&e.value>=2&&e.value<=10&&Number.isInteger(b.value)&&b.value>=0&&b.value<=100?b.value:0;
  }catch(_){return 0}}
  function play(s,ids,options,battery) {
    // Legacy two-argument callers never gain Frenzy scoring authority from a
    // cached run level. The app supplies the actual profile level and one clock.
    var context=null,actualLevel;if(options!==undefined){check(Frenzy,'Load the Frenzy model before the engine.');context=Frenzy.context(options);actualLevel=context.actualLevel;if(context.actualLevel<33)context=null;}
    phase(s,['play']);check(s.hands>0,'No hands remain.');var cards=selected(s,ids,s.hand,selectionLimit(s,actualLevel),1),r=evaluateRun(s,cards);
    if(s.levels[r.key]===undefined&&(r.key==='double_triple'||r.key==='six'))s.levels[r.key]=1;
    var forbidden=activeBoss(s,'psychic')&&cards.length!==5?'The Psychic requires exactly 5 cards.':activeBoss(s,'eye')&&s.roundTypes[r.key]?'The Eye forbids repeating a poker hand.':activeBoss(s,'mouth')&&s.firstRoundHand&&s.firstRoundHand!==r.key?'The Mouth only allows '+HANDS[s.firstRoundHand][0]+'.':null;
    check(!activeBoss(s,'cerulean_bell')||ids.indexOf(s.forcedCardId)>=0,'Include the card selected by Cerulean Bell.');
    if(activeBoss(s,'crimson_heart')){s.jokers.forEach(function(j){j.disabled=false;});var candidates=s.jokers.filter(isJokerActive);if(candidates.length){pick(s,candidates).disabled=true;recordBossEffect(s,'crimson_heart','joker-disabled');}applyDebuffs(s,true);}
    // Freeze physical order/UID bindings once after Crimson Heart, not counters.
    var handBindings=captureJokerBindings(s);
    // Obelisk compares against history BEFORE this hand increments its count.
    r.previousCount=s.stats.handCounts[r.key]||0;r.previousMax=Object.keys(HANDS).reduce(function(n,key){return Math.max(n,s.stats.handCounts[key]||0);},0);
    r.matadorPaid={};r.bossTriggered=!!forbidden;if(forbidden)recordBossEffect(s,s.bossId,'hand-prohibited');
    var gamingHp=potionEffects(s).gamingHP,gamingDead=false;
    if(gamingHp!==null){var remainingHp=Math.max(0,gamingHp-cards.length);s.potions=Potions.patchActiveHp(s.potions,remainingHp,s.potionNow);gamingDead=remainingHp===0;}
    s.hands--;s.roundHands++;s.stats.handsPlayed++;s.stats.cardsPlayed=(s.stats.cardsPlayed||0)+cards.length;s.stats.handCounts[r.key]=(s.stats.handCounts[r.key]||0)+1;s.roundTypes[r.key]=(s.roundTypes[r.key]||0)+1;if(!s.firstRoundHand)s.firstRoundHand=r.key;
    // One committed selection, not scoring cards/retriggers. Keep this before
    // hand-level / win receipts, and before Gaming death ends the active potion.
    progressEvent(s,'hand-play',cards.length,{cards:cards.length});
    if(activeBoss(s,'ox')&&r.key===s.oxHand){if(s.money>0)r.bossTriggered=true;if(s.money!==0)recordBossEffect(s,'ox','bank-reset');s.money=0;}if(activeBoss(s,'tooth')){s.money-=cards.length;recordBossEffect(s,'tooth','played-card-loss');}
    s.lastResult=forbidden?{name:r.name,key:r.key,handLevel:s.levels[r.key],chips:0,mult:0,total:0,lines:[forbidden,'Hand consumed: scores 0.']}:scoreHand(s,cards,r,handBindings,context,finalBatteryChips(battery,actualLevel));
    if(forbidden&&context){s.lastResult.scoringTriggers=0;s.lastResult.scoringCards=[];s.lastResult.frenzy=commitFrenzy(s,context,0,[]);}
    s.score=finite(s.score+s.lastResult.total);s.stats.bestHand=Math.max(s.stats.bestHand,s.lastResult.total);
    cards.forEach(function(c){if(s.antePlayed.indexOf(c.id)<0)s.antePlayed.push(c.id);c.faceDown=false;});
    var playedIds=cards.map(function(c){return c.id;});s.hand=s.hand.filter(function(c){return playedIds.indexOf(c.id)<0;});cards.forEach(function(c){if(s.cards.some(function(x){return x.id===c.id;}))s.discardPile.push(c);});
    // Count only actual end-of-hand Glass breaks, never cards already destroyed
    // by Sixth Sense or another effect earlier in this hand.
    var broken=cards.filter(function(c){return !forbidden&&!c.debuffed&&c.enhancement==='glass'&&s.cards.some(function(x){return x.id===c.id;})&&chance(s,4);});s.lastResult.glassBroken=broken.length;if(broken.length){destroyCards(s,broken);s.lastResult.lines.push(broken.length+' Glass card(s) broke.');}
    s.jokers.forEach(function(j){if(!isJokerActive(j))return;if(j.id==='ice_cream')j.counter-=5;if(j.id==='seltzer')j.counter--;});s.jokers=s.jokers.filter(function(j){return j.eternal||!((j.id==='ice_cream'||j.id==='seltzer')&&j.counter<=0);});
    note(s,r.name+': '+s.lastResult.total+' Chips.');
    // Forbidden hands emit only Matador cash, never independent scoring or editions.
    if(forbidden)eachAbility(s,handBindings,'independent',function(j,b){if(j.id==='matador')payMatador(s,r,b,s.lastResult.lines);});
    if(gamingDead){s.potions=Potions.endActive(s.potions,s.potionNow,'gaming-death');s.phase='lost';snapshotRoundDeal(s,'loss');if(s.potionBossDisable)delete s.potionBossDisable;note(s,'Gaming Potion: 0 HP. Run lost before Boss rewards.');return;}
    if(s.score>=s.target){finishRound(s);return;}
    if(activeBoss(s,'hook')){var victims=shuffle(s,handInDrawOrder(s)).slice(0,2);discardCards(s,victims,false);if(victims.length)recordBossEffect(s,'hook','forced-discard');}
    refill(s,true);maybeLose(s);
  }
  function discardCards(s,cards,trigger) {
    if(trigger){var discardBindings=captureJokerBindings(s);eachAbility(s,discardBindings,'discard',function(j){switch(j.id){case 'green_joker':j.counter=Math.max(0,j.counter-1);break;case 'double_green_joker':j.counter=Math.max(0,j.counter-2);break;case 'faceless_joker':if(cards.filter(function(c){return face(s,c);}).length>=3)addMoney(s,5);break;case 'mail_in_rebate':addMoney(s,5*cards.filter(function(c){return c.rank===j.targetRank&&c.enhancement!=='stone';}).length);break;case 'ramen':j.counter=Math.max(1,j.counter-cards.length*0.01);break;case 'castle':j.counter+=3*cards.filter(function(c){return suit(c,j.targetSuit,s);}).length;break;case 'hit_the_road':j.counter+=0.5*cards.filter(function(c){return c.rank===11&&c.enhancement!=='stone';}).length;break;case 'yorick':j.discarded=(j.discarded||0)+cards.length;while(j.discarded>=23){j.discarded-=23;j.counter++;}break;case 'burnt_joker':if(s.roundDiscards===1)level(s,evaluateRun(s,cards).key,1);break;case 'trading_card':if(s.roundDiscards===1&&cards.length===1){destroyCards(s,cards);addMoney(s,3);}break;}});
      cards.forEach(function(c){if(c.seal==='purple'&&!c.debuffed)addConsumable(s,randomConsumable(s,'tarot').id);});s.jokers=s.jokers.filter(function(j){return j.eternal||!(j.id==='ramen'&&j.counter<=1);});}
    var ids=cards.map(function(c){return c.id;});s.hand=s.hand.filter(function(c){return ids.indexOf(c.id)<0;});cards.forEach(function(c){c.faceDown=false;if(s.cards.some(function(x){return x.id===c.id;}))s.discardPile.push(c);});
  }
  function discard(s,ids,options) {phase(s,['play']);check(s.discards>0,'No discards remain.');var cards=selected(s,ids,s.hand,selectionLimit(s,selectionActualLevel(options)),1);s.discards--;s.roundDiscards++;s.stats.discardsUsed++;s.stats.cardsDiscarded=(s.stats.cardsDiscarded||0)+cards.length;discardCards(s,cards,true);refill(s,false);maybeLose(s);note(s,'Discarded '+cards.length+' card(s).');}
  // https://balatrowiki.org/w/Card_modifiers#Appearance_rates
  // Natural Negative stays 0.3%; Hone/Glow replace, rather than multiply each other.
  function editionWeights(s,kind) {
    // Illusion's sourced total is 20%, independent of Hone/Glow. The exact
    // conditional edition split is unverified: retain the old 3:20:20 ratio,
    // rather than inventing/claiming vanilla weights. No Illusion => plain.
    if(kind==='shop_card')return owned(s,'illusion')?{negative:0,poly:0.2*3/43,holo:0.2*20/43,foil:0.2*20/43,base:0.8}:{negative:0,poly:0,holo:0,foil:0,base:1};
    var boost=owned(s,'glow_up')?4:owned(s,'hone')?2:1,n=kind==='standard'?0:3,p=kind==='standard'?12*boost:6*boost-3,h=(kind==='standard'?28:14)*boost,f=(kind==='standard'?40:20)*boost;
    return {negative:n/1000,poly:p/1000,holo:h/1000,foil:f/1000,base:(1000-n-p-h-f)/1000};
  }
  function edition(s,kind) {var weights=editionWeights(s,kind),r=random(s),end=0,ids=['negative','poly','holo','foil'];for(var i=0;i<ids.length;i++){end+=weights[ids[i]];if(r<end)return ids[i];}return null;}
  // Wheel/Aura guaranteed-edition weights, not the natural shop distribution.
  function effectEdition(s) {var r=random(s);return r<0.5?'foil':r<0.85?'holo':'poly';}
  function packItem(s) {var total=PACKS.reduce(function(n,p){return n+p.weight;},0),roll=random(s)*total;for(var i=0;i<PACKS.length;i++){roll-=PACKS[i].weight;if(roll<0)return PACKS[i];}return PACKS[PACKS.length-1];}
  function shopDollarPrice(s,base) {return base===0?0:Math.max(0,base-(s.progressionEnabled===true&&s.playerLevel>=24?1:0));}
  function bossRerollCost(s) {return shopDollarPrice(s,10);}
  function price(s,base) {return Math.max(1,Math.floor(base*(owned(s,'liquidation')?0.5:owned(s,'clearance_sale')?0.75:1)));}
  function itemPrice(s,item) {if(has(s,'astronomer')&&(item.type==='planet'||item.type==='pack'&&packById[item.id].type==='planet'))return 0;return item.price;}
  // Omitted payment is native Bank. Explicit Bank accepts old inert level hints;
  // no other source (including Card), inherited source or source getter can pay.
  function bankPayment(payment) {
    if(payment===undefined)return;
    var d=payment&&typeof payment==='object'&&!Array.isArray(payment)&&Object.getOwnPropertyDescriptor(payment,'source');
    check(d&&d.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&d.value==='bank','Only Bank payments are supported.');
  }
  function payFor(s,amount,payment) {bankPayment(payment);check(Number.isFinite(amount)&&amount>=0,'Invalid purchase price.');check(s.money-amount>=-creditLimit(s),'Not enough money.');s.money-=amount;if(s.phase==='shop')progressEvent(s,'shop-spend',amount,{dollars:amount});}
  // Read-only live-price/consent snapshot. Never hydrate the caller or draw RNG.
  function purchaseQuote(s,kind,index) {
    check(s&&s.version===1,'Invalid purchase run.');validateLegacyWallet(s);validatePassiveMoney(s);
    var n=clone(s);hydrate(n);var item,amount,label;
    if(kind==='item'||kind==='item-use'){phase(n,['shop']);check(Number.isInteger(index)&&n.shop.items[index]&&!n.shop.items[index].sold,'Choose an available shop item.');item=n.shop.items[index];if(kind==='item-use')check(consumableById[item.id]&&['tarot','planet'].indexOf(item.type)>=0&&consumableById[item.id].type===item.type,'Only shop Tarot and Planet cards can be used immediately.');amount=itemPrice(n,item);label=item.name;}
    else if(kind==='pack'){phase(n,['shop']);check(Number.isInteger(index)&&n.shop.packs[index]&&!n.shop.packs[index].sold,'Choose an available pack.');item=n.shop.packs[index];check(packById[item.id],'Unknown Booster Pack.');amount=itemPrice(n,{type:'pack',id:item.id,price:item.price});label=item.name;}
    else if(kind==='voucher'){phase(n,['shop']);item=n.shop.voucher;check(item&&!item.sold&&voucherById[item.id]&&!owned(n,item.id),'No voucher is available.');check(!UPGRADES[item.id]||owned(n,UPGRADES[item.id]),'Buy the first-tier voucher first.');amount=item.price;label=item.name;}
    else if(kind==='reroll'){phase(n,['shop']);amount=n.shop.rerollCost;label='Shop reroll';}
    else if(kind==='boss'){phase(n,['select','shop']);check(owned(n,'directors_cut')||owned(n,'retcon'),"Director's Cut or Retcon is required.");check(owned(n,'retcon')||!n.bossRerolled,'The Boss has already been rerolled this Ante.');amount=bossRerollCost(n);label='Boss reroll';}
    else check(false,'Unknown run-cash purchase.');
    check(Number.isFinite(amount)&&amount>=0,'Invalid purchase price.');
    // Ignore heartbeat clocks, XP mirrors and log text, but fence every purchase
    // price, inventory, RNG, phase, capacity, purse and native credit dependency.
    var token=JSON.stringify([n._uiId||null,n.deckId,n.stake,kind,index===undefined?null:index,n.phase,n.ante,n.round,n.blindIndex,n.rng,n.nextId,n.progressionEnabled===true,n.playerLevel||null,n.money,n.wallet||null,n.shop,n.vouchers,n.jokers,n.jokerReserve||[],n.consumables,n.coinUnlocks||[],n.jokerSlots,n.consumableSlots,n.bossRerolled===true,n.bossId]);
    if(kind==='item-use')token=JSON.stringify([token,n.cards,n.levels,n.lastConsumable,n.tarotsUsed,n.planetTypes]);
    return {kind:kind,index:index===undefined?null:index,price:amount,label:label,token:token};
  }
  function jokerItem(s,rarity,forcedEdition) {var def=randomJoker(s,rarity),ed=forcedEdition===undefined?edition(s):forcedEdition;return rollShopStickers(s,{type:'joker',id:def.id,name:def.name,description:def.description,rarity:def.rarity,edition:ed,price:price(s,def.price+(ed==='foil'?2:ed==='holo'?3:ed==='poly'||ed==='negative'?5:0))});}
  function cardItem(s,standard) {var c=newCard(s,int(s,13)+2,pick(s,SUITS));c.edition=edition(s,standard?'standard':'shop_card');if(!standard&&owned(s,'illusion')&&random(s)<0.4)c.enhancement=pick(s,Object.keys(ENHANCEMENTS));if(!standard&&owned(s,'illusion')&&random(s)<0.2)c.seal=pick(s,Object.keys(SEALS));return {type:'card',id:c.id,name:(RANK_NAMES[c.rank]||c.rank)+' of '+SUIT_NAMES[c.suit],description:describeCard(c),card:c,price:price(s,1)};}
  function shelfWeights(s) {var weights=[{type:'joker',w:20},{type:'tarot',w:owned(s,'tarot_tycoon')?32:owned(s,'tarot_merchant')?9.6:4},{type:'planet',w:owned(s,'planet_tycoon')?32:owned(s,'planet_merchant')?9.6:4}];if(s.deckId==='ghost')weights.push({type:'spectral',w:2});if(owned(s,'magic_trick'))weights.push({type:'card',w:4});return weights;}
  function shelfItem(s) {var weights=shelfWeights(s),roll=random(s)*weights.reduce(function(n,x){return n+x.w;},0),type='joker';for(var i=0;i<weights.length;i++){roll-=weights[i].w;if(roll<0){type=weights[i].type;break;}}
    if(type==='joker'){var r=random(s);return jokerItem(s,r<0.7?'common':r<0.95?'uncommon':'rare');}if(type==='card')return cardItem(s);var c=clone(randomConsumable(s,type));c.price=price(s,c.price);return c;
  }
  function rerollCost(s,n) {var base=s.shop&&s.shop.baseRerollCost!==undefined?s.shop.baseRerollCost:5;return Math.max(0,Math.max(0,base-(owned(s,'reroll_surplus')?2:0)-(owned(s,'reroll_glut')?2:0))+(n||0)-(s.progressionEnabled===true&&s.playerLevel>=24?1:0));}
  function refreshPrices(s) {
    if(!s.shop)return;
    (s.shop.packs||[]).forEach(function(p){check(!!packById[p.id],'Unknown booster pack: '+p.id);});
    (s.shop.items||[]).concat(s.shop.packs||[],s.shop.voucher?[s.shop.voucher]:[],s.shop.voucherQueue||[]).forEach(function(i){if(i.basePrice===undefined)i.basePrice=i.price;var free=has(s,'astronomer')&&(i.type==='planet'||packById[i.id]&&packById[i.id].type==='planet');i.price=free?0:shopDollarPrice(s,i.basePrice);});
    if(s.phase==='shop')s.shop.rerollCost=s.shop.freeRerolls?0:rerollCost(s,s.shop.rerolls);
  }
  function generateShop(s) {
    var items=[],num=2+(owned(s,'overstock')?1:0)+(owned(s,'overstock_plus')?1:0);for(var i=0;i<num;i++)items.push(shelfItem(s));var candidates=vouchers.filter(function(v){return !owned(s,v.id)&&(!UPGRADES[v.id]||owned(s,UPGRADES[v.id]));});
    if(!s.anteVoucher||s.anteVoucher.ante!==s.ante)s.anteVoucher={ante:s.ante,id:candidates.length?pick(s,candidates).id:null,sold:false};
    var voucher=s.anteVoucher.id&&!s.anteVoucher.sold&&!owned(s,s.anteVoucher.id)?clone(voucherById[s.anteVoucher.id]):null;if(voucher){voucher.price=price(s,10);voucher.baseVoucher=true;}var packs=[clone(packItem(s)),clone(packItem(s))];if(!s.shopsVisited)packs[0]=clone(packById.buffoon);s.shopsVisited=(s.shopsVisited||0)+1;packs.forEach(function(p){p.price=price(s,p.price);});
    var coupon=false,d6=0,voucherQueue=[];s.tags=s.tags.filter(function(t){var id=t.id;if(['uncommon','rare','negative','foil','holo','poly'].indexOf(id)>=0){var item=jokerItem(s,id==='uncommon'||id==='rare'?id:undefined,['negative','foil','holo','poly'].indexOf(id)>=0?id:undefined);item.price=0;items.push(item);return false;}
      var packIds={standard:'mega_standard',charm:'mega_arcana',meteor:'mega_celestial',buffoon:'mega_buffoon',ethereal:'spectral'};if(packIds[id]){var p=clone(packById[packIds[id]]);p.price=0;packs.push(p);return false;}if(id==='voucher'){var available=candidates.filter(function(v){return (!voucher||v.id!==voucher.id)&&!voucherQueue.some(function(q){return q.id===v.id;});});if(available.length){var extra=clone(pick(s,available));extra.price=price(s,10);voucherQueue.push(extra);}return false;}if(id==='coupon'){coupon=true;return false;}if(id==='d6'){d6++;return false;}return true;});
    if(!voucher&&voucherQueue.length)voucher=voucherQueue.shift();
    if(coupon){items.forEach(function(i){i.price=0;});packs.forEach(function(p){p.price=0;});}
    s.shop={items:items,packs:packs,voucher:voucher,voucherQueue:voucherQueue,rerolls:0,baseRerollCost:d6?0:5,freeRerolls:count(s,'chaos_the_clown'),rerollCost:0};s.shop.rerollCost=s.shop.freeRerolls?0:rerollCost(s,0);refreshPrices(s);
  }
  function cashout(s) {phase(s,['cashout']);addMoney(s,s.payout.total);s.jokers.forEach(function(j){j.disabled=false;});s.roundHandBonus=0;s.firstRoundHand=null;if(s.ante===8&&s.blindIndex===2&&!s.endless){s.phase='won';note(s,'Eight Antes complete! Continue explicitly for endless mode.');return;}nextBlind(s);s.phase='shop';generateShop(s);}
  function continueRun(s) {phase(s,['won']);s.endless=true;nextBlind(s);s.phase='shop';generateShop(s);note(s,'Endless mode: Ante '+s.ante+'.');}
  function leaveShop(s) {phase(s,['shop']);var exitBindings=captureJokerBindings(s);eachAbility(s,exitBindings,'shopExit',function(j){if(j.id==='perkeo'&&s.consumables.length){var original=pick(s,s.consumables),c=clone(original);c.uid=uid(s,'u');c.edition='negative';s.consumables.push(c);}});s.phase='select';s.hand=[];s.drawPile=[];s.discardPile=[];s.firstRoundHand=null;}
  function acquire(s,item) {if(item.type==='joker'){check(jokerById[item.id]&&coinJokerEligible(s,jokerById[item.id]),'This Joker has not been coin-unlocked.');acquireStickers(addJoker(s,item.id,item.edition),item);return;}if(item.type==='card'){check(item.card,'Playing card data is missing.');var c=clone(item.card);if(s.cards.some(function(x){return x.id===c.id;}))c.id=uid(s,'c');addCard(s,c,s.phase==='play'?'hand':undefined);return;}check(consumableById[item.id],'Unknown shop item.');check(addConsumable(s,item.id,item.edition==='negative'),'No free consumable slots.');}
  function buy(s,index,payment) {bankPayment(payment);phase(s,['shop']);check(Number.isInteger(index)&&s.shop.items[index],'Choose an available shop item.');var item=s.shop.items[index];check(!item.sold,'This item has already been bought.');var cost=itemPrice(s,item);acquire(s,item);payFor(s,cost,payment);if(item.type==='joker')progressEvent(s,'joker-buy',3,{jokerId:item.id});item.sold=true;refreshPrices(s);note(s,'Bought '+item.name+' for $'+cost+'.');}
  // One atomic action: native debit first, then the SAME consumable effect.
  // A transient owned card never requires or steals a held inventory slot;
  // generated cards still obey the real post-consumption capacity checks.
  function buyUse(s,index,ids,payment) {
    bankPayment(payment);phase(s,['shop']);check(Number.isInteger(index)&&s.shop.items[index]&&!s.shop.items[index].sold,'Choose an available shop item.');
    var item=s.shop.items[index],def=consumableById[item.id];check(def&&['tarot','planet'].indexOf(item.type)>=0&&def.type===item.type,'Only shop Tarot and Planet cards can be used immediately.');
    var cost=itemPrice(s,item);payFor(s,cost,payment);var c=consumable(s,item.id);if(item.edition==='negative')c.edition='negative';var at=s.consumables.length;s.consumables.push(c);
    item.sold=true;refreshPrices(s);note(s,'Bought '+item.name+' for $'+cost+'.');useConsumable(s,at,ids);
  }
  function reroll(s,payment) {phase(s,['shop']);payFor(s,s.shop.rerollCost,payment);if(s.shop.freeRerolls>0)s.shop.freeRerolls--;else s.shop.rerolls++;var n=2+(owned(s,'overstock')?1:0)+(owned(s,'overstock_plus')?1:0);s.shop.items=[];for(var i=0;i<n;i++)s.shop.items.push(shelfItem(s));s.shop.rerollCost=s.shop.freeRerolls>0?0:rerollCost(s,s.shop.rerolls);s.jokers.forEach(function(j){if(j.id==='flash_card'&&isJokerActive(j))j.counter+=2;});refreshPrices(s);}
  function buyVoucher(s,payment) {phase(s,['shop']);var v=s.shop.voucher;check(v&&!v.sold,'No voucher is available.');check(voucherById[v.id]&&!owned(s,v.id),'This voucher is already owned.');check(!UPGRADES[v.id]||owned(s,UPGRADES[v.id]),'Buy the first-tier voucher first.');payFor(s,v.price,payment);s.vouchers[v.id]=true;v.sold=true;if(s.anteVoucher&&s.anteVoucher.id===v.id)s.anteVoucher.sold=true;
    if(v.id==='hieroglyph'){s.ante=Math.max(0,s.ante-1);s.handsBonus--;s.bossId=pickBoss(s);}if(v.id==='petroglyph'){s.ante=Math.max(0,s.ante-1);s.discardsBonus--;s.bossId=pickBoss(s);}if(v.id==='overstock'||v.id==='overstock_plus')s.shop.items.push(shelfItem(s));
    if(['clearance_sale','liquidation'].indexOf(v.id)>=0){var ratio=v.id==='liquidation'&&owned(s,'clearance_sale')?2/3:0.75;s.shop.items.concat(s.shop.packs,s.shop.voucher?[s.shop.voucher]:[],s.shop.voucherQueue||[]).forEach(function(i){if(!i.sold&&(i.basePrice===undefined?i.price:i.basePrice)>0)i.price=i.basePrice=Math.max(1,Math.floor((i.basePrice===undefined?i.price:i.basePrice)*ratio));});}
    s.shop.rerollCost=s.shop.freeRerolls?0:rerollCost(s,s.shop.rerolls);refreshPrices(s);note(s,'Redeemed '+v.name+'.');if(s.shop.voucherQueue&&s.shop.voucherQueue.length)s.shop.voucher=s.shop.voucherQueue.shift();}
  // The Soul: Arcana/Spectral; Black Hole: Celestial/Spectral (including Omen).
  // Each eligible special occupies a disjoint 0.3% outcome; neither is Oops-boosted.
  // Exact vanilla internal roll ordering is not claimed; duplicate rules still apply.
  function packConsumable(s,type,used) {var showman=has(s,'showman'),special=(type==='tarot'?['soul']:type==='planet'?['black_hole']:['soul','black_hole']).filter(function(id){return showman||used.indexOf(id)<0&&!s.consumables.some(function(c){return c.id===id;});});if(special.length){var roll=random(s);if(roll<0.003*special.length)return consumableById[special[Math.floor(roll/0.003)]];}return randomConsumable(s,type,showman?null:used);}
  // Shared native generation: free Tag rewards use identical pools, stickers,
  // choices and pack-open triggers without payment, shop generation or buy XP.
  function beginPack(s,def,context) {var choices=[],used=[];
    for(var i=0;i<def.count;i++){var choice;if(def.type==='joker'){choice=jokerItem(s,undefined);if(!has(s,'showman')){var tries=0;while(used.indexOf(choice.id)>=0&&tries++<30)choice=jokerItem(s,undefined);}}
      else if(def.type==='card'){choice=cardItem(s,true);choice.card.enhancement=random(s)<0.4?pick(s,Object.keys(ENHANCEMENTS)):null;choice.card.seal=random(s)<0.2?pick(s,Object.keys(SEALS)):null;choice.description=describeCard(choice.card);}
      else {var type=def.type;if(type==='tarot'&&owned(s,'omen_globe')&&random(s)<0.2)type='spectral';if(i===0&&def.type==='planet'&&owned(s,'telescope'))choice=clone(planets.find(function(p){return p.hand===topHand(s);}));else choice=clone(packConsumable(s,type,used));}
      delete choice.sold;choices.push(choice);used.push(choice.id);
    }
    s.pack=Object.assign({name:def.name,id:def.id,choices:choices,remaining:def.choose},context);s.phase='pack';eachAbility(s,captureJokerBindings(s),'packOpen',function(j){if(j.id==='hallucination'&&chance(s,2))addConsumable(s,randomConsumable(s,'tarot').id);});
  }
  function openPack(s,index,payment) {phase(s,['shop']);check(Number.isInteger(index)&&s.shop.packs[index],'Choose an available pack.');var p=s.shop.packs[index];check(!p.sold,'This pack is already open.');var def=packById[p.id];check(def,'Unknown Booster Pack.');payFor(s,itemPrice(s,{type:'pack',id:p.id,price:p.price}),payment);p.sold=true;beginPack(s,def);}
  function openNextTagPack(s,returnPhase) {
    check(returnPhase==='select'||returnPhase==='shop','Invalid Tag pack return phase.');
    check(Array.isArray(s.tagPackQueue)&&s.tagPackQueue.length,'No pending Tag pack is available.');
    var entry=s.tagPackQueue[0];check(entry&&entry.packId==='mega_buffoon'&&entry.tagId==='buffoon','Invalid pending Tag pack.');
    var opened=s.tagPacksOpened===undefined?0:s.tagPacksOpened;
    check(Number.isSafeInteger(opened)&&opened>=0&&opened<Number.MAX_SAFE_INTEGER,'Invalid Tag pack opening counter.');
    s.tagPackQueue.shift();s.tagPacksOpened=opened+1;
    beginPack(s,packById[entry.packId],{source:'tag',tagId:entry.tagId,returnPhase:returnPhase});
  }
  // Explicit legacy redemption only. Hydration and read-only queries never
  // consume old tags or regenerate persisted choices. Unredeemed legacy tags
  // still follow their historical shop path; redemption removes that debt once.
  function openPendingTagPack(s) {
    phase(s,['select','shop']);check(!s.pack,'Finish the current pack first.');var returnPhase=s.phase;
    s.tags=s.tags.filter(function(t){if(t.id==='buffoon'){queueBuffoonPack(s);return false;}return true;});
    openNextTagPack(s,returnPhase);
  }
  function finishPack(s) {
    var tag=s.pack.source==='tag',returnPhase=s.pack.returnPhase||'shop';
    check(returnPhase==='select'||returnPhase==='shop','Invalid pack return phase.');
    s.pack=null;s.phase=returnPhase;
    if(tag&&s.tagPackQueue&&s.tagPackQueue.length)openNextTagPack(s,returnPhase);
  }
  function choosePack(s,index) {phase(s,['pack']);check(s.pack&&s.pack.remaining>0,'No pack choices remain.');if(index===-1){s.jokers.forEach(function(j){if(j.id==='red_card'&&isJokerActive(j))j.counter+=3;});finishPack(s);return;}
    check(Number.isInteger(index)&&s.pack.choices[index],'Choose an available pack card.');var item=s.pack.choices[index];check(!item.chosen,'This pack choice was already taken.');acquire(s,item);item.chosen=true;s.pack.remaining--;if(!s.pack.remaining)finishPack(s);refreshPrices(s);
  }
  function sellJoker(s,index) {
    phase(s,['select','play','shop','pack']);check(Number.isInteger(index)&&s.jokers[index],'Choose an owned Joker.');var j=s.jokers[index];check(!j.eternal,'Eternal Jokers cannot be sold.');
    // Resolve the sold physical emitter before removal; unsold copies do not
    // observe another Joker's self-sale effect. Payment/stickers remain physical.
    var saleBinding=resolveJokerAbility(s.jokers,j.uid),saleAbility=saleBinding&&eventAllowed(saleBinding,'soldSelf')?saleBinding.ability:null;
    addMoney(s,sellValue(j));s.jokers.splice(index,1);
    if(saleAbility&&saleAbility.id==='luchador'&&s.phase==='play'&&s.blindIndex===2)s.bossDisabled=true;if(s.phase==='play'&&s.bossId==='verdant_leaf')s.bossDisabled=true;if(saleAbility&&saleAbility.id==='diet_cola')grantTag(s,'double',true);
    s.jokers.forEach(function(x){if(x.id==='campfire'&&isJokerActive(x))x.counter+=0.25;});
    // Removing a Negative Invisible Joker also removes its slot: check capacity
    // after the sale, before consuming RNG or constructing the duplicate.
    refresh(s);
    if(j.id==='invisible_joker'&&isJokerActive(j)&&j.counter>=2&&s.jokers.length&&s.jokers.length<s.jokerSlots){
      s.jokers.push(copyOwnedJoker(s,pick(s,s.jokers)));
    }
    if(s.phase==='play'&&s.blindIndex===2)s.target=blindInfo(s).target;applyDebuffs(s,true);refreshPrices(s);note(s,'Sold '+jokerById[j.id].name+'.');
  }
  function moveJoker(s,index,direction) {phase(s,['select','play','shop','pack']);check(Number.isInteger(index)&&s.jokers[index],'Choose an owned Joker.');check(direction===-1||direction===1,'Move left or right.');var to=index+direction;check(to>=0&&to<s.jokers.length,'That Joker is already at the edge.');var j=s.jokers[index];s.jokers[index]=s.jokers[to];s.jokers[to]=j;}
  function targetCards(s,ids,min,max) {return selected(s,ids,s.phase==='play'?s.hand:s.cards,max,min);}
  function useConsumable(s,index,ids) {
    phase(s,['select','play','shop']);ids=ids||[];check(Number.isInteger(index)&&s.consumables[index],'Choose an owned consumable.');var c=s.consumables[index],def=consumableById[c.id];check(def,'Unknown consumable.');s.consumables.splice(index,1);refresh(s);var targets,pool=s.phase==='play'?s.hand:s.cards;
    if(def.type==='planet'){level(s,def.hand,1+potionEffects(s).planetBonusLevels);s.planetTypes[def.id]=true;s.jokers.forEach(function(j){if(j.id==='constellation'&&isJokerActive(j))j.counter+=0.1;});}
    else {
      var enhance={magician:['lucky',2],empress:['mult',2],hierophant:['bonus',2],lovers:['wild',1],chariot:['steel',1],justice:['glass',1],devil:['gold',1],tower:['stone',1]},seals={talisman:'gold',deja_vu:'red',trance:'blue',medium:'purple'},suits={star:'D',moon:'C',sun:'H',world:'S'};
      if(enhance[c.id]){targets=targetCards(s,ids,1,enhance[c.id][1]);targets.forEach(function(x){x.enhancement=enhance[c.id][0];});}
      else if(seals[c.id]){targets=targetCards(s,ids,1,1);targets[0].seal=seals[c.id];}
      else if(suits[c.id]){targets=targetCards(s,ids,1,3);targets.forEach(function(x){x.suit=suits[c.id];});}
      else switch(c.id){
        case 'fool':check(s.lastConsumable&&s.lastConsumable!=='fool'&&consumableById[s.lastConsumable].type!=='spectral','No previous Tarot or Planet is available to copy.');check(addConsumable(s,s.lastConsumable),'No free consumable slots.');break;
        case 'high_priestess':case 'emperor':var type=c.id==='emperor'?'tarot':'planet',added=0;for(var i=0;i<2;i++)if(addConsumable(s,randomConsumable(s,type).id))added++;check(added,'No free consumable slots.');break;
        case 'hermit':addMoney(s,Math.min(20,Math.max(0,s.money)));break;
        case 'wheel_of_fortune':var eligible=s.jokers.filter(function(j){return !j.edition;});check(eligible.length,'No uneditioned Joker is available.');if(chance(s,4))pick(s,eligible).edition=effectEdition(s);else note(s,'The Wheel of Fortune: no effect.');break;
        case 'strength':targets=targetCards(s,ids,1,2);targets.forEach(function(x){x.rank=x.rank===14?2:x.rank+1;});break;
        case 'hanged_man':destroyCards(s,targetCards(s,ids,1,2));break;
        case 'death':targets=targetCards(s,ids,2,2);targets.sort(function(a,b){return pool.indexOf(a)-pool.indexOf(b);});var originalId=targets[0].id,copy=clone(targets[1]);Object.keys(targets[0]).forEach(function(k){delete targets[0][k];});Object.assign(targets[0],copy,{id:originalId});break;
        case 'temperance':addMoney(s,Math.min(50,s.jokers.reduce(function(n,j){return n+sellValue(j);},0)));break;
        case 'judgement':addJoker(s,randomJoker(s).id);break;
        case 'familiar':case 'grim':case 'incantation':check(pool.length,'No playing cards are available.');destroyCards(s,[pick(s,s.phase==='play'?handInDrawOrder(s):pool)]);var number=c.id==='familiar'?3:c.id==='grim'?2:4;for(var q=0;q<number;q++){var rank=c.id==='familiar'?11+int(s,3):c.id==='grim'?14:2+int(s,9),nc=newCard(s,rank,pick(s,SUITS));nc.enhancement=pick(s,Object.keys(ENHANCEMENTS).filter(function(e){return e!=='stone';}));addCard(s,nc,s.phase==='play'?'hand':undefined);}break;
        case 'aura':targets=targetCards(s,ids,1,1);check(!targets[0].edition,'Aura requires an uneditioned playing card.');targets[0].edition=effectEdition(s);break;
        case 'wraith':addJoker(s,randomJoker(s,'rare').id);s.money=0;break;
        case 'sigil':check(pool.length,'No playing cards are available.');var whichSuit=pick(s,SUITS);pool.forEach(function(x){x.suit=whichSuit;});break;
        case 'ouija':check(pool.length,'No playing cards are available.');var rank2=int(s,13)+2;pool.forEach(function(x){x.rank=rank2;});s.handSizeBonus--;break;
        case 'ectoplasm':var nonnegative=s.jokers.filter(function(j){return j.edition!=='negative';});check(nonnegative.length,'No eligible Joker is available.');pick(s,nonnegative).edition='negative';s.handSizeBonus-=1+s.ectoplasms;s.ectoplasms++;break;
        case 'immolate':check(pool.length>=5,'Immolate requires at least 5 available cards.');destroyCards(s,shuffle(s,s.phase==='play'?handInDrawOrder(s):pool.slice()).slice(0,5));addMoney(s,20);break;
        case 'ankh':check(s.jokers.length,'Ankh requires a Joker.');check(s.jokers.length<s.jokerSlots,'Ankh needs a free Joker slot.');var keep=pick(s,s.jokers),other=copyOwnedJoker(s,keep);s.jokers=s.jokers.filter(function(j){return j.uid===keep.uid||j.eternal;});refresh(s);check(s.jokers.length<s.jokerSlots,'Ankh needs room for its copied Joker.');s.jokers.push(other);break;
        case 'hex':var plain=s.jokers.filter(function(j){return !j.edition;});check(plain.length,'Hex requires an uneditioned Joker.');var chosen=pick(s,plain);chosen.edition='poly';s.jokers=s.jokers.filter(function(j){return j.uid===chosen.uid||j.eternal;});break;
        case 'cryptid':targets=targetCards(s,ids,1,1);for(var z=0;z<2;z++)addCard(s,copyCard(s,targets[0]),s.phase==='play'?'hand':undefined);break;
        case 'soul':addJoker(s,randomJoker(s,'legendary').id);break;
        case 'black_hole':availableHandKeys(s).forEach(function(k){level(s,k,1);});break;
        default:fail('This consumable effect is not implemented.');
      }
      if(def.type==='tarot'){s.tarotsUsed++;progressEvent(s,'tarot-use',3,{tarotId:def.id});}
    }
    if(c.id!=='fool'&&def.type!=='spectral')s.lastConsumable=c.id;applyDebuffs(s,true);refreshPrices(s);if(s.phase==='play')maybeLose(s);note(s,'Used '+c.name+'.');
  }
  function sellConsumable(s,index) {phase(s,['select','play','shop']);check(Number.isInteger(index)&&s.consumables[index],'Choose an owned consumable.');var c=s.consumables[index];addMoney(s,sellValue(c));s.consumables.splice(index,1);s.jokers.forEach(function(j){if(j.id==='campfire'&&isJokerActive(j))j.counter+=0.25;});note(s,'Sold '+c.name+'.');}
  function rerollBoss(s,payment) {phase(s,['select','shop']);check(owned(s,'directors_cut')||owned(s,'retcon'),"Director's Cut or Retcon is required.");check(owned(s,'retcon')||!s.bossRerolled,'The Boss has already been rerolled this Ante.');payFor(s,bossRerollCost(s),payment);s.bossId=pickBoss(s);s.bossRerolled=true;}
  function describeCard(c) {check(c&&SUIT_NAMES[c.suit],'Unknown playing card.');var lines=[(RANK_NAMES[c.rank]||c.rank)+' of '+SUIT_NAMES[c.suit]];if(c.enhancement)lines.push(ENHANCEMENTS[c.enhancement]||'Unknown enhancement.');else lines.push('Base card: +'+rankChips(c)+' Chips when scored.');if(c.edition)lines.push(EDITIONS[c.edition]||'Unknown edition.');if(c.seal)lines.push(SEALS[c.seal]||'Unknown Seal.');if(c.bonusChips)lines.push('Permanent bonus: +'+c.bonusChips+' Chips when scored.');if(c.debuffed)lines.push('Debuffed: no Chips, card effects, edition, Seal or card-triggered Joker effects.');if(c.faceDown)lines.push('Face down for this Blind.');return lines.join('\n');}
  return {version:1,decks:decks,stakes:stakes,jokers:jokers,tags:tags,planets:planets,tarots:tarots,spectrals:spectrals,vouchers:vouchers,bosses:bosses,packs:PACKS,enhancements:clone(ENHANCEMENTS),editions:clone(EDITIONS),seals:clone(SEALS),hands:clone(HANDS),
    achievements:[{id:'first_blind',name:'First Blind',description:'Win a Blind.'},{id:'ante_eight',name:'Eight Antes',description:'Defeat the Ante 8 Boss.'}],
    newRun:newRun,evaluate:evaluate,preview:preview,selectionLimit:selectionLimit,blindInfo:blindInfo,frenzyInfo:frenzyInfo,describeCard:describeCard,summary:summary,isJokerActive:isJokerActive,creditLimit:creditLimit,xpMultiplier:xpMultiplier,bossRerollCost:bossRerollCost,purchaseQuote:purchaseQuote,mothimHP:mothimHP,canMothimAttack:canMothimAttack,copyInfo:copyInfo,probabilityInfo:probabilityInfo,copyCompatibility:clone(COPY_COMPATIBILITY),
    setHandSort:atomic(setHandSort),setLevel10Deal:atomic(setLevel10Deal),setPotionState:atomic(setPotionState),drinkPotion:atomic(drinkPotion),setCoinUnlocks:atomic(setCoinUnlocks),setPlayerLevel:atomic(setPlayerLevel),disableBossOnce:atomic(disableBossOnce),mothimAttack:atomic(mothimAttack),startBlind:atomic(startBlind),skipBlind:atomic(skipBlind),play:atomic(play),discard:atomic(discard),cashout:atomic(cashout),buy:atomic(buy),buyUse:atomic(buyUse),reroll:atomic(reroll),buyVoucher:atomic(buyVoucher),openPack:atomic(openPack),openPendingTagPack:atomic(openPendingTagPack),choosePack:atomic(choosePack),sellJoker:atomic(sellJoker),moveJoker:atomic(moveJoker),useConsumable:atomic(useConsumable),sellConsumable:atomic(sellConsumable),abandon:atomic(abandon),continueRun:atomic(continueRun),leaveShop:atomic(leaveShop),nextRound:atomic(leaveShop),rerollBoss:atomic(rerollBoss),sellValue:sellValue,
    coverage:{decks:decks.length,jokers:jokers.length,tarots:tarots.length,planets:planets.length,spectrals:spectrals.length,vouchers:vouchers.length,tags:tags.length,bosses:bosses.length,stakes:stakes.length,stickers:3},
    _test:{addJoker:function(s,id,edition){return addJoker(s,id,edition);},addConsumable:function(s,id){return addConsumable(s,id);},grantTag:function(s,id){grantTag(s,id);},generateShop:function(s){generateShop(s);},rollShopStickers:rollShopStickers,chance:chance,edition:edition,resolveJokerAbility:resolveJokerAbility,captureJokerBindings:captureJokerBindings,eachAbility:eachAbility}
  };
});
