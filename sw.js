/* Poker Table offline worker. package-ipad.py stamps only its DIST copy. */
'use strict';
const VERSION = '8e46030d9af63a5948d8030e';
const EXPECTED_HASHES = {"achievements-data.js": "9d6aae1ae853f207a18259b6bf7ba1209dff17c71e6bb8ee987949eded1c4294", "app.js": "269fdaec9646362823050db243cd44b8094ba262f1930fc830020336702a6386", "audio.js": "901f2b1fe48fb6949c101b229ffb37c1626c6f5b58cbe3b03aca34055d723ec3", "cap-levels.css": "63a995f6e13c8a1c9dc160bc1dfdd94cc36c5f85863aa87730122d36f509d844", "cloud-save.js": "a071909d9fbd46908807b1a2c18c933dd683c855395e7e82425150668eedc389", "collection-tracking.js": "8e0ed02004acfbd21395d92172d7a786fec753737ee0a1e337533115af38e21d", "crit-effects.css": "0df6b7161077543b94f29eb57609a1313112aedc9f12569f66c268fa14b9add8", "custom-images.css": "65789ace7485c82915be17834b720998e9ae0e644f55708f5580d9ef1964a6be", "custom-images.js": "80b6ff96e6886453f29f3adb0bf32e5046ec40ac1c8a8063a734bc1555b0cfcb", "daily-streak-ui.js": "78ed64be01df985519e6437745db98317c2041508d9d218be4a241242c0826b5", "daily-streak.css": "6f70fe48bf0349c64d4586864b2a4ace24b61b4a57c037059c30f4fb74fd54dc", "daily-streak.js": "d53321825c292f12846a72e9a96294d8fd729dffe96d490c738b8f64191e8c4d", "daily-tasks-ui.js": "2821d92efadab621bc307c46210589dd6e5871035572045662cf42dc281c437d", "daily-tasks.js": "d622739613e8b0d6810aa677fc306bfb423d81eae817c08892243f95936883a6", "deadly-roulette.mp3": "ef6aae97cd50a21b36e2a3694619ae2263c5630e40c68d3a43490425ccd2bf11", "effect-text.css": "85711d83790f431011d3e634284636d786f4732f13e0caee06e714d39104c457", "effect-text.js": "59fb7c8fd10e950b942258b1ae5ffb9e47aec018b16c76071f5b19c99136cfc0", "emerald-actions.js": "fa4898f0234222a22a3fef827b3eb20939b4038387000494dafaebaa18a32808", "emerald-adviser.js": "1e72ee3c4a164bf07e1c943d3ee883721713cadf80a6cd184478cb392f8cc0a6", "emerald-asset.js": "7aa0bce80d6692a1e5eb9050b8da0843628acfbd4f03f099bf4107a43f832fc4", "emerald-blackjack-actions.js": "bd0fffc7bc0d825a5f6064845234201e3cdc09f3c060a5709dbc68ec9b89b1f7", "emerald-blackjack-ui.js": "3bd93ac9db0a30f451bc3211d9cd0e380c430a1208eac1bedba80faaa5f69f79", "emerald-blackjack.css": "7cdf5f67d0bc5f4dc3748236ab276085152892b915ec3425872a027c926b5886", "emerald-blackjack.js": "b29f0900aad6e3600925c78a538271dcf091257f69ae86baa56bf640a5a320de", "emerald-chat.js": "89a29031dd88a412a4671c583c1747355007a82c0008a5bb0e61e20a602483d0", "emerald-conduct.js": "89c8aceef9fe39fdd6db23cb3c181b23543923372b761fe034571eb928a20fdd", "emerald-friendship.js": "6c72b3b356dbc55f816e32c6e972aae468dcc5eee13f19f0937eaa638febf9ea", "emerald-progress.js": "801e0ed4d5f1649c64e2d60e3b78ecf7156544db1640f52ea616583f6913ce77", "emerald-roadmap.js": "45410ff8a949d2e1140b93cf9406e190b181eb67995686413d47408b7b24ad14", "emerald-runtime.js": "e6a2290213748febd9ef48620c69e6bd6dae24b7ba61a3f104379a5de1068094", "emerald-survey.css": "5f9b4fe8cad16fe7cfb96ddd85fe54578270304631795dd5e6b88843ef95b71b", "emerald-survey.js": "bbb705f2a75e2716c9f868a22a4604fd58596c32a3d9231f3cf9dcef230ba41f", "emerald-ui.js": "3dd2092516bc971dc432601a7782121eaa4ba4e7630f336c15d69ae28ef6704f", "emerald-workshop.js": "809a420e2f3bffd4f172edd38c4e163fe32e6dbb9fbec947b1caa7581c343c3c", "emerald.css": "ea6a26e136664b67b8cbc93440120a6437f3a2a517dc5930fc5568d93d42336f", "engine.js": "d9841a4b222efd5d713c45cc0407ff5000b3904290ccc90601e09cd9532a8f5c", "exp-interest.js": "67c93c57390199d0e21fc3f7726260d0c77a7d62818df0ce7dcf182207de0ea9", "faucet-activity.css": "cdda4e6bca8c09239e41a42a42de8077711db210d6c793c5482757be5e544d23", "faucet-graph.js": "a972ef51011d163f2983aeef005dfcf0621c487a432aca530cf62cf690752fa7", "five-jokers.css": "75cbf1d4ca722663eb33427c4b449214536e60b4b990d6def56651514fb47eb6", "frenzy.js": "bd443b50dd4b4977198a44644d0e1c896fc2dd897b26187a1534914f35a2d895", "george-street-shuffle.mp3": "15ee9995e01ffe91678db6ba072ec13cf0bf258f17c01677c5367009932b9c07", "icon-192.png": "f09f6b6a7f734c9697a26839d01cb8306b463ef945a04edf8360de60bbf7789e", "icon-512.png": "6bcc710c835288fe8fddc744a503d7450bf2b571c35624612f1a1175bbb23711", "icon-apple-180.png": "6bd472219ed1a48c861b210e2b691d84a06ee01b972d058e45a9124d2b352d59", "icon.svg": "747f8f0630a98052f849ea609413065c02dc3f6fcc13cd888a3476351b1d3880", "index.html": "dc06b9a506ce89b98824b269e0e1f9dfef9ffc9da8eb82b7f2515e7374ee89aa", "joker-art.css": "b9f66357fb3dfe99b12ca16064a5e65113b562b9e504aeafb79ec26075f1ae7c", "joker-art.js": "bde83c35b666f940b5195d11cc52eb91694ade093d58a8c432e2dbc8680ffbd7", "levels-ui.js": "75361a4a04d724b2d6e0b3af572b4ee819c05c29397d77e0a7fef5f4f99e4de2", "manifest.webmanifest": "8f7fbb449c2ddf39b40d6649f1bd3195dafe651e95808d49123f7d9c6e4b74a7", "mining-by-moonlight.mp3": "683e5638ab2b3017a89d9c9a2ab7a3b516956f9dc5651740fed3508eddd35997", "motion.js": "51cd8be3ae1c1a8a067bc42cd261bfc5ccd7552f9652971ede38f8dc631ae4f5", "moving-panels.css": "107571e69768040680c3a32770471e11f4e8a78331e44c0a0dcc5b8905c08398", "moving-panels.js": "e5ce1c021ad2e35f1f3c33f7db6ecaf38df1648514a48f471438b44b560fd15b", "music-assets.js": "df0e4458f9f75bf6426cfee39b126797d3c9986b2ad59e333abad723ca0c7c9d", "music-data.js": "2a516245a7fb1e2b99677880b82b390f1ac2e8d3c387f9a21c1e739e77ca2d67", "passive-money-controller.js": "f0e4406b9fd0a9a2dac5ae07e8900a1774941d84ba0fd1969ced939cbc824f58", "passive-money.js": "eff2f55665d29015633953891673ac414edcca2e671d30a463629effc0e37fb9", "passive-xp.js": "d0d6fcdfff6bd584fe50a61e6e395a03047f754f7305bc9cc7f6e2c80434963f", "player-identity.js": "70e684115e4ea56015879374f1644943616c36481bee2e3b7084d777bf8e2df8", "potions-ui.js": "5cbf30c652551ac92ccf7849fd12a0404ebe36127fea75cdac7723a3b131a14d", "potions.css": "5e989e503929329a5dbdc8c5f3e7dc39362414a36578bb945b7fb67b87c9bb4e", "potions.js": "b6a2b771f0785adec035726d945c39767ea79a374932be97ae0b626c40974aa7", "progression.js": "9423f29000d878215dbe9ef54c9971ef9638e30fb0ec7042757d16906dae5b82", "pwa.js": "892fe6f5a3a4c1936fe531ef312fc8042417b61b8ebf04e4ae9e7315752a99cd", "run-wallet.js": "fb0879e06cda54efce923d3360f49f4f913c4bf31fe4ce5af40ed9ff9ed718f8", "save-slots.js": "89e6b0edc3cef24791e36c97a316901a938890ba9e2a85793f39ed7b3cbc9667", "stats.js": "8c1abb88f0ed37d206be3a9cee3729563db8649a77854df2d6453a877c893e03", "stock-market-data.js": "cbf3a0152118cd305b4432a4d41b81d6a1763deb67cc3a906b133a11e3ece542", "stock-market-ui.js": "cf838b7d62551f40afadaa186552a3cdeb4ac4dfd755e93ee65bb3176719375d", "stock-market.css": "e12ea9ff23cd08fb33310b282ceb3bc804bb1c4f693c6caac11076f0acbb7a04", "stock-market.js": "4b10d2e1af584a0224c6528e15f81ea370b50046464cefacc0e91424e0efd99a", "style.css": "6c10654748600cc183e036f82aab00a73a825c174797c7f26fb8c0c5e2fbc961", "survey-flower.mp4": "0cd83d944a6ca7822b4a8306cecc60a36e859b041f6702c6a1ad9ead78924451", "survey-runner.js": "e123e3ae6c10e6fbd58f4d4e91443b9dc65ed2172604fd9ce895a022c3933878", "survey-video01.mp4": "98455b50f49009e87e3cb5f517d1d854d78644413ea525fd6282569cb7ba5051", "survey-video02.mp4": "b0da286b8b23bf7714b79ac4d4d029367c08e380cb66c233a4555fd334244d6a", "survey-video03.mp4": "7a2ae73a7ccf8e8c6e93ce107c9b6d450ebfc61ded19b4255485560ea65cf051", "survey-video04.mp4": "2641435c86717904814e519020b2343f8913fba3457345e0f64a7f5ec66a2b71", "survey-video05.mp4": "14aca2fcd55cdfeaa61b6249af5d843165520e7c4fceed6fc91bbb6b2498464d", "survey-video06.mp4": "66b7d4484313ff1362023f5751cedc65854b9652ffe801a4063f9f24ec5aabfb", "survey-video07.mp4": "40d604dd8a9d038525c5ecc821007872d9f035ea9a7b9d2c37243b615a5234ad", "survey-video08.mp4": "59b371ff2c5ad4dd9aa21618bd3c26eb53323b838c45a5f4204bcaf70665edd3", "survey-video09.mp4": "af803eddc3c3fcb71d1f81082f2fc18294e1211c0057f1704d175f9e85aab9fb", "survey-video10.mp4": "49c949924631130c5c5e5494515bd486324c8dfc3ab1c451059b0d72bc6db454", "survey-video11.mp4": "a8642751cf9e349481879131bb18b9b968760c532aa4ce2a5522d1b10449d19b", "survey-video12.mp4": "002afc6278c970b59dfc40d15df71026e64d3e9837e8d56599fff23bce135d78", "survey-videos.js": "7a894aa287a40640056b9e64039a532422a7b3285b2b2f8d69dca0450259a16a", "surveys-ui.js": "1c2da9b5fe6fcbbee8992fd7f348d69e9f1bbb8b2141a4ace0e5af033de9cc8d", "surveys.css": "662a31d0b10670cfbfbcd1a1b575b80b977e2ac7949c9c778838eb7c03860a1e", "surveys.js": "4e038668d3064ef51aa8804d2758d5e622ba019b652fe28492b4aaef12c9e206", "text-customization.js": "c518cb57308bce27d6705d849097231e02d0b188d8d3df42006200e22a053160"};
const FILES = Object.freeze([
  'passive-money.js', 'passive-money-controller.js', 'emerald-roadmap.js', 'emerald-survey.js', 'emerald-survey.css', 'george-street-shuffle.mp3', 'mining-by-moonlight.mp3',
  'frenzy.js', 'emerald-progress.js', 'emerald-workshop.js', 'emerald-runtime.js', 'emerald-actions.js', 'run-wallet.js', 'cap-levels.css', 'crit-effects.css', 'emerald.css', 'emerald-asset.js', 'emerald-adviser.js', 'emerald-conduct.js', 'emerald-chat.js', 'emerald-ui.js',
  'index.html', 'player-identity.js', 'text-customization.js', 'moving-panels.js', 'moving-panels.css', 'custom-images.js', 'custom-images.css', 'joker-art.js', 'joker-art.css', 'surveys.css', 'surveys.js', 'survey-videos.js', 'survey-runner.js', 'surveys-ui.js', 'style.css', 'effect-text.js', 'effect-text.css', 'five-jokers.css', 'daily-streak.css', 'daily-streak.js', 'daily-tasks.js', 'daily-tasks-ui.js', 'daily-streak-ui.js', 'potions.js', 'engine.js', 'achievements-data.js', 'progression.js', 'passive-xp.js', 'exp-interest.js',
  'faucet-graph.js', 'levels-ui.js', 'collection-tracking.js', 'music-assets.js', 'music-data.js', 'audio.js', 'motion.js',
  'stats.js', 'stock-market.js', 'stock-market-data.js', 'stock-market-ui.js', 'stock-market.css', 'faucet-activity.css', 'potions.css', 'potions-ui.js', 'cloud-save.js', 'save-slots.js', 'app.js', 'pwa.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png',
  'icon-512.png', 'icon-apple-180.png', 'survey-flower.mp4', 'deadly-roulette.mp3',
  'survey-video01.mp4', 'survey-video02.mp4', 'survey-video03.mp4', 'survey-video04.mp4',
  'survey-video05.mp4', 'survey-video06.mp4', 'survey-video07.mp4', 'survey-video08.mp4',
  'survey-video09.mp4', 'survey-video10.mp4', 'survey-video11.mp4', 'survey-video12.mp4',
  'emerald-friendship.js', 'emerald-blackjack.js', 'emerald-blackjack-actions.js', 'emerald-blackjack-ui.js', 'emerald-blackjack.css'
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
