/* Fictional, local-only surveys. Pure generator/quality API; no storage or network. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BOSurveys = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Version3 is a frozen public generator (including Theorem). Only new rolling
  // CPX/Bitlabs births use version4; stored sessions always dispatch explicitly.
  var EPOCH_MS = 14400000, FORMAT_VERSION = 3, ROLLING_FORMAT_VERSION = 4, HOT_CHANCE = 1 / 5, TOP_CHANCE = 1 / 25, TOP_MULTIPLIER = 4;
  // These names label original local simulations, never remote integrations.
  var PROVIDERS = Object.freeze({
    cpx: Object.freeze({id: 'cpx', name: 'CPX Research', level: 25, maxOffers: 5, refreshMs: 14400000, rewardMultiplier: 1, questionMultiplier: 1}),
    theorem: Object.freeze({id: 'theorem', name: 'Theorem Reach', level: 14, maxOffers: 10, refreshMs: 21600000, rewardMultiplier: 2, questionMultiplier: 2}),
    bitlabs: Object.freeze({id: 'bitlabs', name: 'Bitlabs', level: 19, maxOffers: 20, refreshMs: 3600000, rewardMultiplier: 0.5, questionMultiplier: 1})
  });
  var OFFER_FIELDS = ['id', 'topic', 'reward', 'currency', 'stars', 'qualifications', 'questionCount', 'minutes', 'ageMin', 'ageMax', 'sex', 'showProgress'];
  var own = Object.prototype.hasOwnProperty;
  var TOPICS = ['Sports & teamwork', 'Cars & travel', 'Fictional brands', 'Everyday life', 'Media & creativity'];
  var TYPES = ['yesno', 'slider', 'text', 'image', 'animation', 'table', 'double-table', 'attention'];
  // Human-friendly floors, not an estimate of reading ability. One accidental
  // fast click may be retried; the runner durably disqualifies at three strikes.
  var SPEED_FLOORS = Object.freeze({yesno: 350, slider: 450, text: 800, image: 650, animation: 1200, table: 900, 'double-table': 1200, attention: 350});
  var BANK = [
    {key: 'sports', items: ['team practice', 'a running track', 'a swimming pool', 'a climbing wall', 'a cycling route', 'a friendly tournament'], features: ['teamwork', 'comfort', 'clear rules', 'colourful equipment', 'fun challenges', 'space to relax'], yes: ['Would you try a new team activity?', 'Would you watch a friendly match?', 'Would you include a warm-up?', 'Would you pick outdoor practice?', 'Would you share equipment?', 'Would you design a team badge?'], sliders: ['How appealing is a friendly sports challenge?', 'How important is teamwork in your invented club?', 'How much would you enjoy a new activity?', 'How much does a colourful kit appeal to you?', 'How useful is a clear practice schedule?'], texts: ['Invent a name for a friendly sports club.', 'Describe an imaginary team mascot.', 'Suggest a fun rule for a made-up sport.', 'Describe an invented activity for a rainy day.', 'Suggest a friendly team motto.'], object: 'ball'},
    {key: 'cars', items: ['a city car', 'a tiny electric buggy', 'a family wagon', 'a solar concept car', 'a delivery van', 'a colourful bus'], features: ['comfort', 'quiet travel', 'colour', 'easy parking', 'storage space', 'a clear dashboard'], yes: ['Would you choose a colourful concept car?', 'Would you take an imaginary scenic route?', 'Would a quiet motor appeal to your character?', 'Would you try a miniature electric buggy?', 'Would you add a map to the dashboard?', 'Would you design a car for a story?'], sliders: ['How appealing is a quiet concept vehicle?', 'How important is comfort on an invented trip?', 'How useful is extra storage in your imaginary car?', 'How much do bright vehicle colours appeal to you?', 'How interesting is a solar-powered concept?'], texts: ['Invent a model name for a fictional car.', 'Describe one playful feature of an imaginary vehicle.', 'Suggest a destination for a made-up road trip.', 'Invent a friendly slogan for a concept car.', 'Describe a vehicle from an imaginary city.'], object: 'car'},
    {key: 'brands', items: ['Leaf Studio', 'Wave Works', 'Spark Club', 'Orbit Goods', 'Cloud Corner', 'Pebble Lab'], features: ['a clear logo', 'friendly packaging', 'simple instructions', 'durability', 'creative colours', 'repairable designs'], yes: ['Would a simple fictional logo catch your eye?', 'Would you try a made-up reusable notebook?', 'Would your character choose bright packaging?', 'Would you notice clear product instructions?', 'Would you invent a brand mascot?', 'Would you pick a repairable imaginary gadget?'], sliders: ['How memorable is a simple invented logo?', 'How appealing are playful fictional brand colours?', 'How important are clear instructions for a pretend product?', 'How useful is a repairable imaginary gadget?', 'How much does friendly packaging appeal to you?'], texts: ['Invent a name for a fictional brand.', 'Suggest a friendly slogan for a made-up notebook.', 'Describe a logo for an imaginary shop.', 'Invent a helpful feature for a pretend gadget.', 'Describe a fictional brand mascot.'], object: 'spark'},
    {key: 'life', items: ['a garden corner', 'a reading nook', 'a drawing desk', 'a picnic spot', 'a puzzle shelf', 'a music corner'], features: ['calm surroundings', 'bright colours', 'comfortable seating', 'creative supplies', 'clear signs', 'room to share'], yes: ['Would your fictional character enjoy a picnic?', 'Would you add a reading corner to an invented room?', 'Would a made-up weekend include a puzzle?', 'Would you choose a colourful imaginary garden?', 'Would you plan a pretend creative afternoon?', 'Would a quiet corner suit your character?'], sliders: ['How appealing is a relaxed imaginary afternoon?', 'How much would your fictional character enjoy a garden?', 'How useful is a creative corner in an invented room?', 'How appealing is a made-up puzzle activity?', 'How important is comfortable seating in a pretend space?'], texts: ['Describe a relaxed afternoon for an invented character.', 'Invent a name for a friendly imaginary town.', 'Suggest an activity for a fictional weekend.', 'Describe a made-up garden corner.', 'Invent a cheerful detail for an imaginary room.'], object: 'bee'},
    {key: 'media', items: ['an animated adventure', 'a puzzle game', 'a nature comic', 'a music show', 'a space story', 'a creative video'], features: ['a friendly cast', 'clear sound', 'colourful art', 'a clever story', 'gentle humour', 'a surprising setting'], yes: ['Would you watch a made-up animated adventure?', 'Would you try an imaginary puzzle game?', 'Would you read a fictional nature comic?', 'Would you invent a story soundtrack?', 'Would a friendly robot make a good main character?', 'Would you design a pretend game world?'], sliders: ['How appealing is a colourful invented story?', 'How much would a fictional puzzle game interest you?', 'How useful is clear sound in a made-up show?', 'How appealing is gentle humour in an imaginary comic?', 'How interesting is a story set in a friendly space town?'], texts: ['Invent a title for a friendly animated story.', 'Describe a character for an imaginary puzzle game.', 'Suggest a setting for a made-up comic.', 'Invent a name for a fictional music show.', 'Describe one scene from an imaginary adventure.'], object: 'star'}
  ];
  var CONTEXTS = ['a sunny weekend', 'a rainy afternoon', 'a friendly club', 'an imaginary festival', 'a small creative project', 'a futuristic town', 'a relaxed holiday', 'a colourful exhibition', 'a community challenge', 'an invented island', 'a storybook village', 'a playful design contest', 'a quiet evening', 'a spring celebration'];
  function check(ok, message) { if (!ok) throw new Error(message); }
  function hash(value) {
    var h = 2166136261, s = String(value);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function random(seed) {
    var a = hash(seed);
    return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function integer(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
  function pick(rng, values) { return values[integer(rng, 0, values.length - 1)]; }
  function shuffle(values, rng) {
    var a = values.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = integer(rng, 0, i), x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  function providerInfo(id) {
    check(typeof id === 'string' && own.call(PROVIDERS, id), 'Invalid survey provider.');
    return PROVIDERS[id];
  }
  function normalizeOffer(value) {
    check(value && typeof value === 'object' && !Array.isArray(value), 'Invalid survey offer.');
    if (value.formatVersion === ROLLING_FORMAT_VERSION) return normalizeRollingOffer(value);
    var marked = own.call(value, 'formatVersion') || own.call(value, 'provider'), provider = null, current = value.formatVersion === FORMAT_VERSION;
    var allowed = marked ? OFFER_FIELDS.concat(['formatVersion', 'provider'], current ? ['hot', 'top'] : []) : OFFER_FIELDS;
    check(OFFER_FIELDS.every(function (key) { return own.call(value, key); }) && Object.keys(value).every(function (key) { return allowed.indexOf(key) >= 0; }), 'Invalid survey offer fields.');
    if (marked) {
      check(own.call(value, 'formatVersion') && own.call(value, 'provider') && (value.formatVersion === 2 || current), 'Invalid survey offer format.');
      provider = providerInfo(value.provider);
    }
    check(typeof value.id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value.id), 'Invalid survey offer ID.');
    if (provider) {
      var match = new RegExp('^survey' + value.formatVersion + '-' + provider.id + '-([0-9a-z]+)-(0|[1-9][0-9]*)$').exec(value.id);
      check(match, 'Invalid survey provider offer ID.');
      var epoch = parseInt(match[1], 36), slot = Number(match[2]);
      check(Number.isSafeInteger(epoch) && epoch >= 0 && epoch.toString(36) === match[1] && Number.isSafeInteger(slot) && slot < provider.maxOffers, 'Invalid survey provider offer ID.');
      if (current) {
        var badges = offerBadges(epoch, provider.id, slot);
        check(own.call(value, 'hot') && own.call(value, 'top') && typeof value.hot === 'boolean' && typeof value.top === 'boolean' && value.hot === badges.hot && value.top === badges.top, 'Invalid survey badge metadata.');
      }
    } else check(!/^survey[234]-/.test(value.id), 'Invalid unmarked survey offer ID.');
    check(typeof value.topic === 'string' && value.topic.length > 0 && value.topic.length <= 100, 'Invalid survey topic.');
    ['stars', 'qualifications', 'questionCount', 'ageMin', 'ageMax'].forEach(function (key) { check(Number.isSafeInteger(value[key]), 'Invalid survey ' + key + '.'); });
    check(value.stars >= 1 && value.stars <= 5 && value.qualifications >= 1 && value.qualifications <= 100, 'Invalid survey offer ranges.');
    check(value.ageMin >= 1 && value.ageMax <= 120 && value.ageMax >= value.ageMin, 'Invalid survey age range.');
    check(['any', 'female', 'male', 'other'].indexOf(value.sex) >= 0, 'Invalid survey sex filter.');
    var currencies = provider ? ['coins', 'medals', 'xp'] : ['coins', 'medals'];
    check(currencies.indexOf(value.currency) >= 0, 'Invalid survey currency.');
    var multiplier = (provider ? provider.rewardMultiplier : 1) * (current && value.top ? TOP_MULTIPLIER : 1), baseReward = value.reward / multiplier;
    check(Number.isFinite(value.reward) && Number.isSafeInteger(baseReward), 'Invalid survey reward.');
    var minReward = value.currency === 'xp' ? 100 : 10, maxReward = provider ? (value.currency === 'xp' ? 300 : 20) : 30;
    check(baseReward >= minReward && baseReward <= maxReward, 'Invalid survey reward bounds.');
    var questionMultiplier = provider ? provider.questionMultiplier : 1, baseCount = value.questionCount / questionMultiplier;
    check(Number.isInteger(baseCount) && baseCount >= 10 && baseCount <= 100, 'Invalid survey question count.');
    check(typeof value.showProgress === 'boolean' && Number.isFinite(value.minutes) && value.minutes > 0 && value.minutes <= (provider ? 240 : 120), 'Invalid survey estimate or progress setting.');
    var result = {id: value.id, topic: value.topic, reward: value.reward, currency: value.currency, stars: value.stars, qualifications: value.qualifications, questionCount: value.questionCount, minutes: value.minutes, ageMin: value.ageMin, ageMax: value.ageMax, sex: value.sex, showProgress: value.showProgress};
    if (provider) { result.formatVersion = value.formatVersion; result.provider = provider.id; }
    if (current) { result.hot = value.hot; result.top = value.top; }
    return result;
  }
  // Frozen compatibility path: keep all seed strings, draws, field order and
  // balancing exactly as shipped. Pending legacy sessions are never repriced.
  function generateLegacyOffers(epoch) {
    check(Number.isSafeInteger(epoch) && epoch >= 0, 'Supply a nonnegative integer survey epoch.');
    var rng = random('offers/' + epoch), currencies = shuffle(['coins', 'coins', 'coins', 'coins', 'medals', 'medals', 'medals', 'medals'], random('currency/' + epoch));
    var progress = shuffle([true, true, true, true, false, false, false, false], random('progress/' + epoch));
    return Array.from({length: 8}, function (_, i) {
      var ageMin = integer(rng, 13, 45), ageMax = integer(rng, ageMin + 5, 99), count = integer(rng, 10, 100);
      return {id: 'survey-' + epoch.toString(36) + '-' + i, topic: pick(rng, TOPICS), reward: integer(rng, 10, 30), currency: currencies[i], stars: integer(rng, 1, 5), qualifications: integer(rng, 1, 100), questionCount: count, minutes: Math.max(2, Math.ceil(count * 8 / 60)), ageMin: ageMin, ageMax: ageMax, sex: pick(rng, ['any', 'female', 'male', 'other']), showProgress: progress[i]};
    });
  }
  // Frozen version2 path: never change its seeds, draws, field order or payouts.
  function generatePreviousOffers(epoch, providerId) {
    check(Number.isSafeInteger(epoch) && epoch >= 0, 'Supply a nonnegative integer survey epoch.');
    var provider = providerInfo(providerId === undefined ? 'cpx' : providerId);
    return Array.from({length: provider.maxOffers}, function (_, i) {
      var seed = 'offers2/' + provider.id + '/' + epoch + '/' + i, rng = random(seed + '/details');
      // Independent seeded channels: neither provider payout nor the other
      // offer fields skew the one-third currency or one-half progress draw.
      var currency = pick(random(seed + '/currency'), ['coins', 'medals', 'xp']);
      var reward = integer(random(seed + '/reward'), currency === 'xp' ? 100 : 10, currency === 'xp' ? 300 : 20) * provider.rewardMultiplier;
      var count = integer(random(seed + '/count'), 10, 100) * provider.questionMultiplier;
      var ageMin = integer(rng, 13, 45), ageMax = integer(rng, ageMin + 5, 99);
      return {id: 'survey2-' + provider.id + '-' + epoch.toString(36) + '-' + i, topic: pick(rng, TOPICS), reward: reward, currency: currency, stars: integer(rng, 1, 5), qualifications: integer(rng, 1, 100), questionCount: count, minutes: Math.max(2, Math.ceil(count * 8 / 60)), ageMin: ageMin, ageMax: ageMax, sex: pick(rng, ['any', 'female', 'male', 'other']), showProgress: random(seed + '/progress')() < 0.5, formatVersion: 2, provider: provider.id};
    });
  }
  function offerBadges(epoch, providerId, slot) {
    var seed = 'offers3/' + providerId + '/' + epoch + '/' + slot;
    // Separate channels: neither badge is forced per board or changes any
    // existing currency, count, progress or screener draw. Both may occur.
    return {hot: random(seed + '/hot')() < HOT_CHANCE, top: random(seed + '/top')() < TOP_CHANCE};
  }
  function generateOffers(epoch, providerId) {
    return generatePreviousOffers(epoch, providerId).map(function (offer, i) {
      var badges = offerBadges(epoch, offer.provider, i);
      offer.id = 'survey3-' + offer.provider + '-' + epoch.toString(36) + '-' + i;
      offer.formatVersion = FORMAT_VERSION;
      offer.hot = badges.hot; offer.top = badges.top;
      // Provider scaling has already happened. This is the actual listed
      // coin/Medal/base-XP reward, not a display-only multiplier; XP bonuses
      // remain exclusively the host's responsibility when banking it.
      if (offer.top) offer.reward *= TOP_MULTIPLIER;
      return offer;
    });
  }
  // Theorem's durable board stores only canonical references. Old generators and
  // question seeds above/below remain frozen; replenishment never edits an offer.
  var THEOREM_PERIOD = PROVIDERS.theorem.refreshMs, THEOREM_CAP = PROVIDERS.theorem.maxOffers, MAX_TIME = 8640000000000000;
  function poolTime(at) { check(Number.isSafeInteger(at) && at >= 0 && at <= MAX_TIME, 'Invalid Theorem inventory time.'); return at; }
  function theoremRef(offer, epoch) { return Object.assign({offerId: offer.id, epoch: epoch, formatVersion: offer.formatVersion, provider: 'theorem'}, offer.formatVersion === 4 ? {eventKey: offer.eventKey} : {}); }
  function normalizeTheoremInventory(value) {
    check(value && typeof value === 'object' && !Array.isArray(value), 'Invalid Theorem inventory.');
    check(Object.keys(value).length === 4 && ['version', 'cap', 'processedEpoch', 'refs'].every(function (k) { return own.call(value, k); }), 'Invalid Theorem inventory fields.');
    check(value.version === 1 && value.cap === THEOREM_CAP, 'Unsupported Theorem inventory version or capacity.');
    check(Number.isSafeInteger(value.processedEpoch) && value.processedEpoch >= 0 && value.processedEpoch <= Math.floor(MAX_TIME / THEOREM_PERIOD), 'Invalid Theorem processed epoch.');
    check(Array.isArray(value.refs) && value.refs.length <= THEOREM_CAP, 'Invalid Theorem inventory capacity.');
    var ids = new Set(), batches = new Map();
    var refs = value.refs.map(function (ref) {
      check(ref && typeof ref === 'object' && !Array.isArray(ref), 'Invalid Theorem offer reference.');
      var fields = ['offerId', 'epoch', 'formatVersion', 'provider'].concat(ref.formatVersion === 4 ? ['eventKey'] : []);
      check(Object.keys(ref).length === fields.length && fields.every(function (k) { return own.call(ref, k); }), 'Invalid Theorem offer reference.');
      check(ref.provider === 'theorem' && [2, 3, 4].indexOf(ref.formatVersion) >= 0 && Number.isSafeInteger(ref.epoch) && ref.epoch >= 0 && ref.epoch <= value.processedEpoch, 'Invalid Theorem reference metadata.');
      if (ref.formatVersion === 4) eventKey(ref.eventKey);
      check(typeof ref.offerId === 'string' && !ids.has(ref.offerId), 'Duplicate or invalid Theorem offer reference.'); ids.add(ref.offerId);
      var key = ref.formatVersion + '/' + ref.epoch + '/' + (ref.eventKey || '');
      if (!batches.has(key)) batches.set(key, ref.formatVersion === 4 ? generateRollingOffers(ref.epoch, 'theorem', ref.eventKey) : (ref.formatVersion === 2 ? generatePreviousOffers : generateOffers)(ref.epoch, 'theorem'));
      var offer = batches.get(key).find(function (o) { return o.id === ref.offerId; });
      check(offer, 'Theorem reference does not match its canonical birth epoch.');
      return theoremRef(offer, ref.epoch);
    });
    return {version: 1, cap: THEOREM_CAP, processedEpoch: value.processedEpoch, refs: refs};
  }
  function createTheoremInventory(at, options) {
    var epoch = Math.floor(poolTime(at) / THEOREM_PERIOD), offers = options && options.eventKey !== undefined ? generateRollingOffers(epoch, 'theorem', options.eventKey) : generateOffers(epoch, 'theorem');
    return {version: 1, cap: THEOREM_CAP, processedEpoch: epoch, refs: offers.map(function (o) { return theoremRef(o, epoch); })};
  }
  function theoremInventoryOffers(value) {
    return normalizeTheoremInventory(value).refs.map(function (ref) { return refOffer(ref, ref.eventKey); });
  }
  function refillTheoremInventory(value, at, options) {
    var board = normalizeTheoremInventory(value); poolTime(at); options = options || {};
    var used = options.usedOfferIds || [], removed = options.removed || [];
    check(Array.isArray(used) && used.every(function (v) { return typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v); }) && Array.isArray(removed), 'Invalid Theorem inventory history.');
    var excluded = new Set(used.concat(board.refs.map(function (r) { return r.offerId; }))), events = [], removals = new Set();
    removed.forEach(function (event) {
      check(event && typeof event.offerId === 'string' && !removals.has(event.offerId), 'Invalid Theorem removal reference.'); poolTime(event.at); removals.add(event.offerId);
      excluded.add(event.offerId); if (event.at <= at && board.refs.some(function (r) { return r.offerId === event.offerId; })) events.push({offerId: event.offerId, at: event.at});
    });
    events.sort(function (a, b) { return a.at - b.at; });
    var target = Math.max(board.processedEpoch, Math.floor(at / THEOREM_PERIOD)), tick = board.processedEpoch, cursor = 0;
    function prune(until) { while (cursor < events.length && events[cursor].at <= until) { var id = events[cursor++].offerId; board.refs = board.refs.filter(function (r) { return r.offerId !== id; }); } }
    // At most ten additions plus ten removals need work, even after years away.
    // A full board skips ticks, not capacity: a hole made AFTER a skipped tick
    // cannot spend it later. Terminal-event times preserve this while offline.
    while (tick < target) {
      var next = tick + 1; prune(next * THEOREM_PERIOD);
      if (board.refs.length === THEOREM_CAP) {
        tick = cursor < events.length ? Math.min(target, Math.ceil(events[cursor].at / THEOREM_PERIOD) - 1) : target;
        continue;
      }
      var born = options.eventKey !== undefined ? generateRollingOffers(next, 'theorem', options.eventKey) : generateOffers(next, 'theorem');
      var offer = born.find(function (o) { return !excluded.has(o.id); });
      if (offer) { board.refs.push(theoremRef(offer, next)); excluded.add(offer.id); }
      tick = next;
    }
    prune(at); board.processedEpoch = target;
    return board;
  }
  // Personalized deterministic LOCAL events, not claims about the real CPX.
  // Independent windows can be empty. Neither callers nor the UI get a next date.
  var DAY_MS = 86400000, EVENT_WINDOW = 28 * DAY_MS;
  function providerEventKey(seed) { check(typeof seed === 'string' && seed.length > 0 && seed.length <= 256, 'Invalid survey event seed.'); return hash('local-cpx-events4/' + seed).toString(16).padStart(8, '0'); }
  function eventKey(value) { check(typeof value === 'string' && /^[0-9a-f]{8}$/.test(value), 'Invalid local survey event key.'); return value; }
  function cpxPromotion(at, key) {
    poolTime(at); eventKey(key);
    var cycle = Math.floor(at / EVENT_WINDOW), rng = random('local-cpx-event4/' + key + '/' + cycle);
    if (rng() >= 0.65) return null;
    var startsAt = cycle * EVENT_WINDOW + integer(rng, 0, 21 * 86400 - 1) * 1000;
    var endsAt = startsAt + integer(rng, 1, 7) * DAY_MS, percent = integer(rng, 10, 50);
    return at >= startsAt && at < endsAt ? {id: 'local-cpx-' + key + '-' + cycle.toString(36), percent: percent, startsAt: startsAt, endsAt: endsAt} : null;
  }
  function rollingProvider(provider) { check(provider === 'cpx' || provider === 'bitlabs', 'Invalid rolling survey provider.'); return PROVIDERS[provider]; }
  function generateRollingOffers(epoch, providerId, key) {
    var provider = providerInfo(providerId); eventKey(key);
    check(Number.isSafeInteger(epoch) && epoch >= 0 && epoch <= Math.floor(MAX_TIME / provider.refreshMs), 'Invalid rolling survey epoch.');
    var promotion = provider.id === 'cpx' ? cpxPromotion(epoch * provider.refreshMs, key) : null;
    return generateOffers(epoch, provider.id).map(function (offer, i) {
      offer.id = 'survey4-' + provider.id + '-' + epoch.toString(36) + '-' + key + '-' + i;
      offer.formatVersion = ROLLING_FORMAT_VERSION; offer.eventKey = key;
      offer.promotion = promotion ? {id: promotion.id, percent: promotion.percent, startsAt: promotion.startsAt, endsAt: promotion.endsAt} : null;
      // Work in half-units before rounding; never accumulate floating currency.
      if (promotion) offer.reward = Math.ceil(offer.reward * 2 * (100 + promotion.percent) / 100) / 2;
      return offer;
    });
  }
  function normalizeRollingOffer(value) {
    var provider = providerInfo(value.provider), key = eventKey(value.eventKey);
    var match = new RegExp('^survey4-' + provider.id + '-([0-9a-z]+)-' + key + '-(0|[1-9][0-9]*)$').exec(value.id);
    check(match, 'Invalid rolling survey ID.'); var epoch = parseInt(match[1], 36), slot = Number(match[2]);
    check(Number.isSafeInteger(epoch) && epoch.toString(36) === match[1] && slot < provider.maxOffers, 'Invalid rolling survey birth metadata.');
    var expected = generateRollingOffers(epoch, provider.id, key)[slot];
    check(Object.keys(value).length === Object.keys(expected).length && Object.keys(expected).every(function (k) { return own.call(value, k) && JSON.stringify(value[k]) === JSON.stringify(expected[k]); }), 'Invalid canonical rolling survey offer.');
    return expected;
  }
  function providerRef(offer, epoch) { return Object.assign({offerId: offer.id, epoch: epoch, formatVersion: offer.formatVersion, provider: offer.provider}, offer.formatVersion === 4 ? {eventKey: offer.eventKey} : {}); }
  function refOffer(ref, key) { return (ref.formatVersion === 2 ? generatePreviousOffers(ref.epoch, ref.provider) : ref.formatVersion === 3 ? generateOffers(ref.epoch, ref.provider) : generateRollingOffers(ref.epoch, ref.provider, key)).find(function (o) { return o.id === ref.offerId; }); }
  function normalizeProviderInventory(value) {
    check(value && typeof value === 'object' && !Array.isArray(value), 'Invalid provider inventory.');
    var provider = rollingProvider(value.provider); eventKey(value.eventKey);
    check(Object.keys(value).length === 6 && ['version', 'provider', 'cap', 'processedEpoch', 'eventKey', 'refs'].every(function (k) { return own.call(value, k); }), 'Invalid provider inventory fields.');
    check(value.version === 1 && value.cap === provider.maxOffers, 'Unsupported provider inventory version or capacity.');
    check(Number.isSafeInteger(value.processedEpoch) && value.processedEpoch >= 0 && value.processedEpoch <= Math.floor(MAX_TIME / provider.refreshMs), 'Invalid provider processed epoch.');
    check(Array.isArray(value.refs) && value.refs.length <= provider.maxOffers, 'Invalid provider inventory capacity.');
    var ids = new Set(), batches = new Map();
    var refs = value.refs.map(function (ref) {
      check(ref && typeof ref === 'object' && !Array.isArray(ref), 'Invalid provider offer reference.');
      var fields = ['offerId', 'epoch', 'formatVersion', 'provider'].concat(ref.formatVersion === 4 ? ['eventKey'] : []);
      check(Object.keys(ref).length === fields.length && fields.every(function (k) { return own.call(ref, k); }), 'Invalid provider reference fields.');
      check(ref.provider === provider.id && [2, 3, 4].indexOf(ref.formatVersion) >= 0 && Number.isSafeInteger(ref.epoch) && ref.epoch >= 0 && ref.epoch <= value.processedEpoch && (ref.formatVersion !== 4 || ref.eventKey === value.eventKey), 'Invalid provider reference metadata.');
      check(typeof ref.offerId === 'string' && !ids.has(ref.offerId), 'Duplicate provider reference.'); ids.add(ref.offerId);
      var batchKey = ref.formatVersion + '/' + ref.epoch;
      if (!batches.has(batchKey)) batches.set(batchKey, (ref.formatVersion === 2 ? generatePreviousOffers(ref.epoch, provider.id) : ref.formatVersion === 3 ? generateOffers(ref.epoch, provider.id) : generateRollingOffers(ref.epoch, provider.id, value.eventKey)));
      var offer = batches.get(batchKey).find(function (o) { return o.id === ref.offerId; }); check(offer, 'Provider reference does not match its canonical birth.'); return providerRef(offer, ref.epoch);
    });
    return {version: 1, provider: provider.id, cap: provider.maxOffers, processedEpoch: value.processedEpoch, eventKey: value.eventKey, refs: refs};
  }
  function createProviderInventory(at, providerId, key, options) {
    var provider = rollingProvider(providerId), epoch = Math.floor(poolTime(at) / provider.refreshMs); eventKey(key);
    // An existing unlocked save migrates its current old board, never a reroll.
    var offers = options && options.migrate ? generateOffers(epoch, provider.id) : generateRollingOffers(epoch, provider.id, key);
    return {version: 1, provider: provider.id, cap: provider.maxOffers, processedEpoch: epoch, eventKey: key, refs: offers.map(function (o) { return providerRef(o, epoch); })};
  }
  function providerInventoryOffers(value) { var b = normalizeProviderInventory(value); return b.refs.map(function (ref) { return refOffer(ref, b.eventKey); }); }
  function refillProviderInventory(value, at, options) {
    var board = normalizeProviderInventory(value), provider = PROVIDERS[board.provider], period = provider.refreshMs; poolTime(at); options = options || {};
    var used = options.usedOfferIds || [], removed = options.removed || [];
    check(Array.isArray(used) && used.every(function (v) { return typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v); }) && Array.isArray(removed), 'Invalid provider inventory history.');
    var excluded = new Set(used.concat(board.refs.map(function (r) { return r.offerId; }))), events = [], removals = new Set();
    removed.forEach(function (event) {
      check(event && typeof event.offerId === 'string' && !removals.has(event.offerId), 'Invalid provider removal reference.'); poolTime(event.at); removals.add(event.offerId); excluded.add(event.offerId);
      if (event.at <= at && board.refs.some(function (r) { return r.offerId === event.offerId; })) events.push({offerId: event.offerId, at: event.at});
    });
    events.sort(function (a, b) { return a.at - b.at; });
    var target = Math.max(board.processedEpoch, Math.floor(at / period)), tick = board.processedEpoch, cursor = 0;
    function prune(until) { while (cursor < events.length && events[cursor].at <= until) { var id = events[cursor++].offerId; board.refs = board.refs.filter(function (r) { return r.offerId !== id; }); } }
    // Same terminal-time ordering as Theorem. Work is bounded by capacity plus
    // existing history, not offline ticks. Full ticks are discarded, not banked.
    while (tick < target) {
      var next = tick + 1; prune(next * period);
      if (board.refs.length === board.cap) { tick = cursor < events.length ? Math.min(target, Math.ceil(events[cursor].at / period) - 1) : target; continue; }
      var offer = generateRollingOffers(next, provider.id, board.eventKey).find(function (o) { return !excluded.has(o.id); });
      if (offer) { board.refs.push(providerRef(offer, next)); excluded.add(offer.id); } tick = next;
    }
    prune(at); board.processedEpoch = target; return board;
  }
  function attentionVariant(offer, seed, index, forcedKind) {
    var rng = random('attention4/' + offer.id + '/' + seed + '/' + index), kind = forcedKind || pick(rng, ['colour', 'smallest', 'largest', 'height', 'width']);
    var q = {variant: kind};
    if (kind === 'colour') {
      // Pic2 clarification: randomize the requested colour, not Stroop ink.
      q.expected = pick(random('colour4/' + offer.id + '/' + seed + '/' + index), ['red', 'green', 'blue']);
      q.prompt = 'Attention check: please select ' + q.expected[0].toUpperCase() + q.expected.slice(1) + ' below. This checks the instructions, not your opinion.';
      q.options = [option('red', 'Red'), option('green', 'Green'), option('blue', 'Blue')];
    } else if (kind === 'smallest' || kind === 'largest') {
      var numbers = shuffle(Array.from({length: 99}, function (_, i) { return i + 1; }), rng).slice(0, 3), sizes = shuffle([20, 32, 46], rng);
      q.prompt = 'Attention check: choose the ' + kind + ' NUMERIC VALUE. Ignore the different font sizes.';
      q.options = numbers.map(function (number, i) { return {value: ['A', 'B', 'C'][i], label: String(number), number: number, fontSize: sizes[i]}; });
      var target = Math[kind === 'smallest' ? 'min' : 'max'].apply(Math, numbers); q.expected = q.options.find(function (o) { return o.number === target; }).value;
    } else {
      var lengths = shuffle([60, 110, 160], rng); q.lines = ['A', 'B', 'C'].map(function (id, i) { return {id: id, length: lengths[i]}; });
      q.prompt = 'Attention check: which labelled line is ' + (kind === 'height' ? 'TALLEST (greatest height)' : 'WIDEST (greatest width)') + '? Compare the lines, not their labels.';
      q.options = ['A', 'B', 'C'].map(function (id) { return option(id, 'Line ' + id); }); q.expected = q.lines.find(function (l) { return l.length === 160; }).id;
      q.svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 240" role="img" aria-label="Three clearly labelled lines for a ' + kind + ' comparison"><rect width="480" height="240" rx="12" fill="#fff"/>' + q.lines.map(function (line, i) {
        var x1 = kind === 'height' ? 90 + i * 150 : 145, y1 = kind === 'height' ? 190 : 55 + i * 65, x2 = kind === 'height' ? x1 : x1 + line.length, y2 = kind === 'height' ? y1 - line.length : y1;
        return '<line data-line="' + line.id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#175cd3" stroke-width="8" stroke-linecap="butt"/><text x="' + (kind === 'height' ? x1 : 70) + '" y="' + (kind === 'height' ? 225 : y1 + 6) + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#1d3044">Line ' + line.id + '</text>';
      }).join('') + '</svg>';
    }
    q.alt = 'Local attention illustration: follow the explicit instruction above.'; return q;
  }
  function theme(topic) {
    var lower = topic.toLowerCase();
    if (/sport/.test(lower)) return BANK[0];
    if (/car|travel/.test(lower)) return BANK[1];
    if (/brand/.test(lower)) return BANK[2];
    if (/media|creativ/.test(lower)) return BANK[4];
    return BANK[3];
  }
  function option(value, label) { return {value: value, label: label}; }
  function yesno() { return [option('yes', 'Yes'), option('no', 'No')]; }
  function graphic(object, colour, animate) {
    var drawing = object === 'car' ? '<rect x="-34" y="-12" width="68" height="26" rx="10" fill="' + colour + '"/><path d="M-20-12l10-16h24l12 16" fill="#bce6f6" stroke="#17344a" stroke-width="3"/><circle cx="-21" cy="15" r="9" fill="#17344a"/><circle cx="22" cy="15" r="9" fill="#17344a"/>' :
      object === 'ball' ? '<circle r="27" fill="' + colour + '" stroke="#17344a" stroke-width="3"/><path d="M-26 0h52M0-27c-15 15-15 39 0 54M0-27c15 15 15 39 0 54" fill="none" stroke="#17344a" stroke-width="2"/>' :
      object === 'bee' ? '<ellipse cx="-12" cy="-17" rx="15" ry="20" fill="#d9f2ff"/><ellipse cx="12" cy="-17" rx="15" ry="20" fill="#d9f2ff"/><ellipse rx="31" ry="20" fill="#f3ca52"/><path d="M-10-18v36M7-19v38" stroke="#17344a" stroke-width="8"/><circle cx="20" cy="-3" r="3" fill="#17344a"/>' :
      '<path d="M0-32l9 21 23 2-18 15 5 24L0 18l-19 12 5-24-18-15 23-2z" fill="' + colour + '" stroke="#17344a" stroke-width="3"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" role="img" aria-label="An original illustrated ' + object + '"><rect width="480" height="200" rx="18" fill="#edf7fb"/><circle cx="408" cy="43" r="24" fill="#f3d580"/><path d="M0 142Q90 103 180 144T360 142T540 136V200H0z" fill="#bddfcf"/><path d="M32 159h416" stroke="#789ca0" stroke-width="3" stroke-dasharray="9 8"/><g transform="translate(190 105)"><g' + (animate ? ' class="bo-survey-motion"' : '') + '>' + drawing + '</g></g><text x="24" y="32" font-family="sans-serif" font-size="14" fill="#315163">IMAGINATION STUDIO</text></svg>';
  }
  function grid(rng, bank, id, label) {
    return {id: id, label: label, rows: shuffle(bank.features, rng).slice(0, 3).map(function (s, i) { return {id: 'r' + (i + 1), label: s}; }), columns: [option('1', 'Not important'), option('2', 'Somewhat'), option('3', 'Very important')]};
  }
  function generateFrozenQuestions(input, seed) {
    var offer = normalizeOffer(input);
    check((typeof seed === 'string' && seed.length <= 256) || (Number.isSafeInteger(seed)), 'Supply a string or integer survey seed.');
    var rng = random('questions/' + offer.id + '/' + seed), bank = theme(offer.topic), out = [], deck = [];
    while (deck.length < offer.questionCount) {
      // A complete shuffled deck, not random sampling: even count=10 includes
      // every supported control, one explicit check, and two ordinary extras.
      deck = deck.concat(shuffle(TYPES.concat(['yesno', 'slider']), rng));
    }
    var counts = Object.create(null), contexts = shuffle(CONTEXTS, rng);
    for (var i = 0; i < offer.questionCount; i++) {
      var type = deck[i], n = counts[type] || 0; counts[type] = n + 1;
      var context = contexts[n % contexts.length], item = bank.items[(n + integer(rng, 0, bank.items.length - 1)) % bank.items.length];
      var q = {id: offer.id + '-q' + (i + 1), type: type, prompt: ''};
      if (type === 'yesno') { q.prompt = 'Imagine ' + context + '. ' + bank.yes[n % bank.yes.length]; q.options = yesno(); }
      if (type === 'slider') { q.prompt = 'For ' + context + ': ' + bank.sliders[n % bank.sliders.length]; q.min = 0; q.max = 10; q.step = 1; q.minLabel = 'Not at all'; q.maxLabel = 'Very much'; }
      if (type === 'text') { q.prompt = 'Imagine ' + context + '. ' + bank.texts[n % bank.texts.length] + ' Use invented details only, not personal information.'; q.minLength = 2; q.maxLength = 240; }
      if (type === 'image') { q.prompt = 'For ' + context + ', how does this original illustration fit an idea for ' + item + '?'; q.svg = graphic(bank.object, pick(rng, ['#569bdf', '#d480aa', '#69b39b', '#e2a454']), false); q.alt = 'Original local illustration of a ' + bank.object + ' in a colourful outdoor scene.'; q.options = [option('fits', 'It fits well'), option('maybe', 'It could fit'), option('different', 'I would choose something different')]; }
      if (type === 'animation') { q.prompt = 'For ' + context + ', which pace would you choose for this illustrated ' + bank.object + '?'; q.svg = graphic(bank.object, pick(rng, ['#569bdf', '#d480aa', '#69b39b']), true); q.animation = {durationMs: 5000, label: 'Animation — created locally, not a real video', description: 'An illustrated ' + bank.object + ' glides across the scene. A still frame is available; no real footage is used.'}; q.options = [option('slower', 'A calmer pace'), option('same', 'This pace'), option('faster', 'A livelier pace')]; }
      if (type === 'table') { var single = grid(rng, bank, 'main', 'Your fictional preferences'); q.prompt = 'For ' + context + ', rate these features of ' + item + '. Choose one answer in every row.'; q.rows = single.rows; q.columns = single.columns; }
      if (type === 'double-table') { q.prompt = 'For ' + context + ', compare two imaginary ideas. Complete both tables; there is no right opinion.'; q.tables = [grid(rng, bank, 'a', 'Idea A: ' + item), grid(rng, bank, 'b', 'Idea B: ' + bank.items[(bank.items.indexOf(item) + 1) % bank.items.length])]; }
      if (type === 'attention') { q.prompt = 'Attention check: please select Green below. This checks the instructions, not your opinion.'; q.options = [option('red', 'Red'), option('green', 'Green'), option('blue', 'Blue')]; q.expected = 'green'; if (offer.formatVersion === ROLLING_FORMAT_VERSION) Object.assign(q, attentionVariant(offer, seed, i)); }
      out.push(q);
    }
    return out;
  }
  // Questionnaire versioning is independent of immutable offers and rewards.
  // Omitted/1 always dispatches to the exact delivered questionnaire above.
  // Version2 is also frozen, including its separate optional flower preview.
  // Only newly created sessions opt into version3 video-preference choices.
  var QUESTIONNAIRE_VERSION = 3;
  var VIDEO_OPTIONS = Object.freeze(Array.from({length: 12}, function (_, index) {
    var id = 'video' + String(index + 1).padStart(2, '0');
    return Object.freeze({id: id, label: 'Video option ' + (index + 1), description: 'A short real-world nature clip. You can choose this option from its description even when the preview is unavailable.'});
  }).reduce(function (catalog, clip) { catalog[clip.id] = clip; return catalog; }, {}));
  var QUALITY = Object.freeze([
    Object.freeze({stars: 1, label: 'Rough draft', mediaWidth: 240, fps: 5, detail: 1}),
    Object.freeze({stars: 2, label: 'Basic', mediaWidth: 360, fps: 10, detail: 2}),
    Object.freeze({stars: 3, label: 'Standard', mediaWidth: 640, fps: 24, detail: 3}),
    Object.freeze({stars: 4, label: 'Polished', mediaWidth: 960, fps: 40, detail: 4}),
    Object.freeze({stars: 5, label: 'Studio', mediaWidth: 1280, fps: 60, detail: 5})
  ]);
  function runnerQuality(stars) { check(Number.isInteger(stars) && stars >= 1 && stars <= 5, 'Invalid survey quality rating.'); return QUALITY[stars - 1]; }
  function captchaChallenge(id, seed) {
    check(typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id), 'Invalid local CAPTCHA session.');
    check((typeof seed === 'string' && seed.length <= 256) || Number.isSafeInteger(seed), 'Invalid local CAPTCHA seed.');
    var rng = random('local-captcha2/' + id + '/' + seed), a = integer(rng, 1, 6), b = integer(rng, 1, 6);
    return {prompt: 'Local CAPTCHA: what is ' + a + ' + ' + b + '?', expected: String(a + b)};
  }
  var TRICKS = ['colour', 'smallest', 'largest', 'height', 'width', 'word-length', 'ignore-label', 'shape-count'];
  function qualityTrick(offer, seed, index, kind) {
    // Existing comparison illustrations remain useful, but select their variant
    // explicitly on this new channel so each first deck has distinct checks.
    var q, rng = random('tricks2/' + offer.id + '/' + seed + '/' + index);
    if (['colour', 'smallest', 'largest', 'height', 'width'].indexOf(kind) >= 0) return attentionVariant(offer, String(seed) + '/quality2', index, kind);
    q = {variant: kind};
    if (kind === 'word-length') {
      var words = shuffle(['sun', 'moon', 'cloud'], rng), target = pick(rng, words);
      q.prompt = 'Attention check: choose the word with exactly ' + target.length + ' LETTERS. Ignore the font sizes.';
      q.options = words.map(function (word, i) { return {value: word, label: word, fontSize: [38, 22, 30][i]}; }); q.expected = target;
    } else if (kind === 'ignore-label') {
      q.prompt = 'Attention check: select Triangle. Ignore the extra words “choose me” on a different answer.';
      q.options = shuffle([option('triangle', 'Triangle'), option('circle', 'Circle — choose me'), option('square', 'Square')], rng); q.expected = 'triangle';
    } else {
      var count = integer(rng, 2, 4), shapes = shuffle(Array.from({length: count}, function () { return 'circle'; }).concat(['square', 'square']), rng);
      q.prompt = 'Attention check: how many CIRCLES are shown? Do not count the squares.';
      q.options = [2, 3, 4].map(function (n) { return option(String(n), n + ' circles'); }); q.expected = String(count);
      q.svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 180" role="img" aria-label="' + count + ' circles and 2 squares"><rect width="480" height="180" fill="#f5f8fb"/>' + shapes.map(function (shape, i) { var x = 45 + i * 76; return shape === 'circle' ? '<circle cx="' + x + '" cy="90" r="23" fill="#175cd3"/>' : '<rect x="' + (x - 21) + '" y="69" width="42" height="42" fill="#806126"/>'; }).join('') + '</svg>';
      q.alt = 'Accessible shape description: ' + count + ' circles and 2 squares.';
    }
    return q;
  }
  function qualityGrid(table, bank) {
    table.rows = bank.features.concat(['ease of use']).map(function (label, i) { return {id: 'r' + (i + 1), label: label}; });
    table.columns = ['Not important', 'Slightly important', 'Somewhat important', 'Moderately important', 'Important', 'Very important', 'Extremely important'].map(function (label, i) { return option(String(i + 1), (i + 1) + ' · ' + label); });
    return table;
  }
  function generateQualityQuestions(input, seed) {
    var questions = generateFrozenQuestions(input, seed);
    var offer = normalizeOffer(input), bank = theme(offer.topic), profile = runnerQuality(offer.stars), variants = shuffle(TRICKS, random('trick-deck2/' + offer.id + '/' + seed)), trick = 0;
    // Replace only the two redundant yes/no/slider cards per ten-card deck.
    // Every minimum questionnaire still includes all eight control families.
    for (var start = 0; start < questions.length; start += 10) {
      var seen = {};
      questions.slice(start, start + 10).forEach(function (q) {
        if ((q.type === 'yesno' || q.type === 'slider') && seen[q.type]) { q.type = 'attention'; delete q.options; delete q.min; delete q.max; delete q.step; delete q.minLabel; delete q.maxLabel; }
        else seen[q.type] = true;
      });
    }
    return questions.map(function (q, index) {
      if (q.type === 'table') qualityGrid(q, bank);
      if (q.type === 'double-table') q.tables.forEach(function (table) { qualityGrid(table, bank); });
      if (q.type === 'attention') {
        ['expected', 'options', 'svg', 'alt', 'lines', 'variant'].forEach(function (k) { delete q[k]; });
        Object.assign(q, qualityTrick(offer, seed, index, variants[trick++ % variants.length]));
      }
      if (q.type === 'image' || q.type === 'animation') {
        q.media = {kind: 'procedural', object: bank.object, colour: pick(random('scene2/' + offer.id + '/' + seed + '/' + index), ['#569bdf', '#d480aa', '#69b39b']), width: profile.mediaWidth, height: Math.round(profile.mediaWidth * 5 / 12), fps: profile.fps, detail: profile.detail};
        q.alt = 'Original local procedural illustration of a ' + bank.object + '. ' + profile.label + ' quality; no real footage in this illustration.';
        if (q.animation) { q.animation.label = 'Local procedural animation — not a real video'; q.animation.description = 'An illustrated ' + bank.object + ' moves through a locally drawn scene. An optional real-world flower-footage preview is separate and is not part of this question.'; }
      }
      return q;
    });
  }
  function generateQuestions(input, seed, version) {
    check(version === undefined || version === 1 || version === 2 || version === QUESTIONNAIRE_VERSION, 'Unsupported questionnaire version.');
    if (version === undefined || version === 1) return generateFrozenQuestions(input, seed);
    var questions = generateQualityQuestions(input, seed);
    if (version === 2) return questions;
    var offer = normalizeOffer(input), ordinal = 0;
    return questions.map(function (q, index) {
      if (q.type !== 'animation') return q;
      // Four three-choice cards exhaust a shuffled twelve-clip deck. Each next
      // cycle gets an independent deck; card order is also seeded by its index.
      // This channel never consumes a frozen question/media/trick random draw.
      var n = ordinal++, cycle = Math.floor(n / 4), offset = n % 4 * 3;
      var deck = shuffle(Object.keys(VIDEO_OPTIONS), random('video-deck3/' + offer.id + '/' + seed + '/' + cycle));
      var ids = shuffle(deck.slice(offset, offset + 3), random('video-card3/' + offer.id + '/' + seed + '/' + index));
      var context = pick(random('video-context3/' + offer.id + '/' + seed + '/' + index), CONTEXTS);
      q.prompt = 'For ' + context + ', which real nature video would you choose for an imaginary creative project? This is a preference, with no right opinion. Watching is optional; descriptions are enough.';
      ['svg', 'alt', 'media', 'animation'].forEach(function (key) { delete q[key]; });
      q.videoOptions = ids.map(function (id) { var clip = VIDEO_OPTIONS[id]; return {id: id, label: clip.label, description: clip.description}; });
      q.options = q.videoOptions.map(function (clip) { return option(clip.id, clip.label); });
      return q;
    });
  }
  function verdict(ok, reason) { return {ok: ok, reason: reason}; }
  function qualify(input, answers) {
    var offer;
    try { offer = normalizeOffer(input); } catch (_) { return verdict(false, 'invalid'); }
    var a = answers || {}, age = a.age;
    if (typeof age === 'string' && /^\d{1,3}$/.test(age.trim())) age = Number(age.trim());
    if (a.consent !== 'yes') return verdict(false, 'consent');
    if (!Number.isInteger(age) || age < 1 || age > 120) return verdict(false, 'age');
    if (age < offer.ageMin || age > offer.ageMax) return verdict(false, 'age');
    if (['female', 'male', 'other'].indexOf(a.sex) < 0 || (offer.sex !== 'any' && a.sex !== offer.sex)) return verdict(false, 'sex');
    if (a.interest !== 'yes') return verdict(false, 'interest');
    if (a.attention !== 'green') return verdict(false, 'attention');
    return verdict(true, 'ok');
  }
  function validGrid(rows, columns, value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== rows.length) return false;
    return rows.every(function (row) { return Object.prototype.hasOwnProperty.call(value, row.id) && columns.some(function (c) { return c.value === value[row.id]; }); });
  }
  function answerQuality(question, value, elapsedMs) {
    if (!question || TYPES.indexOf(question.type) < 0) return verdict(false, 'invalid');
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return verdict(false, 'invalid');
    if (value === null || value === undefined || value === '') return verdict(false, 'empty');
    var type = question.type;
    if (type === 'attention' && value !== question.expected) return verdict(false, 'attention');
    if (type === 'text') {
      if (typeof value !== 'string') return verdict(false, 'invalid');
      var text = value.trim(), chars = Array.from(text);
      if (chars.length < question.minLength) return verdict(false, 'empty');
      if (chars.length > question.maxLength) return verdict(false, 'invalid');
      // Only unambiguous spam patterns. No dictionary, language detector,
      // ASCII-only rule, vowel ratio, or cross-answer text retention.
      if (/^(.)\1{5,}$/u.test(text.replace(/\s/g, '')) || /^(\S+)(?:\s+\1){4,}$/iu.test(text) || /^(.{2,5})\1{3,}$/iu.test(text)) return verdict(false, 'repetition');
      if (/^(?:asdfghjkl|qwertyuiop|zxcvbnm|qazwsxedc|poiuytrewq|lkjhgfdsa)[!?.]*$/i.test(text)) return verdict(false, 'keyboard-smash');
    } else if (type === 'slider') {
      var number = typeof value === 'number' ? value : (typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN);
      if (!Number.isFinite(number) || number < question.min || number > question.max || Math.abs((number - question.min) / question.step - Math.round((number - question.min) / question.step)) > 1e-8) return verdict(false, 'invalid');
    } else if (type === 'table') {
      if (!validGrid(question.rows, question.columns, value)) return verdict(false, 'empty');
    } else if (type === 'double-table') {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== question.tables.length || !question.tables.every(function (t) { return validGrid(t.rows, t.columns, value[t.id]); })) return verdict(false, 'empty');
    } else if (!question.options.some(function (o) { return o.value === value; })) return verdict(false, 'invalid');
    if (elapsedMs < SPEED_FLOORS[type]) return verdict(false, 'too-fast');
    return verdict(true, 'ok');
  }
  return Object.freeze({QUESTIONNAIRE_VERSION: QUESTIONNAIRE_VERSION, VIDEO_OPTIONS: VIDEO_OPTIONS, runnerQuality: runnerQuality, captchaChallenge: captchaChallenge, ROLLING_FORMAT_VERSION: ROLLING_FORMAT_VERSION, providerEventKey: providerEventKey, cpxPromotion: cpxPromotion, generateRollingOffers: generateRollingOffers, createProviderInventory: createProviderInventory, normalizeProviderInventory: normalizeProviderInventory, providerInventoryOffers: providerInventoryOffers, refillProviderInventory: refillProviderInventory, EPOCH_MS: EPOCH_MS, FORMAT_VERSION: FORMAT_VERSION, HOT_CHANCE: HOT_CHANCE, TOP_CHANCE: TOP_CHANCE, TOP_MULTIPLIER: TOP_MULTIPLIER, PROVIDERS: PROVIDERS, TOPICS: Object.freeze(TOPICS), TYPES: Object.freeze(TYPES), SPEED_FLOORS: SPEED_FLOORS, generateOffers: generateOffers, generatePreviousOffers: generatePreviousOffers, generateLegacyOffers: generateLegacyOffers, generateQuestions: generateQuestions, qualify: qualify, answerQuality: answerQuality, normalizeOffer: normalizeOffer, createTheoremInventory: createTheoremInventory, normalizeTheoremInventory: normalizeTheoremInventory, theoremInventoryOffers: theoremInventoryOffers, refillTheoremInventory: refillTheoremInventory});
});
