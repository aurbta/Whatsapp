# MessageFlow

Supabase-backed campaign preparation dashboard with a consent-first workflow.

## Implemented features

### Foundation and contacts
- Email/password authentication
- Contact management, search, pagination, manual entry, and CSV export
- Excel/CSV import with preview, duplicate detection, and invalid-row reporting
- Indian mobile normalization to `+91`, E.164 international phone support, English/Hindi column headers
- New contacts default to `opted_in = false`; importing a number never implies consent

### Composer and attachments
- Message composer and live preview; supports `{{name}}` personalization
- Up to 20 attachments per campaign, up to 20 MB per file
- Image/video previews, document type labels, private Supabase Storage uploads
- Upload cleanup attempts when an attachment or metadata record fails

### Queue and manual WhatsApp handoff
- Persistent campaign and recipient-job records
- Optional future `scheduled_at` time per recipient job
- Pause, resume, and cancel controls for campaigns
- Queue progress/status view and activity history
- Manual WhatsApp handoff for eligible pending jobs: opens a `wa.me` link with a prefilled personalized text message
- Handoff is blocked for contacts not marked opted in, paused campaigns, and jobs whose scheduled time has not arrived

## Phase 6: guarded cloud worker

The repository now includes a server-side worker at `/api/worker` and a Vercel Cron entry. The worker is intentionally inert until all required server-side environment variables exist and the request is authenticated with `CRON_SECRET`.

Set these in **Vercel → Project Settings → Environment Variables** (never in `index.html` or in chat):

- `CRON_SECRET`: a long random secret (at least 16 characters)
- `SUPABASE_URL`: the Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role secret; server-side only
- `WHATSAPP_ACCESS_TOKEN`: official WhatsApp Business Platform access token
- `WHATSAPP_PHONE_NUMBER_ID`: the sending phone number ID from Meta
- `WHATSAPP_GRAPH_API_VERSION`: a currently supported Graph API version

For automated delivery, create a campaign with an approved WhatsApp template name and the exact template language code (for example, `en_US`). The worker only claims due jobs for queued campaigns and contacts marked opted in, and it sends template messages only. If the campaign text includes `{{name}}`, the contact name is passed as the template's first body parameter. Attachments are not sent by this worker. Provider failures are recorded as failed jobs; check the dashboard and Vercel function logs before retrying.

**Current deployment state:** `CRON_SECRET`, `SUPABASE_URL`, and `WHATSAPP_GRAPH_API_VERSION=v26.0` are configured in Vercel Production. The worker is deployed, but automatic sends are not active because the Supabase service-role key, Meta access token, and WhatsApp Phone Number ID still need to be configured. The current Vercel Hobby cron is set to run daily at 03:00 UTC; this is not suitable for precise near-real-time scheduling. Plans supporting more frequent cron execution or a separate secure scheduler are needed for a faster queue. Test with a small, consented recipient set before any wider use.

## Automatic delivery status

**Automatic WhatsApp delivery is not active yet.** The deployed worker can send approved template messages through the official WhatsApp Cloud API once all required server-side credentials and Meta approvals are configured. Until then, queues remain pending and no WhatsApp messages are sent automatically. Never put provider secrets in browser code or share them in chat.

The manual handoff only pre-fills text. Attachments must be added in WhatsApp manually. A click on the handoff button is not a delivery receipt.

## Backend

Tables: `mf_contacts`, `mf_campaigns`, `mf_attachments`, `mf_message_jobs`, and `mf_message_events`. Row-level security scopes records to the authenticated owner. Attachments use the private `messageflow-attachments` Storage bucket.

## Deployment

- Repository: https://github.com/aurbta/Whatsapp
- Production app: https://whatsapp-sigma-jade.vercel.app/
- Vercel project: `whatsapp`, connected to `main`
