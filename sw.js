/* Poker Table offline worker. package-ipad.py stamps only its DIST copy. */
'use strict';
const VERSION = 'f7aa3aa686b74d6e05237911';
const EXPECTED_HASHES = {"achievements-data.js": "9d6aae1ae853f207a18259b6bf7ba1209dff17c71e6bb8ee987949eded1c4294", "app.js": "2ae91c5f9156abac47da005eb1b4909a0f423f32d3d26a5f1232843c9192b2db", "audio.js": "3d7ebe9034346b21a564633829f56ae316218dc0ba1495d587fe3cb6921f25fa", "battery-controller.js": "e06371bd3a34b3067bbc117486691a8576dc940858f1cce5e0096e52ff56ec34", "battery-display.js": "088a89a8982ade6dd187daa57e39ce79a319c7271037c4c8581bc13c6564b2ab", "battery-ui.js": "b03ff3e93b8cf3cd63ac33c49f5b88ea68a10a6850e8f4e71a14f8e2f91da410", "battery.css": "8c8c1e2a2cae6864a902580ddf31a934b0879da1d1aac127e308cf3826645a2f", "battery.js": "6ff9898ce296ec635a0fdb0ddf9f45eb42a36c060c7d882c9f2c435e9836b513", "cap-levels.css": "63a995f6e13c8a1c9dc160bc1dfdd94cc36c5f85863aa87730122d36f509d844", "cloud-save.js": "913af9f93f5e8ff490e08ad3eb7f11156505817aacf2292ef807d0edb3b4f08e", "collection-tracking.js": "8e0ed02004acfbd21395d92172d7a786fec753737ee0a1e337533115af38e21d", "crit-effects.css": "0df6b7161077543b94f29eb57609a1313112aedc9f12569f66c268fa14b9add8", "custom-images.css": "65789ace7485c82915be17834b720998e9ae0e644f55708f5580d9ef1964a6be", "custom-images.js": "80b6ff96e6886453f29f3adb0bf32e5046ec40ac1c8a8063a734bc1555b0cfcb", "daily-streak-ui.js": "fa1ee1663c1ec25fc46c790bfc8339dfdf37b5d3fab452bca1237fdcc5898337", "daily-streak.css": "6f70fe48bf0349c64d4586864b2a4ace24b61b4a57c037059c30f4fb74fd54dc", "daily-streak.js": "d53321825c292f12846a72e9a96294d8fd729dffe96d490c738b8f64191e8c4d", "daily-tasks-ui.js": "f5ecce267d0c97b528d721bcd794150fdbc11ed6b1dfc1abac63032bad274055", "daily-tasks.js": "d622739613e8b0d6810aa677fc306bfb423d81eae817c08892243f95936883a6", "deadly-roulette.mp3": "ef6aae97cd50a21b36e2a3694619ae2263c5630e40c68d3a43490425ccd2bf11", "effect-text.css": "85711d83790f431011d3e634284636d786f4732f13e0caee06e714d39104c457", "effect-text.js": "59fb7c8fd10e950b942258b1ae5ffb9e47aec018b16c76071f5b19c99136cfc0", "emerald-actions.js": "fa4898f0234222a22a3fef827b3eb20939b4038387000494dafaebaa18a32808", "emerald-adviser.js": "42aa71e2821d76459f0a9a9a5214e993db5bf91538a5d38c0f0c82fca51ffca8", "emerald-asset.js": "fcd76de246a08d7aace1df41204802ed72b7dd56a896485dc8f867046efb49f3", "emerald-attentive.css": "e6ce67593e78ce429ced7c1e8310737d95322571e98be81aaacf770db1b65bf2", "emerald-attentive.js": "dfea20a023911da94f5e8d0bb4e434c90091eb97ea4bd913a874aa2c696e437d", "emerald-blackjack-actions.js": "7ec63032200b2ebbfa0890b1d2ddacf8e549f53f692bd608abe762ff72d719f0", "emerald-blackjack-ui.js": "9c41a28245ac7b6b570d2bbe566814d3c784d6c4caa4505d4f0055410aa399fa", "emerald-blackjack.css": "5e26a4724f965b5992a0a26c1cb7974f04c802883df42ed19e2931fef58e6806", "emerald-blackjack.js": "b29f0900aad6e3600925c78a538271dcf091257f69ae86baa56bf640a5a320de", "emerald-card-frames.js": "63abd75ab2b79647bc264d013c50a64b95730b5ef205c34237f26da6b2865095", "emerald-chat.js": "89a29031dd88a412a4671c583c1747355007a82c0008a5bb0e61e20a602483d0", "emerald-chill-actions.js": "efb1a1079807d7846f8127159ef1f365099bfdfe473c7685e09806d23c90034f", "emerald-chill-games.js": "09a5561c66525afea36d4942697707225478e8b6e2e061e9f37d7d5722dd905a", "emerald-chill-ui.js": "7b60444ce7e80be38b8ca812fc9d1778079e23b9ebfd88e248d38148e462fa0f", "emerald-chill.css": "319d70d45ee61b0cc3b9490e5b36373abbbd32bc9b2ccbf67965fcf4d188b7fe", "emerald-conduct.js": "89c8aceef9fe39fdd6db23cb3c181b23543923372b761fe034571eb928a20fdd", "emerald-framed-portrait.png": "92c4afe2443aafa39fadc139ca0b19741ad5bd35a9c93ab32b3a6251bd1cb189", "emerald-friendship.js": "fd14e2fd564cc692805ff880b8929da66e84e3e7ccda2cf03c63ff10fce47dcd", "emerald-progress.js": "8ff537abf5e699c272bfc0c757a1e3f44847ee562f60283494aa8c4563fe3cc5", "emerald-roadmap.js": "10331fd6d0083d34395c27d9d3fbf3fb37b0e06fe9106236c9e6756d9338cb08", "emerald-runtime.js": "e6a2290213748febd9ef48620c69e6bd6dae24b7ba61a3f104379a5de1068094", "emerald-survey.css": "9fc5503b54910aef7f4829a92d4b6447b6c96108934f0b9ac5fe6fe4a360b22a", "emerald-survey.js": "049f0c334f4027fe289143a042120e25de970c04f772416941c5a854fce40bb3", "emerald-text-quirks.js": "ab55cea7a7c314f5a3947ec96a24af5662d077a6ac4b1655149ade9cd574f28c", "emerald-typewriter.js": "0642f421e275a2584b9815bbf23ce5de1fde2d5d4da617d2fc889cc734fe2bcd", "emerald-ui.js": "fe27842346ac13a39bfef4fef56554b88fc224497da612146f62541b3abcd9b6", "emerald-workshop.js": "809a420e2f3bffd4f172edd38c4e163fe32e6dbb9fbec947b1caa7581c343c3c", "emerald.css": "7affc65481db63e7979ed6056f0b24b2b78c5c3d7fccb0ee3a6236a44f4c15b5", "engine.js": "ff1ac8f3e676628c575595349f70ca0867fb3ab504108f95be437c639079f4a3", "exp-interest.js": "ba0d9a1417af1cda835cc54d4e2c4069c29586518d1a90fdd26356c1d8fbfe55", "faucet-activity.css": "cdda4e6bca8c09239e41a42a42de8077711db210d6c793c5482757be5e544d23", "faucet-graph.js": "a972ef51011d163f2983aeef005dfcf0621c487a432aca530cf62cf690752fa7", "feature-power.js": "6461a938efb7fdaeb4cb61d26251b38a1a432b6d6d08dcc107e050de3914f379", "five-jokers.css": "75cbf1d4ca722663eb33427c4b449214536e60b4b990d6def56651514fb47eb6", "frenzy.js": "bd443b50dd4b4977198a44644d0e1c896fc2dd897b26187a1534914f35a2d895", "george-street-shuffle.mp3": "15ee9995e01ffe91678db6ba072ec13cf0bf258f17c01677c5367009932b9c07", "i18n-bindings.js": "ca0470ba038d10fca932e724cc39af3baab87313abbd0d2dc0f5e2eec1ebe0ba", "i18n-en-US.js": "54bbbedf4b15299fbeb73a28eddd3ba211132929c95f04cbef2c23da5fbd00c2", "i18n-es.js": "d3b49275c768b653e37dccd262e00b04f8a79ff0958fd5cc36df48deb8352070", "i18n-fr.js": "b0d80116fe8ec174497ccdeca72bbe32abbbc10786e656d145b5fbe88a0f43f6", "i18n.js": "090f231b73a12e61cb7a0210b4556ebd7cb9693663d504884c4450d1a547137f", "icon-192.png": "f09f6b6a7f734c9697a26839d01cb8306b463ef945a04edf8360de60bbf7789e", "icon-512.png": "6bcc710c835288fe8fddc744a503d7450bf2b571c35624612f1a1175bbb23711", "icon-apple-180.png": "6bd472219ed1a48c861b210e2b691d84a06ee01b972d058e45a9124d2b352d59", "icon.svg": "747f8f0630a98052f849ea609413065c02dc3f6fcc13cd888a3476351b1d3880", "index.html": "b97d54e3e5d9580666ffc3a55021bab788c085c9b8b5f3d62ea2b71fd7fa1a86", "interest-settings.js": "30a4d600277d924d2f1ee5ec21dc032068081066738bf6529e8b445710315026", "joker-art.css": "b9f66357fb3dfe99b12ca16064a5e65113b562b9e504aeafb79ec26075f1ae7c", "joker-art.js": "bde83c35b666f940b5195d11cc52eb91694ade093d58a8c432e2dbc8680ffbd7", "levels-ui.js": "4b6044b50c424d6b7a3461f2fd68b80dd24a13a38519f188e5faa5681ee01def", "manifest.webmanifest": "8f7fbb449c2ddf39b40d6649f1bd3195dafe651e95808d49123f7d9c6e4b74a7", "mining-by-moonlight.mp3": "683e5638ab2b3017a89d9c9a2ab7a3b516956f9dc5651740fed3508eddd35997", "motion.js": "51cd8be3ae1c1a8a067bc42cd261bfc5ccd7552f9652971ede38f8dc631ae4f5", "moving-panels.css": "107571e69768040680c3a32770471e11f4e8a78331e44c0a0dcc5b8905c08398", "moving-panels.js": "6dda66dc4d2ee6aede602696d21f858c93e90aefdcc2a4138f967e9ca31123aa", "music-assets.js": "df0e4458f9f75bf6426cfee39b126797d3c9986b2ad59e333abad723ca0c7c9d", "music-data.js": "2a516245a7fb1e2b99677880b82b390f1ac2e8d3c387f9a21c1e739e77ca2d67", "passive-money-controller.js": "239d828366d4dffcdcf6996ad93ba70bc23a73e8e707ac71876c87b9364ed8e0", "passive-money.js": "866aa7754e4638aaca4118fc815c8bce016abd9f67edb4a874e286c78f4c76b2", "passive-xp.js": "2d966ce8ca28643dd74b6b278004df8c77aaf1447ae3eeaaccccfff301b0c113", "player-identity.js": "70e684115e4ea56015879374f1644943616c36481bee2e3b7084d777bf8e2df8", "potions-ui.js": "1e5acd5bf1b5b1bb2d86888d85003c1afde1aeec2cf015faecb0025271a5b995", "potions.css": "5e989e503929329a5dbdc8c5f3e7dc39362414a36578bb945b7fb67b87c9bb4e", "potions.js": "b6a2b771f0785adec035726d945c39767ea79a374932be97ae0b626c40974aa7", "power-boundary.js": "90d09867d227c84c60584cbfa33529a45df45d5aedf697e7a89e872df658f6d8", "power-settings-ui.css": "3dfc1d0c5f06a70a74eec84ef0027f657dcbc7e1bc714129623115c48df2b2f2", "power-settings-ui.js": "cd5203afcddcb1513daa39a92eba508f9524d6bec1654e68e4738381175483f6", "progression.js": "de2aac99e6b4cb6f3125e23efcbea5cb45ea7f938f93161827d595c02d5520c4", "pwa.js": "892fe6f5a3a4c1936fe531ef312fc8042417b61b8ebf04e4ae9e7315752a99cd", "run-wallet.js": "fb0879e06cda54efce923d3360f49f4f913c4bf31fe4ce5af40ed9ff9ed718f8", "save-slots.js": "89e6b0edc3cef24791e36c97a316901a938890ba9e2a85793f39ed7b3cbc9667", "stats.js": "6ea3b2b0f53ea22b440caf67fc36e2b2aaf102fbe103d3bd76572bfa610f28ce", "stock-market-data.js": "cbf3a0152118cd305b4432a4d41b81d6a1763deb67cc3a906b133a11e3ece542", "stock-market-ui.js": "1e4b2b7f04b1e852dc7ad74c7fa3e3a56676d9083b7750e68fc64717712d5bb1", "stock-market.css": "e12ea9ff23cd08fb33310b282ceb3bc804bb1c4f693c6caac11076f0acbb7a04", "stock-market.js": "c145e0d75e86368df1dda19ee43b2572e7a0ea34096db62b8e08dd3bb1d1d18f", "style.css": "688ba78229de7f9ee1bc0de7bc3ed2dc9f9dd0c4af074e02c9e422308374b904", "survey-flower.mp4": "0cd83d944a6ca7822b4a8306cecc60a36e859b041f6702c6a1ad9ead78924451", "survey-runner.js": "2aa5ef5ab1071b6535411f6ffd236e8031d949e160b7a5348857cc0345d66d69", "survey-video01.mp4": "98455b50f49009e87e3cb5f517d1d854d78644413ea525fd6282569cb7ba5051", "survey-video02.mp4": "b0da286b8b23bf7714b79ac4d4d029367c08e380cb66c233a4555fd334244d6a", "survey-video03.mp4": "7a2ae73a7ccf8e8c6e93ce107c9b6d450ebfc61ded19b4255485560ea65cf051", "survey-video04.mp4": "2641435c86717904814e519020b2343f8913fba3457345e0f64a7f5ec66a2b71", "survey-video05.mp4": "14aca2fcd55cdfeaa61b6249af5d843165520e7c4fceed6fc91bbb6b2498464d", "survey-video06.mp4": "66b7d4484313ff1362023f5751cedc65854b9652ffe801a4063f9f24ec5aabfb", "survey-video07.mp4": "40d604dd8a9d038525c5ecc821007872d9f035ea9a7b9d2c37243b615a5234ad", "survey-video08.mp4": "59b371ff2c5ad4dd9aa21618bd3c26eb53323b838c45a5f4204bcaf70665edd3", "survey-video09.mp4": "af803eddc3c3fcb71d1f81082f2fc18294e1211c0057f1704d175f9e85aab9fb", "survey-video10.mp4": "49c949924631130c5c5e5494515bd486324c8dfc3ab1c451059b0d72bc6db454", "survey-video11.mp4": "a8642751cf9e349481879131bb18b9b968760c532aa4ce2a5522d1b10449d19b", "survey-video12.mp4": "002afc6278c970b59dfc40d15df71026e64d3e9837e8d56599fff23bce135d78", "survey-videos.js": "7a894aa287a40640056b9e64039a532422a7b3285b2b2f8d69dca0450259a16a", "surveys-ui.js": "6743f3b848eded510a7df479a60c5c6f7f3b06b30ef30da52056d1a3840768b0", "surveys.css": "662a31d0b10670cfbfbcd1a1b575b80b977e2ac7949c9c778838eb7c03860a1e", "surveys.js": "ab0894eec98899efacf6a4041640fab059792c49a5b1c0bfc04b92d7b8ad03b6", "text-customization.js": "c518cb57308bce27d6705d849097231e02d0b188d8d3df42006200e22a053160"};
const FILES = Object.freeze([
  'achievements-data.js',
  'app.js',
  'audio.js',
  'battery-controller.js',
  'battery-display.js',
  'battery-ui.js',
  'battery.css',
  'battery.js',
  'cap-levels.css',
  'cloud-save.js',
  'collection-tracking.js',
  'crit-effects.css',
  'custom-images.css',
  'custom-images.js',
  'daily-streak-ui.js',
  'daily-streak.css',
  'daily-streak.js',
  'daily-tasks-ui.js',
  'daily-tasks.js',
  'deadly-roulette.mp3',
  'effect-text.css',
  'effect-text.js',
  'emerald-actions.js',
  'emerald-adviser.js',
  'emerald-asset.js',
  'emerald-attentive.css',
  'emerald-attentive.js',
  'emerald-blackjack-actions.js',
  'emerald-blackjack-ui.js',
  'emerald-blackjack.css',
  'emerald-blackjack.js',
  'emerald-card-frames.js',
  'emerald-chat.js',
  'emerald-chill-actions.js',
  'emerald-chill-games.js',
  'emerald-chill-ui.js',
  'emerald-chill.css',
  'emerald-conduct.js',
  'emerald-framed-portrait.png',
  'emerald-friendship.js',
  'emerald-progress.js',
  'emerald-roadmap.js',
  'emerald-runtime.js',
  'emerald-survey.css',
  'emerald-survey.js',
  'emerald-text-quirks.js',
  'emerald-typewriter.js',
  'emerald-ui.js',
  'emerald-workshop.js',
  'emerald.css',
  'engine.js',
  'exp-interest.js',
  'faucet-activity.css',
  'faucet-graph.js',
  'feature-power.js',
  'five-jokers.css',
  'frenzy.js',
  'george-street-shuffle.mp3',
  'i18n-bindings.js',
  'i18n-en-US.js',
  'i18n-es.js',
  'i18n-fr.js',
  'i18n.js',
  'icon-192.png',
  'icon-512.png',
  'icon-apple-180.png',
  'icon.svg',
  'index.html',
  'interest-settings.js',
  'joker-art.css',
  'joker-art.js',
  'levels-ui.js',
  'manifest.webmanifest',
  'mining-by-moonlight.mp3',
  'motion.js',
  'moving-panels.css',
  'moving-panels.js',
  'music-assets.js',
  'music-data.js',
  'passive-money-controller.js',
  'passive-money.js',
  'passive-xp.js',
  'player-identity.js',
  'potions-ui.js',
  'potions.css',
  'potions.js',
  'power-boundary.js',
  'power-settings-ui.css',
  'power-settings-ui.js',
  'progression.js',
  'pwa.js',
  'run-wallet.js',
  'save-slots.js',
  'stats.js',
  'stock-market-data.js',
  'stock-market-ui.js',
  'stock-market.css',
  'stock-market.js',
  'style.css',
  'survey-flower.mp4',
  'survey-runner.js',
  'survey-video01.mp4',
  'survey-video02.mp4',
  'survey-video03.mp4',
  'survey-video04.mp4',
  'survey-video05.mp4',
  'survey-video06.mp4',
  'survey-video07.mp4',
  'survey-video08.mp4',
  'survey-video09.mp4',
  'survey-video10.mp4',
  'survey-video11.mp4',
  'survey-video12.mp4',
  'survey-videos.js',
  'surveys-ui.js',
  'surveys.css',
  'surveys.js',
  'text-customization.js',
]);
const BASE = new URL('./', self.registration.scope);
const PREFIX = 'poker-table-pwa-v1|' + encodeURIComponent(BASE.pathname) + '|';
const CACHE = PREFIX + VERSION;
const URLS = new Map(FILES.map(name => [new URL(name, BASE).href, name]));
const INDEX = new URL('index.html', BASE).href;

