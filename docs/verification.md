# Reproducible verification record

The values below are directly observed. Pending stages are labeled pending.

| Item | Observed value |
| --- | --- |
| Source commit | https://github.com/haris4587/OpenSeat/commit/23f479d71d503d6a4480f6c006b04687f45430e1 (includes pinned evidence; code is from parent `cea77b9947f245e5cd6b6f6c3b81bd65d967165a`) |
| Studio environment | `studionet`, chain ID 61999 |
| Contract address | `0x56bEDc6836B2d8809ca9134b2d66b5CBab291ae1` |
| Deploy transaction and explorer URL | [0xa317…e4e5](https://explorer-studio.genlayer.com/tx/0xa317af488f0d25e622c07c8b9a515e420587d07ab95c2947647edfa9db08e4e5), FINALIZED / SUCCESS |
| Application transaction(s) | [0xea6a…e854](https://explorer-studio.genlayer.com/tx/0xea6a77677a55d4184c0daa76c1d3e08a63bc4d129e72f8b76137b8a85f09e854), FINALIZED; applicant `0x4F125FBBcAfC171f3B9341aa16A6b1A70b00848e`, pinned evidence commit `23f479d…`, digest `7fc62…d2b33` |
| Review and challenge transactions | [Review 0x155e…807f](https://explorer-studio.genlayer.com/tx/0x155e8f2368f2262b03bc6051104645841835383246612178a2bf2ba6d850807f), FINALIZED / SUCCESS / Accepted, five initial validators, equivalence output `"eligible"`. No challenge was submitted. |
| Finalize transaction | [0x2e5a…6a4f](https://explorer-studio.genlayer.com/tx/0x2e5abf29aad833f31102a2d6a748a64897d2581a034814f8b8659db092db6a4f), submitted by Studio account `0x20fa9d98c9D0a45F059034b379082D73b414aB7a`, FINALIZED / SUCCESS / Accepted at 2026-09-27 18:39:19 UTC. Equivalence output is beacon seed `43978d0c9e99c44986adc54a825fb810f286f366abffdd8f51bdc0b3c5e0b19e`. |
| Finalized `get_config` / `get_applicants` / `get_history` / `get_winners` | `get_config`: organizer `0xb06aD272b569581Ce52cc4Cc2476188c8EFac6c0`, title `OpenSeat Source Links Pilot`, rules SHA256 `2a5aced86efcbeb987d9a7c0cb6f4f26610871ab2d97240085867fe234aa72c1`, deadline `1790448856`, review end `1790449516`, one seat, beacon round `6500621`, finalized true. `get_applicants`: one eligible record after one review, pinned proof at commit `23f479d…`. `get_history`: apply, review, finalize. `get_winners`: `0x4F125FBBcAfC171f3B9341aa16A6b1A70b00848e`. |
| Published website | https://openseat-haris4587.itzanza2.chatgpt.site — production deployment `appgdep_6ab813d370c0819196db534e69add30b` succeeded 2026-09-26T18:50:13Z, public; refreshed finalized reads on 2026-09-27 displayed allocation final, one eligible applicant and one allocated seat. |
| Published Site source | `7eaa3ea2c21da3e72bbac2ce9dc61832e95f0cb4` (Site mirror), version 6 |

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

The third pilot at [0x91ad…BF04](https://explorer-studio.genlayer.com/address/0x91adfBe7648f8C478140b9Cd6bB110139712BF04) produced a finalized [ineligible review 0xf3ef…251a](https://explorer-studio.genlayer.com/tx/0xf3efdd5aaf7c6e8fb63b653a6010602378b450e94b3c90c4432f7a5a5ae0251a) because its pinned README did not explicitly link the contract and frontend source under the locked rule. It is a separate pilot excluded from the live site. The source-linked proof now includes exact source links and is committed at an immutable GitHub revision.

The current source-linked pilot at `0x56bEDc…91ae1` was reviewed after its deadline. [Transaction 0x155e…807f](https://explorer-studio.genlayer.com/tx/0x155e8f2368f2262b03bc6051104645841835383246612178a2bf2ba6d850807f) finalized successfully at 2026-09-26 18:55:18 UTC; the explorer shows Accepted consensus and an `eligible` equivalence output. [Finalization 0x2e5a…6a4f](https://explorer-studio.genlayer.com/tx/0x2e5abf29aad833f31102a2d6a748a64897d2581a034814f8b8659db092db6a4f) finalized successfully the next day. The public app's finalized reads show the applicant as the sole winner. With seed `43978d0c9e99c44986adc54a825fb810f286f366abffdd8f51bdc0b3c5e0b19e`, the ranking digest `SHA256(seed_bytes || lowercase_wallet_address)` for `0x4F125FBBcAfC171f3B9341aa16A6b1A70b00848e` is `011f150064604074f2c21da8c8f6745b03d5a450e0becc16cae2dd3174597c41`.
