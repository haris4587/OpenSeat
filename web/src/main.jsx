import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ADDRESS, EXPLORER, read, write, hashText, pinnedURL, shorten } from './chain';
import './style.css';

function App() {
  const [wallet, setWallet] = useState('');
  const [config, setConfig] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [history, setHistory] = useState([]);
  const [url, setUrl] = useState('');
  const [digest, setDigest] = useState('');
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('');
  const [tx, setTx] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('applications');
  async function refresh() {
    if (!ADDRESS) return;
    try {
      const [c, a, w, h] = await Promise.all([read('get_config'), read('get_applicants'), read('get_winners'), read('get_history')]);
      setConfig(c); setApplicants(a); setWinners(w); setHistory(h.map(parse => typeof parse === 'string' ? JSON.parse(parse) : parse)); setError('');
    } catch (e) { setError(`Finalized read failed: ${e.message}`); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!window.ethereum) return;
    const changed = xs => setWallet(xs[0] || '');
    window.ethereum.on?.('accountsChanged', changed);
    return () => window.ethereum.removeListener?.('accountsChanged', changed);
  }, []);
  async function connect() {
    try { if (!window.ethereum) throw new Error('Install an EIP-1193 wallet such as MetaMask.');
      const xs = await window.ethereum.request({ method: 'eth_requestAccounts' }); setWallet(xs[0] || ''); setError('');
    } catch (e) { setError(e.message); }
  }
  async function submit(name, args = []) {
    if (!wallet) { await connect(); return; }
    setBusy(true); setError(''); setTx(''); setStatus('Preparing transaction…');
    try { await write(wallet, name, args, (s, h) => { setStatus(s); if (h) setTx(h); }); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function inspectEvidence() {
    setError('');
    try {
      if (!pinnedURL(url)) throw new Error('Use a raw.githubusercontent.com URL pinned to a full 40-character commit.');
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Evidence request returned ${response.status}`);
      const body = await response.arrayBuffer();
      if (body.byteLength > 16384) throw new Error('Evidence exceeds 16 KiB.');
      const bytes = new Uint8Array(body);
      const result = await crypto.subtle.digest('SHA-256', bytes);
      setDigest(Array.from(new Uint8Array(result), b => b.toString(16).padStart(2, '0')).join(''));
    } catch (e) { setDigest(''); setError(e.message); }
  }
  const now = Date.now() / 1000;
  const stage = !config ? 'Awaiting deployment' : config.finalized ? 'Allocation final' : now < config.deadline ? 'Applications open' : now < config.review_end ? 'Evidence review' : 'Ready for draw';
  const mine = applicants.find(a => a.wallet.toLowerCase() === wallet.toLowerCase());
  const available = config ? Math.max(0, config.seats - winners.length) : 0;
  return <div className="shell">
    <header><div className="brand"><span className="mark">O<span>✦</span></span><span>OpenSeat</span></div><div className="header-right"><span className="network">◉ Studio devnet</span><button className="wallet" onClick={connect}>{wallet ? shorten(wallet) : 'Connect wallet ↗'}</button></div></header>
    <main>
      <section className="mast"><div><div className="eyebrow">THE COHORT DESK <span className="rule"/> EVIDENCE-LED ALLOCATION</div><h1>Fair places.<br/><em>Verified work.</em></h1><p>One application per wallet. Public work checked by GenLayer validators. A fixed future beacon draws seats after review closes.</p></div><div className="mast-aside"><span className="aside-label">CURRENT ROUND</span><strong>{config?.title || 'No live round connected'}</strong><span className="stage">{stage}</span>{ADDRESS && <small>Contract <a href={`${EXPLORER}/address/${ADDRESS}`} target="_blank" rel="noreferrer">{shorten(ADDRESS)} ↗</a></small>}</div></section>
      {!ADDRESS && <div className="notice"><b>Deployment pending</b><span>The site is ready for a contract address. No applications, outcomes, or live data are being shown.</span></div>}
      {error && <div className="error" role="alert">{error}</div>}
      {status && <div className="status" role="status">{status} {tx && <a href={`${EXPLORER}/tx/${tx}`} target="_blank" rel="noreferrer">Inspect transaction ↗</a>}</div>}
      <section className="metrics"><div><span>SEATS</span><b>{config ? config.seats : '—'}</b><small>Hard cap</small></div><div><span>APPLICATIONS</span><b>{config ? applicants.length : '—'}</b><small>Up to 64 wallets</small></div><div><span>ELIGIBLE</span><b>{config ? applicants.filter(a => a.status === 'eligible').length : '—'}</b><small>Reviewed evidence</small></div><div><span>ALLOCATED</span><b>{config?.finalized ? winners.length : '—'}</b><small>{config?.finalized ? `${available} unfilled` : 'After beacon draw'}</small></div></section>
      <div className="workspace"><section className="panel form-panel"><div className="panel-head"><div><span className="overline">01 / APPLY</span><h2>Put your work forward</h2></div><span className="tiny">NO DEPOSIT</span></div><p className="intro">Commit a plain-text public file from an immutable GitHub commit. The exact bytes are hashed before submission and fetched again during review.</p><label htmlFor="evidence">Pinned raw evidence URL</label><input id="evidence" value={url} onChange={e => { setUrl(e.target.value); setDigest(''); }} placeholder="https://raw.githubusercontent.com/owner/repo/<40-char-sha>/evidence.md"/><button className="secondary" onClick={inspectEvidence} disabled={!url}>Fetch & hash evidence</button><div className="hashbox"><span>SHA-256 COMMITMENT</span><code>{digest || 'Fetch evidence to calculate the exact byte hash'}</code></div><button className="primary" disabled={!digest || busy || !wallet || !config || now >= config.deadline || !!mine} onClick={() => submit('apply', [url, digest])}>{mine ? 'Application already submitted' : 'Submit application ↗'}</button>{!wallet && <small className="hint">Connect your wallet to submit.</small>}{mine && <p className="mine">Your application: <b>{mine.status}</b> · {shorten(mine.sha256)}</p>}</section>
      <section className="panel review-panel"><div className="panel-head"><div><span className="overline">02 / REVIEW</span><h2>Open decisions</h2></div><button className="textbutton" onClick={refresh} disabled={!ADDRESS}>Refresh ↻</button></div><div className="tabs"><button className={tab === 'applications' ? 'active' : ''} onClick={() => setTab('applications')}>Applicants <span>{config ? applicants.length : '—'}</span></button><button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Decision log <span>{config ? history.length : '—'}</span></button></div>{tab === 'applications' ? <div className="list">{applicants.length ? applicants.map(a => <div className="row" key={a.wallet}><div><b>{shorten(a.wallet)}</b><a href={a.url} target="_blank" rel="noreferrer">View committed evidence ↗</a></div><span className={`pill ${a.status}`}>{a.status}</span></div>) : <div className="empty">{ADDRESS ? 'No finalized applications yet.' : 'Applications will appear after contract deployment.'}</div>}</div> : <div className="list">{history.length ? history.map((h, i) => <div className="row" key={i}><div><b>{h.action.replaceAll('_', ' ')} · {shorten(h.wallet)}</b><small>{new Date(h.at * 1000).toLocaleString()}</small></div><span className={`pill ${h.status}`}>{h.status}</span></div>) : <div className="empty">No finalized decisions yet.</div>}</div>}
      <div className="review-actions"><label htmlFor="selected">Applicant wallet to review or challenge</label><input id="selected" value={selected} onChange={e => setSelected(e.target.value)} placeholder="0x…"/><div className="action-grid"><button className="secondary" disabled={busy || !config || now < config.deadline || now >= config.review_end || !applicants.some(a => a.wallet.toLowerCase() === selected.toLowerCase() && a.reviews === 0)} onClick={() => submit('review', [selected])}>Review evidence</button><button className="secondary" disabled={busy || !config || now < config.deadline || now >= config.review_end || !applicants.some(a => a.wallet.toLowerCase() === selected.toLowerCase() && a.reviews > 0)} onClick={() => submit('challenge', [selected])}>Challenge decision</button></div></div></section></div>
      <section className="allocation"><div><span className="overline">03 / ALLOCATE</span><h2>The draw happens<br/><em>after the window closes.</em></h2><p>Any wallet may finalize. The beacon round is fixed by the review deadline. Eligible wallets are ranked by SHA-256 of the beacon value and wallet address; the first {config?.seats ?? 'N'} receive seats.</p><button className="primary light" disabled={busy || !config || config.finalized || now < Number(config.review_end) + 150} onClick={() => submit('finalize')}>Finalize allocation ↗</button></div><div className="allocation-details"><div><span>APPLICATION DEADLINE</span><strong>{config ? new Date(config.deadline * 1000).toLocaleString() : '—'}</strong></div><div><span>REVIEW CLOSES</span><strong>{config ? new Date(config.review_end * 1000).toLocaleString() : '—'}</strong></div><div><span>BEACON ROUND</span><strong>{config?.beacon_round || '—'}</strong></div><div><span>WINNERS</span><strong>{config?.finalized ? (winners.length ? winners.map(shorten).join(' · ') : 'No eligible applicants') : 'Pending finalization'}</strong></div></div></section>
      <footer><span>OpenSeat / Independent review, deterministic seats.</span><span>{config ? `Rules SHA-256: ${shorten(config.rules_sha256)}` : 'Contract deployment pending'} · <a href="https://github.com/haris4587/OpenSeat" target="_blank" rel="noreferrer">Source & verification ↗</a></span></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
