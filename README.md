# רדאר מנויים - אפליקציה

התראה 14 יום לפני כל חידוש - ומחליטים בזמן אם להשאיר או לבטל.

- **אתר:** https://rinaati-sketch.github.io/subscription-radar-app/
- **טכנולוגיה:** React, Vite, TypeScript, Tailwind, Supabase, PWA
- **פרסום:** כל דחיפה ל-main מתפרסמת אוטומטית (GitHub Actions)

## הרצה מקומית
```bash
npm install
npm run dev
```

## מסד נתונים
- `supabase/schema.sql` - הסכמה (RLS ופעולות ההחלטה)
- `supabase/schema.test.mjs` - בדיקות על Postgres מקומי (PGlite)
