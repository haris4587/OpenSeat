# Reproducible verification record

The values below are directly observed. Pending stages are labeled pending.

| Item | Observed value |
| --- | --- |
| Source commit | https://github.com/haris4587/OpenSeat/commit/d7a574ca6f7bdbb712886c5b81c25aad8d9cfb47 (pinned evidence source; active project source is the latest main revision) |
| Studio environment | `studionet`, chain ID 61999 |
| Contract address | `0xf70eAf992565Aa334526E82Da06f6d99E4Ca3366` |
| Deploy transaction and explorer URL | `0xf70eAf992565Aa334526E82Da06f6d99E4Ca3366` |
| Application transaction(s) | [0x6c95…78f1](https://explorer-studio.genlayer.com/tx/0x6c95da5401e0018bc2ed8eb1c08282ae225e5f593cb1e7db4340f1cd715078f1), FINALIZED; applicant `0xb06aD272b569581Ce52cc4Cc2476188c8EFac6c0`, pinned README commit `11a1b47…`, digest `a688043…f8784` |
| Review and challenge transactions | Pending end-to-end run |
| Finalize transaction | Pending review window and future beacon |
| Finalized `get_config` / `get_applicants` / `get_history` / `get_winners` | `0xf70eAf992565Aa334526E82Da06f6d99E4Ca3366` |
| Published website | https://openseat-haris4587.itzanza2.chatgpt.site — production update to corrected contract pending; previous public build connected to superseded first pilot |
| Published Site source | pending republish |

## Verification commands

1. `npm ci && npm test && npm run build`.
2. `python -m venv .venv && .venv/bin/pip install pytest genlayer-test==0.29.2 && .venv/bin/python -m pytest tests -q`.
3. Deploy `contracts/OpenSeat.py` in Studio and retain the deployment hash and contract address from its success receipt. Verify both the consensus status and execution result. Set `VITE_CONTRACT_ADDRESS` to the recorded address and rebuild before publishing.
4. Submit a pinned public UTF-8 GitHub evidence URL whose byte hash matches the frontend, await finalization and check `get_applicants` via `LATEST_FINAL`.
5. After the deadline, have a different wallet review the application; after review end and beacon availability, finalize from any wallet. Compare winners against the documented SHA-256 ranking and inspect every transaction in the network explorer.
6. Record actual links and decoded finalized read values here; no copied illustration is a network result.

## Environment verification note

Native Direct Mode was attempted with `genlayer-test==0.29.2`. Its runtime artifact download returned HTTP 404 for `genvm-universal.tar.xz` at the pinned `v0.3.0-rc7` release, before the contract executed. The native smoke test is opt-in (`GENLAYER_DIRECT=1`) and is not represented as passing. The 7 deterministic stand-in tests and 7 frontend tests are separate.

The Studio-dev preview was inaccessible. Stable Studionet `https://studio.genlayer.com/api` returned chain ID 61999. The first deployment attempt [0x77f9…f3c](https://explorer-studio.genlayer.com/tx/0x77f9f6009dafa9c94dcd2139fab8b545bc515e91f7d0189006b9c4e372758f3c) finalized with execution error (`TreeMap <- dict`). Source was corrected to initialize `TreeMap()` and the second deployment succeeded. The stable GenLayerJS 1.1.8 `LATEST_FINAL` call returned the configuration above over Studionet RPC.

The first pilot at [0x062C…2eCe](https://explorer-studio.genlayer.com/address/0x062C51781a0Ab04899FA39C024E47c1d6Bd82eCe) accepted an application, but [review 0xb2b3…9f31](https://explorer-studio.genlayer.com/tx/0xb2b39d9d7088760260c4b91a343a29ef817d4630374028501dcd51f0761e9f31) finalized with a contract execution error: Studio decoded its `Address` parameter as an integer, causing a `TreeMap[Address]` comparison assertion. The corrected source takes a hex `str` at both public review and challenge boundaries and converts it with `Address(wallet)`. A fresh immutable pilot was deployed; the old pilot is excluded from live site reads.
