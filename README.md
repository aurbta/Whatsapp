# MessageFlow — Phase 1

Supabase-backed, consent-first campaign preparation dashboard.

## Features
- Email/password authentication
- Excel/CSV contact import and duplicate detection
- Contact management and CSV export
- Message composer, preview, and private attachments
- Persistent campaign recipient queues and activity history
- Only opted-in contacts can enter a queue

## Safety boundary
WhatsApp/SMS sending is intentionally disabled in Phase 1. This app prepares campaign queues; it does not send messages.

## Backend
Tables: `mf_contacts`, `mf_campaigns`, `mf_attachments`, `mf_message_jobs`, and `mf_message_events`. Records are protected with owner-scoped Row Level Security. The `messageflow-attachments` Storage bucket is private, with a 20 MB file limit.

## Deployment
Source repository: https://github.com/aurbta/Whatsapp
Vercel project: `whatsapp`, connected to the `main` branch of this repository. Git-based deployments are enabled.
