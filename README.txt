READ-ONLY SIZE INSPECTOR — DIAGNOSTIC ONLY, NOT A CAPACITY FIX

Upload only quota-size-check.html beside the existing game files on the SAME existing origin. Do not replace app.js, index.html, sw.js or other assets.

Keep the current paused game tab open and untouched. In a separate NEW tab, open:
https://balatro-online.vercel.app/quota-size-check.html?readonly=photo2053
The query is only a diagnostic label; it does not force activation or bypass any ownership/save guard. No game reload is required. Other origins and file:// are blocked before storage access.

The page requests no writes or owner claims and loads no game modules or external assets. It reads presence and UTF-16 lengths for eleven source-verified fixed game banks only, plus the total key COUNT. No raw bank value is shown, parsed, copied or downloaded. You may select/copy the displayed metadata manually.

Coverage: core profile (including its stored model state), active run, settings, daily banks, one metadata bank holding all three slots, retained legacy slot backup, known cloud backup and slot/native/cloud journals. Dynamic ending-backup IDs, owner records, authentication keys, survey data and other unlisted keys are not queried. The subtotal is NOT full-origin usage, actual browser quota accounting, available capacity or device free space. Missing and read-error rows create no defaults. Reads are not atomic.

Do not retry rewards, clear data, evict backups, migrate, reset, import or force-reload the paused game. Any later storage repair needs separate authorization, lossless preservation and owner/journal/readback failure tests.

QA-proof.json covers isolated Node RAM fixtures and static HTML/JS/CSP/privacy checks. It is not an iPad browser boot, active-service-worker, financial-commit or physical-save proof. The ZIP is held for parent review; this package itself performs no delivery or publication.
