// GET    /api/db                     -> every collection
// PUT    /api/db?c=kols&id=ID        -> create / replace a document   (body: the document)
// PATCH  /api/db?c=kols&id=ID        -> update some fields            (body: changed fields)
// DELETE /api/db?c=kols&id=ID        -> delete a document
const S = require("./_store");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    S.checkPass(req);
    const q = req.query || {}; const c = q.c, id = q.id;
    if (req.method === "GET") return res.status(200).json(Object.assign(await S.readAll(), { at: Date.now() }));
    if (req.method === "PUT")    { await S.setDoc(c, id, await S.readBody(req)); if (c === "changelog") S.trimLog().catch(() => {}); return res.status(200).json({ ok: true }); }
    if (req.method === "PATCH")  { await S.patchDoc(c, id, await S.readBody(req)); return res.status(200).json({ ok: true }); }
    if (req.method === "DELETE") { await S.delDoc(c, id); return res.status(200).json({ ok: true }); }
    throw S.httpErr(405, "Method not allowed");
  } catch (e) { res.status(e.status || 500).json({ error: e.message || String(e) }); }
};
