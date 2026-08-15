# RackTag

Warehouse QR label generator deployed on Vercel.

## Usage analytics (database)

RackTag can store anonymous usage events in **Vercel Postgres** when users opt in (footer checkbox, on by default).

### Setup on Vercel

1. Open your project in the [Vercel Dashboard](https://vercel.com/dashboard).
2. Go to **Storage** → **Create Database** → **Postgres** (Neon).
3. Connect the database to the RackTag project.
4. Open the database **Query** tab and run `sql/init.sql` (optional — the API also creates the table automatically).
5. Redeploy the project.

Vercel injects `POSTGRES_URL` automatically. Without it, the app still works; analytics requests return `503` and are ignored in the browser.

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
