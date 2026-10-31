(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BOLateLevelCosts = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const costs = Object.freeze([
    110000,120000,130000,140000,150000,175000,200000,220000,240000,250000,
    250000,300000,350000,400000,450000,500000,625000,750000,825000,1000000,
    1500000,2000000,2500000,3000000,3500000,4000000,4500000,5000000,7500000,10000000,
    10000000,20000000,30000000,40000000,50000000,60000000,70000000,80000000,90000000,100000000,
    400000000,700000000,1000000000,2000000000,3000000000,5000000000,8000000000,12000000000,17000000000,25000000000
  ]);
  function normalCost(level) {
    if (!Number.isInteger(level) || level < 1 || level > 100) {
      throw new RangeError('Actual player level must be an integer from 1 to 100.');
    }
    return level >= 50 && level < 100 ? costs[level - 50] : null;
  }
  return Object.freeze({ VERSION: 1, normalCost });
}));
