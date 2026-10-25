/* Poker Table offline worker. package-ipad.py stamps only its DIST copy. */
'use strict';
const VERSION = '90abcc95633bb1c0651fd8c0';
const EXPECTED_HASHES = {"achievements-data.js": "9d6aae1ae853f207a18259b6bf7ba1209dff17c71e6bb8ee987949eded1c4294", "app.js": "984b2e96dbb3c1c7df1185be8803ab759bb00a3320ba1fa74d3f63b28d1de90e", "audio.js": "88365a38dc2c1daa0b89e27a01fe370760ee232919dd52605782bfb119eddf5c", "cap-levels.css": "63a995f6e13c8a1c9dc160bc1dfdd94cc36c5f85863aa87730122d36f509d844", "cloud-save.js": "6032ac335a31d3f435a0ab9933ff275b3224f0f86c8d25ff4c51c3a8d91edde0", "collection-tracking.js": "8e0ed02004acfbd21395d92172d7a786fec753737ee0a1e337533115af38e21d", "crit-effects.css": "0df6b7161077543b94f29eb57609a1313112aedc9f12569f66c268fa14b9add8", "custom-images.css": "65789ace7485c82915be17834b720998e9ae0e644f55708f5580d9ef1964a6be", "custom-images.js": "80b6ff96e6886453f29f3adb0bf32e5046ec40ac1c8a8063a734bc1555b0cfcb", "daily-streak-ui.js": "fa1ee1663c1ec25fc46c790bfc8339dfdf37b5d3fab452bca1237fdcc5898337", "daily-streak.css": "6f70fe48bf0349c64d4586864b2a4ace24b61b4a57c037059c30f4fb74fd54dc", "daily-streak.js": "d53321825c292f12846a72e9a96294d8fd729dffe96d490c738b8f64191e8c4d", "daily-tasks-ui.js": "f5ecce267d0c97b528d721bcd794150fdbc11ed6b1dfc1abac63032bad274055", "daily-tasks.js": "d622739613e8b0d6810aa677fc306bfb423d81eae817c08892243f95936883a6", "deadly-roulette.mp3": "ef6aae97cd50a21b36e2a3694619ae2263c5630e40c68d3a43490425ccd2bf11", "effect-text.css": "85711d83790f431011d3e634284636d786f4732f13e0caee06e714d39104c457", "effect-text.js": "59fb7c8fd10e950b942258b1ae5ffb9e47aec018b16c76071f5b19c99136cfc0", "emerald-actions.js": "fa4898f0234222a22a3fef827b3eb20939b4038387000494dafaebaa18a32808", "emerald-adviser.js": "1e72ee3c4a164bf07e1c943d3ee883721713cadf80a6cd184478cb392f8cc0a6", "emerald-asset.js": "03e757ce002a1d1492a88d2b98f04f5a33a017a62c628d4df81d0fc12251674c", "emerald-blackjack-actions.js": "eed9aa63ad821b7f3cca1c8ea4c2d893096777aed8fb71e215d23038180dc27a", "emerald-blackjack-ui.js": "8d3ac2d07cca98e04c71816528c379058af835aecfe64f95485a5846c94fec90", "emerald-blackjack.css": "5e26a4724f965b5992a0a26c1cb7974f04c802883df42ed19e2931fef58e6806", "emerald-blackjack.js": "b29f0900aad6e3600925c78a538271dcf091257f69ae86baa56bf640a5a320de", "emerald-chat.js": "89a29031dd88a412a4671c583c1747355007a82c0008a5bb0e61e20a602483d0", "emerald-chill-actions.js": "efb1d825498f98a763def934609e905beed2b398c4318237c877e1b9c431ace5", "emerald-chill-games.js": "e1d945f317622acc5bc558f5de761ebfadbf0369da3da33a040b19ed8c7c5e87", "emerald-chill-ui.js": "f8542653a60719dcda7f9d50e391d9d68daf72f3e0915e81c0a115f84df6935a", "emerald-chill.css": "319d70d45ee61b0cc3b9490e5b36373abbbd32bc9b2ccbf67965fcf4d188b7fe", "emerald-conduct.js": "89c8aceef9fe39fdd6db23cb3c181b23543923372b761fe034571eb928a20fdd", "emerald-framed-portrait.png": "92c4afe2443aafa39fadc139ca0b19741ad5bd35a9c93ab32b3a6251bd1cb189", "emerald-friendship.js": "ca402677ee377469508d7d6b6ce99a38a7de708e6df05dc0a608c1a3505a48e8", "emerald-progress.js": "801e0ed4d5f1649c64e2d60e3b78ecf7156544db1640f52ea616583f6913ce77", "emerald-roadmap.js": "10331fd6d0083d34395c27d9d3fbf3fb37b0e06fe9106236c9e6756d9338cb08", "emerald-runtime.js": "e6a2290213748febd9ef48620c69e6bd6dae24b7ba61a3f104379a5de1068094", "emerald-survey.css": "9fc5503b54910aef7f4829a92d4b6447b6c96108934f0b9ac5fe6fe4a360b22a", "emerald-survey.js": "049f0c334f4027fe289143a042120e25de970c04f772416941c5a854fce40bb3", "emerald-text-quirks.js": "dae1cf1198f5f0fee6994b0c9b9ab01c6dc715b5f8fa916ec08a3bb30aaae881", "emerald-ui.js": "4405d447efa0cd74f33466045f131ffd9e7af3fe8c27841daeae0f3c4214bdcf", "emerald-workshop.js": "809a420e2f3bffd4f172edd38c4e163fe32e6dbb9fbec947b1caa7581c343c3c", "emerald.css": "62d917f66fdaa87b04136244a9db35eaf84e431725ad3d570001ef6b00571b83", "engine.js": "573142b2a82dfeaf4b62c7a514aaecd8de0ce7cdb53e83f8f320b092792346b2", "exp-interest.js": "ba8fbe042f51db1c4f4ccb373cd2dca90b8d5dfed2708f051f08840d44325b17", "faucet-activity.css": "cdda4e6bca8c09239e41a42a42de8077711db210d6c793c5482757be5e544d23", "faucet-graph.js": "a972ef51011d163f2983aeef005dfcf0621c487a432aca530cf62cf690752fa7", "five-jokers.css": "75cbf1d4ca722663eb33427c4b449214536e60b4b990d6def56651514fb47eb6", "frenzy.js": "bd443b50dd4b4977198a44644d0e1c896fc2dd897b26187a1534914f35a2d895", "george-street-shuffle.mp3": "15ee9995e01ffe91678db6ba072ec13cf0bf258f17c01677c5367009932b9c07", "i18n-bindings.js": "ca0470ba038d10fca932e724cc39af3baab87313abbd0d2dc0f5e2eec1ebe0ba", "i18n-en-US.js": "7f773732bf31c339eec630084896aa61c1f2d087df683ca0a3b85229b2415faf", "i18n-es.js": "666d5029d53bbeedd4704b506b67c8b9cb9db76075945243667384edadaa26d7", "i18n-fr.js": "1cdb080b9c77430ae37200daaa1d85095c3ee2ff338eed1d48d722545b7051cf", "i18n.js": "090f231b73a12e61cb7a0210b4556ebd7cb9693663d504884c4450d1a547137f", "icon-192.png": "f09f6b6a7f734c9697a26839d01cb8306b463ef945a04edf8360de60bbf7789e", "icon-512.png": "6bcc710c835288fe8fddc744a503d7450bf2b571c35624612f1a1175bbb23711", "icon-apple-180.png": "6bd472219ed1a48c861b210e2b691d84a06ee01b972d058e45a9124d2b352d59", "icon.svg": "747f8f0630a98052f849ea609413065c02dc3f6fcc13cd888a3476351b1d3880", "index.html": "03d02dc7c11aa3cb256a20ea4b68c82e8e1de30cd617c3529dd20bb508de154d", "joker-art.css": "b9f66357fb3dfe99b12ca16064a5e65113b562b9e504aeafb79ec26075f1ae7c", "joker-art.js": "bde83c35b666f940b5195d11cc52eb91694ade093d58a8c432e2dbc8680ffbd7", "levels-ui.js": "9be0d78eb0efccdfaeb2f19e281d888403600ff086638366bbeffbcdc6a36682", "manifest.webmanifest": "8f7fbb449c2ddf39b40d6649f1bd3195dafe651e95808d49123f7d9c6e4b74a7", "mining-by-moonlight.mp3": "683e5638ab2b3017a89d9c9a2ab7a3b516956f9dc5651740fed3508eddd35997", "motion.js": "51cd8be3ae1c1a8a067bc42cd261bfc5ccd7552f9652971ede38f8dc631ae4f5", "moving-panels.css": "107571e69768040680c3a32770471e11f4e8a78331e44c0a0dcc5b8905c08398", "moving-panels.js": "6dda66dc4d2ee6aede602696d21f858c93e90aefdcc2a4138f967e9ca31123aa", "music-assets.js": "df0e4458f9f75bf6426cfee39b126797d3c9986b2ad59e333abad723ca0c7c9d", "music-data.js": "2a516245a7fb1e2b99677880b82b390f1ac2e8d3c387f9a21c1e739e77ca2d67", "passive-money-controller.js": "f0e4406b9fd0a9a2dac5ae07e8900a1774941d84ba0fd1969ced939cbc824f58", "passive-money.js": "eff2f55665d29015633953891673ac414edcca2e671d30a463629effc0e37fb9", "passive-xp.js": "d0d6fcdfff6bd584fe50a61e6e395a03047f754f7305bc9cc7f6e2c80434963f", "player-identity.js": "70e684115e4ea56015879374f1644943616c36481bee2e3b7084d777bf8e2df8", "potions-ui.js": "1e5acd5bf1b5b1bb2d86888d85003c1afde1aeec2cf015faecb0025271a5b995", "potions.css": "5e989e503929329a5dbdc8c5f3e7dc39362414a36578bb945b7fb67b87c9bb4e", "potions.js": "b6a2b771f0785adec035726d945c39767ea79a374932be97ae0b626c40974aa7", "progression.js": "9423f29000d878215dbe9ef54c9971ef9638e30fb0ec7042757d16906dae5b82", "pwa.js": "892fe6f5a3a4c1936fe531ef312fc8042417b61b8ebf04e4ae9e7315752a99cd", "run-wallet.js": "fb0879e06cda54efce923d3360f49f4f913c4bf31fe4ce5af40ed9ff9ed718f8", "save-slots.js": "89e6b0edc3cef24791e36c97a316901a938890ba9e2a85793f39ed7b3cbc9667", "stats.js": "6ea3b2b0f53ea22b440caf67fc36e2b2aaf102fbe103d3bd76572bfa610f28ce", "stock-market-data.js": "cbf3a0152118cd305b4432a4d41b81d6a1763deb67cc3a906b133a11e3ece542", "stock-market-ui.js": "bd4912e0ce368ddc0ee7de17381898cfec6c9579dd61ce5a54a47d7dacab32f2", "stock-market.css": "e12ea9ff23cd08fb33310b282ceb3bc804bb1c4f693c6caac11076f0acbb7a04", "stock-market.js": "4b10d2e1af584a0224c6528e15f81ea370b50046464cefacc0e91424e0efd99a", "style.css": "6c10654748600cc183e036f82aab00a73a825c174797c7f26fb8c0c5e2fbc961", "survey-flower.mp4": "0cd83d944a6ca7822b4a8306cecc60a36e859b041f6702c6a1ad9ead78924451", "survey-runner.js": "5772dbb2817b754141ad8b8407835095ee8097fecc0647dfca487bd69abc0494", "survey-video01.mp4": "98455b50f49009e87e3cb5f517d1d854d78644413ea525fd6282569cb7ba5051", "survey-video02.mp4": "b0da286b8b23bf7714b79ac4d4d029367c08e380cb66c233a4555fd334244d6a", "survey-video03.mp4": "7a2ae73a7ccf8e8c6e93ce107c9b6d450ebfc61ded19b4255485560ea65cf051", "survey-video04.mp4": "2641435c86717904814e519020b2343f8913fba3457345e0f64a7f5ec66a2b71", "survey-video05.mp4": "14aca2fcd55cdfeaa61b6249af5d843165520e7c4fceed6fc91bbb6b2498464d", "survey-video06.mp4": "66b7d4484313ff1362023f5751cedc65854b9652ffe801a4063f9f24ec5aabfb", "survey-video07.mp4": "40d604dd8a9d038525c5ecc821007872d9f035ea9a7b9d2c37243b615a5234ad", "survey-video08.mp4": "59b371ff2c5ad4dd9aa21618bd3c26eb53323b838c45a5f4204bcaf70665edd3", "survey-video09.mp4": "af803eddc3c3fcb71d1f81082f2fc18294e1211c0057f1704d175f9e85aab9fb", "survey-video10.mp4": "49c949924631130c5c5e5494515bd486324c8dfc3ab1c451059b0d72bc6db454", "survey-video11.mp4": "a8642751cf9e349481879131bb18b9b968760c532aa4ce2a5522d1b10449d19b", "survey-video12.mp4": "002afc6278c970b59dfc40d15df71026e64d3e9837e8d56599fff23bce135d78", "survey-videos.js": "7a894aa287a40640056b9e64039a532422a7b3285b2b2f8d69dca0450259a16a", "surveys-ui.js": "a98832b45dd19e64288c5c2a2e4c19bd8bc33d0210b684d6a4c1b86952ed44f7", "surveys.css": "662a31d0b10670cfbfbcd1a1b575b80b977e2ac7949c9c778838eb7c03860a1e", "surveys.js": "4e038668d3064ef51aa8804d2758d5e622ba019b652fe28492b4aaef12c9e206", "text-customization.js": "c518cb57308bce27d6705d849097231e02d0b188d8d3df42006200e22a053160"};
const FILES = Object.freeze([
  'achievements-data.js',
  'app.js',
  'audio.js',
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
  'emerald-blackjack-actions.js',
  'emerald-blackjack-ui.js',
  'emerald-blackjack.css',
  'emerald-blackjack.js',
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
  'emerald-ui.js',
  'emerald-workshop.js',
  'emerald.css',
  'engine.js',
  'exp-interest.js',
  'faucet-activity.css',
  'faucet-graph.js',
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
