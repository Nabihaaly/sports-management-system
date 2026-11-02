import { budgetScore, overlapWindow, minutesBetween, scoreMatch, skillScore } from './scoring';

const t = (hhmm: string) => new Date(`2030-01-05T${hhmm}:00+05:00`);

describe('player matching scoring', () => {
  it('finds the common time window', () => {
    const o = overlapWindow({ from: t('18:00'), until: t('20:00') }, { from: t('19:00'), until: t('22:00') });
    expect(o && minutesBetween(o)).toBe(60);
    expect(overlapWindow({ from: t('18:00'), until: t('19:00') }, { from: t('19:00'), until: t('20:00') })).toBeNull();
  });

  it('gives more skill points to closer levels, neutral when unknown', () => {
    expect(skillScore('INTERMEDIATE', 'INTERMEDIATE').points).toBe(35);
    expect(skillScore('INTERMEDIATE', 'PRO').points).toBeLessThan(skillScore('INTERMEDIATE', 'ADVANCED').points);
    expect(skillScore(null, 'PRO').points).toBe(17.5);
  });

  it('gives more budget points to closer budgets', () => {
    expect(budgetScore(1000, 1000)).toBe(25);
    expect(budgetScore(1000, 500)).toBe(12.5);
  });

  it('ranks a full-overlap, same-level, same-budget player at 100', () => {
    const s = scoreMatch({
      overlap: { from: t('18:00'), until: t('19:00') }, targetMinutes: 60,
      mySkill: 'INTERMEDIATE', theirSkill: 'INTERMEDIATE', myBudget: 1500, theirBudget: 1500,
    });
    expect(s.score).toBe(100);
  });
});
