import { colors, contrast } from '../src/theme/tokens';
import { dateLabel } from '../src/lib/format';
import { decideHold, timerLabel } from '../src/lib/holdToTalk';

describe('tokens', () => {
  it('ink on paper and white on kumkum / mango leaf pass WCAG AA (4.5)', () => {
    expect(contrast(colors.ink, colors.paper)).toBeGreaterThan(4.5);
    expect(contrast('#FFFFFF', colors.kumkum)).toBeGreaterThan(4.5);
    expect(contrast('#FFFFFF', colors.mangoLeaf)).toBeGreaterThan(4.5);
    expect(contrast(colors.ink, colors.marigold)).toBeGreaterThan(4.5);
  });
});

describe('date labels', () => {
  it('formats in English and Kannada', () => {
    expect(dateLabel('2027-01-14')).toBe('Thu 14 Jan');
    expect(dateLabel('2027-01-14', 'kn-IN')).toBe('ಗುರು 14 ಜನವರಿ');
    expect(dateLabel('2027-01-15', 'te-IN')).toBe('Fri 15 Jan');
  });
});

describe('hold to talk', () => {
  it('ignores short taps and caps long holds', () => {
    expect(decideHold(0, 300)).toBe('ignore');
    expect(decideHold(0, 1500)).toBe('send');
    expect(decideHold(0, 25_000)).toBe('send_capped');
    expect(timerLabel(4200)).toBe('0:04 / 0:20');
  });
});
