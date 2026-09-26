import { createClient, isSuccessful } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
export const ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const EXPLORER = 'https://explorer-studio-dev.genlayer.com';
export const readClient = createClient({ chain: studioDevnet });
export const parseJSON = value => typeof value === 'string' ? JSON.parse(value) : value;
export const shorten = s => s ? `${s.slice(0, 7)}…${s.slice(-5)}` : '';
export function receiptOK(receipt) { return isSuccessful(receipt); }
export async function read(name) {
  if (!ADDRESS) throw new Error('Contract deployment is pending. Live reads are unavailable.');
  return parseJSON(await readClient.readContract({ address: ADDRESS, functionName: name, args: [], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }));
}
export async function write(wallet, name, args, onStatus) {
  if (!ADDRESS) throw new Error('Contract deployment is pending. Writes are unavailable.');
  const client = createClient({ chain: studioDevnet, account: wallet, provider: window.ethereum });
  await client.connect('studioDevnet');
  const call = { address: ADDRESS, functionName: name, args };
  onStatus('Estimating network fee…');
  const estimate = await client.estimateTransactionFeesForWrite(call);
  const hash = await client.writeContract({ ...call, fees: { distribution: estimate.distribution, feeValue: estimate.feeValue } });
  onStatus(`Submitted ${hash}. Waiting for network finalization…`, hash);
  try {
    const receipt = await client.waitForFinalization({ hash });
    if (!receiptOK(receipt)) throw new Error(`Transaction ${receipt.statusName} / ${receipt.txExecutionResultName}`);
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
