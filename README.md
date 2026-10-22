# Carbon Guard

Catch reuse of retired serials before another carbon claim is recorded.

Carbon Guard is a local evidence-review prototype for the **Carbon Markets & Emissions Transparency** track of IEEE ClimateChain. A reviewer loads a proposed serial range, sees its issuance/transfer/retirement trail, and gets an explicit blocked decision when the range overlaps a prior retirement. A separate Solidity contract rejects reuse of namespaced serial keys even if an off-chain check is bypassed.

**Evidence level:** synthetic records, deterministic rules, and an ephemeral local EVM. No registry integration, certification, public-chain deployment, real credits, tokens, or measured emissions reductions. No AI model is used at runtime. Development was AI-assisted.

## Browser demo

[Open the working browser demo](https://kaivenn52.github.io/carbon-double-count-guard/). Allow the bundled EVM runtime (about 8 MB) to load on the first visit; review is enabled after the local ledger is ready.

The `docs/` build runs the Solidity contract inside each visitor's browser using Ganache and ethers. It needs no Node server, wallet, external RPC, credentials or funds. Each tab has an isolated temporary ledger. Reloading resets it. This static build can be served from a subdirectory; all runtime libraries are bundled locally, with license notices in `docs/vendor/`.

Build it with `npm run build:hosted`. Run `npm run test:hosted` to test the static build using installed Chrome. Validation covers exact overlap, actual EVM recording, replay rejection, offline export consistency, responsive widths, reset on reload and absence of external requests. The Node application below remains available for local development.

## Run locally

Requires Node.js 22 or 24 and npm. On Windows PowerShell:

```powershell
npm.cmd ci --no-audit --no-fund
npm.cmd test
npm.cmd run build
npm.cmd start
```

Open http://127.0.0.1:4387. The first startup compiles Solidity, starts Ganache in process, deploys the contract, and seeds serials 1–40 as already used. No wallet, credentials, external RPC or real money are needed. Restarting resets all local state and changes deployment addresses and transaction hashes.

If the port is occupied, select a free local port with `$env:PORT='4388'; npm.cmd start`. The reviewed instance in this workspace is currently at **http://127.0.0.1:4388**; port 4387 is occupied by a different service and was left untouched.

`npm run build` compiles the contract to `dist/ClaimGuard.json` and copies the frontend into `dist/public`; this is a validation/package step. The working application still requires the Node API server. Do not publish only `dist/public` and claim a working full application.

## Demo in 60 seconds

1. Review the default range 25–60. Observe **ALREADY_RETIRED**, exact overlap 25–40, and the original beneficiary. The recording action is disabled.
2. Load unused range 61–80. Review it. The decision states that only the loaded source has been checked.
3. Record in local EVM. Inspect the real local transaction hash, block and contract address. Export the review JSON.
4. Review the same range again. It is now blocked. Inspect source records to see the local retirement and receipts.

## Architecture

`public/` → Node HTTP API → `src/engine.mjs` → `src/chain.mjs` → `contracts/ClaimGuard.sol`.

- Identity is registry + project + vintage + individual serial. This prototype supports one synthetic batch; arbitrary registries and vintages fail closed.
- Rules reject invalid/oversized/out-of-issuance ranges, unknown identities, owner mismatches, missing beneficiary, unrecognized fixture references and any retired intersection. Ranges are inclusive.
- The server rechecks current state before recording and serializes writes. It does not trust a prior browser decision.
- Contract `record` is reviewer-only, marks each key used exactly once, and reverts the entire transaction when any serial is already used. It is a claim nullifier demonstration, not a carbon registry or credit token.
- JSON exports include scope, findings, source/claim commitments and local receipt when available. Digests commit to data; they do not establish its truth.
- Source trail is fabricated in `src/engine.mjs`. The UI labels it synthetic throughout. Public policy pages inform the design only; they do not supply any displayed carbon records.

## Validation

Version 1 exports embed an immutable copy of the pre-recording source snapshot. Verify a downloaded export offline with `node src/verify-export.mjs evidence/sample-local-review.json`. The command recomputes digests and the decision, checks local receipt field consistency, and exits nonzero on inconsistent or legacy files. It does not query a chain, verify a signature, or authenticate source data. Self-consistent fabricated records can still pass; the output explicitly states this boundary.

The video was recorded on October 21 and remains an accurate demonstration of the unchanged review/record/replay flow. The October 22 update adds source snapshots to new exports and a separate CLI verifier; these are not shown in that recording. `sample-local-review.json` is the current versioned export. `demo-recorded-review.json` is a historical export from the video run; the verifier deliberately reports older exports without snapshots as unverifiable.

`npm test` covers inclusive/partial overlap, unknown identity, malformed range, unissued serials, owner/evidence failures, subsequent retirement, actual Solidity execution, authorization, duplicate keys, and atomic rollback. `npm run test:ui` requires the server running with fresh state; it exercises overlap → unused review → local transaction → replay rejection at desktop/tablet/mobile widths. Install the Playwright Chromium runtime using `npx playwright install chromium` if absent, or use installed Chrome with `$env:BROWSER_CHANNEL='chrome'` in PowerShell. `APP_URL` selects an alternate localhost port for UI/API checks. Browser plugin is not available in this session; standard Playwright is used for localhost QA.

Node 24 can print a Ganache native µWS compatibility warning before falling back to its JavaScript implementation. The tested local transactions still execute. This demo does not rely on a network WebSocket server.

## Local-only video review materials

The video, review ZIP and internal submission records are intentionally excluded from this public source repository. Video sharing is authorized only as an unlisted link supplied separately to reviewers. The paths below describe the author's local review package; they are not files included in a source clone.

The completed review file is `evidence/Carbon-Guard-Demo.mp4`: **4:17.88**, 1920×1080 H.264 video with AAC English narration and selectable English subtitles. It records the real running synthetic application. The narrator is an offline synthetic voice. The video is shared separately as Unlisted and is intentionally absent from this public repository. Technical probe details are in `evidence/video-validation.json`.

On Windows with Microsoft Zira Desktop and ffmpeg/ffprobe in PATH, run `./submission/make-narration.ps1`, then `node submission/record-demo.mjs`, then `node submission/render-demo.mjs`. The recorder starts its own fresh server on port 4389 and closes it afterward. It records the actual application, with offline synthetic narration and English captions. No video is uploaded by these scripts. The recording must be reviewed before publication.

## Security and scope

This is a single-process, trusted local demo. The HTTP server binds only to loopback, checks Host and Origin for browser writes, caps input size, and serves a fixed file allowlist. The local reviewer key is controlled by the process. Do not expose this server publicly: it has no production authentication, registry authorization, durable database, reconciliation worker, multi-user approval, or independent audit.

The contract cannot detect the same real-world credit reidentified under another namespace, unreported registry events, forged source records, double issuance across projects, national accounting conflicts, or additionality/permanence failures. A production integration needs authorized registry data, evidence signatures, freshness policy, ownership reconciliation, canonical identifiers, durable concurrency controls and a reviewed deployment model.

## Primary sources and submission

Official references: [ClimateChain Overview](https://ieee-climatechain-hack.devpost.com/), [Rules](https://ieee-climatechain-hack.devpost.com/rules), and [Verra's historical retirement/token notice](https://verra.org/verra-addresses-crypto-instruments-and-tokens/). The private review package contains the detailed rules audit, submission draft and readiness record. This source repository does not claim an accepted entry. Original implementation began on 2026-10-18. No prior project code was copied. Dependencies are third-party libraries under their respective licenses.

