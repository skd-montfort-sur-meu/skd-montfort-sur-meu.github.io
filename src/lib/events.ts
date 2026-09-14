const formatFr = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
const formatMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
const formatMonthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const formatWeekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });

export interface EventBase {
  title: string;
  date: string;
  time?: string;
  location?: string;
  address?: string;
  icon?: string;
}

export type FormattedEvent<T extends EventBase = EventBase> = T & {
  day: number;
  weekday: string;
  month: string;
  monthShort: string;
  dateLabel: string;
};

export const EVENT_CATEGORIES = ['competition', 'stage', 'grade'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface ClubEvent extends EventBase {
  category: EventCategory;

  categories?: string;
  audience?: string;
  price?: string;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatEvents<T extends EventBase>(events: T[]): FormattedEvent<T>[] {
  return events
    .map((event) => {
      const d = new Date(`${event.date}T00:00:00`);
      return {
        ...event,
        day: d.getDate(),
        weekday: capitalize(formatWeekday.format(d)),
        month: capitalize(formatMonth.format(d)),
        monthShort: capitalize(formatMonthShort.format(d)),
        dateLabel: formatFr.format(d),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function splitUpcomingPast<T extends EventBase>(
  events: T[],
  today: Date = new Date(),
): {
  upcoming: FormattedEvent<T>[];
  past: FormattedEvent<T>[];
} {
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);
  const formatted = formatEvents(events);
  const upcoming = formatted.filter((e) => new Date(`${e.date}T00:00:00`) >= current);
  const past = formatted.filter((e) => new Date(`${e.date}T00:00:00`) < current);
  return { upcoming, past };
}