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
import {
  clubAboutFixture,
  clubFixture,
  clubPricesFixture,
  clubScheduleFixture,
  clubTeachersFixture,
  eventsFixture,
  karateFixture,
  karateSeniorsFixture,
} from '../fixtures/content';

const root = process.cwd();
const configDir = join(root, 'src', 'content', 'config');

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(join(configDir, name), 'utf-8'));
}

describe('content fixtures', () => {
  it.each([
    ['club', clubSchema, clubFixture],
    ['club about', clubAboutSchema, clubAboutFixture],
    ['club teachers', clubTeachersSchema, clubTeachersFixture],
    ['club schedule', clubScheduleSchema, clubScheduleFixture],
    ['club prices', clubPricesSchema, clubPricesFixture],
    ['events', eventsSchema, eventsFixture],
    ['karate', karateSchema, karateFixture],
    ['karate seniors', karateSeniorsSchema, karateSeniorsFixture],
  ])('validate the %s fixture', (_name, schema, data) => {
    expect(() => schema.parse(data)).not.toThrow();
  });
});

describe('editable content (src/content/config)', () => {
  it.each([
    ['club.json', clubSchema],
    ['club-about.json', clubAboutSchema],
    ['club-teachers.json', clubTeachersSchema],
    ['club-schedule.json', clubScheduleSchema],
    ['club-prices.json', clubPricesSchema],
    ['events.json', eventsSchema],
    ['karate.json', karateSchema],
    ['karate-seniors.json', karateSeniorsSchema],
  ])('validate %s', (file, schema) => {
    expect(() => schema.parse(readJson(file))).not.toThrow();
  });

  it('events are sorted by ascending date in the source file', () => {
    const { events } = readJson('events.json') as { events: { date: string }[] };
    const dates = events.map((event) => event.date);
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
