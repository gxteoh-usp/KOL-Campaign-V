// GET /api/backup -> download everything as one JSON file (keep a copy anytime)
const S = require("./_store");
module.exports = async (req, res) => {
  try {
    S.checkPass({ headers: { "x-passcode": (req.query && req.query.p) || req.headers["x-passcode"] || "" } });
    const data = await S.readAll();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="kol-campaign-tracker-backup-' + new Date().toISOString().slice(0, 10) + '.json"');
    res.status(200).send(JSON.stringify(data, null, 2));
  } catch (e) { res.status(e.status || 500).json({ error: e.message || String(e) }); }
};
