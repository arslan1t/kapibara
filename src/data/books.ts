/**
 * Editorial copy that is the same for every copy of the book.
 *
 * The catalogue itself — titles, prices, availability, artwork — lives in the
 * database and is read through `@/lib/products`. Only text that no
 * administrator edits belongs here.
 */

/** Shared physical spec, identical across the range. */
export const BOOK_PAGE_COUNT = 40;

/** Titles we are working on but do not sell yet — shown as a quiet text list only. */
export const upcomingStories = [
  "История о морском путешествии",
  "История о полёте к звёздам",
  "История о первом дне в школе",
];

/** What every copy includes — one shared spec, since there is one product. */
export const bookIncludes = [
  "Имя ребёнка в тексте истории",
  "Фотография ребёнка в иллюстрациях",
  "Персональное посвящение на первой странице",
  `${BOOK_PAGE_COUNT} иллюстрированных страниц`,
  "Твёрдая обложка, квадратный формат",
  "Плотная бумага с матовым покрытием",
];
