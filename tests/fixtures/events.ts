import type { ClubEvent } from '../../src/lib/events';

export const eventFixtures: ClubEvent[] = [
  {
    category: 'stage',
    title: 'Stage de test',
    date: '2026-01-10',
    time: '9h à 12h',
    location: 'Dojo de test',
    audience: 'Tous niveaux',
    price: 'Gratuit',
    icon: 'lucide:users',
  },
  {
    category: 'competition',
    title: 'Coupe de test',
    categories: 'Kata / Combat',
    date: '2026-10-03',
    location: 'Salle de test',
    icon: 'lucide:trophy',
  },
  {
    category: 'grade',
    title: 'Examen de grades de test',
    date: '2027-01-17',
    icon: 'lucide:badge-check',
  },
];

export const eventFixtureToday = new Date('2026-09-12T00:00:00');
