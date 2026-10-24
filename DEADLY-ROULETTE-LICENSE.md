# Deadly Roulette — original recording and license record

## Verified identity and current primary license

- Track: **Deadly Roulette**.
- Artist/composer: **Kevin MacLeod (incompetech.com)**.
- ISRC: **USUAN1600033**.
- Official catalog filename: `Deadly Roulette.mp3`; listed length: `00:02:39`.[1][2]
- Current official license: **Creative Commons Attribution 4.0 International (CC BY 4.0)**. The official track page's attribution template and the official Creative Commons credit generator both specify version 4.0.[1][3]
- Source URL: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600033
- Official catalog dataset: https://incompetech.com/music/royalty-free/pieces.json
- Official download URL: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Deadly%20Roulette.mp3
- Local file: `deadly-roulette.mp3`.
- Retrieval record date requested for this task: **2026-10-20**. For transparency, the download response's origin-server `Date` header was `Wed, 21 Oct 2026 06:31:05 GMT`; the requested record date is not represented as that server timestamp.

Use the current authentic primary license above, not a different version quoted by third-party mirrors. Incompetech describes its Creative Commons option as free with credit; its paid Standard License is a separate option for uses without attribution. No Standard License was purchased or required for this credited CC use.[3]

## Verbatim official track-page attribution

The following is the official track page's rendered attribution wording, with the catalog title substituted by that page's own template.[1][2]

```text
"Deadly Roulette" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
```

The official license generator also supplies `Kevin MacLeod (incompetech.com)`, `Licensed under Creative Commons: By Attribution 4.0`, and the same license URL.[3]

## Credits/settings and distribution requirements

Display the verbatim credit above visibly in the game's credits/settings for both the standalone HTML and website versions. Include the track source link and an accurate change notice alongside it. Ship this record with the local MP3; an inaccessible source-code comment alone is not the intended user-visible attribution.

CC BY 4.0 permits copying, redistribution/bundling, and adaptations, including commercial uses, subject to its terms.[4][5] Retain supplied attribution and notices, link to the licensed material where reasonably practicable, link to the license, and identify modifications; do not imply endorsement or add restrictions/DRM that prevent recipients exercising the licensed rights.[4][5]

The downloaded MP3 is unedited and untranscoded: only its local filename differs. Bundling or embedding this original recording does not make the game's own original composition, arrangement, or code the work of Kevin MacLeod.

If the integrating game implements the described boss adaptation, display this additional notice (adjust it if the actual implementation differs):

```text
Changes in this game: the boss version adds an original game arrangement
and pitch processing to the music. The bundled source MP3 is unmodified.
Kevin MacLeod and Incompetech do not endorse this game.
Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600033
License: https://creativecommons.org/licenses/by/4.0/
```

This asset-only task does not implement or verify the game's boss arrangement or playback processing. Do not claim those changes exist unless implemented. The no-endorsement and change-disclosure requirements come from the CC license.[4][5]

License deed: https://creativecommons.org/licenses/by/4.0/

Full legal code: https://creativecommons.org/licenses/by/4.0/legalcode.en

The recording is offered without warranties under the license; this record documents provenance and is not a substitute for the legal code.[5]

## Download and integrity validation

These are local verification results for the complete response body saved without alteration:

- Public HTTPS download, without login, account, purchase, or access-control bypass.
- HTTP status: **200 OK**; final URL exactly equals the official download URL above.
- Origin content type: `application/octet-stream` with `Content-Disposition: attachment`; media validation, not this generic MIME type, establishes the MP3 format.
- HTTP `Content-Length`: **5,099,663 bytes**.
- Saved file size: **5,099,663 bytes** (matches the entire response body and declared length).
- SHA-256: **`ef6aae97cd50a21b36e2a3694619ae2263c5630e40c68d3a43490425ccd2bf11`**.
- `ffprobe`: MP3 (MPEG audio layer 3), one audio stream, stereo, 44,100 Hz, stream bitrate 256,000 bit/s.
- `ffprobe` duration: **159.294719 seconds** (approximately **2:39.295**).
- Embedded title: `Deadly Roulette`; artist: `Kevin MacLeod`; comment: `ISRC: USUAN1600033`.
- Full-stream decode check: `ffmpeg -nostdin -v error -xerror -i deadly-roulette.mp3 -map 0:a:0 -f null -` exited **0**, with no errors.
- No YouTube audio, third-party download mirror, shortened preview, re-encoding, or generated imitation was used.

## Primary verification method

The official page is a JavaScript shell. Its public source calls `fetch('pieces.json')`, selects the matching ISRC record, constructs `/music/royalty-free/mp3-royaltyfree/` plus the URL-encoded catalog filename, and renders the 4.0 attribution template. The unique matching catalog record supplies the title, filename, listed duration, and ISRC. The separate official license generator's `renderCC` function corroborates the same 4.0 license.[1][2][3]

Only the new MP3 and this new license/provenance record were created by this asset task. No runtime, build, test, deployment, or publication changes were made.

## Sources

[1] https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600033 — Incompetech official track page and attribution template
    > "Licensed under Creative Commons: By Attribution 4.0 License"
[2] https://incompetech.com/music/royalty-free/pieces.json — Incompetech official catalog dataset
    > `"title": "Deadly Roulette", "filename": "Deadly Roulette.mp3", "length": "00:02:39",`
    > `"uploaded": "2016-06-21", "isrc": "USUAN1600033",`
[3] https://incompetech.com/music/royalty-free/licenses — Incompetech official license choices and credit generator
    > "Licensed under Creative Commons: By Attribution 4.0"
[4] https://creativecommons.org/licenses/by/4.0 — Creative Commons Attribution 4.0 International deed
    > "The licensor cannot revoke these freedoms as long as you follow the license terms."
[5] https://creativecommons.org/licenses/by/4.0/legalcode.en — Creative Commons Attribution 4.0 International legal code
    > "reproduce and Share the Licensed Material, in whole or in part;"
