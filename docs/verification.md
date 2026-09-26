# Reproducible verification record

No deployment, network write, finalized read or published site is asserted until its exact observed values are entered below.

| Item | Observed value |
| --- | --- |
| Source commit | https://github.com/haris4587/OpenSeat/commit/d7a574ca6f7bdbb712886c5b81c25aad8d9cfb47 (initial source; later documentation updates may advance it) |
| Studio environment | `studio-dev`, chain ID 61997 |
| Contract address | Pending deployment |
| Deploy transaction and explorer URL | Pending deployment |
| Application transaction(s) | Pending end-to-end run |
| Review and challenge transactions | Pending end-to-end run |
| Finalize transaction | Pending review window and future beacon |
| Finalized `get_config` / `get_applicants` / `get_history` / `get_winners` | Pending deployment |
| Published website | https://openseat-haris4587.itzanza2.chatgpt.site — production deployment `appgdep_6ab800afb4848191a9e4bcbe3e9146ff`, succeeded 2026-09-26T17:29:29Z; public access |
| Published Site source | `72a40082947591142c439f57067309bfc84c083d` (Site source mirror, static build without contract address) |

## Verification commands

1. `npm ci && npm test && npm run build`.
2. `python -m venv .venv && .venv/bin/pip install pytest genlayer-test==0.29.2 && .venv/bin/python -m pytest tests -q`.
3. Deploy `contracts/OpenSeat.py` in Studio-dev and retain the deployment hash and contract address from its success receipt. Verify both the consensus status and execution result. Set `VITE_CONTRACT_ADDRESS` to **that exact address** and rebuild before publishing.
4. Submit a pinned public UTF-8 GitHub evidence URL whose byte hash matches the frontend, await finalization and check `get_applicants` via `LATEST_FINAL`.
5. After the deadline, have a different wallet review the application; after review end and beacon availability, finalize from any wallet. Compare winners against the documented SHA-256 ranking and inspect every transaction in the network explorer.
6. Record actual links and decoded finalized read values here; no copied illustration is a network result.

## Environment verification note

Native Direct Mode was attempted with `genlayer-test==0.29.2`. Its runtime artifact download returned HTTP 404 for `genvm-universal.tar.xz` at the pinned `v0.3.0-rc7` release, before the contract executed. The native smoke test is opt-in (`GENLAYER_DIRECT=1`) and is not represented as passing. The 7 deterministic stand-in tests and 3 frontend tests are separate.

Studio-dev connectivity check: a direct JSON-RPC `eth_chainId` request to `https://studio-dev.genlayer.com/api` timed out after 8 seconds, and the Studio browser navigation failed after a 300-second timeout. No GenLayer deployment or live transaction was submitted.
