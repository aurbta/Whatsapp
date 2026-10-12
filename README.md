# MessageFlow — Phase 2

Supabase-backed, consent-first campaign preparation dashboard.

## Phase 1 foundation
- Email/password authentication
- Contact management and CSV export
- Message composer, preview, and multiple private attachments
- Persistent campaign recipient queues and activity history
- Owner-scoped Row Level Security (RLS)
- Private `messageflow-attachments` Storage bucket (20 MB per file)

## Phase 2 — Excel Contact Manager
- Import `.xlsx`, `.xls`, and `.csv` files
- Import preview with new, already-saved, duplicate, and invalid row counts
- Duplicate detection inside the spreadsheet and against saved contacts
- Indian mobile normalization to `+91`, including numbers entered with a leading `0`
- E.164 international phone-number support
- English and Hindi name/mobile column headers
- Header detection within the first 10 rows, including sheets with title rows
- Batched database upserts (200 contacts per batch) and paginated contact list
- New contacts default to `opted_in = false`; consent is never assumed from importing a number

## Safety boundary
WhatsApp/SMS sending is intentionally disabled in Phase 2. This app prepares campaign queues; it does not send messages.

## Backend
Tables: `mf_contacts`, `mf_campaigns`, `mf_attachments`, `mf_message_jobs`, and `mf_message_events`. Row-level security scopes records to the authenticated owner.

## Deployment
Repository: https://github.com/aurbta/Whatsapp
Vercel project: `whatsapp`, connected to the `main` branch. Git-based deployments are enabled.
