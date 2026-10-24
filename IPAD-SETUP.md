# Poker Table — iPad / Safari setup

## What this package is (and is not)

Building this installable static web app creates no deployment or account, and
adds no analytics or automatic sharing. Nothing has been uploaded. Optional
Account & Cloud actions contact the configured Supabase project only when asked.

## Level34 shine / Level37 dramatic Boss music

Actual player Level34 adds static blue, red, gold and green highlights to the
existing interface colours. There is no flashing, filter, card/rarity recolour,
layout change or extra motion. Existing custom text colours and motion settings stay.
Actual player Level37 adds original developing Boss arrangements, with more
harmonic movement, tension and a stronger final-boss climax. It is not just louder
music; normal table, Last Chance and Frenzy retain their own arrangements. Your
selected track, licensed recording credit, mute and volume settings stay intact.
Emerald now appears at actual player Level 5, with his separate E1–E10 green bar
below the photo at player Level 10. Fresh full-game wins at player10+ count.
No progress, save format, money, cloud account or Wallet is added or reset.

This attachment does not update an existing hosted website automatically. Back up
first and replace ALL website files at the SAME origin; never clear browser data.

## Player35 hands, tips and local conversation

- Player35+ selects/discards up to six cards and has six base Joker slots. Deck,
  voucher and Negative-slot effects still apply. Double-Triple of a Kind is two
  triples: 120 Chips ×10 Mult, upgrading +20/+4 with Venus Rock. Six of a Kind is
  150×10, upgrading +30/+3 with Planet Y.
- Reaching 5 Exp/sec interest NEVER triples level requirements. Existing player
  Level10/20/30 cost discounts and potion discounts are unchanged.
- Emerald's “1st tips” (original advice) and “2nd tips” (Dani's quotes) are separate
  toggles; either, both or neither can be selected. Each speech lasts ten seconds
  before Next is available; rerendering or switching toggles cannot skip the wait.
  Quotes unlock by PLAYER level and conditional tips use real current public facts.
- Talk is a small offline, rule-based Balatro helper, not an online generative AI.
  It sends/stores no chat messages and awards no gifts or XP for manual messages.
  Swearing triggers a three-calendar-month GAME restriction across the local
  browser/site's slots. Saved progress is never deleted. This is local enforcement,
  not a secure server/account ban; another browser/origin is not covered. Failed
  restriction storage confirmation pauses play rather than pretending success.
- “Memoir of Summer” is pending Dani's artist/link and reuse permission; this
  package does not invent, download or impersonate that song.

## Wallet removed — ordinary purchases

The extra Level 33 Wallet and Bank/Card payment chooser have been removed.
Run purchases use normal game dollars again, including the native Credit Card
Joker's debt allowance. No new $100 purse is granted and no old purse balance is
converted into game cash. Existing valid save metadata is retained, inactive,
so this update does not reset your run or other progress. Frenzy and Emerald stay.

## Three local save slots

Your existing local progress becomes Slot 1 without resetting it. Slots 2 and 3
start fresh. Choose a slot when opening the game; progress saves automatically in
that selected slot. Settings -> Local save slots lets you switch or delete one.
Deletion requires typing DELETE N and confirming; it affects only that slot.

Slots stay in this browser on this same website origin/device, not in Telegram
attachments or another domain. Close old game/survey tabs before switching;
finish pending surveys and bank their rewards first. Safe switch/delete/recovery
requires modern browser Web Locks. Without them, ordinary single-tab play in the
current slot still works, but unsafe replacement is refused rather than guessed.
Keep your exported JSON backup and never clear site data to install an update.

Account login is shared by the browser but never archived inside slot saves.
Manual Save to Cloud uploads the selected slot only; Load from Cloud and Restore
local backup replace the selected slot only. The pre-restore backup follows that
slot. Neither cloud transfer nor JSON export is an automatic backup of all three.

Bigger genuinely awarded XP amounts play a higher-pitched XP chime, respecting
your sound/mute/volume settings. Opening a slot or restoring progress awards no XP.

## Password recovery update — existing website

Keep your exported JSON backup. Update the complete contents of the website ZIP
at the SAME existing HTTPS domain, including index.html, scripts, manifest and
sw.js together; do not mix versions or clear browser site data. Close older game
tabs and apply any offered offline-app update. Before requesting email, verify
that Settings -> Account & Cloud on the WEBSITE shows Forgot password.

