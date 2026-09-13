# Dropfile

A small, dependency-free GitHub Pages frontend for turning supported media links into downloads.

## Important limitation

GitHub Pages only serves static files. It cannot fetch and convert TikTok, Instagram, YouTube, or other platform URLs on its own. The app therefore sends the pasted URL to a compatible downloader service. The default endpoint is the public Cobalt API; you can replace it from **Service settings** with your own CORS-enabled endpoint.

Use this only for content you have permission to download and follow each platform's terms.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server:

```powershell
npx serve .
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. Set the source to **Deploy from a branch**, select `main` and `/ (root)`, then save.

The site is made of `index.html`, `style.css`, and `app.js`, so no build command is required.