# Lucky Strike Portfolio

A modern, lightweight portfolio website for Mark Jenkins - Senior Design Manager.

## Quick Start

Preview locally:
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. For production domain (theluckystrike.co.uk):
   - Add custom domain in Vercel dashboard
   - Update DNS at your domain provider:
     - A record: 76.76.21.21
     - Or CNAME to cname.vercel-dns.com

## Files

- `index.html` - Main page
- `styles.css` - Styling
- `script.js` - Interactions