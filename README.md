<div dir="rtl">

# 🕯️ נקודת ציון — Memorial Map

> פלטפורמה חברתית מבוססת-מיקום להנצחת חללי מערכות ישראל ונפגעי פעולות האיבה.

![צילום מסך של האפליקציה — נקודת ציון](./Photos/APPimage.png)

> *תצוגת המפה האינטראקטיבית של האפליקציה, המציגה את אתרי ההנצחה ומסלולי המורשת על-גבי מפה חיה.*

### 🔗 קישור לאפליקציה החיה
**[https://memorial-map-murex.vercel.app/map](https://memorial-map-murex.vercel.app/map)**


---

## סקירה כללית

**נקודת ציון** היא פלטפורמה חברתית אינטראקטיבית מבוססת-מיקום, שנועדה לשמר את מורשתם וסיפוריהם של חללי מערכות ישראל ונפגעי פעולות האיבה. האפליקציה ממירה את ההנצחה מחוויה סטטית וחד-כיוונית לחוויה חיה, קהילתית ומשתפת — הקושרת בין סיפור אנושי לבין נקודה פיזית על המפה.

---

## הבעיה

עם ישראל חווה אירועים טרגיים ומכוננים רבים כתוצאה ממלחמות ופעולות איבה, ומשקיע משאבים ועתים רבים בהנצחת הנופלים. אולם למרות זאת, **לא קיימת בישראל פלטפורמה אחת מאוחדת** לכך. אין רשת חברתית ייעודית שבה ניתן להנציח, לשתף סיפורים, לתת ביטוי לכאב, ולעודד אחרים לבקר באתרי ההנצחה ולחלוק כבוד ליקיריהם. המידע מפוזר, אובד וחסר הקשר גאוגרפי.

---

## קהל היעד

| קהל | הצורך |
| --- | --- |
| **משפחות שכולות** | שימור הסיפור האישי של יקיריהן והנגשתו לציבור הרחב. |
| **מטיילים ומטפסים** | התחברות למורשת ולסיפורים של המקומות שבהם הם מבקרים. |
| **הציבור הרחב ומערכת החינוך** | דרך משמעותית, חווייתית ופעילה להתחבר לזיכרון הלאומי. |

---

## מתחרים ובידול

| המתחֵר | החיסרון |
| --- | --- |
| **אתר "יזכור" הרשמי** | סטטי, מיושן, וחסר ממדים קהילתיים ומבוססי-מיקום. |
| **קבוצות פייסבוק / וואטסאפ** | המידע נקבר, אינו מאורגן, ואינו קשור לניווט פיזי בשטח. |
| **גיליונות Excel ומסמכים** | מבוזרים, לא נגישים ולא חווייתיים. |

### 🎯 הבידול שלנו
מפה אינטראקטיבית מבוססת-מיקום, המשולבת עם רכיבים חברתיים — **הדלקת נר וירטואלי, פיד קהילתי וסיפורים שנכתבים על-ידי המשתמשים** — ההופכים את ההנצחה מחוויה פסיבית לחוויה פעילה, חיה ומשותפת.

---

## הפיצ'רים המרכזיים

- 🗺️ **מפה אינטראקטיבית** — תצוגת אתרי הנצחה ומסלולי מורשת על-גבי מפה חיה, עם אשכולות סמנים (clustering), חיפוש וסינון לפי קטגוריות (חרבות ברזל, מלחמת ששת הימים, נפגעי איבה).
- ➕ **הוספת תוכן על-ידי המשתמשים** — הוספת נקודות הנצחה ומסלולים חדשים באמצעות נעיצה ישירה על המפה, כולל סיפורים ותמונות.
- 🕯️ **הדלקת נר וירטואלי** — מונה נרות חי לכל אתר הנצחה, המתעדכן בזמן אמת ומאפשר מחווה אישית.
- 👥 **פיד קהילתי** — הזנת פעילות חברתית של הקהילה (נרות שהודלקו, נקודות שנוספו, מסלולים שהושלמו).
- 🔐 **מערכת משתמשים והרשאות** — הרשמה והתחברות, פרופיל אישי, ניהול התרומות של המשתמש, ופאנל ניהול (Admin) לבקרת תוכן.
- 🧭 **ניווט במסלולי מורשת** — מסלולים מודרכים עם נקודות-ציון ומסך ניווט פעיל בשטח.

---
## טבלת שירותים חיצוניים ואינטגרציות

| שירות / טכנולוגיה | סוג | שימוש בפרויקט ותפקיד ארכיטקטוני |
| --- | --- | --- |
| **Supabase** | Backend / Database / Auth | מסד נתונים PostgreSQL, אימות משתמשים (Email/Password), ומערכת הרשאות אבטחה ברמת השורה (Row Level Security). |
| **Wikidata SPARQL API** | External API | אינטגרציה מורכבת לשאיבת נתוני אמת. המערכת מתממשקת ל-API של ויקינתונים כדי למשוך אתרי הנצחה בישראל, תיאורים וקואורדינטות בצורה אוטומטית (Data Pipeline). |
| **Algorithmic Routing Engine** | Server-side Logic | מנוע חישוב (Node.js) המעבד את נתוני ה-API החיצוניים. משתמש באלגוריתם *Nearest Neighbor* ונוסחת *Haversine* לחשוב מרחקים ויצירת מסלולי מורשת אוטומטיים. |
| **AI Synthetic Pipeline** | AI Data Generation | שימוש במודלי שפה חכמים (AI) ליצירת מנגנון Seeding המאכלס את מסד הנתונים בתוכן מורשת איכותי ועשיר ללא צורך בהזנה ידנית. |
| **Leaflet + OpenStreetMap** | Maps SDK / API | רינדור המפה האינטראקטיבית, הטענת אריחי המפה, והצגת אשכולות סמנים מבוססי מיקום (`leaflet.markercluster`). |
| **Vercel** | Deployment / Hosting | אירוח האפליקציה בסביבת ייצור (Production), כולל הגדרות ניתוב ל-SPA. |
| **GitHub Actions** | CI/CD | הרצה אוטומטית של חבילת הבדיקות בכל `push` ו-`pull request` לענף `main`. |
| **Vitest + Testing Library** | Testing | בדיקות יחידה ואינטגרציה לשירותים ולרכיבי ה-UI. |

    ---

## מודל הנתונים (ERD)

תרשים הישויות והקשרים (Entity-Relationship Diagram) של מסד הנתונים, המתאר את הטבלאות המרכזיות של הפרויקט (משתמשים, אתרי הנצחה, מסלולים, נרות ופעילות קהילתית) ואת הקשרים ביניהן.

![תרשים ERD של מסד הנתונים](./Photos/ERD.png)

---

## הוראות הרצה מקומית

```bash
# 1. שכפול המאגר
git clone <repository-url>
cd MyProject

# 2. התקנת התלויות
npm install

# 3. הגדרת משתני הסביבה
# יש ליצור קובץ .env בתיקיית השורש עם המפתחות הבאים:
#   VITE_SUPABASE_URL=<your-supabase-url>
#   VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>

# 4. הרצת סביבת הפיתוח
npm run dev
```

האפליקציה תהיה זמינה בכתובת `http://localhost:5173`.

| פקודה | תיאור |
| --- | --- |
| `npm run dev` | הרצת שרת הפיתוח (Vite). |
| `npm run build` | בניית גרסת ייצור. |
| `npm test` | הרצת חבילת הבדיקות (Vitest). |

---

## משתמש דמו

לבדיקת האפליקציה ללא צורך בהרשמה, ניתן להתחבר באמצעות פרטי הדמו הבאים:

| | |
| --- | --- |
| **אימייל** | `[galtenne225@gmail.com]` |
| **סיסמה** | `[Tennec100]` |

---

## מחסנית טכנולוגית (Tech Stack)

`React 18` · `Vite` · `React Router v6` · `Tailwind CSS` · `Leaflet` · `Supabase` · `Vitest` · `PWA`


---

## Final Checklist for Submission

### Product Summary
- The system is a location-based memorial platform allowing users to create, explore, and interact with memorial sites on an interactive map.
- Focus: preserving memory through structured digital storytelling and geospatial context.

---

## Architecture Overview

Frontend (React)
↓
Authentication (Supabase Auth)
↓
Database Layer (Supabase Postgres)
↓
Geospatial Layer (Leaflet + OpenStreetMap)
↓
User Interactions (memorial creation, viewing, engagement)

---

## Key User Flow

1. User registers or logs in
2. User accesses interactive map
3. User creates or selects memorial location
4. User views memorial details (story, media, metadata)
5. User interacts (e.g., tribute / memory action)
6. Data is saved in Supabase and reflected on map

---

## External Services & Integrations

| Service | Type | Purpose |
|----------|------|---------|
| Supabase Auth | Authentication | User login and session management |
| Supabase Postgres | Database | Storage of memorials, users, and interactions |
| Leaflet | Mapping Library | Interactive map rendering and geospatial UI |
| OpenStreetMap | Map Tiles API | Base map data provider |
| Vercel | Hosting | Production deployment |

---

## Database Model (ERD Reference)

The database includes core entities such as:
- Users
- Memorials
- Locations (lat, lng)
- User interactions (tributes / actions)

Relationships:
- User → Memorials (1 to many)
- Memorial → Location (1 to 1)
- Memorial → Interactions (1 to many)

(See full ERD diagram in `/docs/ERD.png` or Supabase Schema Visualizer)

---

## Deployment

- The application is deployed on Vercel
- All core flows are fully functional in production
- No local setup required for evaluation

---

## Notes on Product Design

- The system is designed for a single clear core use case: digital memorial creation and exploration
- Emphasis on simplicity, emotional clarity, and map-based interaction
- Mobile responsive and RTL compatible

---

</div>
