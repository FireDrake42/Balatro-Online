/*
 * Balatro vanilla Steam achievement reference metadata ONLY.
 * Sources: https://balatrowiki.org/w/Achievements
 *          https://balatrowiki.org/w/Collection
 *          https://steamcommunity.com/achievements/2379780
 * See catalog-reference.md for exact provenance and mechanics exceptions.
 *
 * Local IDs are not Steam API identifiers. Predicate objects describe evidence;
 * they are not executable unlock checks, implemented tracking, or Steam support.
 * No entry carries unlocked/progress state. Suggested metric names are not an
 * engine API. Eligibility and compound conditions must be implemented separately.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.BOAchievements = factory();
  }
}(typeof window !== 'undefined' ? window :
  (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  return [
    {
      id: 'ante_up',
      name: 'Ante Up!',
      description: 'Reach Ante 4',
      metadataOnly: true,
      predicate: { category: 'reach_ante', scope: 'run', metric: 'highestAnte', operator: 'gte', threshold: 4 }
    },
    {
      id: 'ante_upper',
      name: 'Ante Upper!',
      description: 'Reach Ante 8',
      metadataOnly: true,
      predicate: { category: 'reach_ante', scope: 'run', metric: 'highestAnte', operator: 'gte', threshold: 8 }
    },
    {
      id: 'heads_up',
      name: 'Heads Up',
      description: 'Win a Run',
      metadataOnly: true,
      predicate: { category: 'run_win', scope: 'run', requiresWin: true }
    },
    {
      id: 'low_stakes',
      name: 'Low Stakes',
      description: 'Win a run on at least Red Stake difficulty',
      metadataOnly: true,
      predicate: { category: 'stake_win', scope: 'run', minimumStake: 'red', requiresWin: true }
    },
    {
      id: 'mid_stakes',
      name: 'Mid Stakes',
      description: 'Win a run on at least Black Stake difficulty',
      metadataOnly: true,
      predicate: { category: 'stake_win', scope: 'run', minimumStake: 'black', requiresWin: true }
    },
    {
      id: 'high_stakes',
      name: 'High Stakes',
      description: 'Win a run on at least Gold Stake difficulty',
      metadataOnly: true,
      predicate: { category: 'stake_win', scope: 'run', minimumStake: 'gold', requiresWin: true }
    },
    {
      id: 'card_player',
      name: 'Card Player',
      description: 'Play at least 2500 Cards',
      metadataOnly: true,
      predicate: {
        category: 'cards_played', scope: 'profile', metric: 'cardsPlayed', operator: 'gte', threshold: 2500,
        notes: 'Cumulative individual cards across eligible runs, not hands played.'
      }
    },
    {
      id: 'card_discarder',
      name: 'Card Discarder',
      description: 'Discard at least 2500 Cards',
      metadataOnly: true,
      predicate: {
        category: 'cards_discarded', scope: 'profile', metric: 'cardsDiscarded', operator: 'gte', threshold: 2500,
        notes: 'Cumulative individual cards across eligible runs, not discard actions.'
      }
    },
    {
      id: 'nest_egg',
      name: 'Nest Egg',
      description: 'Have $400 or more during a single run',
      metadataOnly: true,
      predicate: {
        category: 'money_balance', scope: 'run', metric: 'peakMoney', operator: 'gte', threshold: 400,
        notes: 'Actual held balance at one moment; cumulative earnings are insufficient.'
      }
    },
    {
      id: 'flushed',
      name: 'Flushed',
      description: 'Play a Flush with 5 Wild Cards',
      metadataOnly: true,
      predicate: {
        category: 'wild_flush', scope: 'hand', metric: 'wildCards', operator: 'gte', threshold: 5,
        notes: 'Published requirement. Four Fingers can permit four Wild Cards; Flush House and Flush Five do not qualify. Requires special-case evidence, not a generic contains-Flush check.'
      }
    },
    {
      id: 'speedrunner',
      name: 'Speedrunner',
      description: 'Win a run in 12 or fewer rounds',
      metadataOnly: true,
      predicate: {
        category: 'round_limited_win', scope: 'run', metric: 'roundsPlayed', operator: 'lte', threshold: 12,
        requiresWin: true, notes: 'Played blind rounds, not hands, time, or skipped blind slots.'
      }
    },
    {
      id: 'roi',
      name: 'ROI',
      description: 'Buy 5 Vouchers by the end of Ante 4',
      metadataOnly: true,
      predicate: {
        category: 'voucher_purchases_by_ante', scope: 'run', metric: 'qualifyingVoucherPurchases', operator: 'gte', threshold: 5,
        deadlineAnte: 4, notes: 'Count purchases through Ante 4 inclusive; starting deck vouchers do not count.'
      }
    },
    {
      id: 'shattered',
      name: 'Shattered',
      description: 'Break 2 Glass Cards in a single hand',
      metadataOnly: true,
      predicate: {
        category: 'glass_breaks', scope: 'hand', metric: 'glassCardsBrokenThisHand', operator: 'gte', threshold: 2,
        notes: 'Actual Glass break events in one hand, not merely playing or owning two Glass Cards.'
      }
    },
    {
      id: 'royale',
      name: 'Royale',
      description: 'Play a Royal Flush',
      metadataOnly: true,
      predicate: {
        category: 'royal_flush', scope: 'hand',
        notes: 'Royal Flush shares Straight Flush levels but must remain distinguishable as a played hand.'
      }
    },
    {
      id: 'retrograde',
      name: 'Retrograde',
      description: 'Get any poker hand to level 10',
      metadataOnly: true,
      predicate: { category: 'hand_level', scope: 'run', metric: 'highestHandLevel', operator: 'gte', threshold: 10 }
    },
    {
      id: 'score_10k',
      name: '10K',
      description: 'Score 10,000 Chips in a single hand',
      metadataOnly: true,
      predicate: { category: 'single_hand_score', scope: 'hand', metric: 'finalHandScore', operator: 'gte', threshold: 10000 }
    },
    {
      id: 'score_1000k',
      name: '1,000K',
      description: 'Score 1,000,000 Chips in a single hand',
      metadataOnly: true,
      predicate: { category: 'single_hand_score', scope: 'hand', metric: 'finalHandScore', operator: 'gte', threshold: 1000000 }
    },
    {
      id: 'score_100000k',
      name: '100,000K',
      description: 'Score 100,000,000 Chips in a single hand',
      metadataOnly: true,
      predicate: { category: 'single_hand_score', scope: 'hand', metric: 'finalHandScore', operator: 'gte', threshold: 100000000 }
    },
    {
      id: 'tiny_hands',
      name: 'Tiny Hands',
      description: 'Thin your deck down to 20 or fewer cards',
      metadataOnly: true,
      predicate: {
        category: 'full_deck_size', scope: 'run', metric: 'minimumFullDeckSize', operator: 'lte', threshold: 20,
        notes: 'Full permanent playing deck, not hand size or remaining draw-pile size.'
      }
    },
    {
      id: 'big_hands',
      name: 'Big Hands',
      description: 'Have 80 or more cards in your deck',
      metadataOnly: true,
      predicate: {
        category: 'full_deck_size', scope: 'run', metric: 'maximumFullDeckSize', operator: 'gte', threshold: 80,
        notes: 'Full permanent playing deck, not hand size or remaining draw-pile size.'
      }
    },
    {
      id: 'you_get_what_you_get',
      name: 'You Get What You Get',
      description: 'Win a run without rerolling the shop',
      metadataOnly: true,
      predicate: {
        category: 'no_shop_reroll_win', scope: 'run', metric: 'shopRerolls', operator: 'eq', threshold: 0,
        requiresWin: true, notes: 'Includes free shop rerolls; spending zero dollars on rerolls is not equivalent.'
      }
    },
    {
      id: 'rule_bender',
      name: 'Rule Bender',
      description: 'Complete any challenge run',
      metadataOnly: true,
      predicate: { category: 'challenge_wins', scope: 'profile', metric: 'distinctChallengesCompleted', operator: 'gte', threshold: 1 }
    },
    {
      id: 'rule_breaker',
      name: 'Rule Breaker',
      description: 'Complete every Challenge run',
      metadataOnly: true,
      predicate: {
        category: 'challenge_wins', scope: 'profile', metric: 'distinctChallengesCompleted', operator: 'gte', threshold: 20,
        allRequired: true, notes: 'All 20 distinct vanilla challenges, not 20 repeats.'
      }
    },
    {
      id: 'legendary',
      name: 'Legendary',
      description: 'Discover a Legendary Joker',
      metadataOnly: true,
      predicate: {
        category: 'discovery', scope: 'profile', collection: 'jokers', rarity: 'legendary', operator: 'gte', threshold: 1
      }
    },
    {
      id: 'astronomy',
      name: 'Astronomy',
      description: 'Discover every Planet card',
      metadataOnly: true,
      predicate: {
        category: 'discovery', scope: 'profile', collection: 'planets', operator: 'gte', threshold: 12,
        allRequired: true, notes: 'Distinct required vanilla cards, not number of purchases or uses.'
      }
    },
    {
      id: 'cartomancy',
      name: 'Cartomancy',
      description: 'Discover every Tarot card',
      metadataOnly: true,
      predicate: {
        category: 'discovery', scope: 'profile', collection: 'tarots', operator: 'gte', threshold: 22,
        allRequired: true, notes: 'Distinct required vanilla cards, not number of purchases or uses.'
      }
    },
    {
      id: 'clairvoyance',
      name: 'Clairvoyance',
      description: 'Discover every Spectral card',
      metadataOnly: true,
      predicate: {
        category: 'discovery', scope: 'profile', collection: 'spectrals', operator: 'gte', threshold: 18,
        allRequired: true, notes: 'Includes The Soul and Black Hole; distinct required vanilla cards.'
      }
    },
    {
      id: 'extreme_couponer',
      name: 'Extreme Couponer',
      description: 'Discover every Voucher',
      metadataOnly: true,
      predicate: {
        category: 'discovery', scope: 'profile', collection: 'vouchers', operator: 'gte', threshold: 32,
        allRequired: true, notes: 'Distinct required vanilla vouchers, not 32 voucher purchases.'
      }
    },
    {
      id: 'completionist',
      name: 'Completionist',
      description: 'Discover 100% of your collection',
      metadataOnly: true,
      predicate: {
        category: 'complete_collection', scope: 'profile', metric: 'collectionPercent', operator: 'gte', threshold: 100,
        allRequired: true, notes: 'Complete vanilla discovery set; not a percentage of this implementation catalog.'
      }
    },
    {
      id: 'completionist_plus',
      name: 'Completionist+',
      description: 'Win with every deck at Gold Stake difficulty',
      metadataOnly: true,
      predicate: {
        category: 'all_decks_gold_win', scope: 'profile', metric: 'distinctDecksWonAtGold', operator: 'gte', threshold: 15,
        stake: 'gold', allRequired: true, notes: 'All 15 distinct standard decks; 15 repeats do not qualify.'
      }
    },
    {
      id: 'completionist_plus_plus',
      name: 'Completionist++',
      description: 'Earn a Gold Sticker on every Joker',
      metadataOnly: true,
      predicate: {
        category: 'all_jokers_gold_sticker', scope: 'profile', metric: 'distinctJokersWithGoldSticker', operator: 'gte', threshold: 150,
        allRequired: true, notes: 'All 150 distinct vanilla Jokers held for Gold Stake run wins; discovery is insufficient.'
      }
    }
  ];
}));
