import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
export const ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const EXPLORER = 'https://explorer-studio.genlayer.com';
export const readClient = createClient({ chain: studionet });
export const parseJSON = value => typeof value === 'string' ? JSON.parse(value) : value;
export const shorten = s => s ? `${s.slice(0, 7)}…${s.slice(-5)}` : '';
export function receiptOK(receipt) { return (receipt.statusName === 'FINALIZED' || receipt.status === 7) && (receipt.txExecutionResultName === 'FINISHED_WITH_RETURN' || receipt.consensus_data?.leader_receipt?.[0]?.execution_result === 'SUCCESS'); }
export async function read(name) {
  if (!ADDRESS) throw new Error('Contract deployment is pending. Live reads are unavailable.');
  return parseJSON(await readClient.readContract({ address: ADDRESS, functionName: name, args: [], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }));
}
export async function write(wallet, name, args, onStatus) {
  if (!ADDRESS) throw new Error('Contract deployment is pending. Writes are unavailable.');
  const client = createClient({ chain: studionet, account: wallet, provider: window.ethereum });
  await client.connect('studionet');
  const call = { address: ADDRESS, functionName: name, args };
  onStatus('Requesting wallet signature…');
  const hash = await client.writeContract({ ...call, value: 0n });
  onStatus(`Submitted ${hash}. Waiting for network finalization…`, hash);
  try {
    const receipt = await client.waitForTransactionReceipt({ hash, status: 'FINALIZED' });
    if (!receiptOK(receipt)) throw new Error(`Transaction ${receipt.statusName || receipt.status} / ${receipt.txExecutionResultName || receipt.consensus_data?.leader_receipt?.[0]?.execution_result || 'unknown execution'}`);
    onStatus('Finalized successfully.', hash);
    return hash;
  } catch (e) {
    onStatus(`Transaction ${hash} needs inspection: ${e.message}`, hash);
    throw e;
  }
}
export async function hashText(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
export const pinnedURL = url => /^https:\/\/raw\.githubusercontent\.com\/[\w.-]+\/[\w.-]+\/[a-fA-F0-9]{40}\/[\w./-]{1,240}$/.test(url) && !url.includes('..');