Request one reset email there. Open its newest private link on the updated site,
verify the displayed account explicitly, and enter/confirm a new private password.
Recovery authorization exists only in that tab: a reload/cancel needs a fresh link.
Then log in normally. Saving current progress to cloud is a separate Save to Cloud
action; Load from Cloud replaces local progress and is not an upload.
Never share reset links, passwords, private API keys or service-role keys.
See PASSWORD-RECOVERY-STATUS.md in the source archive for tested scope/limitations.

Telegram/Files HTML previews may not execute JavaScript. Saving an HTML attachment
is not the same as opening a web app in Safari. A working, installable Safari URL
needs parent-approved HTTPS hosting (or approved local HTTPS). A parent or guardian
must approve that first. A ZIP by itself does not create a Safari URL. Ordinary
HTTP to another computer's LAN address does not enable service workers; the
localhost exception is only for the same device.

## Parent integration — do not replace the game

Keep the existing viewport (`viewport-fit=cover`), theme-color (`#0b2427`) and CSS.
Add these in the source `index.html` head:

```html
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Poker Table">
<link rel="apple-touch-icon" sizes="180x180" href="icon-apple-180.png">
```

Add this after `app.js`, before `</body>`:

```html
<script src="pwa.js"></script>
```

Also add `pwa.js` to the parent's existing standalone builder's embedded scripts.
That downloadable main HTML must still contain its JS/CSS: do not turn it into a
shell that relies on sibling files. On `file://`, embedded `pwa.js` does not touch
service workers, fetch, caches, saves or navigation. Manifest/Apple icon references
are for the hosted version; they cannot make a file preview installable.

Optional settings/help integration (no automatic modal):

- `BOPWA.getStatus()` → frozen snapshot: `state`, `supported`, `offlineReady`,
  `updateAvailable`, `installed`, `scope`, `error`.
- `await BOPWA.ready` → initial offline setup result, including harmless fallback.
- `BOPWA.installInstructionsHTML()` → constant English help HTML; show on request.
- `await BOPWA.checkForUpdate()` → manual check only; never reloads/activates early.
- Window event `bopwa:status` has the snapshot in `event.detail`.

Do not display `error` as an automatic popup. A failed/insecure/unsupported offline
setup must not stop the ordinary game. `offlineReady` describes the installed
worker now, not a promise that iPadOS will retain its storage forever.

## Build and local verification

From this source directory, after integrating the tags:

```sh
/opt/node-v24.18.0/bin/node test-pwa.js --icons
python3 package-ipad.py
/opt/node-v24.18.0/bin/node test-pwa.js
```

The icon step rasterizes our original `icon.svg` with existing Chrome (no extra
libraries). The packager refuses missing/extra runtime references, hashes the
actual allowlisted source assets, and stamps only `ipad-web/sw.js` with its build
version plus asset checksums. Source `sw.js` remains a template. Outputs:

- `ipad-web/` — reviewed static website files, ready for a parent's later decision.
- `Poker-Table-iPad.zip` — exactly that folder, plus this guide inside it.

No source/test tooling, hidden files, browser profiles, caches, saves, old builds,
challenge metadata or 100k planning data enter the ZIP. Do not upload the project
root. Publish a complete `ipad-web` release atomically if hosting is later approved;
never mix individual versions. Serve `.webmanifest` as `application/manifest+json`,
JS as JavaScript, and `sw.js` with revalidation/no-cache. Keep the same directory URL
and do not broaden service-worker scope. Subdirectory hosting is supported. Do not
minify, inject into or otherwise transform packaged files after the build: their
exact checksums intentionally reject changed bytes.

The test uses a temporary loopback server on an OS-selected port, separate from
8765. It checks 768×1024 touch Chromium, offline play after first load, exact cache
contents, subpaths, safe update waiting, release-integrity checks and file fallback.
This is not a real Safari/WebKit/iPad test; those are unavailable here.

## On the iPad (after parental hosting approval)

1. Open the approved HTTPS game URL directly in Safari.
2. Tap Share → Add to Home Screen. If offered, keep Open as Web App on, then Add.
3. Open the new icon online once; let offline setup finish, then try Airplane Mode.
4. Tap the music button to enable audio; iOS requires a user gesture.

