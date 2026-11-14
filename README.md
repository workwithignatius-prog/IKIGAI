# 生き甲斐 IKIGAI — Find your reason for being

An interactive website that guides your audience through the four circles of Ikigai and reveals a personal Ikigai map at the end:

- **What you LOVE**
- **What you're GOOD AT**
- **What the world NEEDS**
- **What you can be PAID FOR**

## The experience

1. **Landing.** A dark, glowing night sky with four drifting orbs of light and a breathing Venn diagram.
2. **Name & email.** These are saved to the database, with a required privacy consent and an optional email opt-in.
3. **Four circles, 15 questions.** Each circle opens with its own colour, Japanese kanji and short intro. The questions mix four formats:
   - multi-select chips
   - "pick one" cards
   - free-text tags, where people use their own words
   - sliders

   A mini Venn diagram in the header fills in as the person progresses. Every answer is auto-saved, so people can close the tab and continue later.
4. **Weaving.** The four orbs converge while the result is calculated.
5. **Result.** The person sees:
   - their personalised **Ikigai map**, drawn in the classic four-circle style with their own words in each circle
   - their themes for **Passion, Mission, Profession and Vocation**, with their **Ikigai** at the centre
   - an archetype (e.g. *"The Storytelling Healer"*) and a one-line purpose statement
   - a circle-harmony score
   - suggested career paths and a concrete next step

   The map can be **downloaded as a PNG** or **shared** with a link.

## How the Ikigai is calculated

Every answer feeds twelve life themes per circle, for example Creativity, Technology, Teaching, Healing and Storytelling. Free-text answers are also scanned for theme keywords.

- **Each overlap** (Passion, Mission, etc.) is the geometric mean of its two circles' theme scores.
- **The Ikigai at the centre** is the strongest theme across all four circles.

The engine is in `public/js/engine.js`. The questions and themes are in `public/js/questions.js`, so edit that file to change wording, add questions or adjust themes. The browser and the server share the same code.

## Run it locally

You need **Node.js 22.13 or newer**. SQLite is built into Node, so there are no native packages to compile.

```bash
npm install
```

```bash
cp .env.example .env   # then set ADMIN_TOKEN to a long random string
```

```bash
npm start
```

Open http://localhost:3000. The admin dashboard is at http://localhost:3000/admin.

Run the tests:

```bash
npm test
```

## Admin dashboard

Set `ADMIN_TOKEN` and open `/admin`. From there you can:

- see every person, their archetype, overlaps and completion status
- search and filter submissions
- open anyone's map
- **export everything to CSV**, including name, email, opt-in, Ikigai, each overlap, their own words and the raw answers

## Configuration

| Variable      | Default             | Purpose                                        |
|---------------|---------------------|------------------------------------------------|
| `PORT`        | `3000`              | HTTP port                                      |
| `ADMIN_TOKEN` | *(empty: disabled)* | Password for `/admin` and the admin API        |
| `DB_FILE`     | `./data/ikigai.db`  | SQLite database file                           |

## Deploying

### GitHub Pages (free, no server)

The site is published to **https://workwithignatius-prog.github.io/IKIGAI/** by `.github/workflows/pages.yml`. Every push to `main` runs the tests and then redeploys.

With no backend, the site runs entirely in the browser:

- **Submissions** (name, email, opt-in, answers and result) are sent to a **Google Sheet** that you own (setup below).
- **Share links** carry the person's first name and answers in the link itself (`#r=…`). They never include the email.
- The `/admin` dashboard isn't available. Your Google Sheet replaces it.

#### Google Sheet setup (about 3 minutes, one time)

1. Create a new Google Sheet (e.g. "IKIGAI submissions").
2. Open **Extensions → Apps Script**. Delete what's there and paste in the contents of [`google-apps-script/Code.gs`](google-apps-script/Code.gs). Click **Save**.
3. Click **Deploy → New deployment**. Choose the type **Web app**, then set:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
4. Click **Deploy** and authorise. Copy the **Web app URL** (it ends in `/exec`).
5. Paste that URL into `public/js/config.js` as `sheetUrl: 'https://script.google.com/macros/s/…/exec'`, then commit to `main`.

A row appears in the **Submissions** tab when someone starts, and it fills in when they reveal their Ikigai.

If you later edit `Code.gs`, use **Deploy → Manage deployments → Edit → New version**, so the URL stays the same.

### Render (one click, with the built-in database and admin)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/workwithignatius-prog/ikigai)

`render.yaml` sets up the whole service:

- a Node web service on the Starter plan
- a 1 GB persistent disk at `/var/data` for the SQLite database
- health checks on `/api/health`
- an auto-generated `ADMIN_TOKEN`, shown under the service's **Environment** tab in Render

Every push to `main` redeploys automatically.

### Other hosts

Any host that runs Node 22+ works, for example Render, Railway, Fly.io or a VPS.

- Build command: `npm install`
- Start command: `npm start`
- Set `ADMIN_TOKEN`.
- Point `DB_FILE` at a **persistent disk or volume**. On hosts with ephemeral file systems, the database would otherwise be wiped on each deploy.

## API

| Method & path                   | Description                                               |
|---------------------------------|-----------------------------------------------------------|
| `POST /api/journeys`            | `{name, email, consent, optIn}`: starts a journey and returns `{id}` |
| `PATCH /api/journeys/:id`       | `{answers, step}`: auto-saves progress                    |
| `POST /api/journeys/:id/complete` | `{answers}`: computes and saves the result              |
| `GET /api/results/:id`          | Public, shareable result (never includes the email)       |
| `GET /api/admin/journeys`       | All submissions (`Authorization: Bearer <ADMIN_TOKEN>`)   |
| `GET /api/admin/export.csv`     | CSV export (same auth)                                    |

## Project layout

```
server.js            Express server, API, security headers, rate limiting
db.js                SQLite schema & queries (users, journeys)
public/
  index.html         The journey (single page)
  admin.html         Admin dashboard
  css/               Styles
  js/questions.js    Circles, 12 themes, 15 questions (edit me!)
  js/engine.js       Scoring → Ikigai result (shared with the server)
  js/diagram.js      Personal Ikigai map (SVG) + PNG export
  js/app.js          The guided journey UI
  js/admin.js        Admin UI
test/                API + engine tests (node:test)
```
