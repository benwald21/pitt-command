const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_PROSPECTS_DB;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
};

function toNotion(p) {
  return {
    "Name": { title: [{ text: { content: p.name || "" } }] },
    "Position": { select: p.position ? { name: p.position } : null },
    "Grad Year": { select: p.gradYear ? { name: String(p.gradYear) } : null },
    "Tier": { select: p.tier ? { name: `Tier ${p.tier}` } : null },
    "Interest Level": {
      select: p.interest === "top2" ? { name: "Top 2 choices" }
        : p.interest === "strong" ? { name: "Strong interest" }
        : p.interest === "moderate" ? { name: "Moderate interest" } : null
    },
    "Projection": {
      select: p.status === "starter" ? { name: "Starter-ready" }
        : p.status === "minutes" ? { name: "Significant mins" }
        : p.status === "developmental" ? { name: "Developmental" }
        : p.status === "need" ? { name: "Priority need" } : null
    },
    "Technical": { number: p.ratings?.technical || null },
    "Athleticism ACC": { number: p.ratings?.athleticism || null },
    "Positional Fit": { number: p.ratings?.fit || null },
    "Character": { number: p.ratings?.character || null },
    "Coachability": { number: p.ratings?.coachability || null },
    "Club Team": { rich_text: [{ text: { content: p.club || "" } }] },
    "Notes": { rich_text: [{ text: { content: p.notes || "" } }] },
  };
}

function fromNotion(page) {
  const p = page.properties;
  const txt = (f) => f?.rich_text?.[0]?.plain_text || "";
  const sel = (f) => f?.select?.name || null;
  const num = (f) => f?.number ?? 0;
  const tierRaw = sel(p["Tier"]);
  const tier = tierRaw === "Tier 1" ? 1 : tierRaw === "Tier 2" ? 2 : 3;
  const interestRaw = sel(p["Interest Level"]);
  const interest = interestRaw === "Top 2 choices" ? "top2" : interestRaw === "Strong interest" ? "strong" : "moderate";
  const projRaw = sel(p["Projection"]);
  const status = projRaw === "Starter-ready" ? "starter" : projRaw === "Significant mins" ? "minutes" : projRaw === "Developmental" ? "developmental" : projRaw === "Priority need" ? "need" : "developmental";
  return {
    id: page.id,
    name: p["Name"]?.title?.[0]?.plain_text || "",
    position: sel(p["Position"]) || "CM",
    gradYear: parseInt(sel(p["Grad Year"])) || 2027,
    tier,
    interest,
    status,
    club: txt(p["Club Team"]),
    notes: txt(p["Notes"]),
    ratings: {
      technical: num(p["Technical"]),
      athleticism: num(p["Athleticism ACC"]),
      fit: num(p["Positional Fit"]),
      character: num(p["Character"]),
      coachability: num(p["Coachability"]),
    },
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
