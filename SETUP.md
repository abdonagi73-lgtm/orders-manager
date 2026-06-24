# Orders Manager — Setup Guide
## Choices For You · Vendor → Square POS workflow

---

## What you're setting up

- **Next.js app** hosted on Vercel (free)
- **Google Sheets** as the database (your data, your Google account)
- **GitHub** repo for the code
- Two URLs when done:
  - `your-app.vercel.app/field` → worker's mobile form
  - `your-app.vercel.app/owner` → your dashboard

Total time: ~20 minutes

---

## Step 1 — Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **blank spreadsheet**
2. Name it: `Orders Manager — Choices For You`
3. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
   ```
   Save it — you'll need it later.

---

## Step 2 — Create a Google Cloud service account

This lets the app read/write your Sheet without you having to be logged in.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"** → name it `orders-manager` → Create
3. In the search bar, search **"Google Sheets API"** → click it → click **Enable**
4. In the left menu: **APIs & Services → Credentials**
5. Click **"+ Create Credentials"** → **"Service account"**
6. Name: `orders-manager-sa` → click **Create and Continue** → skip the optional steps → Done
7. Click the service account email that appeared in the list
8. Go to the **Keys** tab → **Add Key** → **Create new key** → **JSON** → Create
9. A `.json` file downloads — **keep this safe, never share it**

From that JSON file you need two values:
- `client_email` — looks like `orders-manager-sa@your-project.iam.gserviceaccount.com`
- `private_key` — the long string starting with `-----BEGIN RSA PRIVATE KEY-----`

---

## Step 3 — Share your Sheet with the service account

1. Open your Google Sheet
2. Click **Share** (top right)
3. Paste the `client_email` from the JSON file
4. Set permission to **Editor**
5. Click Send (ignore the warning about sharing outside org)

---

## Step 4 — Push code to GitHub

1. Create a new repo on [github.com](https://github.com) — name it `orders-manager`
2. In Cursor (or terminal), open this project folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/orders-manager.git
   git push -u origin main
   ```

---

## Step 5 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **"Add New Project"** → import your `orders-manager` repo
3. Framework: **Next.js** (auto-detected)
4. Before clicking Deploy, click **"Environment Variables"** and add these:

| Variable | Value |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The `client_email` from your JSON |
| `GOOGLE_PRIVATE_KEY` | The `private_key` from your JSON (paste the whole thing including the `-----BEGIN...-----` lines) |
| `GOOGLE_SHEET_ID` | The Sheet ID from Step 1 |
| `OWNER_PIN` | Your chosen PIN (e.g. `8421`) |
| `NEXT_PUBLIC_APP_URL` | Leave blank for now — fill after deploy |

5. Click **Deploy** — takes ~60 seconds
6. Copy your deployment URL (e.g. `orders-manager-xyz.vercel.app`)
7. Go back to Vercel → Settings → Environment Variables → add:
   - `NEXT_PUBLIC_APP_URL` = `https://orders-manager-xyz.vercel.app`
8. Go to Deployments → click the three dots → **Redeploy**

---

## Step 6 — Initialize the Sheet

This creates the tabs, headers, and seeds your vendor registry. **Do this once.**

Open your browser and go to:
```
https://your-app.vercel.app/api/init?pin=YOUR_OWNER_PIN
```

You should see:
```json
{ "ok": true, "message": "Sheet initialized successfully" }
```

Now open your Google Sheet — you'll see three tabs: **Items**, **Settings**, **Registry**.

---

## Step 7 — Test it

1. Open `https://your-app.vercel.app/field` on your phone
2. Add a test item — fill in vendor, code, category, colors, sizes, price
3. Open `https://your-app.vercel.app/owner` on your computer
4. Enter your PIN
5. You should see the item appear
6. Approve it, then go to Export → Download Square CSV

If the CSV downloads correctly, you're done. ✓

---

## Sharing with your worker

Send him this link:
```
https://your-app.vercel.app/field
```

That's it. He bookmarks it on his phone. No login, no install, no app store.

---

## Changing settings per order session

In the Owner dashboard → **Settings** tab:
- Change Tax %, Markup multiplier, Shipping $/kg anytime
- These are saved to the Sheet and apply to all future exports from that session
- Change the PIN there too if needed

---

## Starting a new order session

When you're ready for a new buying trip:
1. Open your Google Sheet
2. Clear all rows below row 1 in the **Items** tab (keep the header)
3. The app will start fresh

Or create a new Sheet, update `GOOGLE_SHEET_ID` in Vercel environment variables, and redeploy.

---

## Troubleshooting

**"Error: The caller does not have permission"**
→ You forgot to share the Sheet with the service account email (Step 3)

**"Cannot read properties of undefined"**
→ Check that all 4 environment variables are set correctly in Vercel

**Private key errors**
→ In Vercel, the private key must be pasted exactly as it appears in the JSON file. If it has literal `\n` characters, that's correct — Vercel handles them.

**Items not appearing in real time**
→ The owner dashboard polls every 10 seconds. Hit ↻ Refresh to force an update.

---

## File structure

```
orders-manager/
├── src/
│   ├── app/
│   │   ├── page.tsx          ← home (role selector)
│   │   ├── field/page.tsx    ← worker mobile form
│   │   ├── owner/page.tsx    ← owner dashboard
│   │   ├── api/
│   │   │   ├── items/route.ts    ← GET/POST/PATCH/DELETE items
│   │   │   ├── session/route.ts  ← settings + PIN verify
│   │   │   ├── export/route.ts   ← Square CSV generation
│   │   │   └── init/route.ts     ← one-time sheet setup
│   │   └── globals.css
│   └── lib/
│       ├── sheets.ts   ← all Google Sheets read/write
│       ├── pricing.ts  ← your existing pricing formula
│       └── types.ts    ← shared TypeScript types
├── .env.example        ← copy to .env.local for local dev
├── .gitignore
├── next.config.js
├── package.json
└── SETUP.md            ← this file
```
