import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const hasDist = existsSync(dist);

function htmlFiles(): string[] {
  return readdirSync(dist, { recursive: true })
    .filter((f): f is string => typeof f === 'string' && f.endsWith('.html'))
    .map((f) => join(dist, f));
}

function resolveDistPath(href: string): string | null {
  const clean = href.split(/[?#]/)[0];
  if (!clean || clean === '/') return join(dist, 'index.html');
  const rel = clean.replace(/^\//, '').replace(/\/$/, '');
  const candidates = [join(dist, rel, 'index.html'), join(dist, rel)];
  return candidates.find((c) => existsSync(c)) ?? null;
}

describe.skipIf(!hasDist)('smoke tests (dist/)', () => {
  const pages = htmlFiles();
  const byName = (name: string) => pages.find((p) => p.endsWith(name));

  it('generate the 4 expected pages', () => {
    expect(byName('/index.html')).toBeDefined();
    expect(byName('/karate/index.html')).toBeDefined();
    expect(byName('/evenements/index.html')).toBeDefined();
    expect(byName('/photos/index.html')).toBeDefined();
  });

  it('emit the HTML shell', () => {
    const home = readFileSync(byName('/index.html')!, 'utf-8');
    expect(home).toContain('<html lang="fr"');
    expect(home).toMatch(/<title>[^<]+<\/title>/);
  });

  it('render markdown without leaving raw markers', () => {
    for (const page of ['/index.html', '/karate/index.html']) {
      const html = readFileSync(byName(page)!, 'utf-8');
      expect(html, `raw markdown present in ${page}`).not.toContain('**');
      expect(html, `invalid render in ${page}`).not.toContain('[object Object]');
      expect(html, `undefined shown in ${page}`).not.toContain('>undefined<');
    }
  });

  it('render the event filters', () => {
    const page = readFileSync(byName('/evenements/index.html')!, 'utf-8');
    for (const label of ['Tous', 'Compétitions', 'Stages', 'Grades']) {
      expect(page).toContain(`role="tab"`);
      expect(page).toContain(label);
    }
    expect(page).toContain('data-panel="all"');
    expect(page).toContain('data-panel="competition"');
    expect(page).toContain('data-panel="stage"');
    expect(page).toContain('data-panel="grade"');
  });

  it('show the teachers and schedule sections', () => {
    const home = readFileSync(byName('/index.html')!, 'utf-8');
    expect(home).toContain('Nos <span class="text-red-600">Professeurs</span>');
    expect(home).toContain('Nos <span class="text-red-600">Horaires</span>');
    expect(home).toContain('<table');
    expect(home).toContain('<th class="px-6 py-4 text-left font-semibold">Jour</th>');
    expect(home).toContain('<th class="px-6 py-4 text-left font-semibold">Horaires</th>');
    expect(home).toContain('<th class="px-6 py-4 text-left font-semibold">Public</th>');
  });

  it('show the photo gallery on the photos page', () => {
    const page = readFileSync(byName('/photos/index.html')!, 'utf-8');
    expect(page).toContain('id="lightbox"');
    expect((page.match(/\.photo-item/g) ?? []).length).toBeGreaterThan(0);
  });

  it('only link to existing internal destinations', () => {
    const links = new Set<string>();
    for (const file of pages) {
      const html = readFileSync(file, 'utf-8');
      for (const href of html.matchAll(/href="([^"]+)"/g)) {
        const value = href[1];
        if (!value || /^(#|mailto:|tel:|https?:|javascript:)/i.test(value)) continue;
        links.add(value);
      }
    }
    for (const href of links) {
      expect(resolveDistPath(href), `broken internal link: ${href}`).not.toBeNull();
    }
  });

  it('reference existing gallery images', () => {
    const page = readFileSync(byName('/photos/index.html')!, 'utf-8');
    const refs = page.matchAll(/src="(\/images\/gallery\/[^"]+)"/g);
    const seen = new Set(Array.from(refs, (m) => m[1]));
    expect(seen.size).toBeGreaterThan(0);
    for (const src of seen) {
      const rel = src.replace(/^\//, '');
      expect(existsSync(join(dist, rel)), `missing image: ${src}`).toBe(true);
    }
  });
});
