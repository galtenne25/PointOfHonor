export interface Memorial {
  id: string
  name: string
  subtitle: string        // unit / battle / classification
  date: string            // Hebrew or Gregorian date string
  description: string
  imageUrl: string
  soldierImageUrl?: string // optional portrait for story cards
  distance: string
  tags: string[]
}

export const memorials: Memorial[] = [
  {
    id: '1',
    name: 'אנדרטת גבעת התחמושת',
    subtitle: 'חטיבת הצנחנים, מלחמת ששת הימים',
    date: "כ\"ו באייר ה'תשכ\"ז | 5 ביוני 1967",
    description:
      'גבעת התחמושת הייתה מוצב ירדני שכיבושו היה חיוני לשחרור העיר העתיקה. ' +
      'בקרב עקוב מדם נפלו כאן לוחמי הצנחנים של חטיבה 55. ' +
      'האנדרטה מנציחה את גבורתם וסיפרת את ההקרבה למען ירושלים.',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    distance: '1.2 ק"מ',
    tags: ['חרבות ברזל', 'בקרבת מקום'],
  },
  {
    id: '2',
    name: 'יד לשריון — לטרון',
    subtitle: 'חיל השריון, מלחמת העצמאות ומלחמות ישראל',
    date: "ה'תש\"ח | 1948",
    description:
      'מוזיאון ואנדרטה המוקדשים לזכר לוחמי חיל השריון שנפלו בכל מלחמות ישראל. ' +
      'כלי רכב משוריינים מכל הדורות ממוקמים לאורך הגן כדי לספר את סיפור הקרבות.',
    imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=600&q=80',
    distance: '38 ק"מ',
    tags: ['אנדרטה', 'מוזיאון'],
  },
  {
    id: '3',
    name: 'גן הנצחה — הר הרצל',
    subtitle: 'בית הקברות הצבאי הלאומי',
    date: 'מוסד קבע לאומי',
    description:
      'הר הרצל הוא בית הקברות הצבאי הלאומי של מדינת ישראל. ' +
      'כאן נטמנו חללי מערכות ישראל לדורותיהן, ובמרומי ההר מנוחתם של מנהיגי האומה. ' +
      'הגן משמש כאתר הנצחה ועלייה לרגל המרכזי של המדינה.',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80',
    distance: '3.5 ק"מ',
    tags: ['בקרבת מקום', 'נפגעי פעולות איבה'],
  },
  {
    id: '4',
    name: 'אנדרטת יחידה 8200',
    subtitle: 'יחידת המודיעין 8200, מלחמת יום הכיפורים',
    date: "י' בתשרי ה'תשל\"ד | 6 באוקטובר 1973",
    description:
      'אנדרטה ייחודית המנציחה את לוחמי יחידת המודיעין שנפלו במלחמת יום הכיפורים. ' +
      'הקרב על מעברי החרמון הפך לאחד מסמלי הגבורה של המלחמה.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80',
    soldierImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    distance: '156 ק"מ',
    tags: ['חרבות ברזל'],
  },
  {
    id: '5',
    name: 'מצפה דני כהן',
    subtitle: 'גדוד 101, מבצע שומר החומות',
    date: '23.10.1991 – 2.10.2023',
    description:
      'מצפה הקרוי על שמו של דני כהן, שנפל בקרב בדרום הרצועה. ' +
      'המצפה ניצב על פסגה המשקיפה על שדות הנגב ומאפשר הנצחה שקטה ומרוממת רוח.',
    imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80',
    soldierImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    distance: '1.2 ק"מ',
    tags: ['חרבות ברזל', 'בקרבת מקום', 'נפגעי פעולות איבה'],
  },
]
