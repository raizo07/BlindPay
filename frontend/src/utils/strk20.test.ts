import { describe, it, expect } from 'vitest';
import { amountToBaseUnits, buildEscrowDepositActions } from './strk20';

describe('amountToBaseUnits', () => {
  it('converts USDC decimals', () => {
    expect(amountToBaseUnits('1.5', 1)).toBe(1_500_000n);
  });

  it('converts STRK decimals', () => {
    expect(amountToBaseUnits('1', 0)).toBe(10n ** 18n);
  });
});

describe('buildEscrowDepositActions', () => {
  it('builds withdraw + invoke with commitment hash', () => {
    const actions = buildEscrowDepositActions(1, 1000n, '0xabc', 1);
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe('withdraw');
    expect(actions[1].type).toBe('invoke');
    if (actions[1].type === 'invoke') {
      expect(actions[1].calldata?.[1]).toMatch(/^0x/);
    }
  });
});
