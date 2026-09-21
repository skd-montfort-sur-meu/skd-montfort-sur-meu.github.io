import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import EventCard from '../../src/components/EventCard.astro';
import { formatEvents } from '../../src/lib/events';
import { eventFixtures } from '../fixtures/events';

describe('EventCard', () => {
  it('renders a fixture event without relying on production content', async () => {
    const container = await AstroContainer.create();
    const event = formatEvents(eventFixtures)[1];
    const html = await container.renderToString(EventCard, { props: { event } });

    expect(html).toContain('Coupe de test');
    expect(html).toContain('Kata / Combat');
    expect(html).toContain('Salle de test');
    expect(html).toContain('samedi 3 octobre 2026');
    expect(html).not.toContain('Championnat départemental');
  });
});
