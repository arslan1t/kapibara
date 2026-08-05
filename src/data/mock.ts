/**
 * Editorial content that is not customer data.
 *
 * The demo reviews that used to live here are gone: reviews now come from the
 * database, are tied to a delivered order line, and are moderated before they
 * appear. See src/lib/reviews.ts.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export const mockFAQ: FAQItem[] = [
  {
    question: "Как создаётся персональная книга?",
    answer:
      "Вы выбираете историю, вводите имя ребёнка и загружаете его фотографию. После загрузки вы увидите предварительный макет и сможете проверить все данные перед оформлением заказа.",
  },
  {
    question: "Что входит в книгу?",
    answer:
      "Твёрдая обложка квадратного формата, 40 иллюстрированных страниц, имя ребёнка в тексте истории, его фотография в иллюстрациях и персональное посвящение на первой странице.",
  },
  {
    question: "Какое фото лучше загрузить?",
    answer:
      "Подойдёт чёткая фотография лица крупным планом при хорошем освещении, желательно на светлом фоне. Не используйте групповые снимки и фотографии в тёмных очках.",
  },
  {
    question: "Что происходит с фотографией ребёнка?",
    // Deliberately does not promise automatic deletion or that the photo stays
    // with us alone: neither is true. Retention is not implemented, and the
    // illustration provider necessarily receives the image. Saying otherwise
    // would be a false claim about a child's data.
    answer:
      "Фотография хранится в закрытом хранилище и используется только для создания вашей книги: её видят сотрудники, работающие над заказом, и сервис, который создаёт иллюстрации. Мы не публикуем её и не передаём для рекламы. Чтобы удалить фотографию, напишите нам — мы удалим её по вашему запросу.",
  },
  {
    question: "Сколько стоит доставка?",
    answer:
      "Стоимость и срок доставки рассчитываются при оформлении заказа — они зависят от вашего города и выбранной службы.",
  },
  {
    question: "Можно ли заказать книгу в подарок?",
    answer:
      "Да. При оформлении заказа укажите адрес получателя, а в поле посвящения — тёплые слова, которые мы напечатаем на первой странице.",
  },
  {
    question: "Когда появятся новые истории?",
    answer:
      "Сейчас доступны две истории — про мальчика и про девочку. Мы работаем над продолжением серии и расскажем о новых книгах в наших соцсетях.",
  },
];

// ─── Labels ───────────────────────────────────────────────────────────────────

export const categoryLabels: Record<string, string> = {
  adventure: "Приключения",
};

