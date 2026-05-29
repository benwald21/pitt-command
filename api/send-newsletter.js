// api/send-newsletter.js
// Paste YOUR Resend audience IDs on lines 8 and 9

const AUDIENCE_IDS = {
  alumni:         "3684b0cc-ddf7-4b56-8a97-292b9ead69b9",
  season_tickets: "8a050205-9f69-46ce-89dc-1dd2dbe3fe63",
};

const FROM = "Pitt Women's Soccer <onboarding@resend.dev>"; 
// ^ Works immediately with no domain setup. 
// Later swap to your own email once you verify a domain in Resend.

export default async function handler(req, res) {
  // Allow requests from your app
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { audience, subject, previewText, body } = req.body;

  if (!audience || !subject || !body) {
    return res.status(400).json({ error: "Missing audience, subject, or body" });
  }

  const audienceId = AUDIENCE_IDS[audience];
  if (!audienceId || audienceId.includes("PASTE_")) {
    return res.status(400).json({ 
      error: "Audience ID not set. Open api/send-newsletter.js and paste your Resend audience IDs on lines 4-5." 
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "RESEND_API_KEY not set in Vercel environment variables." });
  }

  try {
    // 1. Fetch contacts from Resend audience
    const contactsRes = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const contactsData = await contactsRes.json();

    if (!contactsRes.ok) {
      return res.status(500).json({ error: contactsData.message || "Failed to fetch contacts from Resend" });
    }

    const contacts = (contactsData.data || []).filter(c => !c.unsubscribed);

    if (contacts.length === 0) {
      return res.status(400).json({ error: "No active subscribers in this audience yet. Add some via the Subscribers tab." });
    }

    // 2. Send one email per contact with their name personalized
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const sends = await Promise.allSettled(
      contacts.map(contact => {
        const personalizedBody = body
          .replace(/\[First Name\]/g, contact.first_name || "Friend")
          .replace(/\[Last Name\]/g,  contact.last_name  || "")
          .replace(/\[Date\]/g,        today);

        return fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from:    FROM,
            to:      contact.email,
            subject,
            html:    buildHtml(subject, previewText || "", personalizedBody),
            text:    personalizedBody,
          }),
        });
      })
    );

    const sent   = sends.filter(r => r.status === "fulfilled").length;
    const failed = sends.filter(r => r.status === "rejected").length;
    return res.status(200).json({ sent, failed, total: contacts.length });

  } catch (err) {
    console.error("Newsletter error:", err);
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}

// Builds a clean branded HTML email
function buildHtml(subject, previewText, body) {
  const lines = body.split("\n").map(line => {
    if (line.startsWith("─") || line.startsWith("-─")) {
      return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0;">`;
    }
    if (line.trim() === "") return `<div style="height:8px;"></div>`;
    // Section headers (ALL CAPS short lines)
    if (line === line.toUpperCase() && line.trim().length > 2 && line.trim().length < 40) {
      return `<p style="font-size:10px;letter-spacing:0.15em;font-weight:700;color:#6b7280;margin:14px 0 2px;text-transform:uppercase;">${line}</p>`;
    }
    return `<p style="margin:3px 0;color:#374151;font-size:15px;line-height:1.65;">${line}</p>`;
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;</div>` : ""}
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1);">
        <tr>
          <td style="background:#003594;padding:28px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:.35em;font-weight:700;color:#FFB81C;text-transform:uppercase;">· Forged in Steel ·</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">Pitt Women's Soccer</p>
            <p style="margin:6px 0 0;font-size:13px;color:#93c5fd;">${subject}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            ${lines.join("\n            ")}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              Pitt Women's Soccer &middot; Ambrose Urbanic Field &middot; Pittsburgh, PA 15260
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;">
              <a href="https://pittsburghpanthers.com/sports/womens-soccer" style="color:#003594;text-decoration:none;">pittsburghpanthers.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
