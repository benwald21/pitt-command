const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_CAMP_DB;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
};

const STATUS_MAP = {
  new: "Not contacted", invited: "Invited", replied: "Replied",
  attending: "Attending", attended: "Attended",
};
const STATUS_RMAP = Object.fromEntries(Object.entries(STATUS_MAP).map(([k, v]) => [v, k]));

function toNotion(c) {
  return {
    "Name": { title: [{ text: { content: c.name || "" } }] },
    "Team": { rich_text: [{ text: { content: c.team || "" } }] },
    "Phone": { phone_number: c.phone || null },
    "Email": { email: c.email || null },
    "Source": { rich_text: [{ text: { content: c.source || "" } }] },
    "Status": { select: c.status ? { name: STATUS_MAP[c.status] || "Not contacted" } : null },
    "Notes": { rich_text: [{ text: { content: c.notes || "" } }] },
  };
}

function fromNotion(page) {
  const p = page.properties;
  const txt = (f) => f?.rich_text?.[0]?.plain_text || "";
  const sel = (f) => f?.select?.name || null;
  return {
    id: page.id,
    name: p["Name"]?.title?.[0]?.plain_text || "",
    team: txt(p["Team"]),
    phone: p["Phone"]?.phone_number || "",
    email: p["Email"]?.email || "",
    source: txt(p["Source"]),
    status: STATUS_RMAP[sel(p["Status"])] || "new",
    notes: txt(p["Notes"]),
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const results = [];
    let cursor;
    do {
      const body = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const r = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      results.push(...(data.results || []).map(fromNotion));
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);
    return res.json(results);
  }

  if (req.method === "POST") {
    const r = await fetch("https://api.notion.com/v1/pages", {
      method: "POST", headers,
      body: JSON.stringify({ parent: { database_id: DB_ID }, properties: toNotion(req.body) }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.json(fromNotion(data));
  }

  if (req.method === "PATCH") {
    const { id, ...rest } = req.body;
    const r = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ properties: toNotion(rest) }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.json(fromNotion(data));
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    const r = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ archived: true }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
