/* Pure Settings presentation. The parent owns all policy writes, verified
 * save boundaries and delegated input handlers. No listeners, clocks or timers. */
(function (root, factory) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./feature-power') : root.BOFeaturePower,
    node ? require('./interest-settings') : root.BOInterestSettings, root);
  if (node) module.exports = api;
  else root.BOPowerSettingsUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FP, IS, root) {
  'use strict';
  const ID = 'power-settings-controls';
  const EN = Object.freeze({
    title: 'Interest and feature power',
    interestRulesLate: 'One saved interest stream. Existing XP/Joker/Poker boosts apply before its nominal cap. From Level63 the roadmap cap is XP/sec, converted to each payment interval. From50, one critical roll per real payment doubles that capped payment afterward. At80 earned cadence takes over; the saved choice remains.',
    interestTitle: 'Compound Interest · one saved stream',
    interestRules: 'From actual Level 42, the cap is 10 actual XP per payment, not per second. These rows edit one interest stream, not separate payments. Percentages are base rates before earned-XP bonuses and the cap.',
    fullUnlock: 'Full interval/rate choice unlocks at Level 44. Until then, the native timing and rate stay unchanged.',
    row: 'Level {level} · Compound Interest',
    rowLocked: 'This row unlocks at actual Level {level}; it will edit the same saved choice.',
    rowShared: 'Mirrors the same saved interval/rate choice as every other unlocked row.',
    native: 'Native · {ms} ms · {percent}% per payment',
    choice: '{ms} ms · {percent}% per payment',
    zero: 'Actual Level 100 earns 0 XP from interest. Your saved interval/rate choice is retained.',
    featureTitle: 'Feature power · Level 51',
    featureLocked: 'Feature switches unlock at Level 51. Saved choices are retained; they do not disable features or add battery life below this level.',
    featureHelp: 'Checked means explicitly enabled in your saved choices. Low Power may pause background activity without unchecking these switches.',
    featureInterest: 'Compound Interest',
    featurePassiveMoney: 'Passive Money',
    featurePassiveXp: 'Passive XP',
    featureUsername: 'Username display',
    featureCardGames: 'Card games',
    featureStatistics: 'Statistics',
    featureSurveys: 'Surveys',
    featureMarket: 'Market',
    life: 'Disabled features: {count}/8 · +{percent}% battery life · ×{factor}',
    lifeRules: 'Each disabled feature adds 3% battery life, up to +24% for eight. Drain divides by 1 + 0.03 × disabled count; charging speed does not change.',
    lowPowerOn: 'Low Power is on.',
    lowPowerOff: 'Low Power is off.',
    lowPowerRules: 'Low Power pauses Compound Interest, Passive Money, Passive XP and background Market activity. It keeps your saved choices and history.',
    essentials: 'These switches never disable essential charging, battery drain, saving or recovery. Their existing timing rules still apply; no history is deleted.'
  });
  const FEATURES = Object.freeze({
    interest: 'featureInterest', passiveMoney: 'featurePassiveMoney', passiveXp: 'featurePassiveXp',
    username: 'featureUsername', cardGames: 'featureCardGames', statistics: 'featureStatistics',
    surveys: 'featureSurveys', market: 'featureMarket'
  });
  const esc = value => String(value ?? '').replace(/[&<>"']/g,
    char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  function label(key, params = {}) {
    const full = 'powerSettings.' + key;
    const translated = root.BOTranslation?.t?.(full, params);
    const source = typeof translated === 'string' && translated && translated !== full ? translated : EN[key];
    return source.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,
      (all, name) => Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : all);
  }
  function binding(key, params) {
    return ' data-i18n="powerSettings.' + key + '"' +
      (params ? ' data-i18n-params="' + esc(JSON.stringify(params)) + '"' : '');
  }
  function message(tag, key, params, attrs = '') {
    return '<' + tag + attrs + binding(key, params) + '>' + esc(label(key, params)) + '</' + tag + '>';
  }
  function project(profile, prefs) {
    // The helpers inspect only known own data fields; unrelated prefs, charge,
    // XP, usernames and autosave revisions are neither serialized nor read.
    const level = FP.level(profile), power = FP.settings(prefs), choice = IS.read(prefs);
    const lowPower = FP.lowPower(profile), disabledCount = FP.disabledCount(profile, prefs);
    const policy = [power, choice];
    return {level, power, choice, lowPower, disabledCount, effective: IS.effective(level, prefs),
      policySignature: JSON.stringify(policy), signature: JSON.stringify([level, policy, lowPower])};
  }
  function stamp(view) {
    return ' data-player-level="' + view.level + '" data-power-signature="' + esc(view.policySignature) + '"';
  }
  function interestRows(view) {
    const explicit = view.level >= 44 && view.choice !== null;
    return IS.UNLOCK_ROWS.map(level => {
      const id = 'power-interest-choice-' + level;
      const locked = view.level < level, disabled = locked || view.level < 44;
      let options = explicit ? '' : message('option', 'native',
        {ms: view.effective.intervalMs, percent: view.effective.percent}, ' value="native" disabled selected');
      if (view.level >= 44) options += IS.CHOICES.map(choice =>
        message('option', 'choice', {ms: choice.intervalMs, percent: choice.percent},
          ' value="' + choice.index + '"' + (explicit && view.choice.index === choice.index ? ' selected' : ''))).join('');
      return '<div class="power-interest-row">' +
        message('label', 'row', {level}, ' for="' + id + '"') +
        '<select id="' + id + '" data-interest-choice="' + level + '"' + stamp(view) +
        ' aria-describedby="power-interest-rules power-interest-row-' + level + '-note"' +
        (disabled ? ' disabled' : '') + '>' + options + '</select>' +
        message('small', locked ? 'rowLocked' : view.level < 44 ? 'fullUnlock' : 'rowShared',
          locked ? {level} : undefined, ' id="power-interest-row-' + level + '-note"') + '</div>';
    }).join('');
  }
  function featureSwitches(view) {
    return FP.KEYS.map(key => {
      const id = 'power-feature-' + key, checked = !view.power.disabled.includes(key);
      return '<label class="power-feature-row" for="' + id + '">' +
        '<input id="' + id + '" type="checkbox" data-feature-power="' + key + '"' + stamp(view) +
        ' aria-describedby="power-feature-help power-feature-life-rules"' +
        (checked ? ' checked' : '') + (view.level < 51 ? ' disabled' : '') + '>' +
        message('span', FEATURES[key]) + '</label>';
    }).join('');
  }
  function contents(view) {
    const count = view.disabledCount, factor = (1 + .03 * count).toFixed(2);
    return message('h3', 'title', undefined, ' id="power-settings-title"') +
      '<fieldset class="power-interest-settings">' + message('legend', 'interestTitle') +
      message('p', view.level>=50?'interestRulesLate':'interestRules', undefined, ' id="power-interest-rules"') +
      (view.level < 44 ? message('p', 'fullUnlock') : '') +
      (view.level === 100 ? message('p', 'zero', undefined, ' class="power-interest-zero"') : '') +
      '<div class="power-interest-rows">' + interestRows(view) + '</div></fieldset>' +
      '<fieldset class="power-feature-settings">' + message('legend', 'featureTitle') +
      (view.level < 51 ? message('p', 'featureLocked') : '') +
      message('p', 'featureHelp', undefined, ' id="power-feature-help"') +
      '<div class="power-feature-rows">' + featureSwitches(view) + '</div>' +
      message('output', 'life', {count, percent: count * 3, factor},
        ' id="power-feature-life" data-disabled-feature-count="' + count + '" data-battery-life-factor="' + factor + '"') +
      message('p', 'lifeRules', undefined, ' id="power-feature-life-rules"') + '</fieldset>' +
      '<div class="power-policy-notes">' + message('p', view.lowPower ? 'lowPowerOn' : 'lowPowerOff') +
      message('p', 'lowPowerRules') + message('p', 'essentials') + '</div>';
  }
  function render(profile, prefs) {
    const view = project(profile, prefs);
    if(view.level>=80)return ''; // retire controls, not saved choices/history/policy.
    return '<section id="' + ID + '" class="power-settings-controls" aria-labelledby="power-settings-title"' +
      ' data-power-ui-signature="' + esc(view.signature) + '">' + contents(view) + '</section>';
  }
  function paint(container, profile, prefs) {
    const view = project(profile, prefs);
    const section = container?.id === ID ? container : container?.querySelector?.('#' + ID);
    // Parent inserts render() into Settings; never replace an unrelated surface.
    if(section&&view.level>=80){section.remove();return true;}
    if (!section || section.getAttribute('data-power-ui-signature') === view.signature) return false;
    const html = contents(view);
    section.innerHTML = html;
    section.setAttribute('data-power-ui-signature', view.signature);
    return true;
  }
  return Object.freeze({render, paint, EN, label});
});
