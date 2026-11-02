// Player matching ka scoring logic (pure functions - DB se independent, test karna asaan).
// Har match ko 100 mein se score milta hai.

export const WEIGHTS = {
  time: 40, // dono kitni der saath free hain
  skill: 35, // level kitna milta hai (profile ka skillLevel)
  budget: 25, // budget kitna milta hai (request form ka budget)
};

// Court ke baghair: kam se kam itne minute saath free hon tab hi match maana jaye
export const MIN_OVERLAP_MINUTES = 30;
// Court ke baghair: itne minute ya zyada overlap = time ke full marks
export const DEFAULT_TARGET_MINUTES = 60;

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'] as const;
type Level = (typeof LEVELS)[number];

// Level ka farq -> skill marks ka hissa (0 farq = 100%, 1 = 60%, 2 = 20%, 3 = 0%)
const SKILL_FACTOR = [1, 0.6, 0.2, 0];

export interface TimeWindow {
  from: Date;
  until: Date;
}

/** Dono windows ka common hissa. `notBefore` (abhi ka waqt) se pehle ka hissa nahi gina jata. */
export function overlapWindow(a: TimeWindow, b: TimeWindow, notBefore?: Date): TimeWindow | null {
  const starts = [a.from.getTime(), b.from.getTime()];
  if (notBefore) starts.push(notBefore.getTime());
  const from = Math.max(...starts);
  const until = Math.min(a.until.getTime(), b.until.getTime());
  return until > from ? { from: new Date(from), until: new Date(until) } : null;
}

export const minutesBetween = (w: TimeWindow) =>
  Math.round((w.until.getTime() - w.from.getTime()) / 60000);

export function timeScore(overlapMinutes: number, targetMinutes: number) {
  return Math.min(overlapMinutes / targetMinutes, 1) * WEIGHTS.time;
}

/** Dono ka level pata ho to farq se marks; kisi ek ka na ho to aadhe (neutral) marks. */
export function skillScore(mine?: string | null, theirs?: string | null) {
  const a = LEVELS.indexOf(mine as Level);
  const b = LEVELS.indexOf(theirs as Level);
  if (a < 0 || b < 0) return { points: WEIGHTS.skill / 2, diff: null as number | null };
  const diff = Math.abs(a - b);
  return { points: SKILL_FACTOR[diff] * WEIGHTS.skill, diff };
}

/** Budget jitne qareeb, utne zyada marks: chhota budget / bara budget. */
export function budgetScore(mine: number, theirs: number) {
  const max = Math.max(mine, theirs);
  const ratio = max === 0 ? 1 : Math.min(mine, theirs) / max;
  return ratio * WEIGHTS.budget;
}

export const prettyLevel = (l?: string | null) =>
  l ? l.charAt(0) + l.slice(1).toLowerCase() : 'Not set';

export const pkTime = (d: Date) =>
  d.toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit' });

export interface ScoreInput {
  overlap: TimeWindow;
  targetMinutes: number;
  mySkill?: string | null;
  theirSkill?: string | null;
  myBudget: number;
  theirBudget: number;
}

export function scoreMatch(i: ScoreInput) {
  const overlapMinutes = minutesBetween(i.overlap);
  const time = timeScore(overlapMinutes, i.targetMinutes);
  const skill = skillScore(i.mySkill, i.theirSkill);
  const budget = budgetScore(i.myBudget, i.theirBudget);

  const reasons: string[] = [
    `Free together ${pkTime(i.overlap.from)} – ${pkTime(i.overlap.until)} (${overlapMinutes} min)`,
  ];
  if (skill.diff === 0) reasons.push(`Same skill level (${prettyLevel(i.theirSkill)})`);
  else if (skill.diff === 1) reasons.push(`Close skill level (${prettyLevel(i.theirSkill)})`);
  else if (skill.diff === null) reasons.push('Skill level not set');
  else reasons.push(`Different skill level (${prettyLevel(i.theirSkill)})`);
  if (budget >= WEIGHTS.budget * 0.8) reasons.push(`Similar budget (Rs ${i.theirBudget})`);

  return {
    score: Math.round(time + skill.points + budget),
    breakdown: {
      time: Math.round(time),
      skill: Math.round(skill.points),
      budget: Math.round(budget),
    },
    overlapMinutes,
    reasons,
  };
}
