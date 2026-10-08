# KOL Campaign Tracker — own database (no Lark needed)

This version keeps its data in its own small database (**Upstash Redis**, free) that you connect inside Vercel.

- **Your data is safe when you update the page.** Uploading a new `index.html` only changes how the dashboard looks and works. The KOLs, shoots, day remarks and change log stay in the database.
- **Everyone sees the same data.** Changes save instantly and appear on other phones and computers within about 10 seconds.
- **A team passcode** keeps outsiders out.
- **Backup anytime:** ☰ menu → **Backup** downloads a full copy of all data.

Setup takes about 10 minutes, and you only do it once.

---

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The dashboard (latest design) |
| `seed.json` | Your starting data: 198 KOLs + the Penang shoot. Loaded **once** on first open |
| `api/db.js`, `api/_store.js` | Saves and reads data in the database |
| `api/backup.js` | Lets you download a backup |
| `package.json`, `README.md` | Project info and this guide |

---

## Step 1: Put the files on GitHub
1. Go to **github.com**, sign in, then click **New repository**. Name it `kol-campaign-tracker` and set it to **Private**.
2. On the new repository page, click **uploading an existing file**.
3. Drag in **everything inside this folder**: `index.html`, `seed.json`, `package.json`, `README.md` and the whole `api` folder. Click **Commit changes**.

## Step 2: Create the project on Vercel
1. Go to **vercel.com** → **Add New → Project**, then **Import** the `kol-campaign-tracker` repository.
2. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DASHBOARD_PASSCODE` | a passcode your team will type, e.g. `uspizza2026` |

3. Click **Deploy**. The page opens but says the database isn't connected yet. That's expected until you finish Step 3.

## Step 3: Connect the database (free)
1. In your Vercel project, open the **Storage** tab.
2. Click **Create Database**, choose **Upstash → Redis** (sometimes listed under "Marketplace"), pick the **Free** plan and the region closest to Malaysia (Singapore), then **Create**.
3. When asked, **connect it to the `kol-campaign-tracker` project**. Vercel adds the database keys for you (`KV_REST_API_URL` and `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`). Both sets work.
4. Go to **Deployments**, click **⋯** on the latest one, then **Redeploy**.

## Step 4: Open it
Open your Vercel link (e.g. `kol-campaign-tracker.vercel.app`) and enter the passcode. You'll see **Penang KOL Shoots** with all 198 KOLs. The first open loads them from `seed.json` into the database; after that, the database is the master copy.

---

## Updating the dashboard later
- Replace **`index.html`** on GitHub (open the file → pencil/upload → **Commit**). Vercel redeploys automatically within a minute.
- **Don't delete or disconnect the Upstash database** in Vercel. That is where the data lives.
- **Don't replace `seed.json` expecting it to update the data.** It's only used on the very first open. Updating it later has no effect, so it can never overwrite your live data.
- Keep the same Vercel project and link. Each device then remembers its passcode, name and layout choice.

## Backups
☰ menu → **Backup** downloads everything (KOLs, shoots, remarks, change log) as a JSON file. A weekly backup is a good habit during busy campaigns.

## Costs
Upstash's free plan covers far more than this dashboard needs: thousands of KOLs and daily team use. Vercel's free Hobby plan is fine for a team tool.

## If something goes wrong
The status at the top-right of the dashboard shows the problem in plain words:

| Message | Fix |
|---|---|
| Database not connected | Do Step 3, then **Redeploy** |
| Database error 401 / 403 | Reconnect Upstash to the project in **Storage**, then **Redeploy** |
| Wrong passcode | Check `DASHBOARD_PASSCODE` in Vercel → Settings → Environment Variables (redeploy after changing it) |
