---
name: hebrew-copy
description: Write and format Hebrew product copy that reads naturally: voice, a fixed glossary, Hebrew punctuation, numbers, prices in ₪, dates, plurals, and mixing English names into right-to-left text, on the web and in the mobile app. Use for any visible copy, email, or notification when the product's locales include Hebrew (`he`).
---

# Hebrew copy

Apply these rules to every visible string, email, push notification, and error message when `Product locales` in `PRODUCT.md` includes `he`. Layout direction (RTL) has its own rules: `rtl-layout` on mobile, the web RTL rules in `z2a`.

## Voice

- Address users in the plural imperative: בחרו, התחילו, לחצו, נסו שוב. It is the natural Israeli product voice and avoids choosing a gender. Never use slash forms (בחר/י, את/ה).
- Write the way an Israeli product talks, not a translation of English. Short sentences, active voice, no "אנא" and no "הינך".
- Say what happened and what to do next: "לא הצלחנו לשמור. נסו שוב בעוד רגע.", not "שגיאה 500".
- Keep English product and brand names in English (Google, Apple, PostHog). Don't transliterate them.
- When a draft reads like a translation, rewrite it from the meaning.

## Glossary

Use these words, consistently across the product:

| Concept | Use | Not |
| --- | --- | --- |
| Sign in | התחברות, להתחבר | לוגין, כניסה למערכת |
| Sign out | התנתקות | לוגאאוט, יציאה מהמערכת |
| Sign up | הרשמה, יצירת חשבון | רישום |
| Account | חשבון | פרופיל משתמש |
| Email | אימייל | מייל אלקטרוני, דוא״ל in UI |
| Password | סיסמה | סיסמא |
| Settings | הגדרות | העדפות |
| Subscription | מנוי | סאבסקריפשן |
| Payment | תשלום | |
| Save, cancel, delete, send | שמירה, ביטול, מחיקה, שליחה (buttons may use the imperative: שמרו) | |
| Link | קישור | לינק |
| Try again | נסו שוב | |

## Punctuation

- Acronyms and abbreviations take gershayim `״` (U+05F4): ש״ח, דוא״ל, בע״מ. Not the ASCII `"`.
- Abbreviations and transliterated sounds take geresh `׳` (U+05F3): ג׳ינס, וכו׳. Not the ASCII `'`.
- A Hebrew prefix before a number, a Latin word, or an acronym takes maqaf `־` (U+05BE): ל־Google, ב־2026, ה־API.
- Quotation marks in running text: `"..."` or `״...״`, consistently in one product.

## Numbers, prices, dates

Use `Intl` with the `he-IL` locale. Verified on Node and on Hermes (iOS):

| What | Code | Output |
| --- | --- | --- |
| Price | `new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(1234.5)` | `‏1,234.50 ‏₪` |
| Whole shekels | add `maximumFractionDigits: 0` | `‏590 ‏₪` |
| Number | `new Intl.NumberFormat('he-IL').format(1234567.891)` | `1,234,567.891` |
| Long date | `new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' })` | `2 באוקטובר 2026` |
| Short date | `{ dateStyle: 'short' }` | `2.10.2026` |
| Time | `{ timeStyle: 'short', timeZone: 'Asia/Jerusalem' }` | `18:05` (24-hour) |
| Hebrew date | locale `he-IL-u-ca-hebrew`, `{ dateStyle: 'long' }` | `כ״א בתשרי תשפ״ז` |

- The ₪ sign comes after the number, and the formatted string includes invisible right-to-left marks (U+200F). Render the formatter's output as is; don't build prices by concatenating `'₪' + n`.
- Servers run in UTC (Vercel, EAS Hosting). Always pass `timeZone: 'Asia/Jerusalem'` when formatting a time on the server or in an email, or times are off by two or three hours.
- The week starts on Sunday; the weekend is Friday and Saturday.

## Plurals and lists

Hebrew counts have three forms: one (יום אחד), two (יומיים, or 2 + plural for most nouns), and other (3 ימים).

- Web and Node: `new Intl.PluralRules('he-IL').select(n)` returns `one`, `two`, or `other`. `Intl.ListFormat` gives `אבא, אמא וילדים`, and `Intl.RelativeTimeFormat` gives `אתמול` and `בעוד 3 ימים`.
- Mobile: Hermes on iOS throws on `Intl.PluralRules`, `Intl.ListFormat`, and `Intl.RelativeTimeFormat`. Write small helpers instead:

  ```ts
  /** count(1, ['יום אחד', 'יומיים', 'ימים']) → 'יום אחד'; count(5, …) → '5 ימים' */
  export function count(n: number, [one, two, many]: [string, string, string]) {
    if (n === 1) return one;
    if (n === 2) return two;
    return `${n} ${many}`;
  }
  ```

  For a nominal with no dual form, pass the plural for `two` as `'2 משתמשים'`.

## English inside Hebrew

Text that runs left to right (English names, emails, URLs, phone numbers, code) inside a Hebrew sentence must be isolated, or punctuation jumps to the wrong side.

- Web: wrap it in `<bdi>`, or `<span dir="ltr">` for emails, URLs, and phone numbers.
- Mobile and plain-text email: wrap it in Unicode isolates, `⁨…⁩` (first-strong isolate) for names and `⁦…⁩` (left-to-right isolate) for emails, URLs, and phone numbers.
- Write Israeli mobile numbers as `050-123-4567` and display them left to right.

## Check

Before finishing, read every changed string once in context (the rendered page, screen, or email), and fix anything that sounds translated, uses a glossary "Not" word, uses ASCII `"` or `'` in an acronym, or shows misplaced punctuation around English text.
