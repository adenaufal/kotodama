import { describe, it, expect } from 'vitest';
import { shortTime } from '../ContextCard';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

describe('shortTime', () => {
    it('collapses ISO timestamps to a single unit', () => {
        expect(shortTime(ago(7 * 60_000))).toBe('7m');
        expect(shortTime(ago(3 * 3_600_000))).toBe('3h');
        expect(shortTime(ago(2 * 86_400_000))).toBe('2d');
        expect(shortTime(ago(30_000))).toBe('30s');
    });

    it('passes through anything it cannot parse, and nothing for nothing', () => {
        expect(shortTime('7m')).toBe('7m');
        expect(shortTime(undefined)).toBeNull();
    });

    it('never renders a negative age for a clock-skewed future timestamp', () => {
        expect(shortTime(ago(-60_000))).toBe('0s');
    });
});
