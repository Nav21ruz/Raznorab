export const business = {
  name: 'РовныеСтены',
  tagline: 'Штукатурные и шпаклевочные работы',
  city: 'Москва и область',
  phone: '+7 (900) 000-00-00',
  phoneHref: 'tel:+79000000000',
  whatsappNumber: '79000000000',
  telegramUsername: 'your_telegram',
  email: 'info@example.com',
  yearsExperience: 8,
  objectsCompleted: 240,
  warrantyYears: 2,
}

export type Service = {
  icon: 'Layers' | 'PaintRoller' | 'Brush' | 'Hammer' | 'RectangleHorizontal' | 'SprayCan'
  title: string
  description: string
}

export const services: Service[] = [
  {
    icon: 'Layers',
    title: 'Штукатурка стен',
    description: 'Механизированная и ручная штукатурка по маякам — идеально ровные стены под любую отделку.',
  },
  {
    icon: 'RectangleHorizontal',
    title: 'Штукатурка потолков',
    description: 'Выравнивание потолков любой сложности, включая подготовку под натяжные конструкции.',
  },
  {
    icon: 'PaintRoller',
    title: 'Шпаклевка под покраску',
    description: 'Финишная шпаклевка в 2-3 слоя, шлифовка до идеальной гладкости под покраску.',
  },
  {
    icon: 'Brush',
    title: 'Шпаклевка под обои',
    description: 'Устранение всех неровностей и стыков, подготовка поверхности под обои любой плотности.',
  },
  {
    icon: 'Hammer',
    title: 'Демонтаж старой отделки',
    description: 'Снятие старой штукатурки, обоев и покраски, подготовка и грунтовка основания.',
  },
  {
    icon: 'SprayCan',
    title: 'Откосы и углы',
    description: 'Устройство ровных дверных и оконных откосов, идеально прямые внутренние и внешние углы.',
  },
]

export const processSteps = [
  { title: 'Заявка', description: 'Оставляете заявку по телефону, в WhatsApp или через форму на сайте.' },
  { title: 'Замер', description: 'Приезжаем на объект, оцениваем объём работ и состояние поверхностей.' },
  { title: 'Смета', description: 'Готовим прозрачную смету с фиксированной ценой за м² без скрытых доплат.' },
  { title: 'Работа', description: 'Выполняем работы в оговоренные сроки, ежедневно фотоотчёт о процессе.' },
  { title: 'Приёмка', description: 'Сдаём объект, подписываем акт, даём гарантию на выполненные работы.' },
]

export type PriceRow = {
  service: string
  unit: string
  priceFrom: number
  priceTo: number
}

export const prices: PriceRow[] = [
  { service: 'Штукатурка стен по маякам', unit: 'м²', priceFrom: 450, priceTo: 650 },
  { service: 'Штукатурка потолков', unit: 'м²', priceFrom: 500, priceTo: 700 },
  { service: 'Шпаклевка стен под покраску', unit: 'м²', priceFrom: 250, priceTo: 350 },
  { service: 'Шпаклевка стен под обои', unit: 'м²', priceFrom: 200, priceTo: 300 },
  { service: 'Демонтаж старой штукатурки', unit: 'м²', priceFrom: 150, priceTo: 250 },
  { service: 'Устройство откосов', unit: 'п.м.', priceFrom: 600, priceTo: 900 },
]

export type Advantage = {
  icon: 'ShieldCheck' | 'Wrench' | 'Droplets' | 'Clock' | 'Receipt' | 'Camera'
  title: string
  description: string
}

export const advantages: Advantage[] = [
  {
    icon: 'ShieldCheck',
    title: 'Гарантия на работы',
    description: `Договор и гарантия до ${business.warrantyYears} лет на все виды штукатурных и шпаклевочных работ.`,
  },
  {
    icon: 'Wrench',
    title: 'Свой инструмент и материалы',
    description: 'Работаем на профессиональном оборудовании, помогаем подобрать материалы под бюджет.',
  },
  {
    icon: 'Droplets',
    title: 'Чистота на объекте',
    description: 'Защищаем мебель и полы, убираем строительный мусор после каждого этапа работ.',
  },
  {
    icon: 'Clock',
    title: 'Соблюдение сроков',
    description: 'Фиксируем сроки в договоре и укладываемся в них — без переносов и простоев.',
  },
  {
    icon: 'Receipt',
    title: 'Прозрачная смета',
    description: 'Финальная цена известна заранее, доплат за «непредвиденные работы» не бывает.',
  },
  {
    icon: 'Camera',
    title: 'Фотоотчёт о работах',
    description: 'Присылаем фото на каждом этапе — вы видите процесс, даже если не можете быть на объекте.',
  },
]

export type PortfolioItem = {
  title: string
  note: string
  beforeSrc?: string
  afterSrc?: string
}

export const portfolioItems: PortfolioItem[] = [
  { title: 'Штукатурка стен по маякам', note: 'Квартира, 54 м²' },
  { title: 'Выравнивание потолка', note: 'Студия, 28 м²' },
  { title: 'Шпаклевка под обои', note: 'Коттедж, 3 комнаты' },
  { title: 'Шпаклевка под покраску', note: 'Квартира, гостиная' },
  { title: 'Демонтаж и подготовка стен', note: 'Вторичное жильё' },
  { title: 'Откосы и углы', note: 'Новостройка, черновая отделка' },
]

export type Review = {
  name: string
  location: string
  rating: number
  text: string
}

export const reviews: Review[] = [
  {
    name: 'Клиент',
    location: 'г. Москва',
    rating: 5,
    text: 'Текст отзыва появится здесь после сдачи объекта.',
  },
  {
    name: 'Клиент',
    location: 'г. Москва',
    rating: 5,
    text: 'Текст отзыва появится здесь после сдачи объекта.',
  },
  {
    name: 'Клиент',
    location: 'Московская область',
    rating: 5,
    text: 'Текст отзыва появится здесь после сдачи объекта.',
  },
]
