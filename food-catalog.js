(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module !== null &&
      Object.prototype.hasOwnProperty.call(module, 'exports')) {
    module.exports = api;
  } else {
    if (Object.getOwnPropertyDescriptor(root, 'BalatroFoodCatalog')) {
      throw new Error('FOOD_GLOBAL_EXISTS');
    }
    Object.defineProperty(root, 'BalatroFoodCatalog', {
      value: api, enumerable: true, writable: false, configurable: false
    });
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Native rules are implemented in food-effects.js. Seven immutable public columns.
  function R(id, name, benefit, drawback, duration, hook, help) {
    return Object.freeze({id, name, benefit, drawback, duration, hook, help});
  }
  const catalog = [
    R('F001','Black Olive','Interest cap +$2','Hands -2; no early cash','B','E:B+E:P','B start: cap delta +2.'),
    R('F002','Tomato Toast','Start +1 hand','Start -1 discard; minimum rule','B','E:B','B start hands +1, discards -1.'),
    R('F003','Cucumber Sandwich','Start +1 discard','Each score -20 Chips; no extra draw','B','E:B+E:S','B start d+1; score C-20.'),
    R('F004','Carrot Sticks','First 1-card discard refunded','Each score -1 Mult; once only','B','N:R+E:S','First n=1 discard refunds 1 d.'),
    R('F005','Pea Soup','Each score +35 Chips','Start -1 discard','B','E:B+E:S','C+35; B start d-1.'),
    R('F006','Roasted Pepper','First hand x1.30 Mult','Later hands x0.90 Mult','B','E:S','k=1 factor1.30; k>1 factor0.90.'),
    R('F007','Sweetcorn Cup','Discards build +10 Chips, max30','Start -1 hand','B','E:B+E:S','C+10*min(v,3); hands -1.'),
    R('F008','Baked Potato','2+ hands left: +40 Chips','Last hand -10 Chips','B','E:S','h>=2 C+40; h=0 C-10; h=1 neutral.'),
    R('F009','Spinach Parcel','Last hand +5 Mult','Earlier hands -1 Mult','B','E:S','h=0 M+5; h>0 M-1.'),
    R('F010','Pumpkin Wedge','Blind target -10%','Start -1 hand','B','N:T+E:B','Target factor0.90; hands -1.'),
    R('F011','Apple Slice','1-card plays +20 Chips','4+ card plays -10 Chips','B','E:S','n=1 C+20; n>=4 C-10.'),
    R('F012','Banana Split','2-card plays +3 Mult','Other sizes -1 Mult','B','E:S','n=2 M+3; n!=2 M-1.'),
    R('F013','Orange Segments','Scored ranks +10 Chips each, max50','Start -1 discard; Stone excluded','B','E:B+E:S','Distinct scored ranks; d-1.'),
    R('F014','Strawberry Skewer','Exactly 3 scoring cards +50 Chips','Other known counts -10 Chips','B','E:S','q=3 C+50; other known q C-10.'),
    R('F015','Blueberry Muffin','First Pair +6 Mult','Later Pairs -2 Mult','B','N:H+E:S','Exact Pair; other types neutral.'),
    R('F016','Pear Tart','Two Pair +4 Mult','Other known types -10 Chips','B','E:S','Exact Two Pair, not subhands.'),
    R('F017','Peach Crumble','Full House x1.35 Mult','Other known types x0.95 Mult','B','E:S','Exact Full House, not subhands.'),
    R('F018','Pineapple Rings','Straight +60 Chips','Flush -2 Mult','B','E:S','Exact Straight/Flush only.'),
    R('F019','Mango Cubes','Flush +5 Mult','Following play -15 Chips','B','N:H+E:S','Flush arms next-play penalty; no stacking.'),
    R('F020','Watermelon Wedge','6-card plays +80 Chips','1-3 card plays -15 Chips','B','E:S','n=6 C+80; n<=3 C-15; native cap stays.'),
    R('F021','Oat Porridge','+8 Chips per hand played, max40','Each score -2 Mult','B','E:S','C+8*min(k,5); M-2.'),
    R('F022','Cheese Sandwich','Previous type repeated: +3 Mult','Type change -10 Chips','B','N:H+E:S','Compare previous public type; first neutral.'),
    R('F023','Rice Ball','+1 Mult per eligible held card, max5','Each score -15 Chips','B','E:S','Face-up held excludes selected; C-15.'),
    R('F024','Sesame Bagel','+8 Chips per scored suit, max32','Start -1 hand','B','E:B+E:S','Distinct printed suits; hands -1.'),
    R('F025','Wholegrain Roll','Before any discard +25 Chips','Afterwards -1 Mult','B','E:S','v=0 C+25; v>0 M-1.'),
    R('F026','Buttered Noodles','No scored faces +40 Chips','Any scored face -2 Mult','B','E:S','Wholly eligible scored set; printed J-Q-K.'),
    R('F027','Couscous Bowl','After first scoring card +5 Chips each','Solo scoring card -1 Mult','B','E:S','C+5*max(0,q-1), max25; q=1 M-1.'),
    R('F028','Quinoa Salad','All scored ranks different +3 Mult','Repeated ranks -15 Chips; Stone fails','B','E:S','Nonempty wholly eligible distinct ranked set.'),
    R('F029','Corn Tortilla','First 3+ discard fuels next hand +3 Mult','Each score -15 Chips','B','N:H+E:S','One token from first qualifying discard.'),
    R('F030','Pretzel Twist','Odd hands +30 Chips; even +3 Mult','Start -1 discard','B','E:B+E:S','k odd C+30, even M+3; d-1.'),
    R('F031','Lentil Stew','+10 Chips per discard left, max50','Start -1 hand','B','E:B+E:S','C+10*min(d,5); hands -1.'),
    R('F032','Chickpea Fritter','1-card discard fuels next +15 Chips','Other discard clears; always -1 Mult','B','N:H+E:S','Last discard n=1 arms one-play C+15.'),
    R('F033','Black Bean Taco','4+ discard fuels next +5 Mult','Other discard clears; first hand -20 Chips','B','N:H+E:S','Last discard n>=4 arms; k=1 C-20.'),
    R('F034','Edamame Cup','First voluntary discard adds 1 hand','Each score -20 Chips','B','N:R+E:S','Once only; native hand locks win.'),
    R('F035','Hummus Dip','1-2 card opener arms discard refund','Start -1 hand','B','N:R+N:H+E:B','Legal k=1,n<=2: next d refund once; locks win.'),
    R('F036','Tofu Cubes','+12 Chips per type tried, max60','Each score -2 Mult','B','N:H+E:S','C+12*min(public types used,5); M-2.'),
    R('F037','Peanut Butter Toast','Held 2s +3 Mult each, max9','Scored Aces -15 Chips each, max30','B','E:S','M+3*min(held 2s,3); C-15*min(scored Aces,2).'),
    R('F038','Almond Biscuit','Scored 3,5,7 +12 Chips each, max36','Held Kings -1 Mult each, max3','B','E:S','C+12*min(matches,3); M-min(held Kings,3).'),
    R('F039','Cashew Crunch','Scored Stone +20 Chips each, max60','No scored Stone -1 Mult','B','E:S','C+20*min(scored Stones,3); zero M-1.'),
    R('F040','Walnut Loaf','Score Bonus and Mult cards: +4 Mult','Known failure -10 Chips','B','E:S','Both enhancement kinds together required.'),
    R('F041','Cheddar Cube','Exactly 3 active Jokers +4 Mult','More than 3 -20 Chips','B','E:S','Active physical Jokers; copies not new items.'),
    R('F042','Mozzarella Bite','+15 Chips per free Joker slot, max45','No free Joker slot -1 Mult','B','E:S','Native live free capacity, no added slot.'),
    R('F043','Yogurt Parfait','+2 Mult per owned consumable, max6','No consumables -15 Chips','B','E:S','Count owned, max3; no generation.'),
    R('F044','Cottage Cheese Bowl','Free consumable slot +30 Chips','Full consumable capacity -2 Mult','B','E:S','Native live free capacity >0, no override.'),
    R('F045','Egg Muffin','Active Boss +6 Mult','Suppressed/other Blind -15 Chips','B','E:S','Native activeBoss true required.'),
    R('F046','Omelette Roll','Active Boss target -8%','Otherwise target +4%','B','N:T','Factor0.92 or1.04; recheck suppression.'),
    R('F047','Custard Cup','Hand1 +60 Chips; hand2 +30','Later hands -10 Chips','B','E:S','k=1/2 C+60/+30; k>=3 C-10.'),
    R('F048','Rice Pudding','Held Steel +15 Chips each, max45','Each score x0.95 Mult','B','E:S','Eligible held Steel max3; M factor0.95.'),
    R('F049','Honey Pancake','Each score +4 Mult','Unused-hand cashout halved','B','E:S+E:P','Native Remaining hands H: delta -ceil(H/2).'),
    R('F050','Waffle Square','Double unused-hand cash, max +$4','Start -1 discard','B','E:B+E:P','H delta +min(4,H); native zero stays zero.'),
    R('F051','Salmon Rice Bowl','Interest divisor reduced by $1','Start -1 hand','B','E:B+E:P','Native divisor reduction1, min1; no early pay.'),
    R('F052','Tuna Sandwich','Interest cap +$4','No unused-hand cashout','B','E:P','Cap delta+4; H zero rule; Green still zero.'),
    R('F053','Fish Finger','Blind reward x1.5','No Interest','B','E:P','Reward delta floor(L/2); base0 stays0.'),
    R('F054','Shrimp Dumpling','Double held-Gold cash, max +$6','Each score -2 Mult','B','E:S+E:P','Native Held Gold L: +min(6,L); no triggers.'),
    R('F055','Chicken Wrap','S shelf Buy/Use coupon -$2','B each score -2 Mult; no ticket coupon','B+S','E:Q+E:S','Next shop: first eligible native-priced shelf Buy/Use -$2; this blind -2 Mult.'),
    R('F056','Turkey Meatball','S pack coupon -$3','B start -1 hand','B+S','E:B+E:Q','Next shop: first eligible native-priced pack -$3; this blind -1 hand.'),
    R('F057','Beef Empanada','S voucher coupon -$2','B target +5%','B+S','N:T+E:Q','Next shop: first eligible native-priced voucher -$2; target +5%.'),
    R('F058','Pork Bun','S native reroll coupon -$2','B first hand -15 Chips; no extra roll','B+S','E:S+E:Q','Next shop: first eligible native-priced reroll -$2; first hand -15 Chips.'),
    R('F059','Lamb Kofta','B each score +4 Mult','S shelf prices +$1','B+S','E:S+E:Q','Includes rerolled shelf; native free stays0.'),
    R('F060','Mushroom Risotto','S pack prices -$1','S shelf prices +$1','B+S','E:Q','All matching S quotes; tickets unchanged; free stays0.'),
    R('F061','Margherita Pizza','5-card plays +5 Mult','Other sizes -20 Chips','B','E:S','n=5 M+5; n!=5 C-20.'),
    R('F062','Veggie Burger','Try 4 types: x1.40 Mult','Until then x0.90 Mult','B','N:H+E:S','Public types used >=4; current known counts.'),
    R('F063','Falafel Pita','New type +35 Chips','Repeated type -15 Chips','B','N:H+E:S','First use compares prior public type history.'),
    R('F064','Vegetable Sushi','Repeat previous play size +4 Mult','Size change -10 Chips','B','N:H+E:S','Compare n to preceding n; first neutral.'),
    R('F065','Potato Gnocchi','1-2 scoring cards +50 Chips','5+ scoring cards -2 Mult','B','E:S','q=1/2 C+50; q>=5 M-2.'),
    R('F066','Cheese Quesadilla','Exactly 2 scored ranks +6 Mult','Known failure -15 Chips','B','E:S','Distinct scored ranks count2; Stone excluded.'),
    R('F067','Vegetable Paella','3+ scored suits +40 Chips','Exactly 1 scored suit -2 Mult','B','E:S','Distinct printed suits; 2 suits neutral.'),
    R('F068','Spinach Lasagne','Scoring outnumbers held: +3 Mult','Known failure -20 Chips','B','E:S','q > eligible held count; selected excluded.'),
    R('F069','Broccoli Quiche','All held ranks below scored: +7 Mult','Start -1 hand','B','E:B+E:S','max(held)<min(scored); both sets nonempty.'),
    R('F070','Cauliflower Bake','0-1 active Jokers +70 Chips','4+ active Jokers -2 Mult','B','E:S','Active physical count; 2-3 neutral; no parking.'),
    R('F071','Ginger Biscuit','Below 25% target refunds 1 hand','Each score -10 Chips','B','N:R+E:S','First legal final total <target/4; once, not won.'),
    R('F072','Cinnamon Roll','Same-type streak +2 Mult/hand, max6','Nonfirst type change -20 Chips','B','N:H+E:S','Streak1..3; M+2*streak; change resets to1.'),
    R('F073','Lemon Scone','New ranks +8 Chips each, max40','Old ranks -2 Chips each, max12','B','N:H+E:S','13-rank visible card; distinct N/O: C+8*min(N,5)-2*min(O,6); punch after.'),
    R('F074','Cocoa Brownie','In debt +50 Chips','Interest cap -$2','B','E:S+E:P','Bank<0 C+50; cap delta-2; no credit.'),
    R('F075','Vanilla Cookie','Bank $0 to under $10: +5 Mult','Bank $10+ -10 Chips','B','E:S','0<=Bank<10 M+5; debt neutral.'),
    R('F076','Coconut Macaroon','+5 Chips per $5 saved, max50','Start -1 hand','B','E:B+E:S','C+5*min(10,floor(max(0,Bank)/5)); exact Bank.'),
    R('F077','Raisin Bun','+2 Mult per $5 debt, max6','Each score -20 Chips','B','E:S','M+2*min(3,floor(max(0,-Bank)/5)); native credit.'),
    R('F078','Date Square','Each score +30 Chips','No unused-discard cashout','B','E:S+E:P','Remaining discards zero; Green loses line; no tax.'),
    R('F079','Fig Cracker','First discard arms +5 Mult for 2 plays','Exhausted: -1 Mult','B','N:H+E:S','Before first discard neutral; no rearming.'),
    R('F080','Apricot Oat Bar','1-card discards build +1 Mult, max3','Bigger discard: next hand -10 Chips','B','N:H+E:S','Counter0..3; one nonstacking penalty token.'),
    R('F081','Popcorn Cup','+60 Chips fading by15 each hand','Start -1 discard','B','E:B+E:S','C+max(0,60-15*(k-1)); no Joker object.'),
    R('F082','Seaweed Crisp','Scored 2-5 +8 Chips each, max32','Scored 10-A -1 Mult each, max4','B','E:S','C+8*min(low,4); M-min(high,4); no Stone ranks.'),
    R('F083','Pickled Gherkin','Exactly 1 discard used +6 Mult','2+ discards used -15 Chips','B','E:S','v=1 M+6; v>=2 C-15; v=0 neutral.'),
    R('F084','Radish Rosette','First Flush restores 1 discard','Each score -2 Mult','B','N:R+E:S','First legal exact Flush; once; zero locks win.'),
    R('F085','Beetroot Dip','Empty start consumables: +1 hand','Each score x0.90 Chips','B','E:B+E:S','Snapshot inventory at B start; C factor0.90.'),
    R('F086','Avocado Toast','Play from full hand +4 Mult','Start -1 discard','B','E:B+E:S','Preplay count=native hand size; overfull not full.'),
    R('F087','Zucchini Fritter','First 5-card play restores 1 discard','1-2 card plays -2 Mult','B','N:R+E:S','First legal n=5 once; native locks win.'),
    R('F088','Aubergine Roll','S Tarot/Planet shelf prices -$1','S Joker shelf prices +$1','B+S','E:Q','Native Buy/Use; no packs/capacity bypass; free stays0.'),
    R('F089','Asparagus Tart','Play visible debuffed card +40 Chips','Otherwise -10 Chips','B','E:S','Public selected debuff flag only; forbidden stays0.'),
    R('F090','Leek Soup','Start +2 discards','Interest cap -$3','B','E:B+E:P','Cap min0; native zero locks win.'),
    R('F091','Saffron Rice','All scored ranks even +6 Mult','Any odd scored rank -15 Chips','B','E:S','Nonempty ranked set; odd A,3,5,7,9,J,K.'),
    R('F092','Basil Pesto Pasta','2 red and 2 black scored +50 Chips','Single scored colour -2 Mult','B','E:S','Printed eligible counts >=2 each; single nonempty.'),
    R('F093','Garlic Bread','Start +1 hand','First hand -50 Chips','B','E:B+E:S','k=1 C-50 floor0; no current-round gift.'),
    R('F094','Rosemary Focaccia','Blind target -5%','Each score -2 Mult','B','N:T+E:S','Target factor0.95; M-2.'),
    R('F095','Mint Pea Mash','Discard before hand: x1.25 Mult','Unarmed hand x0.95 Mult','B','N:H+E:S','Voluntary discard arms one-play token; no stacking.'),
    R('F096','Dill Potato Salad','No discards left +5 Mult','Discards left -10 Chips','B','E:S','d=0 M+5; d>0 C-10; no discard grant.'),
    R('F097','Parsley Couscous','Blind score halfway or more +50 Chips','Before halfway -1 Mult','B','E:S','Preplay score>=target/2; no future peek.'),
    R('F098','Turmeric Cauliflower','Score consumable count+1: +5 Mult','Known failure -10 Chips','B','E:S','q=owned consumables+1; capacity unchanged.'),
    R('F099','Paprika Wedges','Each score x1.20 Mult','Blind target +8%','B','N:T+E:S','M factor1.20; target factor1.08.'),
    R('F100','Rainbow Fruit Salad','Another B-active food: +5 Mult','Alone -20 Chips','B','E:S','Second distinct B-active only; not pending/S-only.')
  ];
  Object.freeze(catalog);

  function isFoodId(id) {
    return typeof id === 'string' && id.length === 4 &&
      /^F(?:00[1-9]|0[1-9][0-9]|100)$/.test(id);
  }
  function list() { return catalog; }
  function get(id) {
    if (!isFoodId(id)) throw new TypeError('FOOD_ID');
    return catalog[Number(id.slice(1)) - 1];
  }

  // BEGIN_TASK2_CHOOSER
  function chooseOffers(seed, ownedAtGeneration) {
    if (!(typeof seed === 'string' && seed.length > 0 && seed.length <= 256) &&
        !(typeof seed === 'number' && Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff)) throw new TypeError('FOOD_SEED');
    if (!Array.isArray(ownedAtGeneration) || ownedAtGeneration.length > 97 ||
        !ownedAtGeneration.every(isFoodId) || new Set(ownedAtGeneration).size !== ownedAtGeneration.length) throw new TypeError('FOOD_OWNED');
    const excluded = new Set(ownedAtGeneration), pool = catalog.filter(row => !excluded.has(row.id)).map(row => row.id);
    let rng = 2166136261;
    for (const c of 'FOOD-OFFERS-V1|' + seed) rng = Math.imul(rng ^ c.charCodeAt(0), 16777619) >>> 0;
    rng = rng || 1;
    // A separate, once-generated seeded stock stream. Never calls gameplay RNG.
    for (let i = 0; i < 3; i++) {
      rng ^= rng << 13; rng ^= rng >>> 17; rng ^= rng << 5; rng >>>= 0;
      const j = i + rng % (pool.length - i), temp = pool[i]; pool[i] = pool[j]; pool[j] = temp;
    }
    return Object.freeze(pool.slice(0, 3));
  }
  // END_TASK2_CHOOSER

  return Object.freeze({VERSION: 1, list, get, chooseOffers});
}));
