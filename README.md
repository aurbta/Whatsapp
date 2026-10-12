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

**This is infrastructure, not an active sender yet.** It requires valid Meta Business Platform credentials, approved templates, environment variables, and a successful production deployment. Vercel Cron runs every five minutes on plans that support that frequency; the Hobby plan only supports daily cron jobs, so a five-minute schedule will fail to deploy there. Cron times use UTC. Test with a small, consented recipient set before any wider use.

## Automatic delivery status

**Automatic WhatsApp delivery is not enabled.** Scheduling stores the intended time and the dashboard enforces it for manual handoff, but it does not run a background worker and does not send messages on its own. Automatic delivery requires an official WhatsApp Business Platform provider integration, server-side credentials stored as secrets, a delivery worker, and any required business/template approvals. Do not put provider secrets in browser code.

The manual handoff only pre-fills text. Attachments must be added in WhatsApp manually. A click on the handoff button is not a delivery receipt.

## Backend

Tables: `mf_contacts`, `mf_campaigns`, `mf_attachments`, `mf_message_jobs`, and `mf_message_events`. Row-level security scopes records to the authenticated owner. Attachments use the private `messageflow-attachments` Storage bucket.

## Deployment

- Repository: https://github.com/aurbta/Whatsapp
- Production app: https://whatsapp-sigma-jade.vercel.app/
- Vercel project: `whatsapp`, connected to `main`
