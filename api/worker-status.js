const required = [
  "CRON_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_GRAPH_API_VERSION",
];

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Expose configuration names only. Never return environment-variable values.
  const missing = required.filter((name) => !process.env[name]);
  return res.status(200).json({
    provider: "whatsapp_cloud_api",
    configured: missing.length === 0,
    missing,
    schedule_note: "On Vercel Hobby, the current worker cron runs once daily; this is not continuous background delivery.",
  });
};