Finish your hand before updating. An update waits; it never reloads the game or
forces a new worker into a live hand. Close every tab/Home Screen game window and
reopen online to pick up a completed update. One installed worker serves one
versioned bundle; failed or mixed releases do not replace it. Missing cached assets
can repair online only from a complete, checksum-identical release, never from a
mixture of old and new modules. If an update is not available yet, reopening/checking
online may install it for the following launch.

The offline cache holds only the 81 named runtime assets (including `stats.js` and the Frenzy/Emerald modules). It never caches non-GET,
cross-origin, unknown paths, URL queries, exported saves or browser data. Cleanup
is limited to this app's cache prefix and its exact hosting directory; it does not
clear localStorage, other apps' caches or website data. Do not clear Safari data
as an update method. Safari/Home Screen contexts may have separate saves, and
storage can be evicted. Export important progress from game Settings and keep the
backup private. Installation, audio behaviour and retention still need a real
parent-supervised iPad/Safari check.

## Frenzy and Emerald update

Back up your saves, keep the same website origin and update ALL package files
as one release. Attachments do not update an already hosted website. Never clear
browser data or use another domain as an update method.

- Actual player Level 33: genuine scored-card triggers, including retriggers,
  charge the centered scored-card meter. Level33–34 needs 500 triggers; actual
  player35+ needs 166. Reaching the requirement starts ten seconds of rainbow
  Frenzy, adding 50% to final Mult with an original synthesized Frenzy arrangement.
  Its meter drains by wall clock; active scoring cannot refill/restart the burst.
  Charge belongs to the chosen save slot and carries into that slot's new runs.
  Music/mute/volume, Motion OFF and reduced-motion preferences remain respected.
- Actual player5 reveals the original Emerald photo. Player10 reveals his own green
  level/win bar beneath it. Only fresh full-game wins completed by final Ante 8
  Boss cashout while already at actual player10+ count; old saves, blind wins, endless,
  previews and reloading do not award wins. No historical wins are backfilled.
- Emerald E1 has no new buff. E1→E10 needs another 10/15/25/30/40/50/65/80/100
  fresh wins respectively (415 total). E2 shares green-loving, number-6 facts and
  fictional scratch-ticket trivia; no real gambling. E3 makes his photo 20% larger
  and movement 20% faster. E5 adds green aura. E6 comments on actual Lucky/Space
  Joker/banana events, not predicted successes. E7 greets a genuine save entry,
  not every render. E8 adds richer, friendlier public-state tips, not hidden-card
  predictions or a literal AI-IQ increase.
- E4+: each genuine, visible automatic speech has a fixed 1% Speed Potion roll,
  at least ten seconds apart. Quiet, hidden/protected views and silent workshop
  work do not speak or roll. Manual Next Tip and repeated rendering cannot roll.
  A full two-bottle inventory consumes a successful roll without a pending gift.
  Speed is the gift-only 17th bottle; the original 16 shop/Boss drops are unchanged.
  When explicitly drunk it shortens scoring animation durations 30% for 120 real
  seconds, stacking with Level 22 and animation speed; it changes no game timer.
- E9/E10: in the SHOP of the same active run, use Give Emerald a card. Confirm an
  owned playing card; it leaves the deck while Emerald works silently for 120
  seconds. E9 returns the same UID/suit with +1 rank (Ace cap) and a 10% chance of
  Foil/Holographic/Polychrome. E10 returns +3 ranks (Ace cap), a 40% primary
  edition-or-enhancement roll, and an independent 10% edition-plus-enhancement
  roll (46% any modifier on a plain card). Existing metadata/seals are preserved;
  mutually exclusive editions/enhancements are never illegally stacked.
  Results are fixed before saving the give. Collect in that origin run's shop;
  the 300-second cooldown starts at work completion, NOT at collection. Reloading
  does not reroll, and a different/new run never inherits a reserved card/job.
  Abandoning/replacing the origin run forfeits its uncollected card. All dollars,
  cards, potions and rewards are fictional game items; no payments or accounts.

A paused-save warning is not permission to reset or bypass a read guard. Keep
all backups/data and reload safely; intermittent local-file storage loss remains
unproven and is not claimed fixed by this update. Desktop Chromium fixtures do
not replace physical iPad/Safari/Android testing.
