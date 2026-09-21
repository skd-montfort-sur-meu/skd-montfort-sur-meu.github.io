import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  clubAboutSchema,
  clubPricesSchema,
  clubScheduleSchema,
  clubSchema,
  clubTeachersSchema,
  eventsSchema,
  karateSchema,
  karateSeniorsSchema,
} from '../../src/lib/schemas';

const root = process.cwd();
const configDir = join(root, 'src', 'content', 'config');

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(join(configDir, name), 'utf-8'));
}

describe('editable content (src/content/config)', () => {
  it.each([
    ['club.json', clubSchema, readJson('club.json')],
    ['club-about.json', clubAboutSchema, readJson('club-about.json')],
    ['club-teachers.json', clubTeachersSchema, readJson('club-teachers.json')],
    ['club-schedule.json', clubScheduleSchema, readJson('club-schedule.json')],
    ['club-prices.json', clubPricesSchema, readJson('club-prices.json')],
    ['events.json', eventsSchema, readJson('events.json')],
    ['karate.json', karateSchema, readJson('karate.json')],
    ['karate-seniors.json', karateSeniorsSchema, readJson('karate-seniors.json')],
  ])('validate %s', (_file, schema, data) => {
    expect(() => schema.parse(data)).not.toThrow();
  });

  it('events sorted by ascending date in the source file', () => {
    const { events } = JSON.parse(readFileSync(join(configDir, 'events.json'), 'utf-8'));
    const dates = events.map((e: { date: string }) => e.date);
    expect([...dates].sort()).toEqual(dates);
  });
});

describe('photo gallery', () => {
  const galleryDir = join(root, 'public', 'images', 'gallery');
  const manifestFile = join(galleryDir, 'photos.json');

  it('every manifest photo points to an existing file', () => {
    if (!existsSync(manifestFile)) return;
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf-8')) as { src: string }[];
    for (const { src } of manifest) {
      const clean = src.replace(/^\//, '');
      expect(existsSync(join(root, 'public', clean)), `missing file: ${src}`).toBe(true);
    }
  });
});