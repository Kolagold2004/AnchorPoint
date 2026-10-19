import { TransactionReconcileScheduler } from './transaction-reconcile.scheduler';
import { metricsService } from '../services/metrics.service';
import { stellarService } from '../services/stellar.service';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    transaction: { findMany: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('../services/stellar.service', () => ({
  stellarService: { getHorizonServer: jest.fn() },
}));

describe('TransactionReconcileScheduler', () => {
  const call = jest.fn();

  beforeEach(() => {
    metricsService.reset();
    jest.clearAllMocks();
    (stellarService.getHorizonServer as jest.Mock).mockReturnValue({
      transactions: () => ({ transaction: () => ({ call }) }),
    });
    (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
      { id: 'tx-1', stellarTxId: 'hash-1', status: 'pending_stellar' },
    ]);
  });

  it('marks the transaction completed when Horizon reports success', async () => {
    call.mockResolvedValue({ successful: true });

    const count = await new TransactionReconcileScheduler().reconcile();

    expect(count).toBe(1);
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
      data: expect.objectContaining({ status: 'completed', sep31Status: 'completed' }),
    });
    const metrics = await metricsService.getMetrics();
    expect(metrics).toMatch(/transaction_reconciliation_total\{[^}]*outcome="completed"[^}]*\} 1/);
  });

  it('marks the transaction as error when Horizon reports failure', async () => {
    call.mockResolvedValue({ successful: false });

    const count = await new TransactionReconcileScheduler().reconcile();

    expect(count).toBe(1);
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
      data: expect.objectContaining({ status: 'error', sep31Status: 'error' }),
    });
    const metrics = await metricsService.getMetrics();
    expect(metrics).toMatch(/transaction_reconciliation_total\{[^}]*outcome="error"[^}]*\} 1/);
  });

  it('leaves the transaction pending when Horizon has not seen it yet', async () => {
    call.mockRejectedValue({ response: { status: 404 } });

    const count = await new TransactionReconcileScheduler().reconcile();

    expect(count).toBe(0);
    expect(prisma.transaction.update).not.toHaveBeenCalled();
    const metrics = await metricsService.getMetrics();
    expect(metrics).toMatch(/transaction_reconciliation_total\{[^}]*outcome="not_found"[^}]*\} 1/);
  });

  it('only queries pending_stellar transactions older than 5 minutes', async () => {
    (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

    await new TransactionReconcileScheduler().reconcile();

    const where = (prisma.transaction.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.status).toBe('pending_stellar');
    expect(Date.now() - where.updatedAt.lt.getTime()).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });
});
