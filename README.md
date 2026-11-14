# 生き甲斐 IKIGAI — Find your reason for being

An interactive website that guides your audience through the four circles of Ikigai and reveals a personal Ikigai map at the end:

- **What you LOVE**
- **What you're GOOD AT**
- **What the world NEEDS**
- **What you can be PAID FOR**

## The experience

1. **Landing.** A dark, glowing night sky with four drifting orbs of light and a breathing Venn diagram.
2. **Name & email.** These are saved to the database, with a required privacy consent and an optional email opt-in.
3. **Four circles, 16 questions.** Each circle opens with its own colour, Japanese kanji and short intro, then asks three core questions. They mix four formats:
   - multi-select chips
   - "pick one" cards
   - free-text tags, where people use their own words
   - sliders

   **Every question also has an "in your own words" box.** An open-ended answer on its own is enough to continue.
4. **An adaptive fourth question in every circle.** Each circle ends with a question written for that person from everything they've said so far. It goes deeper into their own words, resolves tensions between answers, or connects to earlier circles. While it's being written, an "engine is reflecting" screen quotes their words back to them.

   A mini Venn diagram in the header fills in as the person progresses. Every answer is auto-saved, so people can close the tab and continue later.
5. **Weaving.** The four orbs converge while the engine reasons about the whole conversation.
6. **Result.** The person sees:
   - their personalised **Ikigai map**, drawn in the classic four-circle style with their own words in each circle
   - **Passion, Mission, Profession and Vocation** labelled and explained for them, with their **Ikigai** at the centre
   - an archetype (e.g. *"The Storytelling Healer"*) and a one-line purpose statement
   - **What the engine noticed**: patterns across their answers that they may not have seen
   - a circle-harmony score
   - career paths with the reason each fits them, plus a plan for this week, this month and the next 90 days

   The map can be **downloaded as a PNG** or **shared** with a link.

## How the Ikigai is found

There are two engines. The site always uses the best one available.

### 1. The cognitive engine (Claude)

When an Anthropic API key is configured, **Claude Opus 5.5** reads the person's whole conversation, especially the things they typed in their own words. It does two jobs:

- **Adaptive questions.** At the end of each circle, it writes the next question for that specific person. This uses low effort, so the question appears in a few seconds.
- **Synthesis.** At the end, it reasons about where the four circles meet for *this* person. It writes the archetype, the centre of the map, the four overlaps, what it noticed, career paths with reasons, and a 7/30/90-day plan. This uses medium effort and takes about 20–60 seconds.

Its output is constrained to a strict JSON schema, then validated and length-limited before anything is shown. The prompts are in `public/js/cognitive.js`.

The engine runs on your backend, never in the visitor's browser, so the API key stays secret:

- **on GitHub Pages**, the Google Apps Script is the backend
- **on Render or your own server**, the Node server is the backend

Server-side refusal fallbacks (`fallbacks: "default"`) are switched on, so a rare refused request is retried on another model instead of failing.

**Cost:** roughly **$0.10–$0.30 per completed journey** at Claude Opus 5.5 prices (four short question calls plus one synthesis). Spending guards limit each journey to 10 engine calls per hour, and the whole site to 400 per hour. Change these at the top of `google-apps-script/src/main.js`.

### 2. The rule-based engine (always available, free)

Every answer feeds twelve life themes per circle, for example Creativity, Technology, Teaching, Healing and Storytelling. Open-ended answers are scanned for theme keywords.

- **Each overlap** (Passion, Mission, etc.) is the geometric mean of its two circles' theme scores.
- **The Ikigai at the centre** is the strongest theme across all four circles.
- **Adaptive questions** are built from the themes the person has shown so far.

This engine takes over automatically if there's no API key, the API is slow or down, or a spending limit is hit. The person never sees an error.

The rule-based engine is in `public/js/engine.js`. Questions and themes are in `public/js/questions.js`, so edit that file to change wording or add questions. The browser, the Node server and the Apps Script all share this code.

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
| `ANTHROPIC_API_KEY` | *(empty: rules only)* | Turns on the Claude cognitive engine (Node server) |

