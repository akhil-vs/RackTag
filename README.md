# RackTag

Warehouse QR label generator deployed on Vercel with optional enterprise B2B features: organizations, billing, audit export, API, and SSO.

## Usage analytics (database)

RackTag can store anonymous usage events in **Vercel Postgres** when users opt in (footer checkbox, on by default).

### Setup on Vercel

1. Open your project in the [Vercel Dashboard](https://vercel.com/dashboard).
2. Go to **Storage** → **Create Database** → **Postgres** (Neon).
3. Connect the database to the RackTag project.
4. Open the database **Query** tab and run `sql/init.sql` (optional — the API also creates tables automatically).
5. Set env vars from `.env.example` (`AUTH_SECRET`, optional Stripe/OIDC/SETUP_TOKEN).
6. Redeploy the project.

Vercel injects `POSTGRES_URL` automatically. Without it, the app still works; analytics requests return `503` and are ignored in the browser.

## Enterprise / paid product

| Route | Purpose |
|-------|---------|
| `/login` | Email/password sign-in |
| `/admin/insights` | Demand validation dashboard (`usage_events` metrics) |
| `/admin/pilot` | Interview pipeline + manual pilot activation |
| `/admin/billing` | Stripe Pro checkout |
| `/admin/audit` | CSV audit export (user + label events) |
| `/admin/enterprise` | Custom templates, API keys, webhooks, SSO config |
| `POST /api/v1/labels` | REST label generation (`Authorization: Bearer rtk_…`) |
| `POST /api/auth/register` | Bootstrap first org (requires `SETUP_TOKEN`) |

Plans: **free** (500 labels/mo), **pilot** (10k, manual), **pro** (unlimited via Stripe), **enterprise** (SSO + API + webhooks).

Label templates are loaded from `/api/org/config` and enforced server-side via `/api/usage/check`.

### Stored events

| Event | When |
|-------|------|
| `app_open` | App loads |
| `tab_change` | User switches label type tab |
| `camera_start` | Camera opened (barcode or text mode) |
| `scan_barcode` | Barcode decoded or selected |
| `scan_text` | OCR word selected |
| `download_png` | Label PNG downloaded |
| `add_to_sheet` | Label added to print sheet |
| `print_sheet` | Print sheet printed |
| `clear_sheet` | Print sheet cleared |

Each row includes a random session id, tab, optional label code, sheet count, user agent, and timestamp.

### Query example

```sql
SELECT created_at, event_type, tab, label_code, sheet_count
FROM usage_events
ORDER BY created_at DESC
LIMIT 100;
```
