import { describe, expect, it } from 'vitest';
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

describe('content schemas', () => {
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
