// Renders a personal Ikigai map as SVG (modelled on the classic four-circle diagram)
// and exports it to PNG.
import { CIRCLES, THEMES } from './questions.js';

const R = 280;
const C = {
  love: [500, 310],
  good: [310, 500],
  needs: [690, 500],
  paid: [500, 690],
};

const FILL = {
  love: '#FCE98A',
  good: '#DCF7A3',
  needs: '#FFBDB4',
  paid: '#B6F6E4',
  passion: '#DCEA62',
  mission: '#FFB36B',
  profession: '#A2F09A',
  vocation: '#BCBBA6',
  lgn: '#DDB24C', // love + good + needs
  lgp: '#A2E65C', // love + good + paid
  lnp: '#BBB06D', // love + needs + paid
  gnp: '#A0BA7C', // good + needs + paid
  center: '#9FAA3C',
};

const SANS = "Manrope, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "Fraunces, Georgia, 'Times New Roman', serif";
const INK = '#2E2B26';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

function clip(text, max) {
  const s = String(text).trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function circleEl(id, extra = '') {
  const [cx, cy] = C[id];
  return `<circle cx="${cx}" cy="${cy}" r="${R}" ${extra}/>`;
}

function nested(clips, fillCircle, fill) {
  const open = clips.map((c) => `<g clip-path="url(#ik-clip-${c})">`).join('');
  const close = clips.map(() => '</g>').join('');
  return `${open}${circleEl(fillCircle, `fill="${fill}"`)}${close}`;
}

function textLines(lines, x, y, { size = 20, weight = 500, gap = 1.35, fill = INK, family = SANS, spacing = 0, cls = '' } = {}) {
  return lines
    .map((line, i) => `<text x="${x}" y="${y + i * size * gap}" text-anchor="middle" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" letter-spacing="${spacing}"${cls ? ` class="${cls}"` : ''}>${esc(line)}</text>`)
    .join('');
}

function outerWords(result, circle, maxChars) {
  const words = result.circles?.[circle]?.words ?? [];
  if (words.length) return words.slice(0, 2).map((w) => clip(w, maxChars));
  const top = (result.circles?.[circle]?.top ?? []).slice(0, 2).map((t) => THEMES[t.id]?.short).filter(Boolean);
  return top.length ? [top.join(' · ')] : [];
}

function overlapLines(result, key) {
  return (result.overlaps?.[key] ?? []).slice(0, 2).map((t) => THEMES[t]?.short ?? t);
}

/** Build the full SVG markup for a result. */
export function buildDiagramSVG(result, { name = '', date = new Date() } = {}) {
  const who = (name || result.name || '').trim();
  const title = who ? `${who}’s Ikigai` : 'My Ikigai';
  const [a, b] = result.center ?? [];
  const dateStr = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const outer = (circle, x, y, maxChars, wordsFirst) => {
    const c = CIRCLES[circle];
    const words = outerWords(result, circle, maxChars);
    const wordsSvg = (yy) => textLines(words.map((w) => `“${w}”`), x, yy, { size: 19, weight: 600, family: SERIF, fill: '#3b372f', gap: 1.45 });
    const labelSvg = (yy) =>
      textLines([c.pre], x, yy, { size: 21, weight: 500, fill: '#4a463e' }) +
      textLines([c.key], x, yy + 30, { size: 22, weight: 800, spacing: 1.5 });
    return wordsFirst
      ? `<g class="d-label">${wordsSvg(y)}${labelSvg(y + 78)}</g>`
      : `<g class="d-label">${labelSvg(y)}${wordsSvg(y + 76)}</g>`;
  };

  const lens = (key, x, y) => {
    const lines = overlapLines(result, key);
    return `<g class="d-label">${textLines([key.toUpperCase()], x, y, { size: 19, weight: 800, spacing: 1.6 })}${textLines(lines, x, y + 30, { size: 17, weight: 600, fill: '#3d3a33', gap: 1.3 })}</g>`;
  };

  const centerLines = [a, b].filter(Boolean).map((t) => THEMES[t]?.short ?? t);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1180" width="1000" height="1180" role="img" aria-labelledby="ik-title ik-desc" class="ikigai-map">
  <title id="ik-title">${esc(title)}</title>
  <desc id="ik-desc">${esc(`Ikigai map. Center: ${centerLines.join(' and ')}. Passion: ${overlapLines(result, 'passion').join(', ')}. Mission: ${overlapLines(result, 'mission').join(', ')}. Profession: ${overlapLines(result, 'profession').join(', ')}. Vocation: ${overlapLines(result, 'vocation').join(', ')}.`)}</desc>
  <defs>
    ${Object.keys(C).map((id) => `<clipPath id="ik-clip-${id}">${circleEl(id)}</clipPath>`).join('')}
    <radialGradient id="ik-paper" cx="50%" cy="40%" r="75%">
      <stop offset="0" stop-color="#FFFEFA"/><stop offset="1" stop-color="#F6F1E6"/>
    </radialGradient>
    <filter id="ik-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#5b4a2a" flood-opacity=".12"/>
    </filter>
  </defs>
  <rect width="1000" height="1180" rx="36" fill="url(#ik-paper)"/>
  ${textLines([title], 500, 74, { size: 46, weight: 600, family: SERIF, fill: '#1f1c17' })}
  ${result.archetype ? textLines([result.archetype], 500, 116, { size: 22, weight: 400, family: SERIF, fill: '#7a6f5c', cls: 'd-arch' }).replace('<text ', '<text font-style="italic" ') : ''}

  <g transform="translate(0 140)">
    <g filter="url(#ik-shadow)">
      <g class="d-circle d-c-love">${circleEl('love', `fill="${FILL.love}"`)}</g>
      <g class="d-circle d-c-good">${circleEl('good', `fill="${FILL.good}"`)}</g>
      <g class="d-circle d-c-needs">${circleEl('needs', `fill="${FILL.needs}"`)}</g>
      <g class="d-circle d-c-paid">${circleEl('paid', `fill="${FILL.paid}"`)}</g>
    </g>
    <g class="d-overlaps">
      ${nested(['love'], 'good', FILL.passion)}
      ${nested(['love'], 'needs', FILL.mission)}
      ${nested(['good'], 'paid', FILL.profession)}
      ${nested(['needs'], 'paid', FILL.vocation)}
      ${nested(['love', 'good'], 'needs', FILL.lgn)}
      ${nested(['love', 'good'], 'paid', FILL.lgp)}
      ${nested(['love', 'needs'], 'paid', FILL.lnp)}
      ${nested(['good', 'needs'], 'paid', FILL.gnp)}
      ${nested(['love', 'good', 'needs'], 'paid', FILL.center)}
    </g>
    <g fill="none" stroke="#FFFEFA" stroke-width="7">
      ${Object.keys(C).map((id) => circleEl(id)).join('')}
    </g>

    ${outer('love', 500, 92, 30, false)}
    ${outer('paid', 500, 795, 28, true)}
    ${outer('good', 158, 432, 17, false)}
    ${outer('needs', 842, 432, 17, false)}

    ${lens('passion', 345, 330)}
    ${lens('mission', 655, 330)}
    ${lens('profession', 345, 640)}
    ${lens('vocation', 655, 640)}

    <g class="d-center">
      ${textLines(['Ikigai'], 500, 488, { size: 38, weight: 600, family: SERIF, fill: '#FFFFFF' })}
      ${textLines(centerLines, 500, 522, { size: 16, weight: 700, fill: '#FFFFFF', gap: 1.3, spacing: 0.4 })}
    </g>
  </g>

  ${textLines([`生き甲斐 · a reason for being · ${dateStr}`], 500, 1150, { size: 16, weight: 500, fill: '#9a8f7b', spacing: 0.6 })}
</svg>`;
}

// ───────────── PNG export ─────────────
const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Manrope:wght@500;600;700;800&display=swap';

let fontCssPromise;
async function embeddedFontCss() {
  fontCssPromise ??= (async () => {
    try {
      const css = await (await fetch(FONT_CSS)).text();
      const blocks = [...css.matchAll(/\/\*\s*latin\s*\*\/\s*(@font-face\s*{[^}]*})/g)].map((m) => m[1]);
      const out = await Promise.all(
        blocks.map(async (block) => {
          const url = block.match(/url\((https:[^)]+)\)/)?.[1];
          if (!url) return '';
          const buf = await (await fetch(url)).arrayBuffer();
          let bin = '';
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return block.replace(url, `data:font/woff2;base64,${btoa(bin)}`);
        }),
      );
      return out.join('\n');
    } catch {
      return ''; // fall back to system fonts
    }
  })();
  return fontCssPromise;
}

export async function svgToPngBlob(svgEl, scale = 2) {
  const clone = svgEl.cloneNode(true);
  clone.querySelectorAll('[class]').forEach((n) => n.removeAttribute('class'));
  const css = await embeddedFontCss();
  if (css) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = css;
    clone.insertBefore(style, clone.firstChild);
  }
  const [, , w, h] = clone.getAttribute('viewBox').split(/\s+/).map(Number);
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}
