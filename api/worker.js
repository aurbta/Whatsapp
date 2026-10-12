const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION;
const CRON_SECRET = process.env.CRON_SECRET;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  body: JSON.stringify(body),
});

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase returned ${response.status}`);
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!CRON_SECRET || req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const missing = [
    ["SUPABASE_URL", SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY],
    ["WHATSAPP_ACCESS_TOKEN", WHATSAPP_ACCESS_TOKEN],
    ["WHATSAPP_PHONE_NUMBER_ID", WHATSAPP_PHONE_NUMBER_ID],
    ["WHATSAPP_GRAPH_API_VERSION", WHATSAPP_GRAPH_API_VERSION],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) return res.status(503).json({ error: "Worker is not configured", missing });

  let claimed;
  try {
    claimed = await supabase("rpc/mf_claim_due_template_jobs", {
      method: "POST",
      body: JSON.stringify({ p_limit: 25 }),
    });
  } catch (error) {
    console.error("MessageFlow queue claim failed:", error.message);
    return res.status(500).json({ error: "Queue claim failed" });
  }

  const results = [];
  for (const job of (claimed || [])) {
    try {
      const components = job.use_name && job.display_name
        ? [{ type: "body", parameters: [{ type: "text", text: String(job.display_name).slice(0, 1000) }] }]
        : undefined;
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: job.phone_e164,
        type: "template",
        template: {
          name: job.template_name,
          language: { code: job.template_language || "en_US" },
          ...(components ? { components } : {}),
        },
      };
      const response = await fetch(
        `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const bodyText = await response.text();
      let body = {};
      try { body = bodyText ? JSON.parse(bodyText) : {}; } catch { body = {}; }
      if (!response.ok) {
        const providerMessage = body?.error?.message || `WhatsApp provider returned ${response.status}`;
        await supabase(`mf_message_jobs?id=eq.${encodeURIComponent(job.job_id)}`, {
          method: "PATCH",
          headers: { prefer: "return=minimal" },
          body: JSON.stringify({ status: "failed", last_error: String(providerMessage).slice(0, 1000), finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
        });
        results.push({ job_id: job.job_id, status: "failed" });
        continue;
      }
      const providerId = body?.messages?.[0]?.id || null;
      await supabase(`mf_message_jobs?id=eq.${encodeURIComponent(job.job_id)}`, {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ status: "sent", provider_message_id: providerId, last_error: null, finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      });
      results.push({ job_id: job.job_id, status: "sent" });
    } catch (error) {
      console.error("MessageFlow job failed:", job.job_id, error.message);
      try {
        await supabase(`mf_message_jobs?id=eq.${encodeURIComponent(job.job_id)}`, {
          method: "PATCH",
          headers: { prefer: "return=minimal" },
          body: JSON.stringify({ status: "failed", last_error: String(error.message || "Worker error").slice(0, 1000), finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
        });
      } catch (updateError) {
        console.error("Could not update failed job:", updateError.message);
      }
      results.push({ job_id: job.job_id, status: "failed" });
    }
  }
  return res.status(200).json({ claimed: (claimed || []).length, results });
};
