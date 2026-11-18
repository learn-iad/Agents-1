const STORY_DEFAULTS = {
  hereId: 2,
  completedIds: [1],
};

/** Подсветка блоков на виде «Путь» */
const CHAPTER_THEME = {
  start: {
    tint: 'rgba(61, 255, 168, 0.16)',
    border: '#2ee88a',
    glow: 'rgba(46, 232, 138, 0.28)',
  },
  base: {
    tint: 'rgba(96, 165, 250, 0.14)',
    border: '#60a5fa',
    glow: 'rgba(96, 165, 250, 0.26)',
  },
  decide: {
    tint: 'rgba(167, 139, 250, 0.1)',
    border: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.22)',
  },
  practice: {
    tint: 'rgba(251, 191, 36, 0.08)',
    border: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.18)',
  },
  finish: {
    tint: 'rgba(212, 175, 55, 0.12)',
    border: '#d4af37',
    glow: 'rgba(212, 175, 55, 0.22)',
  },
};

const PATH_LAYOUT = {
  topPad: 24,
  headerH: 52,
  headExtra: 14,
  rowH: 72,
  chapterPadY: 12,
  chapterPadBottom: 10,
  chapterMargin: 10,
  spineX: 160,
};

const COURSE = {
  chapters: [
    { id: 'start', title: 'Старт', subtitle: 'Знакомство и маршрут' },
    { id: 'base', title: 'База', subtitle: 'Агенты и инструменты' },
    { id: 'decide', title: 'Решения', subtitle: 'Автономия и дерево выбора' },
    { id: 'practice', title: 'Практика', subtitle: 'Универсальные задачи' },
    { id: 'finish', title: 'Финиш', subtitle: 'Итог и шпаргалка' },
  ],
  modules: [
    {
      id: 1,
      chapter: 'start',
      title: 'Приветственный лонгрид',
      format: 'longread',
      minutes: 5,
      description:
        'Знакомство и цели курса. Понимает, зачем нужен базовый курс, и связывает его с курсом по промптингу и ИБ; видит выгоду для своей роли.',
      xp: 50,
    },
    {
      id: 2,
      chapter: 'start',
      title: 'Структура курса',
      format: 'interactive',
      minutes: 2,
      description:
        'Видит маршрут курса и задачи из кабинетов разных отделов. Вы здесь — этот тренажёр.',
      xp: 80,
      highlight: true,
    },
    {
      id: 3,
      chapter: 'base',
      title: 'Кто такие ИИ-агенты и чем они могут вам помочь',
      format: 'longread',
      minutes: 8,
      description: 'Отличия чат-бота от агента; где агент реально экономит время.',
      xp: 60,
    },
    {
      id: 4,
      chapter: 'base',
      title: 'Агенты, доступные в России',
      format: 'longread',
      minutes: 10,
      description:
        'Российские сервисы (GigaChat, YandexGPT/Алиса и аналоги), зарубежные с доступом из РФ: chat.z.ai, chat.qwen.ai, arena ai.',
      xp: 70,
    },
    {
      id: 5,
      chapter: 'base',
      title: 'Матчинг: задача — инструмент',
      format: 'interactive',
      minutes: 5,
      description: 'Подбирает инструмент под тип задачи в восьми парах «ситуация — сервис».',
      xp: 100,
    },
    {
      id: 6,
      chapter: 'decide',
      title: 'Границы автономии',
      format: 'longread',
      minutes: 7,
      description:
        'Применяет критерии выбора: регулярность задачи, число шагов, цена ошибки; называет шаги, где решение остаётся за человеком.',
      xp: 65,
    },
    {
      id: 7,
      chapter: 'decide',
      title: 'Дерево решений',
      format: 'interactive',
      minutes: 5,
      description: 'Проводит десять рабочих ситуаций по дереву решений без ошибок.',
      xp: 120,
    },
    {
      id: 8,
      chapter: 'practice',
      title: 'Универсальные задачи',
      format: 'longread',
      minutes: 2,
      description: 'Далее — универсальные задачи, которые отдаём агентам на практике.',
      xp: 40,
    },
    {
      id: 9,
      chapter: 'practice',
      title: 'Презентации',
      format: 'longread',
      minutes: 10,
      description:
        'Пайплайн: человек — тезисы и смыслы, агент — структура и черновики слайдов. Почему агенту нельзя доверять цифры и выводы.',
      xp: 75,
    },
    {
      id: 10,
      chapter: 'practice',
      title: 'Тренажёр: презентации',
      format: 'trainer',
      minutes: null,
      description: 'Закрепление ролей человека и агента в подготовке презентаций.',
      xp: 150,
    },
    {
      id: 11,
      chapter: 'practice',
      title: 'Документы',
      format: 'longread',
      minutes: 5,
      description: 'Какие документы делегировать агенту, а какие готовить самому или с юристом.',
      xp: 55,
    },
    {
      id: 12,
      chapter: 'practice',
      title: 'Тренажёр: документы',
      format: 'trainer',
      minutes: null,
      description: 'Практика границ делегирования для договоров и внутренних документов.',
      xp: 150,
    },
    {
      id: 13,
      chapter: 'practice',
      title: 'Отчёты',
      format: 'longread',
      minutes: 10,
      description: 'Какие отчёты делегировать агенту, а какие готовить самому или с юристом.',
      xp: 75,
    },
    {
      id: 14,
      chapter: 'practice',
      title: 'Тренажёр: отчёты',
      format: 'trainer',
      minutes: null,
      description: 'Отработка решений по типам отчётов и рискам.',
      xp: 150,
    },
    {
      id: 15,
      chapter: 'practice',
      title: 'Изображения',
      format: 'longread',
      minutes: 10,
      description:
        'Промпт по структуре «объект — стиль — формат — ограничения»; отбор годных результатов.',
      xp: 75,
    },
    {
      id: 16,
      chapter: 'practice',
      title: 'Тренажёр: изображения',
      format: 'trainer',
      minutes: null,
      description: 'Сборка промптов и критерии качества визуала.',
      xp: 150,
    },
    {
      id: 17,
      chapter: 'finish',
      title: 'Итоговая работа',
      format: 'final',
      minutes: null,
      description: 'Сводное задание по всему маршруту курса.',
      xp: 300,
    },
    {
      id: 18,
      chapter: 'finish',
      title: 'Шпаргалка',
      format: 'pdf',
      minutes: null,
      description:
        'Скачиваемый PDF: правило трёх вопросов и чек-листы презентации, документа, промпта, письма и ПДн.',
      xp: 100,
    },
  ],
};

const FORMAT_META = {
  longread: { label: 'Лонгрид', icon: 'Л', color: '#4ade80' },
  interactive: { label: 'Интерактив', icon: 'И', color: '#22d3ee' },
  trainer: { label: 'Тренажёр', icon: 'Т', color: '#a78bfa' },
  final: { label: 'Итог', icon: 'Ф', color: '#fbbf24' },
  pdf: { label: 'PDF', icon: 'П', color: '#34d399' },
};

const VIEW_MODES = [
  { id: 'path', label: 'Путь' },
  { id: 'metro', label: 'Схема' },
  { id: 'ribbon', label: 'Лента' },
  { id: 'cards', label: 'Карточки' },
];

const LEVELS = [
  { minXp: 0, name: 'Новичок' },
  { minXp: 200, name: 'Исследователь' },
  { minXp: 500, name: 'Навигатор' },
  { minXp: 900, name: 'Оператор агентов' },
  { minXp: 1400, name: 'Архитектор задач' },
];