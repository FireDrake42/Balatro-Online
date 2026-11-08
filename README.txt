Balatro Play Blind Repair r1

Partial website update, NOT a standalone game.
Merge the 17 site files into the EXISTING same-site project root, replacing those matching files only. Keep ALL other files, media, and browser data. Do not create a new origin/domain.

The fix changes one native Potion/RUN validation function. The index app integrity/fingerprint and offline-worker hashes/version match the repaired app; other scripts and worker runtime remain unchanged.

Do not clear/reset/import/restore saves or retry a reward to install this update. No forced service-worker activation or reload is supplied.

NATIVE-QA.json retains the genuine native ENTRY-fence reproduction/repair checks: positives and 20 strict negative cases, no storage writes. PACKAGE-MANIFEST.json records source fingerprints and metadata QA (15 SRI checks, original worker crypto/canonical/query/negative checks, app syntax only).

Not tested: full 220-file installation, physical devices, startup, complete gameplay/financial commit, or durable FILE saves. This is not a claim that all earlier startup or save issues are resolved.
