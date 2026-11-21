# Growtica update notes

## What changed
- Added a public, responsive Growtica homepage with feature overview, About, Contact and FAQ sections.
- Added a responsive hamburger navigation drawer with outside-click, Escape-key and scroll-lock behavior. Private workspace links lead to sign-in and preserve the requested destination after authentication.
- Kept the existing Supabase authentication client, profile loading, database access, row-level security assumptions, admin checks, news module, page controllers and user-data schema unchanged.
- Added public Privacy Policy and Terms pages and kept the existing authenticated privacy fragment available.
- Added a blue-to-teal workspace header and responsive layout refinements for forms, cards, grids, tables and mobile navigation.
- Added dark-mode styling for the public pages and retained the existing persisted theme preference.
- Updated PWA metadata and service-worker cache version so the new homepage and assets can be refreshed.

## Important deployment checks
- No SQL migration is required by this front-end update.
- Confirm the Supabase Authentication Site URL and redirect allowlist match the deployed domain.
- Review the public Privacy Policy and Terms against the actual operating entity, jurisdiction, retention practices and any third-party analytics/advertising before production use. AdSense approval is not guaranteed by site design alone.
- Test sign-up, email confirmation, sign-in, password reset, user data CRUD, news publishing/reading and admin access against the existing Supabase project after deployment.
- Test the site over HTTPS or localhost; the app shell and Supabase services are not fully usable from a `file://` URL.


## Responsive dashboard and Growth Score update
- Added Day, Month and Year reporting-period selection to the existing Overview.
- Added a Growth Score calculated as the equal-weight average of prayer completion and personal-task completion for the selected period. Only areas with records are included; when no area has records the score displays an em dash.
- Kept the existing Overview statistics, activity chart, trading snapshot, today's prayer/task panels, daily reminder and their original element IDs.
- Added a responsive, reference-inspired gradient overview hero and score ring.
- Expanded responsive layout safeguards for authenticated pages, forms, cards, tables, navigation and controls.
- Bumped the service-worker cache version so deployed clients can receive the updated files.


## Follow-up refinement — horizontal Overview and financial Growth Score
- Kept the Overview hero in a horizontal text-left / score-right layout at mobile widths, with fluid sizing for narrow screens.
- Growth Score now averages available prayer completion, task completion, trading performance, and expense/income health. Trading performance is normalized from net P/L against total wins plus losses.
- Expense health is 100% at zero spend and declines proportionally against the selected period income budget, reaching 0% at or above budget. Expense scoring is included when monthly income is configured in Settings.
- Period savings now uses estimated income for the selected day, month, or year minus period expenses. No database or SQL changes.


## v3 Growth Score initialization
- A newly registered account with no recorded activity now displays **0%** instead of a dash.
- The score detail displays “No activity recorded yet” until there is tracked data.
- Existing scoring inputs and dashboard sections remain unchanged.
