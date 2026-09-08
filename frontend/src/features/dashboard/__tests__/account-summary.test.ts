import { describe, expect, it } from 'vitest';
import { summarizeAccount } from '../account-summary';
import { accountRegistrations, registration } from '../../../test/fixtures/account';
describe('complete account activity', () => {
  it.each([0, 1, 21, 100])('counts complete collection of %s', count => {
    const items = accountRegistrations(count);
    const summary = summarizeAccount(items, Date.UTC(2029, 0, 1));
    expect(summary.activeCount).toBe(items.filter(r => r.status === 'ACTIVE').length);
    expect(summary.cancelledCount).toBe(items.filter(r => r.status === 'CANCELLED').length);
    expect(summary.upcoming.length).toBe(Math.min(3, summary.activeCount));
  });
  it('counts past active but excludes unknown/past/cancelled upcoming; breaks ties by id', () => {
    const summary = summarizeAccount([{ ...registration, id: 'z' }, { ...registration, id: 'a' }, { ...registration, id: 'past', eventStartsAt: '2020-01-01T00:00:00Z' }, { ...registration, id: 'unknown', eventStartsAt: null }], Date.UTC(2029, 0, 1));
    expect(summary.activeCount).toBe(4);
    expect(summary.upcoming.map(r => r.id)).toEqual(['a', 'z']);
    expect(summarizeAccount([registration], Date.UTC(2031, 0, 1)).upcoming).toEqual([]);
  });
});
