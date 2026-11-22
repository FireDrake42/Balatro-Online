/* R174 exact local MP3 additions. Source names are labels, not verified rights or BPM. */
(function (root) {
  'use strict';
  const all = Object.freeze([
    {"rawName":"mfcc-casino-lottery-casino-gambling-music-406445.mp3","bytes":1331618,"sha256":"9066255ab852cf2d26de0ebde73d6d2ca934c93eab4bf9ac838448061d0dfcd9","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_casino_lottery","name":"Casino Lottery","src":"audio/r174/casino-lottery.mp3","duration":41.613063,"integrity":"sha256-kGYlWrhSzy0m3g695z1tLKk0yT6rS/msg4RIBh0N/Nk=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"mfcc-las-vegas-las-vegas-casino-music-385955.mp3","bytes":2341407,"sha256":"501add697ec090a62c173e5cde12611d7fd96ad9e74db9f57d5255935855cbe0","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_las_vegas","name":"Las Vegas","src":"audio/r174/las-vegas.mp3","duration":73.168969,"integrity":"sha256-UBrdaX7AkKYsFz5c3hJhHX/ZatnnTbn1fVJVk1hVy+A=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"nickpanek-rpg-battle-chiptune-video-game-music-346666.mp3","bytes":3732480,"sha256":"1ce70389d74b91a1bc62f0709e649ca07cd7d39a61b42c0af0546afe4f9e0b86","sampleHz":48000,"channels":2,"role":"background","id":"uploaded_rpg_battle","name":"RPG Battle Chiptune","src":"audio/r174/rpg-battle.mp3","duration":116.64,"integrity":"sha256-HOcDiddLkaG8YvBwnmScoHzX05phtCwK8FRq/k+eC4Y=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"epic_musictracks-epic-game-114918.mp3","bytes":4235598,"sha256":"4a12a462b57e43ac0e7f38cab8c71ede193b3fa9ef67df59f0b44ae672a43a29","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_epic_game","name":"Epic Game","src":"audio/r174/epic-game.mp3","duration":132.362438,"integrity":"sha256-ShKkYrV+Q6wOfzjKuMce3hk7P6nvZ99Z8LRK5nKkOik=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"jesuschristisgod_lucky_streak_christian_game_show_music_4jesus_312720.mp3","bytes":3204075,"sha256":"1767ddede23a3122e92f20e9cec21e9de9c27e53d4d8a659f2fa2381d253e49e","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_lucky_streak","name":"Lucky Streak","src":"audio/r174/lucky-streak.mp3","duration":100.127344,"integrity":"sha256-F2fd7eI6MSLpLyDpzsIenenCflPU2KZZ8vojgdJT5J4=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"cyberwave_orchestra_upbeat_background_loop_casual_video_game_music.mp3","bytes":1229635,"sha256":"e4ddf33adbc06904080b9cb21be8862f503393ced7a2a13bd707f88f079546cd","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_upbeat_game_loop","name":"Upbeat Game Loop","src":"audio/r174/upbeat-game-loop.mp3","duration":38.426094,"integrity":"sha256-5N3zOtvAaQQIC5yyG+iGL1Azk87XoqE71wf4jweVRs0=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"cyberwave_orchestra_puzzle_game_loop_bright_casual_video_game_music.mp3","bytes":2363977,"sha256":"c2dab2c408de2b6ad2f6cb4df17ad3174c29c824221409f1b1d6ee871061bf57","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_puzzle_game_loop","name":"Bright Puzzle Loop","src":"audio/r174/puzzle-game-loop.mp3","duration":73.874281,"integrity":"sha256-wtqyxAjeK2rS9stN8XrTF0wpyCQiFAnxsdbuhxBhv1c=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"Walen_-_Gameboy__freetouse.com_.mp3","bytes":3963423,"sha256":"ba80a9a3bc1b7399c9520c3753785b6b9dfe602ef02b85491a159dbec40f5d95","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_gameboy","name":"Gameboy","src":"audio/r174/gameboy.mp3","duration":99.056327,"integrity":"sha256-uoCpo7wbc5nJUgw3U3hba53+YC7wK4VJGhWdvsQPXZU=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"Nebulite_-_Breath__freetouse.com_.mp3","bytes":6725100,"sha256":"95828425b68876a2988b9a868eb8c8bf8a66fe7c633a803510bb08b010384c8e","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_breath","name":"Breath","src":"audio/r174/breath.mp3","duration":168.097959,"integrity":"sha256-lYKEJbaIdqKYi5qGjrjIv4pm/nxjOoA1ELsIsBA4TI4=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"soundtracklegends-poker-game-night-432168.mp3","bytes":4392960,"sha256":"02435a6f057c0468b365ffac87daf972314901674702fb73b464f5698d0d89b4","sampleHz":48000,"channels":2,"role":"background","id":"uploaded_poker_game_night","name":"Poker Game Night","src":"audio/r174/poker-game-night.mp3","duration":137.28,"integrity":"sha256-AkNabwV8BGizZf+sh9r5cjFJAWdHAvtztGT1aY0NibQ=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"mfcc_jazz_music_casino_poker_roulette_las_vegas_background_intro.mp3","bytes":2858840,"sha256":"856579d5105ed308389dcfe8bee2c5c735a419a75fce5747c31de23fb3bb0b09","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_casino_jazz_intro","name":"Casino Jazz Intro","src":"audio/r174/casino-jazz-intro.mp3","duration":89.33875,"integrity":"sha256-hWV51RBe0wg4nc/ovuLFxzWkGadfzldHwx3iP7O7Cwk=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"music_for_videos-casino-164235.mp3","bytes":2089795,"sha256":"999c9c06c586f5d18a81f72b44c26a7a8466e9259d3a7247abe4b30114ee3af1","sampleHz":44100,"channels":2,"role":"background","id":"uploaded_casino","name":"Casino","src":"audio/r174/casino.mp3","duration":65.306094,"integrity":"sha256-mZycBsWG9dGKgfcrRMJqeoRm6SWdOnJHq+SzARTuOvE=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"casino-vip-music-vip-casino-music-7-469284.mp3","bytes":3561984,"sha256":"b0bf0dcce78b58fce9bbc26c68d96e1b21325bb486c7f4546dc6b9aba96e8ddd","sampleHz":48000,"channels":2,"role":"background","id":"uploaded_vip_casino_7","name":"VIP Casino Music 7","src":"audio/r174/vip-casino-7.mp3","duration":111.312,"integrity":"sha256-sL8NzOeLWPzpu8JsaNluGyEyW7SGx/RUbca5q6lujd0=","fallback":"poker_lounge","unlockMusicLevel":2},
    {"rawName":"dealing-one-card-578992.mp3","bytes":12288,"sha256":"61901cddb13ed3cb0833593a0e9f15df8f484081c2856542b4f4e69ec3304fe8","sampleHz":48000,"channels":1,"role":"card-draw","id":"card-draw","name":"Deal a Card","src":"audio/r174/card-draw.mp3","duration":0.384,"integrity":"sha256-YZAc3bE+08sIM1k6Dp8V349IQIHChWVCtPTmnsMwT+g="},
    {"rawName":"poker-chips-bet-578984.mp3","bytes":38400,"sha256":"318a502e57c5daecdcb120efc74310226ebe41c80f2ef5b29271dea45c0dbef8","sampleHz":48000,"channels":1,"role":"chip-bet","id":"chip-bet","name":"Poker Chips Bet","src":"audio/r174/chip-bet.mp3","duration":1.2,"integrity":"sha256-MYpQLlfF2uzcsSDvx0MQIm6+QcgPLvWyknHepFwNvvg="},
    {"rawName":"casino-chips-stack-578990.mp3","bytes":51456,"sha256":"2d4acb8991d76be87dddc46dcba0e9ad549621eacb637afa71d0e664e6d4b524","sampleHz":48000,"channels":1,"role":"chip-stack","id":"chip-stack","name":"Casino Chips Stack","src":"audio/r174/chip-stack.mp3","duration":1.608,"integrity":"sha256-LUrLiZHXa+h93cRty6DprVSWIerLY3r6cdDmZObUtSQ="}
  ].map(row=>Object.freeze(row)));
  const backgrounds = Object.freeze(all.filter(row=>row.role==='background'));
  const effects = Object.freeze(all.filter(row=>row.role!=='background'));
  // R174 only. Streaming is required: arrayBuffer() on an untrusted length would be unbounded.
  async function readVerifiedMP3(response, url, metadata, signal) {
    const size = metadata.bytes, declared = response.headers.get('content-length');
    const encoding = response.headers.get('content-encoding');
    if (signal.aborted) throw new Error('asset_cancelled');
    if (response.status !== 200 || response.redirected || /^(?:opaque|opaqueredirect|error)$/.test(response.type) ||
        (response.url && response.url !== url) || response.headers.has('content-range') ||
        (encoding && encoding.toLowerCase() !== 'identity') || !response.body?.getReader) {
      void response.body?.cancel().catch(() => {});
      throw new Error('asset_read_failed');
    }
    if (!Number.isSafeInteger(size) || size < 1 || size > 12*1024*1024 ||
        (declared !== null && (!/^\d+$/.test(declared) || Number(declared) !== size))) {
      void response.body.cancel().catch(() => {});
      throw new Error('asset_size_limit');
    }
    const bytes = new Uint8Array(size), reader = response.body.getReader();
    const cancel = () => { void reader.cancel().catch(() => {}); };
    signal.addEventListener('abort', cancel, {once:true});
    let offset = 0, complete = false;
    try {
      for (;;) {
        const {done,value} = await reader.read();
        if (signal.aborted) throw new Error('asset_cancelled');
        if (done) break;
        if (!value?.byteLength || value.byteLength > size-offset) throw new Error('asset_size_limit');
        bytes.set(value,offset); offset += value.byteLength;
      }
      complete = true;
      if (offset !== size) throw new Error('asset_read_failed');
      const hash = await globalThis.crypto.subtle.digest('SHA-256',bytes);
      if (signal.aborted) throw new Error('asset_cancelled');
      if (Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('') !== metadata.sha256) {
        throw new Error('asset_integrity_mismatch');
      }
      return bytes.buffer;
    } finally {
      signal.removeEventListener('abort',cancel);
      if (!complete) cancel();
      reader.releaseLock();
    }
  }
  const api = Object.freeze({version:1,backgrounds,effects,readVerifiedMP3});
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.BOAudioAdditions=api;
})(typeof window !== 'undefined' ? window : globalThis);
