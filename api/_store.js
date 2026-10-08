// Storage: Upstash Redis via its REST API (no extra packages needed).
// Vercel adds these automatically when you connect Upstash Redis (Storage tab):
//   KV_REST_API_URL + KV_REST_API_TOKEN   (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
const fs = require("fs"), path = require("path");
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const PREFIX = process.env.DB_PREFIX || "kolct";            // lets several dashboards share one database
const COLLS = ["kols", "programs", "daynotes", "changelog"];
const MAX_LOG = 3000;                                         // keep the newest change-log entries

function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }
async function redis(cmds) {   // cmds: array of commands -> array of results (pipeline)
  if (!URL_ || !TOKEN) throw httpErr(500, "Database not connected. In Vercel: Storage → Create/Connect Upstash Redis, then redeploy.");
  const r = await fetch(URL_.replace(/\/$/, "") + "/pipeline", {
    method: "POST", headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(cmds),
  });
  if (!r.ok) throw httpErr(502, "Database error " + r.status + ". Check the Upstash connection in Vercel.");
  const out = await r.json();
  return out.map(x => { if (x && x.error) throw httpErr(502, "Database error: " + x.error); return x.result; });
}
const key = c => PREFIX + ":" + c;
function checkColl(c) { if (!COLLS.includes(c)) throw httpErr(400, "Unknown collection"); }
function checkId(id) { if (!id || typeof id !== "string" || id.length > 200) throw httpErr(400, "Bad id"); }

// First run: load the starting data (seed.json) once, so the dashboard opens with your KOLs.
async function ensureSeeded() {
  const [seeded] = await redis([["GET", key("seeded")]]);
  if (seeded) return;
  let seed = {};
  try { seed = JSON.parse(fs.readFileSync(path.join(process.cwd(), "seed.json"), "utf8")); } catch (e) { seed = {}; }
  const cmds = [];
  for (const c of COLLS) {
    const docs = seed[c] || {}; const ids = Object.keys(docs);
    for (let i = 0; i < ids.length; i += 200) {
      const args = ["HSET", key(c)]; ids.slice(i, i + 200).forEach(id => args.push(id, JSON.stringify(docs[id])));
      cmds.push(args);
    }
  }
  cmds.push(["SET", key("seeded"), String(Date.now())]);
  await redis(cmds);
}
async function readAll() {
  await ensureSeeded();
  const res = await redis(COLLS.map(c => ["HGETALL", key(c)]));
  const out = {};
  COLLS.forEach((c, i) => {
    const flat = res[i] || []; const obj = {};
    for (let j = 0; j < flat.length; j += 2) { try { obj[flat[j]] = JSON.parse(flat[j + 1]); } catch (e) {} }
    out[c] = obj;
  });
  return out;
}
async function setDoc(c, id, data) { checkColl(c); checkId(id); await redis([["HSET", key(c), id, JSON.stringify(data)]]); }
async function patchDoc(c, id, patch) {
  checkColl(c); checkId(id);
  const [cur] = await redis([["HGET", key(c), id]]);
  if (!cur) throw httpErr(404, "Not found");
  const merged = Object.assign(JSON.parse(cur), patch);
  await redis([["HSET", key(c), id, JSON.stringify(merged)]]);
}
async function delDoc(c, id) { checkColl(c); checkId(id); await redis([["HDEL", key(c), id]]); }
async function trimLog() {
  const [n] = await redis([["HLEN", key("changelog")]]);
  if (n <= MAX_LOG + 200) return;
  const all = (await readAll()).changelog;
  const old = Object.entries(all).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).slice(0, n - MAX_LOG).map(x => x[0]);
  if (old.length) await redis([["HDEL", key("changelog"), ...old]]);
}

function checkPass(req) {
  const need = process.env.DASHBOARD_PASSCODE;
  if (need && (req.headers["x-passcode"] || "") !== need) throw httpErr(401, "Wrong passcode");
}
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return await new Promise(res => { let s = ""; req.on("data", c => s += c); req.on("end", () => { try { res(JSON.parse(s || "{}")); } catch { res({}); } }); });
}
module.exports = { readAll, setDoc, patchDoc, delDoc, trimLog, checkPass, readBody, httpErr, COLLS };
