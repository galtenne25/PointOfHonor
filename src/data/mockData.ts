// ─── Types ───────────────────────────────────────────────────────────────────

export type MemorialType = 'אנדרטה' | 'מצפה' | 'מוזיאון' | 'בית קברות' | 'גן הנצחה'

export interface Memorial {
  id: string
  name: string
  type: MemorialType
  unit: string              // IDF unit / battle / classification
  date: string              // Hebrew date string shown under the name
  descriptionSnippet: string // ≤ 2 lines, used on cards
  description: string       // full text, used on the detail screen (Phase 3)
  imageUrl: string          // monument / landscape photo
  soldierImageUrl?: string  // portrait, used on StoryCards
  distance: string          // e.g. '1.2 ק"מ'
  tags: string[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const memorials: Memorial[] = [
  {
    id: '1',
    name: 'מצפה דני כהן',
    type: 'מצפה',
    unit: 'גדוד 101, חטיבת צנחנים',
    date: '23.10.1991 – 2.10.2023',
    descriptionSnippet:
      'נפל בקרב בדרום הרצועה במבצע "שומר החומות". המצפה מוקם על פסגה השוקפת לשדות הנגב.',
    description:
      'מצפה הקרוי על שמו של דני כהן ז"ל, שנפל בקרב בדרום רצועת עזה. ' +
      'המצפה ניצב על פסגה המשקיפה על שדות הנגב ומאפשר הנצחה שקטה ומרוממת רוח. ' +
      'במקום הוצב שלט זיכרון עם תמונתו ומה שסיפר על חלומותיו.',
    imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80',
    soldierImageUrl: 'https://images.unsplash.com/photo-1546961342-ea5f62d5a27b?w=300&q=80',
    distance: '1.2 ק"מ',
    tags: ['חרבות ברזל', 'בקרבת מקום', 'נפגעי פעולות איבה'],
  },
  {
    id: '2',
    name: 'אנדרטת גבעת התחמושת',
    type: 'אנדרטה',
    unit: 'חטיבת צנחנים 55, מלחמת ששת הימים',
    date: "כ\"ו באייר ה'תשכ\"ז | 5 ביוני 1967",
    descriptionSnippet:
      'נפל בקרב על שחרור ירושלים. האנדרטה מנציחה את לוחמי חטיבה 55 שנפלו כאן.',
    description:
      'גבעת התחמושת הייתה מוצב ירדני שכיבושו היה חיוני לשחרור העיר העתיקה. ' +
      'בקרב עקוב מדם נפלו כאן לוחמי הצנחנים של חטיבה 55. ' +
      'האנדרטה מנציחה את גבורתם וסיפרת את ההקרבה למען ירושלים.',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    distance: '1.2 ק"מ',
    tags: ['בקרבת מקום', 'חרבות ברזל'],
  },
  {
    id: '3',
    name: 'גן הנצחה — הר הרצל',
    type: 'גן הנצחה',
    unit: 'בית הקברות הצבאי הלאומי',
    date: 'מוסד קבע לאומי',
    descriptionSnippet:
      'בית הקברות הצבאי הלאומי. כאן נטמנו חללי מערכות ישראל לדורותיהן.',
    description:
      'הר הרצל הוא בית הקברות הצבאי הלאומי של מדינת ישראל. ' +
      'כאן נטמנו חללי מערכות ישראל לדורותיהן, ובמרומי ההר מנוחתם של מנהיגי האומה. ' +
      'הגן משמש כאתר הנצחה ועלייה לרגל המרכזי של המדינה.',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
    soldierImageUrl: 'https://images.unsplash.com/photo-1590086782792-42dd2350140d?w=300&q=80',
    distance: '3.5 ק"מ',
    tags: ['בקרבת מקום', 'נפגעי פעולות איבה'],
  },
  {
    id: '4',
    name: 'יד לשריון — לטרון',
    type: 'מוזיאון',
    unit: 'חיל השריון, מלחמות ישראל',
    date: "ה'תש\"ח | 1948 ואילך",
    descriptionSnippet:
      'מוזיאון ואנדרטה לזכר לוחמי חיל השריון. כלי רכב משוריינים מכל הדורות.',
    description:
      'מוזיאון ואנדרטה המוקדשים לזכר לוחמי חיל השריון שנפלו בכל מלחמות ישראל. ' +
      'כלי רכב משוריינים מכל הדורות ממוקמים לאורך הגן כדי לספר את סיפור הקרבות.',
    imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80',
    distance: '38 ק"מ',
    tags: ['אנדרטה', 'מוזיאון'],
  },
  {
    id: '5',
    name: 'אנדרטת יחידה 8200',
    type: 'אנדרטה',
    unit: 'יחידת המודיעין 8200, מלחמת יום הכיפורים',
    date: "י' בתשרי ה'תשל\"ד | 6 באוקטובר 1973",
    descriptionSnippet:
      'נפל בקרב על מעברי החרמון. אנדרטה המנציחה את לוחמי יחידת המודיעין.',
    description:
      'אנדרטה ייחודית המנציחה את לוחמי יחידת המודיעין שנפלו במלחמת יום הכיפורים. ' +
      'הקרב על מעברי החרמון הפך לאחד מסמלי הגבורה של המלחמה.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
    soldierImageUrl: 'https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?w=300&q=80',
    distance: '156 ק"מ',
    tags: ['חרבות ברזל'],
  },
]
