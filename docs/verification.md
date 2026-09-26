# Reproducible verification record

The values below are directly observed. Pending stages are labeled pending.

| Item | Observed value |
| --- | --- |
| Source commit | https://github.com/haris4587/OpenSeat/commit/82d246def8be9649da3d8916808d898ddc9c51fc (active project source; pinned evidence uses earlier revision 11a1b47021991209cb16883b20e8bd5f11b20ff7) |
| Studio environment | `studionet`, chain ID 61999 |
| Contract address | `0x91adfBe7648f8C478140b9Cd6bB110139712BF04` |
| Deploy transaction and explorer URL | [0xfa09…508d](https://explorer-studio.genlayer.com/tx/0xfa0923258fb29cc6dffedc79f47c9abf0b9c6798182dd1e3b5961b944546508d), FINALIZED / SUCCESS |
| Application transaction(s) | [0x534e…3086](https://explorer-studio.genlayer.com/tx/0x534ec644cf593655a2ecccd720f512ed5fd99c9a066bf6c00bc60eb5885a3086), FINALIZED; applicant `0xb06aD272b569581Ce52cc4Cc2476188c8EFac6c0`, pinned README commit `11a1b47…`, digest `a688043…f8784` |
| Review and challenge transactions | Pending end-to-end run |
| Finalize transaction | Pending review window and future beacon |
| Finalized `get_config` / `get_applicants` / `get_history` / `get_winners` | `get_config`: organizer `0x4F125FBBcAfC171f3B9341aa16A6b1A70b00848e`, title `OpenSeat Verified Pilot`, rules SHA256 `2a5aced86efcbeb987d9a7c0cb6f4f26610871ab2d97240085867fe234aa72c1`, deadline `1790448036`, review end `1790448696`, one seat, beacon round `6500594`, finalized false. `get_applicants`: one pending record, zero reviews, exact pinned README URL and digest above. `get_history`: one apply entry. `get_winners`: empty. |
| Published website | https://openseat-haris4587.itzanza2.chatgpt.site — production deployment `appgdep_6ab80fce51f08191b0d710390feb1a34` succeeded 2026-09-26T18:33:01Z; public; browser confirmed title, address, one application from finalized reads |
| Published Site source | `0596749baca029ee0879d8775f6c669c1fe1d0df` (Site mirror), version 4 |

## Verification commands

1. `npm ci && npm test && npm run build`.
2. `python -m venv .venv && .venv/bin/pip install pytest genlayer-test==0.29.2 && .venv/bin/python -m pytest tests -q`.
3. Deploy `contracts/OpenSeat.py` in Studio and retain the deployment hash and contract address from its success receipt. Verify both the consensus status and execution result. Set `VITE_CONTRACT_ADDRESS` to the recorded address and rebuild before publishing.
4. Submit a pinned public UTF-8 GitHub evidence URL whose byte hash matches the frontend, await finalization and check `get_applicants` via `LATEST_FINAL`.
5. After the deadline, have a different wallet review the application; after review end and beacon availability, finalize from any wallet. Compare winners against the documented SHA-256 ranking and inspect every transaction in the network explorer.
6. Record actual links and decoded finalized read values here; no copied illustration is a network result.

## Environment verification note

Native Direct Mode was attempted with `genlayer-test==0.29.2`. Its runtime artifact download returned HTTP 404 for `genvm-universal.tar.xz` at the pinned `v0.3.0-rc7` release, before the contract executed. The native smoke test is opt-in (`GENLAYER_DIRECT=1`) and is not represented as passing. The 8 deterministic stand-in tests and 7 frontend tests are separate.

The Studio-dev preview was inaccessible. Stable Studionet `https://studio.genlayer.com/api` returned chain ID 61999. The first deployment attempt [0x77f9…f3c](https://explorer-studio.genlayer.com/tx/0x77f9f6009dafa9c94dcd2139fab8b545bc515e91f7d0189006b9c4e372758f3c) finalized with execution error (`TreeMap <- dict`). Source was corrected to initialize `TreeMap()` and the second deployment succeeded, followed by the diagnostic revisions detailed below. The stable GenLayerJS 1.1.8 `LATEST_FINAL` call returned the configuration above over Studionet RPC.

The first pilot at [0x062C…2eCe](https://explorer-studio.genlayer.com/address/0x062C51781a0Ab04899FA39C024E47c1d6Bd82eCe) accepted an application, but [review 0xb2b3…9f31](https://explorer-studio.genlayer.com/tx/0xb2b39d9d7088760260c4b91a343a29ef817d4630374028501dcd51f0761e9f31) finalized with a contract execution error: Studio decoded its `Address` parameter as an integer, causing a `TreeMap[Address]` comparison assertion. The corrected source takes a hex `str` at both public review and challenge boundaries and converts it with `Address(wallet)`. A fresh immutable pilot was deployed; the old pilot is excluded from live site reads.

The second pilot at [0xf70e…BF04](https://explorer-studio.genlayer.com/address/0xf70eAf992565Aa334526E82Da06f6d99E4Ca3366) applied and reviewed, but [review 0x2266…497b](https://explorer-studio.genlayer.com/tx/0x2266b45d31512bb9615e4e75516a9c251bc8ffb242a0a01e070d12018192497b) and [organizer challenge 0xc1c8…1c95](https://explorer-studio.genlayer.com/tx/0xc1c8ebde12fc3ff243c7444e21005646e01ba47caaf1be4d51f6f3917e221c95) both returned `unavailable`. A diagnostic GenVM call [0x6fd6…a178](https://explorer-studio.genlayer.com/tx/0x6fd6cc048fccee04cfdc7df74e50ba51f61e61770e79e557d171258889e3a178) showed the runtime `Response` has no `status_code`. A follow-up [0x0277…eb26](https://explorer-studio.genlayer.com/tx/0x02772f920513c682a3b47fee181c6b7875841f792c93758ace284bcc45d4eb26) confirmed its fields `body`, `headers`, `status` and the exact expected 6,638-byte SHA-256. A model probe [0xf8fd…9a0d](https://explorer-studio.genlayer.com/tx/0xf8fdd8607f25b1c8bf82344a8233460118f00deb544013421489b6c7cace9a0d) returned a dict with `eligible: true`. The final source uses `response.status` for evidence and beacon fetches. These probes are diagnostics, not claims that the final pilot already has an eligible review.
