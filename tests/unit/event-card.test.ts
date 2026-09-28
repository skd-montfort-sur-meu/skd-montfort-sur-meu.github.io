import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import EventCard from '../../src/components/EventCard.astro';
import { formatEvents } from '../../src/lib/events';
import { eventFixtures, eventFixtureWithEmptyOptionals } from '../fixtures/events';

async function render(event: (typeof eventFixtures)[number]) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(EventCard, { props: { event } });
  const text = html
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { html, text };
}

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

  it('omits every optional field on a grade event', async () => {
    const grade = formatEvents(eventFixtures).find((e) => e.category === 'grade')!;
    const { html, text } = await render(grade);

    expect(text).toBe('17 Janvier Examen de grades de test Grade dimanche 17 janvier 2027');
    expect(html).not.toContain('font-medium mb-4');
    expect(html).not.toContain('>undefined<');
  });

  it('ignores optional fields left empty by the CMS', async () => {
    const { html, text } = await render(formatEvents([eventFixtureWithEmptyOptionals])[0]);

    expect(text).toBe(
      '7 Novembre Stage de test incomplet Stage samedi 7 novembre 2026 3 rue Laennec, 35770 Vezin-sur-Seiche Gratuit',
    );
    expect(html).not.toContain('font-medium mb-4');
    expect(html).not.toContain('>undefined<');
  });
});
