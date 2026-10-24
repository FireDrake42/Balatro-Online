(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BOFaucetGraph = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Pure presentation: rows are supplied by the caller, never inferred from a save.
  // pointInfo returns plain text for textContent; render escapes every insertion.
  var MAX_LEVEL = 50;
  var METRICS = {
    claims: {button: 'Total claims required', title: 'Total lifetime claims to advance', axis: 'Lifetime claims'},
    coins: {button: 'Coins per claim', title: 'Coins per claim', axis: 'Coins per claim'},
    cooldown: {button: 'Cooldown (seconds)', title: 'Cooldown (seconds)', axis: 'Seconds between claims'}
  };
  var COLORS = {background: '#142a32', grid: '#35525a', text: '#e7f2ee', muted: '#b7cfcc', teal: '#76e2cd', gold: '#e4c977'};
  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character];
    });
  }
  function metricName(metric) {
    if (metric === undefined) return 'claims';
    if (typeof metric !== 'string' || !Object.prototype.hasOwnProperty.call(METRICS, metric)) {
      throw new RangeError('Faucet graph metric must be claims, coins or cooldown.');
    }
    return metric;
  }
  function formatter(format) {
    if (format !== undefined && typeof format !== 'function') throw new TypeError('Faucet graph format must be a function.');
    return format === undefined ? function (number) { return String(number); } : function (number) { return String(format(number)); };
  }
  function levelNumber(level) {
    if (!Number.isSafeInteger(level) || level < 1 || level > MAX_LEVEL) throw new RangeError('Faucet level must be an integer from 1 to 50.');
    return level;
  }
  function prepare(rows) {
    if (!Array.isArray(rows) || rows.length !== MAX_LEVEL) throw new TypeError('Faucet graph rows must contain all 50 unique faucet levels.');
    var ordered = new Array(MAX_LEVEL);
    rows.forEach(function (row) {
      if (row === null || typeof row !== 'object' || Array.isArray(row)) throw new TypeError('Each faucet graph row must be an object.');
      var level = levelNumber(row.level), terminal = level === MAX_LEVEL;
      if (ordered[level - 1]) throw new RangeError('Faucet graph rows must have unique levels; duplicate level ' + level + '.');
      if (row.terminal === true && !terminal) throw new RangeError('Only faucet level 50 is terminal.');
      var required = terminal || row.configurationMissing === true || row.requiredClaims === null || row.requiredClaims === undefined ? null : row.requiredClaims;
      if (required !== null && (!Number.isSafeInteger(required) || required <= 0)) throw new RangeError('A known claims requirement must be a positive safe integer.');
      ordered[level - 1] = {level: level, requiredClaims: required, terminal: terminal,
        coins: 1 + .5 * (level - 1), cooldown: 600 - 10 * (level - 1)};
    });
    // Also reject sparse arrays instead of inventing numeric points for absent rows.
    for (var level = 1; level <= MAX_LEVEL; level++) if (!ordered[level - 1]) throw new TypeError('Faucet graph rows must contain all 50 unique faucet levels.');
    return ordered;
  }
  function clock(seconds) { return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); }
  function selectedValue(row, metric) { return metric === 'claims' ? row.requiredClaims : row[metric]; }
  function describe(row, metric, number) {
    var prefix = 'Faucet level ' + row.level;
    if (metric === 'claims') {
      if (row.terminal) return prefix + ': terminal maximum level. No next level or claims requirement.';
      return prefix + ' → ' + (row.level + 1) + ': ' + (row.requiredClaims === null ? 'total successful lifetime claims requirement TBD (not configured)' : number(row.requiredClaims) + ' total successful lifetime claims required') + '. Cumulative total, not additional claims at this level.';
    }
    var value = metric === 'coins' ? number(row.coins) + (row.coins === 1 ? ' coin per claim' : ' coins per claim') : number(row.cooldown) + ' seconds (' + clock(row.cooldown) + ') between claims';
    return prefix + ': ' + value + '.' + (row.terminal ? ' Terminal maximum level; faucet cap 50.' : '');
  }
  function pointInfo(rows, level, metric, format) {
    var ordered = prepare(rows);
    return describe(ordered[levelNumber(level) - 1], metricName(metric), formatter(format));
  }
  function scale(maximum) {
    var raw = (maximum || 1) / 4, power = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var normalized = raw / power, steps = [1, 2, 2.5, 5, 10], step = steps[steps.length - 1] * power;
    for (var i = 0; i < steps.length; i++) if (normalized <= steps[i]) { step = steps[i] * power; break; }
    return {step: step, maximum: Math.ceil((maximum || 1) / step) * step};
  }
  function coordinate(value) { return String(Number(value.toFixed(3))); }
  function renderChart(rows, metric, number) {
    var width = 600, height = 350, left = 64, right = 28, top = 32, bottom = 240, rail = 292;
    var plotWidth = width - left - right, plotHeight = bottom - top, meta = METRICS[metric];
    var maximum = rows.reduce(function (max, row) { return Math.max(max, selectedValue(row, metric) || 0); }, 0), axis = scale(maximum);
    function x(level) { return left + (level - 1) / (MAX_LEVEL - 1) * plotWidth; }
    function y(value) { return bottom - value / axis.maximum * plotHeight; }
    var description = meta.title + ' versus current faucet level, 1 to 50. ' + (metric === 'claims' ? 'Unknown requirements are gaps, not zero or interpolation. Hollow TBD markers and the terminal marker are in a separate non-numeric lane below the axis. ' : '') + 'Faucet level 50 is the terminal cap. Use a point link or the all-50-level data table for exact values.';
    var html = '<svg class="faucet-graph-svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:auto" role="group" aria-roledescription="interactive line chart" aria-labelledby="faucet-graph-title faucet-graph-description">' +
      '<title id="faucet-graph-title">' + escape('Faucet: ' + meta.title + ', levels 1–50') + '</title><desc id="faucet-graph-description">' + escape(description) + '</desc>' +
      '<rect width="600" height="350" rx="14" fill="' + COLORS.background + '"/>' +
      '<g font-family="system-ui,sans-serif" font-size="16" fill="' + COLORS.text + '">' +
      '<text class="faucet-graph-y-axis" x="' + left + '" y="20" font-size="15">' + escape(meta.axis) + '</text>';
    var ticks = Math.round(axis.maximum / axis.step);
    for (var i = 0; i <= ticks; i++) {
      var value = Number((i * axis.step).toPrecision(12)), tickY = coordinate(y(value));
      html += '<path d="M' + left + ' ' + tickY + 'H' + (width - right) + '" stroke="' + COLORS.grid + '" stroke-width="1" fill="none"/>' +
        '<text class="faucet-graph-y-tick" x="' + (left - 9) + '" y="' + coordinate(y(value) + 5) + '" text-anchor="end" fill="' + COLORS.muted + '">' + escape(number(value)) + '</text>';
    }
    html += '<path d="M' + left + ' ' + top + 'V' + bottom + 'H' + (width - right) + '" stroke="' + COLORS.muted + '" stroke-width="1.5" fill="none"/>';
    [1, 10, 20, 30, 40, 50].forEach(function (level) {
      html += '<path d="M' + coordinate(x(level)) + ' ' + bottom + 'v6" stroke="' + COLORS.muted + '"/>' +
        '<text class="faucet-graph-x-tick" x="' + coordinate(x(level)) + '" y="263" text-anchor="middle">' + level + '</text>';
    });
    html += '<text class="faucet-graph-x-axis" x="' + coordinate(left + plotWidth / 2) + '" y="332" text-anchor="middle">Current faucet level</text>' +
      '<path class="faucet-graph-cap-line" d="M' + coordinate(x(MAX_LEVEL)) + ' ' + top + 'V' + bottom + '" stroke="' + COLORS.gold + '" stroke-dasharray="4 5" opacity="0.7"/>' +
      '<text x="' + (width - right) + '" y="20" text-anchor="end" font-size="15" fill="' + COLORS.gold + '">Cap 50</text>' +
      '<rect x="' + left + '" y="274" width="' + plotWidth + '" height="36" rx="8" fill="' + COLORS.gold + '" fill-opacity="0.07"/>';
    var path = '';
    function flush() {
      if (path) html += '<path class="faucet-graph-line" d="' + path + '" fill="none" stroke="' + COLORS.teal + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
      path = '';
    }
    rows.forEach(function (row) {
      var value = selectedValue(row, metric);
      if (value === null) { flush(); return; }
      path += (path ? 'L' : 'M') + coordinate(x(row.level)) + ' ' + coordinate(y(value));
    });
    flush();
    rows.forEach(function (row) {
      var value = selectedValue(row, metric), state = value !== null ? 'value' : row.terminal ? 'terminal' : 'tbd';
      var pointX = coordinate(x(row.level)), pointY = coordinate(value === null ? rail : y(value));
      var label = describe(row, metric, number);
      html += '<a class="faucet-graph-point faucet-graph-point-' + state + '" href="#faucet-graph-point" tabindex="0" data-level-action="graph-point" data-level="' + row.level + '" data-graph-state="' + state + '"' + (value === null ? '' : ' data-value="' + escape(value) + '"') + ' aria-controls="faucet-graph-point" aria-label="' + escape(label) + '"><title>' + escape(label) + '</title>' +
        '<circle cx="' + pointX + '" cy="' + pointY + '" r="9" fill="transparent"/>';
      if (state === 'value') {
        html += '<circle class="faucet-graph-dot" cx="' + pointX + '" cy="' + pointY + '" r="3.7" fill="' + COLORS.teal + '" stroke="' + COLORS.background + '" stroke-width="1.5"/>';
      } else if (state === 'tbd') {
        html += '<circle class="faucet-graph-tbd" cx="' + pointX + '" cy="' + pointY + '" r="5.5" fill="' + COLORS.background + '" stroke="' + COLORS.gold + '" stroke-width="2"/>' +
          '<text x="' + coordinate(x(row.level) + 11) + '" y="297" fill="' + COLORS.gold + '" font-size="15">' + row.level + ' TBD</text>';
      } else {
        html += '<path d="M' + pointX + ' ' + (rail - 7) + 'l7 7-7 7-7-7Z" fill="' + COLORS.gold + '"/>';
      }
      html += '</a>';
    });
    // The cap label remains in the non-numeric lane even in reward/cooldown views.
    html += '<text x="' + coordinate(x(MAX_LEVEL) - 13) + '" y="297" text-anchor="end" fill="' + COLORS.gold + '" font-size="15">50 MAX</text></g></svg>';
    return html;
  }
  function dataTable(rows, metric, number) {
    var html = '<details class="faucet-graph-data"><summary>All 50 faucet levels · accessible data table</summary>' +
      '<div class="faucet-graph-table-wrap" role="region" aria-label="All 50 faucet levels" tabindex="0" style="max-width:100%;overflow-x:auto"><table class="faucet-graph-table">' +
      '<caption>Faucet data: cumulative successful lifetime claims required to advance from each current faucet level; level 50 is terminal. TBD is not zero.</caption>' +
      '<thead><tr><th scope="col">Current faucet level</th><th scope="col">Total lifetime claims to advance</th><th scope="col">Coins per claim</th><th scope="col">Cooldown (seconds; m:ss)</th></tr></thead><tbody>';
    rows.forEach(function (row) {
      var requirement = row.terminal ? 'MAX — terminal; no next level' : row.requiredClaims === null ? 'TBD — not configured' : number(row.requiredClaims) + ' total claims → level ' + (row.level + 1);
      html += '<tr><th scope="row"><button type="button" class="faucet-graph-table-level" data-level-action="graph-point" data-level="' + row.level + '" aria-controls="faucet-graph-point" aria-label="' + escape(describe(row, metric, number)) + '">' + row.level + '</button></th>' +
        '<td>' + escape(requirement) + '</td><td>' + escape(number(row.coins) + (row.coins === 1 ? ' coin' : ' coins')) + '</td><td>' + escape(number(row.cooldown) + ' seconds (' + clock(row.cooldown) + ')') + '</td></tr>';
    });
    return html + '</tbody></table></div></details>';
  }
  function render(options) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Faucet graph options with all 50 rows are required.');
    var rows = prepare(options.rows), metric = metricName(options.metric), number = formatter(options.format);
    var html = '<figure class="faucet-graph" data-graph-metric="' + metric + '"><h3>Faucet levels 1–50</h3>' +
      '<p class="faucet-graph-intro">Informational faucet data, not player XP. Viewing this graph below player level 25 does not unlock or grant faucet claims.</p>' +
      '<div class="faucet-graph-metrics" role="group" aria-label="Faucet graph metric">';
    Object.keys(METRICS).forEach(function (name) {
      html += '<button type="button" class="btn ghost small faucet-graph-metric" data-level-action="graph-metric" data-metric="' + name + '" aria-pressed="' + (metric === name) + '">' + escape(METRICS[name].button) + '</button>';
    });
    html += '</div><p class="faucet-graph-unit"><strong>' + escape(METRICS[metric].title) + '</strong></p>' + renderChart(rows, metric, number) +
      '<ul class="faucet-graph-legend" aria-label="Graph legend"><li>Teal points: ' + escape(metric === 'claims' ? 'known cumulative lifetime claims thresholds' : metric === 'coins' ? 'coins per claim' : 'cooldown in seconds') + '.</li>' +
      (metric === 'claims' ? '<li>Hollow gold / TBD: requirement not configured. Gaps are not zero and are not joined; these markers are non-numeric.</li>' : '') +
      '<li>Gold cap 50: terminal faucet level; no next tier' + (metric === 'claims' ? ' or claims threshold' : '') + '.</li></ul>' +
      '<p class="faucet-graph-guide">Tap a point, use a keyboard point link, or choose a level in the data table for exact values.</p>' +
      '<p class="faucet-graph-point-info" id="faucet-graph-point" role="status" aria-live="polite" aria-atomic="true">' + escape(describe(rows[0], metric, number)) + '</p>' +
      dataTable(rows, metric, number) +
      '<figcaption class="faucet-graph-caption">Each threshold is the total number of successful lifetime claims needed to advance from the current faucet level, not extra claims to earn at that tier. Progress is cumulative and never resets when a level is reached. The supplied table is authoritative; unconfigured thresholds remain TBD. Each latest range describes ten transitions — 30→31 through 39→40, then 40→41 through 49→50; the bare 5.9 means 5.9K. Equal thresholds share the same cumulative total. Faucet cap 50 is terminal, with no next level or invented claims threshold.</figcaption></figure>';
    return html;
  }
  return {render: render, pointInfo: pointInfo};
}));
