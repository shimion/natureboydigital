# Nature Boy Digital — Static Site for GitHub Pages

This is the static production build of **Nature Boy Digital** (fine art nature photography prints by David Matyis), ready for hosting on GitHub Pages or any static web host.

## Features
- **100% Static & Autonomous**: Zero dependencies on PHP, WordPress, or external servers.
- **Local Assets**: All 166 high-resolution and preview images are bundled in `assets/images/`.
- **Fully Relative URLs**: Works seamlessly on:
  - GitHub Pages repository subpaths (e.g. `https://<username>.github.io/<repo-name>/`)
  - GitHub Pages root / user site (`https://<username>.github.io/`)
  - Custom domains (`https://natureboydigital.com/`)
  - Local browser preview (double-clicking `index.html` or running a local server)
- **Interactive Shop**: Client-side cart (`localStorage`), size and price picker (Paper vs Metal), photo lightbox zoom, and complete checkout flow.
- **SEO & Social**: Rank Math-equivalent OpenGraph tags, JSON-LD Schema (WebSite, Organization, Product, Breadcrumbs), `sitemap.xml`, and `robots.txt`.

## How to Test Locally
Open PowerShell or Terminal in this folder (`static-site`) and run:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000/` in your browser.

## How to Upload to GitHub

### Option 1: Using Git in Terminal / PowerShell
1. In this folder (`static-site`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Nature Boy Digital static site"
   git branch -M main
   ```
2. Create a new repository on GitHub (e.g. `natureboydigital` or `<username>.github.io`).
3. Connect and push:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

### Option 2: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** / **root (/)**
   - Click **Save**.
4. Within 1–2 minutes, your website will be live at `https://<your-username>.github.io/<your-repo-name>/`!

### Custom Domain (Optional)
If you are connecting `natureboydigital.com`:
1. In GitHub Repository > **Settings** > **Pages** > **Custom domain**, enter `natureboydigital.com`.
2. Check **Enforce HTTPS**.