## Deploying

### GitHub Pages (free, no server)

The site is published to **https://workwithignatius-prog.github.io/IKIGAI/** by `.github/workflows/pages.yml`. Every push to `main` runs the tests and then redeploys.

With no backend, the site runs entirely in the browser:

- **Submissions** (name, email, opt-in, answers and result) are sent to a **Google Sheet** that you own (setup below).
- **Share links** carry the person's first name and answers in the link itself (`#r=…`). They never include the email.
- The `/admin` dashboard isn't available. Your Google Sheet replaces it.

#### Google Sheet & AI engine setup

1. Create a new Google Sheet (e.g. "IKIGAI submissions").
2. Open **Extensions → Apps Script**. Delete what's there and paste in the contents of [`google-apps-script/Code.gs`](google-apps-script/Code.gs). Click **Save**.
3. **To turn on the cognitive engine:** in Apps Script, open **Project Settings** (the gear icon), then **Script properties → Add script property**:
   - **Property:** `ANTHROPIC_API_KEY`
   - **Value:** your key from https://platform.claude.com, under **API keys**

   Skip this step to use the free rule-based engine only.
4. Click **Deploy → New deployment**. Choose the type **Web app**, then set:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
5. Click **Deploy** and authorise. Google asks for permission to edit the sheet and to connect to an external service (the Claude API). Copy the **Web app URL** (it ends in `/exec`).
6. Paste that URL into `public/js/config.js` as `sheetUrl: 'https://script.google.com/macros/s/…/exec'`, then commit to `main`.

Open the web-app URL in your browser to check it: it shows `"ai": true` when the engine is on.

A row appears in the **Submissions** tab when someone starts, and it fills in when they reveal their Ikigai. The **Engine** column shows whether the AI or the rules engine produced each result.

**When `Code.gs` changes** (it's generated by `npm run build:gas` from the shared engine): paste in the new version, then go to **Deploy → Manage deployments**, click the pencil icon, set **Version** to **New version**, and click **Deploy**. This keeps the same URL.

### Render (one click, with the built-in database and admin)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/workwithignatius-prog/ikigai)

`render.yaml` sets up the whole service:

- a Node web service on the Starter plan
- a 1 GB persistent disk at `/var/data` for the SQLite database
- health checks on `/api/health`
- an auto-generated `ADMIN_TOKEN`, shown under the service's **Environment** tab in Render
- an `ANTHROPIC_API_KEY` setting, which Render asks you for. Leave it empty to use the rule-based engine only.

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
| `POST /api/journeys/:id/followup` | `{circle, answers}`: the adaptive question for a circle |
| `POST /api/journeys/:id/complete` | `{answers}`: runs the engine, saves and returns the result |
| `GET /api/results/:id`          | Public, shareable result (never includes the email)       |
| `GET /api/health`               | `{ok, ai}`: whether the cognitive engine is on            |
| `GET /api/admin/journeys`       | All submissions (`Authorization: Bearer <ADMIN_TOKEN>`)   |
| `GET /api/admin/export.csv`     | CSV export (same auth)                                    |

## Project layout

```
server.js            Express server, API, security headers, rate limiting
ai.js                Cognitive engine for the Node server (Anthropic SDK)
db.js                SQLite schema & queries (users, journeys)
public/
  index.html         The journey (single page)
  admin.html         Admin dashboard
  css/               Styles
  js/config.js       Site settings: Google Sheet URL, AI on/off
  js/questions.js    Circles, 12 themes, 16 questions (edit me!)
  js/engine.js       Rule-based engine, adaptive fallback, result validation
  js/cognitive.js    Prompts + JSON schemas for the Claude engine
  js/diagram.js      Personal Ikigai map (SVG) + PNG export
  js/app.js          The guided journey UI
  js/admin.js        Admin UI
google-apps-script/
  src/main.js        Apps Script entry points (Sheet + engine)
  Code.gs            GENERATED bundle to paste into Apps Script
scripts/build-gas.mjs  Builds Code.gs from the shared sources
test/                API, engine, AI and Apps Script tests (node:test)
```
