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

## Automatic delivery status

**Automatic WhatsApp delivery is not enabled.** Scheduling stores the intended time and the dashboard enforces it for manual handoff, but it does not run a background worker and does not send messages on its own. Automatic delivery requires an official WhatsApp Business Platform provider integration, server-side credentials stored as secrets, a delivery worker, and any required business/template approvals. Do not put provider secrets in browser code.

The manual handoff only pre-fills text. Attachments must be added in WhatsApp manually. A click on the handoff button is not a delivery receipt.

## Backend

Tables: `mf_contacts`, `mf_campaigns`, `mf_attachments`, `mf_message_jobs`, and `mf_message_events`. Row-level security scopes records to the authenticated owner. Attachments use the private `messageflow-attachments` Storage bucket.

## Deployment

- Repository: https://github.com/aurbta/Whatsapp
- Production app: https://whatsapp-sigma-jade.vercel.app/
- Vercel project: `whatsapp`, connected to `main`