async function digest(response) {
  const data = await response.clone().arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

async function prepareCache() {
  // Fetch and verify the whole release before writing. Mixed/partial deployments cannot install.
  const responses = await Promise.all(FILES.map(async name => {
    const url = new URL(name, BASE).href;
    const response = await fetch(new Request(url, {
      cache: 'reload', credentials: 'same-origin', redirect: 'error'
    }));
    if (response.status !== 200 || response.type === 'opaque' ||
        (response.url && response.url !== url)) throw new Error('Incomplete local release: ' + name);
    if (EXPECTED_HASHES && await digest(response) !== EXPECTED_HASHES[name]) {
      throw new Error('Release integrity mismatch: ' + name);
    }
    return [url, response];
  }));
  const cache = await caches.open(CACHE);
  await Promise.all(responses.map(([url, response]) => cache.put(url, response)));
}
let repair = null;

self.addEventListener('install', event => {
  event.waitUntil(prepareCache());
  // Deliberately no skipWaiting: an update must not replace a live hand's worker.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim(); // First install can enable offline use without a reload.
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== BASE.origin || url.search || url.username || url.password) return;
  // Only the literal root URL aliases index.html. Unknown paths, saves, and requests are untouched.
  const key = url.href === BASE.href ? INDEX : url.href;
  if (!URLS.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    let response = await cache.match(key);
    if (!response && EXPECTED_HASHES) {
      // Storage may be evicted independently of the worker. Repair only a complete,
      // byte-identical release; never fetch one newer module into an older bundle.
      try {
        if (!repair) repair = prepareCache().finally(() => { repair = null; });
        await repair;
        response = await (await caches.open(CACHE)).match(key);
      } catch (_) { /* Offline or a different server release: preserve version isolation. */ }
    }
    // Safari/other media players may require byte ranges even for cached MP4.
    // Slice only the reviewed local video, never external requests or save data.
    if (response && /^survey-(?:flower|video(?:0[1-9]|1[0-2]))\.mp4$/.test(URLS.get(key) || '') && request.headers.get('range')) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range'));
      const bytes = await response.arrayBuffer(), size = bytes.byteLength;
      let start = range && range[1] ? Number(range[1]) : 0;
      let end = range && range[2] ? Number(range[2]) : size - 1;
      if (range && !range[1] && range[2]) { start = Math.max(0, size - Number(range[2])); end = size - 1; }
      if (!range || !range[1] && !range[2] || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
        return new Response(null, {status:416, headers:{'Content-Range':'bytes */' + size}});
      }
      end = Math.min(end, size - 1);
      return new Response(bytes.slice(start,end + 1), {status:206, headers:{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Range':'bytes ' + start + '-' + end + '/' + size,'Content-Length':String(end - start + 1)}});
    }
    return response || new Response('Offline game files are unavailable. Reopen online to repair offline support.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  })());
});
