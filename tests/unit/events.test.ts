import { describe, expect, it } from 'vitest';
import { capitalize, formatEvents, splitUpcomingPast } from '../../src/lib/events';
import { eventFixtureToday, eventFixtures } from '../fixtures/events';

describe('capitalize', () => {
  it('capitalize the first letter', () => {
    expect(capitalize('dimanche')).toBe('Dimanche');
  });

  it('not break on an empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('formatEvents', () => {
  const formatted = formatEvents(eventFixtures);

  it('sort events by ascending date', () => {
    expect(formatted.map((e) => e.date)).toEqual(['2026-01-10', '2026-10-03', '2027-01-17']);
  });

  it('fill in the date fields', () => {
    const coupe = formatted.find((e) => e.title === 'Coupe de test');
    expect(coupe).toMatchObject({
      day: 3,
      month: 'Octobre',
      monthShort: 'Oct.',
      weekday: 'Samedi',
      dateLabel: 'samedi 3 octobre 2026',
    });
  });

  it('keep the original fields', () => {
    const coupe = formatted.find((e) => e.title === 'Coupe de test');
    expect(coupe?.categories).toBe('Kata / Combat');
    expect(coupe?.date).toBe('2026-10-03');
  });

  it('preserve optional fields', () => {
    const stage = formatted.find((e) => e.title === 'Stage de test');
    expect(stage).toMatchObject({
      category: 'stage',
      audience: 'Tous niveaux',
      price: 'Gratuit',
      location: 'Dojo de test',
    });
  });

  it('keep a grade event without optional fields', () => {
    const grade = formatted.find((e) => e.title === 'Examen de grades de test');
    expect(grade).toMatchObject({ category: 'grade', date: '2027-01-17' });
    expect(grade?.location).toBeUndefined();
  });
});

describe('splitUpcomingPast', () => {
  it('put earlier events in past', () => {
    const { past } = splitUpcomingPast(eventFixtures, eventFixtureToday);
    expect(past.map((e) => e.date)).toEqual(['2026-01-10']);
  });

  it('put future events in upcoming', () => {
    const { upcoming } = splitUpcomingPast(eventFixtures, eventFixtureToday);
    expect(upcoming.map((e) => e.date)).toEqual(['2026-10-03', '2027-01-17']);
  });

  it('treat an event on today as upcoming', () => {
    const sameDay = [{ category: 'stage' as const, title: 'Événement du jour', date: '2026-09-12' }];
    const { upcoming, past } = splitUpcomingPast(sameDay, eventFixtureToday);
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(0);
  });
});
