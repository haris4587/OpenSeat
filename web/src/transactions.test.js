// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach } from 'vitest';
const mock = vi.hoisted(() => ({
  readContract: vi.fn(), connect: vi.fn(), 
  writeContract: vi.fn(), waitForTransactionReceipt: vi.fn(), createClient: vi.fn()
}));
vi.mock('genlayer-js', () => ({
  createClient: mock.createClient
}));
vi.mock('genlayer-js/chains', () => ({ studionet: {}, studioDevnet: { id: 61997 } }));
vi.mock('genlayer-js/types', () => ({ TransactionHashVariant: { LATEST_FINAL: 'latest-final' } }));

beforeEach(() => {
  vi.resetModules(); vi.stubEnv('VITE_CONTRACT_ADDRESS', '0x' + 'a'.repeat(40));
  for (const fn of Object.values(mock)) fn.mockReset();
  mock.createClient.mockReturnValue(mock);
  mock.readContract.mockResolvedValue('{"title":"Builders"}');
  mock.writeContract.mockResolvedValue('0x' + 'b'.repeat(64));
  mock.waitForTransactionReceipt.mockResolvedValue({ statusName: 'FINALIZED', consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }] } });
});

describe('wallet transactions and durable reads', () => {
  it('explicitly reads the finalized snapshot', async () => {
    const chain = await import('./chain');
    expect(await chain.read('get_config')).toEqual({ title: 'Builders' });
    expect(mock.readContract).toHaveBeenCalledWith(expect.objectContaining({
      address: chain.ADDRESS, functionName: 'get_config', transactionHashVariant: 'latest-final'
    }));
  });
  it('connects the wallet, submits a zero-value write, and checks execution success', async () => {
    const chain = await import('./chain');
    const updates = [];
    const hash = await chain.write('0x' + 'c'.repeat(40), 'apply', ['url','digest'], (...args) => updates.push(args));
    expect(hash).toBe('0x' + 'b'.repeat(64));
    expect(mock.createClient).toHaveBeenCalledWith(expect.objectContaining({ account: '0x'+'c'.repeat(40), provider: window.ethereum }));
    expect(mock.connect).toHaveBeenCalledWith('studionet');
    expect(mock.writeContract).toHaveBeenCalledWith(expect.objectContaining({ functionName: 'apply', value: 0n }));
    expect(updates.at(-1)[0]).toBe('Finalized successfully.');
  });
  it('preserves submitted hash when finalization times out', async () => {
    mock.waitForTransactionReceipt.mockRejectedValue(new Error('timeout'));
    const chain = await import('./chain'); const updates = [];
    await expect(chain.write('0x'+'c'.repeat(40), 'review', ['0x'+'d'.repeat(40)], (...args) => updates.push(args))).rejects.toThrow('timeout');
    expect(updates.at(-1)[1]).toBe('0x'+'b'.repeat(64));
    expect(mock.writeContract).toHaveBeenCalledTimes(1);
  });
  it('rejects finalized receipts with failed execution', async () => {
    mock.waitForTransactionReceipt.mockResolvedValue({ statusName:'FINALIZED', txExecutionResultName:'REVERTED' });
    const chain = await import('./chain');
    await expect(chain.write('0x'+'c'.repeat(40), 'review', [], () => {})).rejects.toThrow('REVERTED');
  });
});
