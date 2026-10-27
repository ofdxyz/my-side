# Our Nebula – website

Plain HTML/CSS/JS site (no build step). Works on GitHub Pages.

## Add or edit gallery photos (no GitHub uploads by hand)
1. Go to **https://app.pagescms.org** and sign in with GitHub. Install the Pages CMS GitHub App on this repository when asked.
2. Open the repo. Pages CMS reads `.pages.yml` (already in this project).
3. **Gallery → Add an entry**: upload the photo, fill **Title, Target, Gear, Date**, pick a category, Save.
4. About a minute later the photo is live (GitHub Pages rebuilds). The gallery sorts newest date first.

Tips: keep the photo itself around 1600px / under ~500 KB. The optional "4K version" field adds a second download button.
If the repo grows too big later, store the 4K files on Cloudinary and paste their https links into the `image_4k` field.

## Contact form (messages go to ournebulaa@gmail.com)
- Uses FormSubmit. After you publish the site, send **one test message**. FormSubmit emails an activation link to ournebulaa@gmail.com – click it once.
- Safer: that mail also contains a random form ID. Paste it in `site.js` → `CONFIG.formAlias`. Then your email is not used in the page at all.
- The address in `site.js` is stored base64‑encoded so scrapers can't read it. To change it run `btoa("new@gmail.com")` in the browser console and paste the result into `CONFIG.contactEmailB64`.
- Built-in protection: hidden honeypot field, 30 s cooldown per visitor, too‑fast‑submit check, message length limit.

## Testing locally
Opening `gallery.html` by double‑click can't load `data/gallery.json`. Run a tiny server instead:
`python -m http.server 8000` (then open http://localhost:8000) or use VS Code "Live Server".

## Files
- `site.js` – all behaviour (gallery, lightbox, form, animations)
- `assets/style.css` + `assets/fonts/fonts.css` – styles and fonts
- `data/gallery.json` – the gallery list (edited by Pages CMS)
- `.pages.yml` – Pages CMS admin setup
- Fonts (Golden Fat, Auromiya, Megazine Poster demo, Kineks Compact trial) are personal‑use licences – buy commercial licences if the site ever earns money.
- Social preview image: `assets/og-image.jpg`. For link previews to show it, change `og:image` in each page to the full URL (https://your-site/assets/og-image.jpg).
