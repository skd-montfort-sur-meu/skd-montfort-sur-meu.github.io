import { describe, expect, it } from 'vitest';
import { capitalize, formatEvents, splitUpcomingPast } from '../../src/lib/events';
import type { ClubEvent } from '../../src/lib/events';

const events: ClubEvent[] = [
  { category: 'competition', title: 'Championnat', categories: 'Kata', date: '2026-10-04' },
  { category: 'competition', title: 'Coupe', categories: 'Combat', date: '2026-10-03' },
  { category: 'stage', title: 'Stage', audience: 'À partir de 10 ans', price: 'Gratuit', date: '2026-01-10' },
  { category: 'grade', title: 'Examen de grades', date: '2027-01-17' },
];

describe('capitalize', () => {
  it('capitalize the first letter', () => {
    expect(capitalize('dimanche')).toBe('Dimanche');
  });

  it('not break on an empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('formatEvents', () => {
  const formatted = formatEvents(events);

  it('sort events by ascending date', () => {
    expect(formatted.map((e) => e.date)).toEqual(['2026-01-10', '2026-10-03', '2026-10-04', '2027-01-17']);
  });

  it('fill in the date fields', () => {
    const coupe = formatted.find((e) => e.title === 'Coupe');
    expect(coupe).toMatchObject({
      day: 3,
      month: 'Octobre',
      monthShort: 'Oct.',
      weekday: 'Samedi',
      dateLabel: 'samedi 3 octobre 2026',
    });
  });

  it('keep the original fields', () => {
    const coupe = formatted.find((e) => e.title === 'Coupe');
    expect(coupe?.categories).toBe('Combat');
    expect(coupe?.date).toBe('2026-10-03');
  });

  it('preserve the category and stage-specific fields', () => {
    const stage = formatted.find((e) => e.title === 'Stage');
    expect(stage).toMatchObject({
      category: 'stage',
      audience: 'À partir de 10 ans',
      price: 'Gratuit',
    });
  });

  it('keep the category on a grade event without optional fields', () => {
    const grade = formatted.find((e) => e.title === 'Examen de grades');
    expect(grade).toMatchObject({ category: 'grade', date: '2027-01-17' });
    expect(grade?.location).toBeUndefined();
  });
});

describe('splitUpcomingPast', () => {
  const today = new Date('2026-09-12T00:00:00');

  it('put earlier events in past', () => {
    const { past } = splitUpcomingPast(events, today);
    expect(past.map((e) => e.date)).toEqual(['2026-01-10']);
  });

  it('put today\u2019s and future events in upcoming', () => {
    const { upcoming } = splitUpcomingPast(events, today);
    expect(upcoming.map((e) => e.date)).toEqual(['2026-10-03', '2026-10-04', '2027-01-17']);
  });

  it('treat an event on today as upcoming', () => {
    const sameDay: ClubEvent[] = [{ category: 'stage', title: 'Aujourd\u2019hui', date: '2026-09-12' }];
    const { upcoming, past } = splitUpcomingPast(sameDay, today);
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(0);
  });
});