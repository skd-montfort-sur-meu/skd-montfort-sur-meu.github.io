import { z } from 'zod';

const required = z.string().min(1);
const richtext = z.string();

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'format attendu : yyyy-MM-dd')
  .refine((s) => !Number.isNaN(new Date(`${s}T00:00:00`).getTime()), 'date invalide');

export const SCHEDULE_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

export const clubSchema = z.object({
  name: required,
  fullName: required,
  address: required,
  email: z.email(),
  phone: required,
  phone2: required,
  facebook: z.url(),
  instagram: z.url(),
  president: required,
  treasurer: required,
  secretary: required,
  footerDescription: required,
});

export const clubAboutSchema = z.object({
  about: z.object({
    titlePrefix: required,
    titleHighlight: required,
    body: richtext.min(1),
    quote: richtext,
  }),
  features: z
    .array(z.object({ icon: required, title: required, desc: required }))
    .min(1),
});

export const clubTeachersSchema = z.object({
  teachers: z
    .array(z.object({ name: required, grade: required, description: required }))
    .min(1),
});

export const clubScheduleSchema = z.object({
  schedule: z
    .array(z.object({ day: z.enum(SCHEDULE_DAYS), time: required, audience: required }))
    .min(1),
});

export const clubPricesSchema = z.object({
  prices: z
    .array(z.object({ category: required, price: z.number().int().min(0), description: richtext }))
    .min(1),
  membership: z.object({ price: z.number().int().min(0), description: required }),
});

export const eventIconSchema = z
  .string()
  .regex(/^lucide:[a-z0-9-]+$/, 'icône invalide');

const cardLinkSchema = z.object({
  title: required,
  text: required,
  detail: required,
  icon: eventIconSchema,
});

const competitionEventSchema = z.object({
  category: z.literal('competition'),
  title: required,
  categories: richtext,
  date: isoDate,
  time: required,
  location: required,
  address: required,
  icon: eventIconSchema,
});

const stageEventSchema = z.object({
  category: z.literal('stage'),
  title: required,
  date: isoDate,
  time: required,
  location: required,
  address: required,
  audience: required,
  price: required,
  icon: eventIconSchema,
});

const gradeEventSchema = z.object({
  category: z.literal('grade'),
  title: required,
  date: isoDate,
  time: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  icon: eventIconSchema,
});

export const eventsSchema = z.object({
  header: z.object({
    eyebrow: required,
    titlePrefix: required,
    titleHighlight: required,
    subtitle: required,
  }),
  events: z.array(z.discriminatedUnion('category', [competitionEventSchema, stageEventSchema, gradeEventSchema])).min(1),
  blocks: z.array(cardLinkSchema).min(1),
});

const karateIconSchema = z.string().min(1);

export const karateSchema = z.object({
  hero: z.object({ eyebrow: required, titlePrefix: required, titleHighlight: required, subtitle: required }),
  history: z.object({ titlePrefix: required, titleHighlight: required, body: richtext.min(1) }),
  cards: z
    .array(
      z.object({
        icon: karateIconSchema,
        headerClass: required,
        iconClass: required,
        title: required,
        body: richtext,
      }),
    )
    .min(1),
  senseiKase: z.object({
    titlePrefix: required,
    titleHighlight: required,
    body: richtext.min(1),
    quote: richtext,
    quoteAuthor: richtext,
  }),
  katas: z.object({
    titlePrefix: required,
    titleHighlight: required,
    body: richtext.min(1),
    points: z.array(z.object({ icon: karateIconSchema, text: richtext })).min(1),
  }),
  vocabulary: z.object({
    titlePrefix: required,
    titleHighlight: required,
    intro: richtext,
    categories: z
      .array(
        z.object({
          title: required,
          icon: karateIconSchema,
          items: z.array(z.object({ term: required, def: richtext })).min(1),
        }),
      )
      .min(1),
  }),
  counting: z.object({
    title: required,
    icon: karateIconSchema,
    numbers: z.array(z.object({ jp: required, fr: required })).min(1),
  }),
  dojoWords: z.object({
    title: required,
    icon: karateIconSchema,
    words: z.array(z.object({ term: required, def: richtext })).min(1),
  }),
  ritual: z.object({
    titlePrefix: required,
    titleHighlight: required,
    intro: richtext,
    steps: z.array(z.object({ step: richtext })).min(1),
  }),
  cta: z.object({
    title: required,
    text: richtext,
    primaryLabel: required,
    primaryHref: required,
    secondaryLabel: required,
    secondaryHref: required,
  }),
});