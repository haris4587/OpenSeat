# Reproducible verification record

No deployment, network write, finalized read or published site is asserted until its exact observed values are entered below.

| Item | Observed value |
| --- | --- |
| Source commit | Pending push |
| Studio environment | `studio-dev`, chain ID 61997 |
| Contract address | Pending deployment |
| Deploy transaction and explorer URL | Pending deployment |
| Application transaction(s) | Pending end-to-end run |
| Review and challenge transactions | Pending end-to-end run |
| Finalize transaction | Pending review window and future beacon |
| Finalized `get_config` / `get_applicants` / `get_history` / `get_winners` | Pending deployment |
| Published website | Pending publication |

## Verification commands

1. `npm ci && npm test && npm run build`.
2. `python -m venv .venv && .venv/bin/pip install pytest genlayer-test==0.29.2 && .venv/bin/python -m pytest tests -q`.
3. Deploy `contracts/OpenSeat.py` in Studio-dev and retain the deployment hash and contract address from its success receipt. Verify both the consensus status and execution result. Set `VITE_CONTRACT_ADDRESS` to **that exact address** and rebuild before publishing.
4. Submit a pinned public UTF-8 GitHub evidence URL whose byte hash matches the frontend, await finalization and check `get_applicants` via `LATEST_FINAL`.
5. After the deadline, have a different wallet review the application; after review end and beacon availability, finalize from any wallet. Compare winners against the documented SHA-256 ranking and inspect every transaction in the network explorer.
6. Record actual links and decoded finalized read values here; no copied illustration is a network result.
