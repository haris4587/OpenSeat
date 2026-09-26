# OpenSeat

An evidence-led, capacity-limited cohort allocation contract and public app for GenLayer. Applicants commit immutable public GitHub evidence; validators independently fetch the exact bytes and judge eligibility against locked rules. After the review window, a future drand beacon ranks eligible wallets for the limited seats. **No applicant bond or organizer escrow** is held. GenLayer network transaction fees may still apply.

## Status

- Contract: `contracts/OpenSeat.py`
- Network target: Studio development preview, chain ID **61997** (GenLayerJS `2.0.0-rc.1`). This is a temporary test environment.
- Contract address: **pending verified deployment**. The app deliberately shows no live data until `VITE_CONTRACT_ADDRESS` is set.
- Source revision, transaction IDs, explorer reads and site URL: recorded only after verified deployment/publication in `docs/verification.md`.

## Run

```sh
npm ci
npm run dev
npm test
npm run build
python -m venv .venv
.venv/bin/pip install pytest genlayer-test==0.29.2
.venv/bin/python -m pytest tests -q
```

For a deployed contract, set `VITE_CONTRACT_ADDRESS=0x...` when building and serve `dist/`. The browser needs an EIP-1193 wallet on Studio devnet. The app uses `LATEST_FINAL` reads, estimates fees for each write, retains the submitted transaction hash through finalization, and checks both status and execution outcome. `Connect wallet` does not submit a transaction.

## Round creation and use

1. In [Studio dev](https://studio-dev.genlayer.com/), load `contracts/OpenSeat.py`; deploy with `title`, `rules`, Unix-second `deadline`, Unix-second `review_end`, and `seats`. Constructor bounds: deadline 10 minutes–90 days after deployment, review end 10 minutes–14 days after deadline, 1–32 seats. The organizer wallet and SHA-256 of the exact rule text are committed on deployment. Rules cannot be edited.
2. An applicant produces a UTF-8 plain-text evidence file in a public GitHub repository, commits it, copies its `raw.githubusercontent.com/owner/repo/<full-40-character-commit>/path` URL, and uses the app to fetch/hash its exact bytes. Evidence must fit 16 KiB. Submit `apply(url, sha256)` before the deadline. One entry per wallet; the organizer cannot apply. At most 64 wallets.
3. From deadline until review end, **any wallet** can call `review(wallet)` once for each application. The contract re-fetches and hashes the evidence, and GenLayer validators independently judge the written rules. A changed, oversized or unavailable page fails closed. The applicant and organizer may each call `challenge(wallet)` once after an initial review; no other wallet may challenge, and neither side supplies an overriding verdict. Each recheck appends a new decision; the old one remains visible.
4. At least 120 seconds after review end, any wallet calls `finalize()`. The contract fetches the *fixed* later beacon round, validates its round and SHA-256(signature) relation, requires exact consensus on randomness, and ranks only eligible applicants by `SHA256(randomness_bytes || lowercase_wallet_address)`, with wallet address as tie break. The first `seats` win. This final action is one-time. An unreviewed application has pending status and does not win.
5. Read `get_config`, `get_applicants`, `get_history`, `get_winners` at `LATEST_FINAL`; verify source hash and transaction outcomes in the explorer.

## Timing and fairness

The beacon is drand's default chained mainnet, chain hash `8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce`, genesis Unix time 1595431050, period 30 seconds. The chosen round is the first round at or after `review_end + 120`; its index is derived by the contract, never supplied by a caller. **Applicants cannot know its output during application or challenge.** The organizer cannot reorder entries, select a beacon round, change rules or count, or decide eligibility by administrative write. Submission order does not determine a seat.

A single wallet is not a unique person; Sybil wallets can increase lottery odds. The immutable evidence file can contain misleading claims, and GitHub can become unavailable. Drand's response is checked for internally consistent signature hash and independent validator retrieval, but **the contract does not verify the BLS signature**; the beacon service and its chain are an explicit trust dependency. The fixed round is public once published; late or censored review transactions and unavailable evidence can still affect the eligible set. Protocol consensus finality and application review deadlines are distinct. Use conservative, public eligibility rules and leave enough review time for network settlement.

## Architecture / security

- **Deterministic:** creator identity, rule hash, deadlines, capacities, one entry per wallet, challenge quotas, immutable evidence commitments, final ranking, write permissions, finalized flag. No payable methods, escrow or refunds are necessary beyond normal network fee settlement.
- **Consensus:** for each review the leader fetches one allowlisted immutable GitHub raw URL, checks HTTP 200, 16 KiB bound and SHA-256 exact bytes; an LLM evaluates only the locked rules against untrusted evidence. Validators repeat the fetch and independent semantic judgment, comparing the meaningful status enum. The prompt tells models to ignore evidence instructions. On disagreement the transaction fails or rotates without updating state.
- **Failure:** HTTP errors, oversized/changed content or model malformation return unavailable/changed/ineligible as appropriate. An explicit bounded challenge gives one repeat per side. Review transactions with validator disagreement leave the previous record intact. No application funds can strand.
- **Read/display:** the UI never synthesizes sample outcomes. It labels its unconfigured state and displays only finalized contract reads. Hash is computed from the actual response bytes, not from copied text. The browser uses a wallet provider for writes. App errors preserve a known transaction hash and do not silently resubmit.

## Documentation

- [Architecture and threat model](docs/architecture.md)
- [Reproducible verification](docs/verification.md)
- [Official GenLayer references](docs/references.md)

The Python tests are deterministic boundary tests with a minimal GenLayer runtime stand-in. They are **not** proof of GenVM deployment or multi-validator consensus. A verified Studio end-to-end trace is separately required and recorded in `docs/verification.md` when available.
