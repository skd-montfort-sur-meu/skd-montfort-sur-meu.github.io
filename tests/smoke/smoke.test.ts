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
    expect(home).toContain('Shotokan');
    expect(home).toContain('Montfort');
  });

  it('show club info on the homepage', () => {
    const home = readFileSync(byName('/index.html')!, 'utf-8');
    expect(home).toContain('skdmontfort@gmail.com');
    expect(home).toContain('Dojo Coesec');
    expect(home).toContain('Pierrick Lemou');
  });

  it('render markdown without leaving raw markers', () => {
    for (const page of ['/index.html', '/karate/index.html']) {
      const html = readFileSync(byName(page)!, 'utf-8');
      expect(html, `raw markdown present in ${page}`).not.toContain('**');
      expect(html, `invalid render in ${page}`).not.toContain('[object Object]');
      expect(html, `undefined shown in ${page}`).not.toContain('>undefined<');
    }
  });

  it('show club events with their categories', () => {
    const page = readFileSync(byName('/evenements/index.html')!, 'utf-8');
    expect(page).toContain('Championnat départementaux');
    expect(page).toContain('Championnat départemental');
    expect(page).toContain('Stage départemental Multi-Disciplines');
    expect(page).toContain('Examen de grades – Janvier 2027');
    expect(page).toContain('3 rue Laennec');
    expect(page).toContain('Compétitions');
    expect(page).toContain('Stages');
    expect(page).not.toContain('**');
  });

  it('preview upcoming events on the homepage', () => {
    const home = readFileSync(byName('/index.html')!, 'utf-8');
    expect(home).toContain('Prochains');
    expect(home).toContain('Stage départemental Multi-Disciplines');
  });

  it('show teachers and schedule', () => {
    const home = readFileSync(byName('/index.html')!, 'utf-8');
    expect(home).toContain('Frédéric Gelin');
    expect(home).toContain('Pierrick Lemou');
    expect(home).toContain('18h15 - 19h30');
    expect(home).toContain('Adultes');
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
