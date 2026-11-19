# My Daily Routine — Supabase web app

A mobile-friendly Vanilla HTML/CSS/JavaScript Progressive Web App (PWA) with a permanent header/footer, hash-based Fetch navigation, Supabase Auth, database records, profile avatars, and RLS-protected user data.

## Before you start

- This project uses your Supabase project URL and **publishable** browser key in `js/supabase-config.js`. A publishable key is intended for browser use; never add a `service_role` or secret key.
- Run the SQL scripts in the exact order below. The frontend cannot create its own schema.
- The admin interface is intentionally limited. It supports protected platform counts and announcements. Banning/deleting Auth users requires a trusted server-side function using a secret key; this ZIP does not expose that key or pretend a browser-only ban is secure.

## 1. Supabase setup

1. Open your Supabase project.
2. Go to **SQL Editor → New query**.
3. Open `sql/database-schema.sql` from this ZIP, copy all its contents, paste into SQL Editor and press **Run**.
4. Repeat with `sql/rls-policies.sql`.
5. Repeat with `sql/storage-policies.sql`.
6. If Supabase reports an error, stop and keep the full error text; do not delete tables or run unrelated repair commands. The schema script is designed to be rerun, but it cannot safely infer ownership for legacy rows that have no `user_id` value.
7. Open **Authentication → URL Configuration**. Set Site URL to your deployed URL. Add the deployed URL and `https://YOUR-DOMAIN/**` to Redirect URLs. For local testing, add your local preview origin.
8. Open **Authentication → Providers → Email** and make sure Email is enabled. Keep email confirmation enabled for a public app; configure SMTP if you need reliable production delivery.
9. Storage bucket `avatars` is created by the supplied SQL and is public-read for profile images. Upload/update/delete is restricted to each user's own UUID folder.

## 2. Create the first administrator safely

Do not add an admin signup field. First register your own normal account through the website. In Supabase, open **Authentication → Users**, copy that account's UUID. Then run this SQL in SQL Editor, replacing the UUID:

```sql
insert into public.user_roles(user_id, role)
values ('PASTE-YOUR-AUTH-USER-UUID-HERE', 'admin')
on conflict(user_id, role) do nothing;
```

The browser cannot insert into `user_roles`. Admin checks are performed by the `is_admin()` database function. The admin page and admin RPC are not secured merely by hiding the menu.

## 3. Test on Android with Acode

1. Extract `daily-routine.zip` using your phone's file manager.
2. In Acode, choose **Open Folder** and select the extracted `daily-routine` folder.
3. Confirm `js/supabase-config.js` contains your project URL and publishable key.
4. Do not open `index.html` with a `file://` URL. Fetch navigation and Supabase auth need an HTTP server.
5. Use Acode's preview/server feature if it serves the folder over HTTP. If not, push the folder to GitHub and use Vercel as described below.
6. Open the served site, register, confirm your email if required, then sign in.
7. Test adding a prayer record, expense, trade, task and profile picture. Sign out/in to confirm saved records remain.

## 4. GitHub and Vercel deployment

1. Create a GitHub repository.
2. Upload the **contents** of this folder, keeping the folders and file names unchanged.
3. In Vercel, choose **Add New → Project**, import the repository.
4. Framework preset: **Other**. Build command: leave empty. Output directory: `.` (root). Deploy.
5. Copy the deployed HTTPS URL.
6. In Supabase **Authentication → URL Configuration**, set Site URL to that URL and add it to Redirect URLs.
7. Redeploy if you changed source files.

## 5. Features included

- Registration, email/password login, logout, persistent sessions, password reset and password change.
- Single fixed sidebar/header/footer; page fragments are loaded by Fetch into one content region; hash navigation supports back/forward.
- Prayer yes/no tracker with editable dates and weekly/monthly counts.
- Expense create/edit/delete, category, totals and CSV export.
- Trading journal with separate winning/losing amount fields, validation, net P/L, win rate, history and CSV export.
- Monthly dashboard and analytics based on the signed-in user's saved rows.
- Calendar and personal tasks with completion/edit/delete.
- Profile details, currency, avatar upload/removal, dark/light theme.
- Admin role check, platform aggregate counts and announcements.

## 6. Privacy, community links and sharing

- The **Privacy Policy** is available from the app footer and explains the data handled by the app and its configured service providers.
- Footer community links: Telegram (`https://t.me/rj_traderhub`), WhatsApp (`https://wa.me/8801849723794`) and Facebook (`https://www.facebook.com/share/1Dx1vFdxcP/`).
- **Share with your friends** uses the device's native share sheet when supported. On supported browsers without Web Share, it copies the public website URL; a manual copy prompt is used as a fallback.

## 7. Install as a web app (PWA)

1. Deploy the site to an HTTPS address (Vercel provides HTTPS automatically).
2. Open the deployed website in Chrome on Android.
3. Open Chrome's menu and choose **Install app** or **Add to Home screen** (the wording can vary by Chrome version).
4. Launch **My Daily Routine** from the home screen. The service worker caches the app shell for faster loading and limited offline access. Sign-in and Supabase data operations still require an internet connection.
5. After publishing an update, if an older version remains visible, close and reopen the installed app or clear the site's cached data in Chrome.

