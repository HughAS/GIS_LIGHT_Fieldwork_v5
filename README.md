# Tweed Forum Field — PWA Deployment Guide

## What's in this package

| File | Purpose |
|------|---------|
| `index.html` | The full field app (map, points, PDF, login) |
| `manifest.json` | PWA manifest — enables "Add to Home Screen" |
| `sw.js` | Service worker — offline caching |
| `icon-192.png` | App icon (home screen, small) |
| `icon-512.png` | App icon (home screen, large / splash) |
| `README.md` | This file |

---

## First-time deployment (Netlify Drop — 2 minutes)

1. Go to **https://app.netlify.com/drop** in a desktop browser
2. Drag the entire folder (all files) onto the drop zone
3. Netlify gives you a URL like `https://quirky-name-abc123.netlify.app`
4. Open that URL on your phone — you'll see the "Add to Home Screen" prompt

> **Keep the Netlify URL secret** — it's not indexed by search engines but
> anyone who knows it can open the login screen. The login system is your
> access control.

---

## Default login credentials

**Change these immediately after first deployment.**

| Username | Password |
|----------|----------|
| `admin` | `TweedAdmin2024` |
| `fielduser` | `TweedField2024` |

To change passwords: sign in as `admin`, open **Export → Manage users (admin)**,
delete old users, add new ones with strong passwords, then download the updated
HTML via **Export → Download App HTML** and re-deploy to Netlify.

---

## Adding / removing users

Users are managed entirely within the app — no code editing required.

1. Sign in as any admin user
2. Tap the **Export** tab → **Download App HTML** — this saves a copy with the
   current user list baked in
3. Re-upload to Netlify (drag-and-drop the new HTML to the same Netlify site)

Password rules enforced by the app:
- Minimum 8 characters
- Usernames are case-insensitive

---

## Where field data is stored

Each user's field points are stored in the **device's browser localStorage**,
scoped to the Netlify URL and the username. This means:

- Data is **local to the device** — it is not uploaded anywhere
- Different users on the same device have separate data stores
- Clearing browser data / site data in settings will erase field points
- **Always export GeoJSON before clearing browser data**

To back up: use **Export → Download GeoJSON** or **Export → Download CSV**
regularly. These files can be imported into QGIS or the desktop Map Viewer.

---

## Updating the app

When a new version of the HTML is ready:

1. Replace `index.html` in your Netlify site (Sites → your site → Deploys →
   drag new folder, or use Netlify CLI)
2. Bump `CACHE_VER` in `sw.js` (e.g. `tweed-field-v1` → `tweed-field-v2`) so
   users' devices pick up the update automatically on next open
3. Users will see a "New version available — reload?" prompt

---

## Installing on Android (Chrome or Edge)

1. Open the Netlify URL in Chrome or Edge
2. Sign in
3. Tap the browser menu (⋮) → **Add to Home Screen** (Chrome) or
   **Add to phone** (Edge)
4. The app icon appears on the home screen and opens in full-screen mode
5. GPS will work because it's now running from `https://`

---

## Installing on iOS (Safari)

1. Open the Netlify URL in **Safari** (must be Safari — other iOS browsers
   cannot install PWAs)
2. Sign in
3. Tap the **Share** button (rectangle with arrow) → **Add to Home Screen**
4. GPS permission prompt appears on first use

---

## SRI (Subresource Integrity) — add at feature freeze

SRI verifies that CDN-delivered scripts (Leaflet, PDF.js) haven't been
tampered with. It should be added once the library versions are final.

To generate hashes, run this in a terminal with `curl` and `openssl`:

```bash
for URL in \
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" \
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
do
  echo -n "$URL  "
  curl -sL "$URL" | openssl dgst -sha384 -binary | openssl base64 -A
  echo
done
```

Then add `integrity="sha384-HASH"` to each `<link>` and `<script>` tag in
`index.html`.

---

## Security summary

| Aspect | Status |
|--------|--------|
| Data in transit | ✓ HTTPS (Netlify) |
| Data at rest | On-device localStorage only, no server |
| Access control | Username + SHA-256 hashed password |
| CDN integrity | Pending SRI at feature freeze |
| GPS | ✓ Works from HTTPS context |
| Offline use | ✓ Service worker cache |
