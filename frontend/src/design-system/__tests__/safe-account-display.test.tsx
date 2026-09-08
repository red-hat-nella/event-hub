import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../atoms/Avatar';
import { formatAccountDate, accountName } from '../account-formatters';
describe('safe account metadata', () => {
  it.each([null, undefined, '', 'invalid'])('formats unknown dates %s', date => expect(formatAccountDate(date)).toBe('Fecha no disponible'));
  it('provides a greeting and avatar fallback', () => {
    expect(accountName(undefined)).toBe('Tu cuenta');
    render(<Avatar name={undefined as unknown as string} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