## 8. Important notes and current boundaries

- Supabase SQL/RLS must be installed before the app can save data. The publishable key alone is not a substitute for setup.
- The Settings page includes a monthly-income editor. The dashboard estimates monthly savings as the saved monthly income minus expenses for the selected month. Enter or update income in **Settings → Monthly income**.
- The public avatar bucket exposes image URLs for display. Users can only upload/delete files under their own UUID folder.
- Admin user listing, account bans, and Auth user deletion are intentionally not implemented in browser code. They require a separately deployed Supabase Edge Function or trusted backend that validates `is_admin()` and uses a server-side secret. Never put that secret in `js/`.
- The application does not claim that unconfigured optional features (trade screenshot upload, goals, notification delivery, or daily quote service) are active.
- Use HTTPS in production. Keep your Supabase project backups and monitor Auth abuse/rate limits.

## 9. Troubleshooting

- **Page fails to load:** make sure you are using an HTTP server and that `pages/` is at the same level as `index.html`.
- **Supabase library error:** check internet access; the official JS v2 CDN script must load.
- **RLS error:** rerun `database-schema.sql`, then `rls-policies.sql`, then `storage-policies.sql`. Check that the signed-in user has a session.
- **Email confirmation:** check inbox/spam and configure SMTP under Supabase Auth for production.
- **Profile avatar upload denied:** confirm storage SQL ran and the bucket is named `avatars`.
- **Admin access denied:** assign the `admin` role to the correct Auth UUID using the SQL above, then sign out/in.

## 10. Project structure

```text
daily-routine/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── register.html
├── forgot-password.html
├── pages/                 # fetched page fragments, never separate app shells
├── css/                   # theme, layout, responsive and page styles
├── js/                    # Supabase, auth, router, PWA and page controllers
├── sql/                   # schema, RLS and Storage policies
└── assets/images/avatar.svg
```


Expense compatibility: the schema supports both `date` and legacy `spent_on` columns. The expense form writes both fields so an older NOT NULL `spent_on` column will not reject new expenses.


## Monthly income

After signing in, open the menu and choose **Settings**. Enter your monthly income and press **Save monthly income**. The amount is stored in your own `profiles.monthly_income` row and used by the dashboard's monthly savings card. The schema includes this column and the compatibility migration adds it to an existing profiles table if it is missing.

## Major News module (new)

Major News is an additive module for the existing authenticated Supabase app. It adds a horizontally scrollable category bar (Business, Trading, Forex, Crypto, Stock Market and Economy), article cards with prominent publication dates and NEW labels, a full-page reader, per-user synced read history, live article updates, and an admin-only publisher with image uploads.

### Install the news database objects

1. Keep your existing `database-schema.sql`, `rls-policies.sql` and `storage-policies.sql` setup unchanged.
2. In Supabase SQL Editor, run `sql/major-news.sql` after the existing setup scripts. It creates only `news_articles` and `news_reads`, the `news-images` Storage bucket and their policies/indexes, and adds the two news tables to `supabase_realtime`.
3. Confirm your intended publisher account already has the `admin` role in `public.user_roles`. The existing `is_admin()` function controls publishing and image uploads; the browser never receives a service-role key.
4. Deploy the updated project files. The service-worker cache version is bumped so the updated app shell can load.
5. Open Admin → Publish Major News. Upload a JPG/PNG/WebP image (maximum 8 MB), select a category, set the publication date, and publish the headline, summary and complete article.

Newly published stories become visible through Supabase Realtime. A reader's unread state is represented by the absence of their `(user_id, article_id)` row in `news_reads`; opening an article inserts that row. This keeps reading history individual and synchronized across devices without creating one row per user for every new article. Article deletion cascades its read-history rows.

**Editorial content note:** this package does not seed fabricated market headlines or pretend that generated copy is verified reporting. The feed starts in a clear empty state until an administrator publishes sourced and checked journalism. The article UI intentionally does not display source URLs or source fields, as requested.

### Supabase checks

- Ensure Realtime is enabled for `public.news_articles` and `public.news_reads` (the migration adds both to `supabase_realtime`).
- `news_articles` read policy allows authenticated users to read published stories; only admins can publish, edit or delete.
- `news_reads` policies restrict history to the signed-in user's UUID.
- The `news-images` bucket is public-read for article display; only admins can upload, update or delete images.
- Never place a Supabase service-role key in frontend files. Publishing uses the existing authenticated session and RLS.

The uploaded project contains a Supabase project URL and publishable key, but no live database inspection credentials or deployed runtime. Therefore the migration and frontend can be prepared and statically checked here, but live database execution, Storage upload, cross-device Realtime delivery and production browser testing must be completed against your Supabase project after deployment.


## Major News database compatibility note

If you have already run the Major News migration and publishing reports a missing `status` or `image_alt` column, run `sql/major-news-repair.sql` once in the Supabase SQL Editor. This script is repeatable and preserves existing articles. For a fresh install, run `sql/major-news.sql` after the existing database schema and RLS scripts. Do not drop or recreate `news_articles`.
