# OpenSeat project evidence

OpenSeat is an open-source GenLayer project for allocating a limited number of hackathon, grant, or accelerator seats. The Python Intelligent Contract fetches pinned GitHub evidence, checks its exact SHA-256, and asks validators to judge immutable eligibility rules; deterministic deadline and capacity checks and a future drand round determine seats.

Python GenLayer Intelligent Contract source: https://github.com/haris4587/OpenSeat/blob/cea77b9947f245e5cd6b6f6c3b81bd65d967165a/contracts/OpenSeat.py

User-facing React/Vite frontend source: https://github.com/haris4587/OpenSeat/blob/cea77b9947f245e5cd6b6f6c3b81bd65d967165a/web/src/main.jsx

GenLayer SDK and finalized-state integration source: https://github.com/haris4587/OpenSeat/blob/cea77b9947f245e5cd6b6f6c3b81bd65d967165a/web/src/chain.js

Published user-facing frontend: https://openseat-haris4587.itzanza2.chatgpt.site

Repository: https://github.com/haris4587/OpenSeat

The contract and frontend are separate working parts. The contract enforces one application per wallet, fixed timing, bounded challenges and capacity; the frontend offers byte hashing, wallet-backed writes, transaction links and finalized reads. Source and tests are publicly inspectable at the links above.
