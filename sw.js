/* Poker Table offline worker. package-ipad.py stamps only its DIST copy. */
'use strict';
const VERSION = '780444aa72fa6f3dc3602977';
const EXPECTED_HASHES = {"achievements-data.js":"9d6aae1ae853f207a18259b6bf7ba1209dff17c71e6bb8ee987949eded1c4294","app.js":"f26fe595a6f5f3e92f263a92a993a19aadfade73ef1b9b1b88635e42f1b7ce88","audio.js":"56568e84a17960a5ffec440f5fb917feb160aefa81069ee30169bf5c4ab54ffa","battery-controller.js":"c82259c1999613092000585b63a433a15f998cec76db6a2743a3e5501f5904e1","battery-display.js":"088a89a8982ade6dd187daa57e39ce79a319c7271037c4c8581bc13c6564b2ab","battery-ui.js":"71c4c76ff1e158d9bf75b0d57544259b518697ef3ebc7bd6dde1d0675d6a3784","battery.css":"8c8c1e2a2cae6864a902580ddf31a934b0879da1d1aac127e308cf3826645a2f","battery.js":"742635b52a4e5e6e8974525e082d2a9e97ebc6365d99d73c031771f44e23ca52","cap-levels.css":"63a995f6e13c8a1c9dc160bc1dfdd94cc36c5f85863aa87730122d36f509d844","cloud-save.js":"498353b5af3254df16d9bf8b1b816fb5dc0dc5fe889665a246e3a3ffd5a1d558","collection-tracking.js":"8e0ed02004acfbd21395d92172d7a786fec753737ee0a1e337533115af38e21d","crit-effects.css":"0df6b7161077543b94f29eb57609a1313112aedc9f12569f66c268fa14b9add8","custom-images.css":"65789ace7485c82915be17834b720998e9ae0e644f55708f5580d9ef1964a6be","custom-images.js":"80b6ff96e6886453f29f3adb0bf32e5046ec40ac1c8a8063a734bc1555b0cfcb","daily-streak-ui.js":"fa1ee1663c1ec25fc46c790bfc8339dfdf37b5d3fab452bca1237fdcc5898337","daily-streak.css":"6f70fe48bf0349c64d4586864b2a4ace24b61b4a57c037059c30f4fb74fd54dc","daily-streak.js":"d53321825c292f12846a72e9a96294d8fd729dffe96d490c738b8f64191e8c4d","daily-tasks-ui.js":"f5ecce267d0c97b528d721bcd794150fdbc11ed6b1dfc1abac63032bad274055","daily-tasks.js":"d622739613e8b0d6810aa677fc306bfb423d81eae817c08892243f95936883a6","deadly-roulette.mp3":"ef6aae97cd50a21b36e2a3694619ae2263c5630e40c68d3a43490425ccd2bf11","effect-text.css":"85711d83790f431011d3e634284636d786f4732f13e0caee06e714d39104c457","effect-text.js":"59fb7c8fd10e950b942258b1ae5ffb9e47aec018b16c76071f5b19c99136cfc0","emerald-actions.js":"806f60072fd1acdddb2e5ec96da781f63afc3f257da7d92d5e7dcccc20da6f52","emerald-adviser.js":"42aa71e2821d76459f0a9a9a5214e993db5bf91538a5d38c0f0c82fca51ffca8","emerald-asset.js":"fcd76de246a08d7aace1df41204802ed72b7dd56a896485dc8f867046efb49f3","emerald-attentive.css":"e6ce67593e78ce429ced7c1e8310737d95322571e98be81aaacf770db1b65bf2","emerald-attentive.js":"dfea20a023911da94f5e8d0bb4e434c90091eb97ea4bd913a874aa2c696e437d","emerald-blackjack-actions.js":"7ec63032200b2ebbfa0890b1d2ddacf8e549f53f692bd608abe762ff72d719f0","emerald-blackjack-ui.js":"d08a0eee0488c78c2d10081088b0df5463cb862a89cb12b6a7cb646004a0dd45","emerald-blackjack.css":"5359fc13cb7a51b5a3faaf8b441f350f0cc9ab4247e4669988e0f943d00e9aea","emerald-blackjack.js":"b29f0900aad6e3600925c78a538271dcf091257f69ae86baa56bf640a5a320de","emerald-card-frames.js":"63abd75ab2b79647bc264d013c50a64b95730b5ef205c34237f26da6b2865095","emerald-chat.js":"89a29031dd88a412a4671c583c1747355007a82c0008a5bb0e61e20a602483d0","emerald-chill-actions.js":"a0c712dd234e6318c1897abd8d9f6aee4e2695f4313fd984ebcb5fb79fb9aa2d","emerald-chill-games.js":"6a94d2df27d7cf3623d2df13b3e23a0eec3ab8094c1e8a2e696bc81091c58e83","emerald-chill-ui.js":"eeca8e23b42ea6640642ba154e16605d310840adf0f5cd7c68f8f317a6f8d3a1","emerald-chill.css":"0408b1fe1a2db6ecce6443cd6247cf82c58029b696474623faab5059ed63447d","emerald-conduct.js":"89c8aceef9fe39fdd6db23cb3c181b23543923372b761fe034571eb928a20fdd","emerald-faceted-gem.svg":"7f27a26ca2f3e22e784e4bc02271a8feed22901a04392554ac826f68030ae2f9","emerald-framed-portrait.png":"92c4afe2443aafa39fadc139ca0b19741ad5bd35a9c93ab32b3a6251bd1cb189","emerald-friendship.js":"6ab1811ad36d5b2b51121281c74b75859bf42ff479b69330e141d6b224e83ba2","emerald-poker-actions.js":"21b4bb87d6c5eacbc79c5ea59c09a5745e3575f4cf2e9ab5b493deccec41d5b0","emerald-poker-events.js":"0552bafd145ad7e78155dbe516fbefb6c20d431063fc3647826b47b165cf08c3","emerald-poker-profile.js":"5f7d022309723151e5048bd789257dbcad07db1f1056b98aa46e37518bac59b9","emerald-poker-ui.js":"68fadada8628834aad32856554178e3669726b8e400511aa87b708de86cf9fc4","emerald-poker.css":"b5e9bbcf59a3163d6103454090c35fb6ea555060c64ffad3d23614288616f4c9","emerald-poker.js":"c0989700fc2d2e930f7621f2d62b03c7a1578f3dbb42a1c54497199f389f5464","emerald-progress.js":"8ff537abf5e699c272bfc0c757a1e3f44847ee562f60283494aa8c4563fe3cc5","emerald-roadmap.js":"10331fd6d0083d34395c27d9d3fbf3fb37b0e06fe9106236c9e6756d9338cb08","emerald-runtime.js":"e6a2290213748febd9ef48620c69e6bd6dae24b7ba61a3f104379a5de1068094","emerald-survey.css":"9fc5503b54910aef7f4829a92d4b6447b6c96108934f0b9ac5fe6fe4a360b22a","emerald-survey.js":"049f0c334f4027fe289143a042120e25de970c04f772416941c5a854fce40bb3","emerald-text-quirks.js":"ab55cea7a7c314f5a3947ec96a24af5662d077a6ac4b1655149ade9cd574f28c","emerald-typewriter.js":"0642f421e275a2584b9815bbf23ce5de1fde2d5d4da617d2fc889cc734fe2bcd","emerald-ui.js":"cdf7361ad7afae12e8915dad6ded85d92fdc8b145dad5c30fa1deff32ce6806b","emerald-workshop.js":"86428f2773eda4df4b47c5fe4773642c22a90be80b3ba75fd0a642cfc687a7d4","emerald.css":"7affc65481db63e7979ed6056f0b24b2b78c5c3d7fccb0ee3a6236a44f4c15b5","engine.js":"ca2d118f99c5a834e6ba22ca8240b9f5f6445dda893ce2c43bdb5c10e6ace844","exp-interest.js":"651c61a040c0bbd5aef16bc8c53206c1963b5d499dcdf64d151160b24bcfe4e5","faucet-activity.css":"cdda4e6bca8c09239e41a42a42de8077711db210d6c793c5482757be5e544d23","faucet-graph.js":"a972ef51011d163f2983aeef005dfcf0621c487a432aca530cf62cf690752fa7","feature-power.js":"6461a938efb7fdaeb4cb61d26251b38a1a432b6d6d08dcc107e050de3914f379","five-jokers.css":"75cbf1d4ca722663eb33427c4b449214536e60b4b990d6def56651514fb47eb6","frenzy.js":"bd443b50dd4b4977198a44644d0e1c896fc2dd897b26187a1534914f35a2d895","george-street-shuffle.mp3":"15ee9995e01ffe91678db6ba072ec13cf0bf258f17c01677c5367009932b9c07","i18n-bindings.js":"ca0470ba038d10fca932e724cc39af3baab87313abbd0d2dc0f5e2eec1ebe0ba","i18n-en-US.js":"34c7412e93264f1615ebca2d6d9c21b3cc0a370823e7ce9fae4ea8f05a9e2642","i18n-es.js":"c5cfbc0745ae4c23c2b68e36e7badf14fcf7176ba8c8ac0de4a301bbad8fac16","i18n-fr.js":"60e5561890b0098ccfd7f973b770458d4dffacf93156271bc60014c5edd6e739","i18n.js":"090f231b73a12e61cb7a0210b4556ebd7cb9693663d504884c4450d1a547137f","icon-192.png":"f09f6b6a7f734c9697a26839d01cb8306b463ef945a04edf8360de60bbf7789e","icon-512.png":"6bcc710c835288fe8fddc744a503d7450bf2b571c35624612f1a1175bbb23711","icon-apple-180.png":"6bd472219ed1a48c861b210e2b691d84a06ee01b972d058e45a9124d2b352d59","icon.svg":"747f8f0630a98052f849ea609413065c02dc3f6fcc13cd888a3476351b1d3880","index.html":"094c9e08a975f22183904065aead99ec67033a045e35920f13668b3bc33cadc7","interest-settings.js":"30a4d600277d924d2f1ee5ec21dc032068081066738bf6529e8b445710315026","joker-art.css":"b9f66357fb3dfe99b12ca16064a5e65113b562b9e504aeafb79ec26075f1ae7c","joker-art.js":"bde83c35b666f940b5195d11cc52eb91694ade093d58a8c432e2dbc8680ffbd7","levels-ui.js":"30fb3381a086a140cfdad8f357aa13c18dc51e8f9580022f2c7bfc2268b73f29","manifest.webmanifest":"8f7fbb449c2ddf39b40d6649f1bd3195dafe651e95808d49123f7d9c6e4b74a7","mining-by-moonlight.mp3":"683e5638ab2b3017a89d9c9a2ab7a3b516956f9dc5651740fed3508eddd35997","motion.js":"51cd8be3ae1c1a8a067bc42cd261bfc5ccd7552f9652971ede38f8dc631ae4f5","moving-panels.css":"107571e69768040680c3a32770471e11f4e8a78331e44c0a0dcc5b8905c08398","moving-panels.js":"6dda66dc4d2ee6aede602696d21f858c93e90aefdcc2a4138f967e9ca31123aa","music-assets.js":"df0e4458f9f75bf6426cfee39b126797d3c9986b2ad59e333abad723ca0c7c9d","music-data.js":"2a516245a7fb1e2b99677880b82b390f1ac2e8d3c387f9a21c1e739e77ca2d67","passive-money-controller.js":"17fda0efa31582785f73bc21559ae5fe6f3b4955e5f09ec40b358a2ffae31c47","passive-money.js":"709c66996d105014eff15e68ea9fd686c9a59878e35df0122ba97fb43968a711","passive-xp.js":"2ba7972149face53a349127d251b81b35007c01c8405d252f8b9d70b324581c9","player-identity.js":"70e684115e4ea56015879374f1644943616c36481bee2e3b7084d777bf8e2df8","potions-ui.js":"1e5acd5bf1b5b1bb2d86888d85003c1afde1aeec2cf015faecb0025271a5b995","potions.css":"5e989e503929329a5dbdc8c5f3e7dc39362414a36578bb945b7fb67b87c9bb4e","potions.js":"b6a2b771f0785adec035726d945c39767ea79a374932be97ae0b626c40974aa7","power-boundary.js":"90d09867d227c84c60584cbfa33529a45df45d5aedf697e7a89e872df658f6d8","power-settings-ui.css":"3dfc1d0c5f06a70a74eec84ef0027f657dcbc7e1bc714129623115c48df2b2f2","power-settings-ui.js":"cd5203afcddcb1513daa39a92eba508f9524d6bec1654e68e4738381175483f6","progression.js":"b2a6cf3c638269592a113f545ab04ff8b803ae380a24066147581b832a20ca57","pwa.js":"892fe6f5a3a4c1936fe531ef312fc8042417b61b8ebf04e4ae9e7315752a99cd","run-wallet.js":"fb0879e06cda54efce923d3360f49f4f913c4bf31fe4ce5af40ed9ff9ed718f8","save-slots.js":"89e6b0edc3cef24791e36c97a316901a938890ba9e2a85793f39ed7b3cbc9667","stats.js":"6ea3b2b0f53ea22b440caf67fc36e2b2aaf102fbe103d3bd76572bfa610f28ce","stock-market-data.js":"cbf3a0152118cd305b4432a4d41b81d6a1763deb67cc3a906b133a11e3ece542","stock-market-ui.js":"1e4b2b7f04b1e852dc7ad74c7fa3e3a56676d9083b7750e68fc64717712d5bb1","stock-market.css":"e12ea9ff23cd08fb33310b282ceb3bc804bb1c4f693c6caac11076f0acbb7a04","stock-market.js":"c145e0d75e86368df1dda19ee43b2572e7a0ea34096db62b8e08dd3bb1d1d18f","style.css":"688ba78229de7f9ee1bc0de7bc3ed2dc9f9dd0c4af074e02c9e422308374b904","survey-flower.mp4":"0cd83d944a6ca7822b4a8306cecc60a36e859b041f6702c6a1ad9ead78924451","survey-runner.js":"2aa5ef5ab1071b6535411f6ffd236e8031d949e160b7a5348857cc0345d66d69","survey-video01.mp4":"98455b50f49009e87e3cb5f517d1d854d78644413ea525fd6282569cb7ba5051","survey-video02.mp4":"b0da286b8b23bf7714b79ac4d4d029367c08e380cb66c233a4555fd334244d6a","survey-video03.mp4":"7a2ae73a7ccf8e8c6e93ce107c9b6d450ebfc61ded19b4255485560ea65cf051","survey-video04.mp4":"2641435c86717904814e519020b2343f8913fba3457345e0f64a7f5ec66a2b71","survey-video05.mp4":"14aca2fcd55cdfeaa61b6249af5d843165520e7c4fceed6fc91bbb6b2498464d","survey-video06.mp4":"66b7d4484313ff1362023f5751cedc65854b9652ffe801a4063f9f24ec5aabfb","survey-video07.mp4":"40d604dd8a9d038525c5ecc821007872d9f035ea9a7b9d2c37243b615a5234ad","survey-video08.mp4":"59b371ff2c5ad4dd9aa21618bd3c26eb53323b838c45a5f4204bcaf70665edd3","survey-video09.mp4":"af803eddc3c3fcb71d1f81082f2fc18294e1211c0057f1704d175f9e85aab9fb","survey-video10.mp4":"49c949924631130c5c5e5494515bd486324c8dfc3ab1c451059b0d72bc6db454","survey-video11.mp4":"a8642751cf9e349481879131bb18b9b968760c532aa4ce2a5522d1b10449d19b","survey-video12.mp4":"002afc6278c970b59dfc40d15df71026e64d3e9837e8d56599fff23bce135d78","survey-videos.js":"7a894aa287a40640056b9e64039a532422a7b3285b2b2f8d69dca0450259a16a","surveys-ui.js":"cac689d019a1246a90a21170cef9f499960e5aa59c49a08584a60291d2e02370","surveys.css":"662a31d0b10670cfbfbcd1a1b575b80b977e2ac7949c9c778838eb7c03860a1e","surveys.js":"ab0894eec98899efacf6a4041640fab059792c49a5b1c0bfc04b92d7b8ad03b6","text-customization.js":"c518cb57308bce27d6705d849097231e02d0b188d8d3df42006200e22a053160"};
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
  'emerald-faceted-gem.svg',
  'emerald-framed-portrait.png',
  'emerald-friendship.js',
  'emerald-poker-actions.js',
  'emerald-poker-events.js',
  'emerald-poker-profile.js',
  'emerald-poker-ui.js',
  'emerald-poker.css',
  'emerald-poker.js',
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
