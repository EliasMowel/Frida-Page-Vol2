#!/usr/bin/env node
/**
 * Builds the website.
 *
 * Reads the content in /content, fills in src/template.html and writes the
 * finished site to /dist. No dependencies. Requires Node 18 or newer.
 *
 *   node build.mjs            build the site
 *   node build.mjs --serve    build, then preview at http://localhost:8080
 *                             (the page is rebuilt every time you refresh it)
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
const esc = (v = '') =>
  String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const str = (v) => (v == null ? '' : String(v).trim());
const list = (v) => (Array.isArray(v) ? v : []);
const digits = (v) => str(v).replace(/\D/g, '');
const icon = (id) => `<svg class="ico" aria-hidden="true"><use href="#${id}"/></svg>`;

/** Keeps only web links. "linkedin.com/in/x" becomes "https://linkedin.com/in/x". */
const safeUrl = (u) => {
  u = str(u);
  if (!u) return '';
  if (/^(https?:)?\/\//i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '';
  return 'https://' + u;
};
const displayUrl = (u) => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

/** "/assets/uploads/a.jpg" becomes "assets/uploads/a.jpg" so it also works without a server. */
const assetUrl = (p) => {
  p = str(p);
  if (!p) return '';
  if (/^(https?:)?\/\//i.test(p) || p.startsWith('data:')) return p;
  return p.replace(/^\/+/, '');
};
const cssUrl = (u) =>
  u.replace(/['"()\\\s]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));

const para = (text, cls = '') =>
  str(text) ? `<p${cls ? ` class="${cls}"` : ''}>${esc(text)}</p>` : '';

const readJSON = (name) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'content', `${name}.json`), 'utf8'));
  } catch (err) {
    throw new Error(`Could not read content/${name}.json. ${err.message}`);
  }
};

/** Fills {{escaped}} and {{{raw}}} placeholders in a single pass. */
function render(template, vars) {
  const missing = new Set();
  const out = template.replace(/\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/g, (_, rawKey, escKey) => {
    const key = rawKey || escKey;
    if (!(key in vars)) {
      missing.add(key);
      return '';
    }
    return rawKey ? String(vars[key]) : esc(vars[key]);
  });
  if (missing.size) throw new Error(`Template placeholders without a value: ${[...missing].join(', ')}`);
  return out;
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */
function build() {
  const general = readJSON('general');
  const about = readJSON('about');
  const services = readJSON('services');
  const banners = readJSON('banners');
  const experience = readJSON('experience');
  const matters = readJSON('matters');
  const contact = readJSON('contact');
  const disclaimer = readJSON('disclaimer');

  /* ---- core details ---- */
  const name = str(general.name) || 'Your Name';
  const role = str(general.role);
  const email = str(general.email);
  const wa = digits(general.whatsapp);
  const phone = str(general.phone_display) || (wa ? `+${wa}` : '');
  const location = str(general.location);
  const social = {};
  for (const k of ['linkedin', 'x', 'facebook', 'instagram']) social[k] = safeUrl(general.socials?.[k]);
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${name}, I would like to enquire about a consultation.`)}`
    : '';
  const ext = 'target="_blank" rel="noopener noreferrer"';
  const seoTitle = str(general.seo_title) || `${name} | ${role}`;
  const seoDescription = str(general.seo_description) || str(general.tagline);
  const siteUrl = safeUrl(general.site_url);

  /* ---- <head> extras ---- */
  const headExtra = [
    siteUrl && `<link rel="canonical" href="${esc(siteUrl)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(seoTitle)}">`,
    `<meta property="og:description" content="${esc(seoDescription)}">`,
    siteUrl && `<meta property="og:url" content="${esc(siteUrl)}">`,
  ]
    .filter(Boolean)
    .join('\n');

  /* ---- hero ---- */
  const heroImages = list(general.hero_images).map(assetUrl).filter(Boolean).slice(0, 3);
  const heroSlides = heroImages.length
    ? heroImages
        .map(
          (u, i) =>
            `    <div class="slide${i === 0 ? ' is-active' : ''}"><div class="slide__img" style="background-image:url('${esc(cssUrl(u))}')"></div></div>`
        )
        .join('\n')
    : readFileSync(join(ROOT, 'src', 'hero-slides.html'), 'utf8').trimEnd();

  const heroStatus =
    general.accepting_clients !== false && str(general.status_text)
      ? `    <p class="status rise" style="--d:.1s"><i aria-hidden="true"></i>${esc(str(general.status_text))}</p>`
      : '';

  const heroLead = str(general.tagline)
    ? `    <p class="hero__lead rise" style="--d:.95s">${esc(str(general.tagline))}</p>`
    : '';

  const heroContacts = [
    email && `      <a href="mailto:${esc(email)}">${icon('i-mail')}<span data-roll>${esc(email)}</span></a>`,
    wa && `      <a href="${esc(waHref)}" ${ext}>${icon('i-whatsapp')}<span data-roll>${esc(phone)}</span></a>`,
    social.linkedin &&
      `      <a href="${esc(social.linkedin)}" ${ext}>${icon('i-linkedin-box')}<span data-roll>${esc(displayUrl(social.linkedin))}</span></a>`,
    location && `      <p>${icon('i-pin')}<span>${esc(location)}</span></p>`,
  ]
    .filter(Boolean)
    .join('\n');

  /* ---- ticker ---- */
  const areas = list(services.areas).filter((a) => str(a.title));
  const marqueeItems = areas
    .map((a) => `      <span>${esc(a.title)}</span><span class="sep">&sect;</span>`)
    .join('\n');

  /* ---- about ---- */
  const portrait = assetUrl(general.portrait);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const portraitInner = portrait
    ? `<img src="${esc(portrait)}" alt="${esc(name)}" loading="lazy">`
    : `<div class="portrait__mark" aria-hidden="true">${esc(initials)}</div>`;

  const aboutParagraphs = list(about.paragraphs)
    .map((t) => (str(t) ? `      ${para(t)}` : ''))
    .filter(Boolean)
    .join('\n');
  const facts = list(about.facts).filter((f) => str(f.label) && str(f.value));
  const aboutFacts = facts.length
    ? `      <dl class="facts">\n${facts
        .map((f) => `        <div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`)
        .join('\n')}\n      </dl>`
    : '';

  /* ---- practice areas ---- */
  const areaItems = areas
    .map((a) => `      <li class="area"><h3>${esc(a.title)}</h3>${para(a.description)}</li>`)
    .join('\n');
  const steps = list(services.steps).filter((s) => str(s.title));
  const process = steps.length
    ? `    <div class="approach">
      <h3>${esc(str(services.process_heading) || 'How we work together')}</h3>
      <ol class="steps">
${steps
  .map((s) => `        <li class="reveal"><h4>${esc(s.title)}</h4>${para(s.description)}</li>`)
  .join('\n')}
      </ol>
    </div>`
    : '';

  /* ---- parallax bands ---- */
  const band = (label, inner) =>
    `<section class="band on-dark" data-band aria-label="${esc(label)}">
  <div class="band__bg"><svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><use href="#bandArt"/></svg></div>
  <div class="band__inner">${inner}</div>
</section>`;
  const bandQuote = str(banners.quote)
    ? band(
        'Professional philosophy',
        `<p class="band__quote">${esc(str(banners.quote))}</p>${para(banners.quote_note, 'band__note')}`
      )
    : '';
  const bandCta = str(banners.cta_text)
    ? band(
        'Book a consultation',
        `<p class="band__quote">${esc(str(banners.cta_text))}</p><a class="btn btn--solid" href="#contact" data-roll>Book a consultation</a>`
      )
    : '';

  /* ---- experience ---- */
  const roles = list(experience.roles)
    .filter((r) => str(r.title))
    .map((r) => {
      const points = list(r.highlights).filter((h) => str(h));
      return `      <article class="role reveal">
        <div class="role__when">${esc(str(r.period))}${str(r.organisation) ? `<span class="role__org">${esc(str(r.organisation))}</span>` : ''}</div>
        <div>
          <h3>${esc(r.title)}</h3>
          ${para(r.summary)}${
            points.length ? `\n          <ul>\n${points.map((h) => `            <li>${esc(h)}</li>`).join('\n')}\n          </ul>` : ''
          }
        </div>
      </article>`;
    })
    .join('\n');

  /* ---- notable matters ---- */
  const caseList = list(matters.matters).filter((m) => str(m.title));
  const matterCards = caseList
    .map(
      (m) =>
        `      <article class="case">${str(m.category) ? `<span class="case__tag">${esc(m.category)}</span>` : ''}<h3>${esc(m.title)}</h3>${para(m.summary)}${
          str(m.outcome) ? `<div class="case__out"><strong>Outcome</strong>${esc(m.outcome)}</div>` : ''
        }</article>`
    )
    .join('\n');
  const mattersCtrl = caseList.length
    ? `      <div class="slider__ctrl">
        <button class="arrow-btn" id="prev" type="button" aria-label="Previous matter"><svg class="ico"><use href="#i-prev"/></svg></button>
        <span class="slider__count" id="count" aria-live="polite">1 / ${caseList.length}</span>
        <button class="arrow-btn" id="next" type="button" aria-label="Next matter"><svg class="ico"><use href="#i-next"/></svg></button>
      </div>`
    : '';
  const recognitionItems = list(matters.recognition).filter((r) => str(r.title));
  const recognition = recognitionItems.length
    ? `    <div class="recog">
      <h3>${esc(str(matters.recognition_heading) || 'Recognition and publications')}</h3>
      <ul>
${recognitionItems
  .map((r) => `        <li><span>${esc(r.title)}</span><span>${esc(str(r.year))}</span></li>`)
  .join('\n')}
      </ul>
    </div>`
    : '';

  /* ---- contact ---- */
  const row = (label, value, href, external = true) =>
    `        <a class="link-row" href="${esc(href)}"${external ? ' ' + ext : ''}><span class="link-row__k">${esc(label)}</span><span class="link-row__v" data-roll>${esc(value)}</span></a>`;
  const contactLinks = [
    email && row('Email', email, `mailto:${email}`, false),
    wa && row('WhatsApp', phone, waHref),
    social.linkedin && row('LinkedIn', 'Connect on LinkedIn', social.linkedin),
    social.x && row('X', 'Follow on X', social.x),
    social.facebook && row('Facebook', 'Visit on Facebook', social.facebook),
    social.instagram && row('Instagram', 'Follow on Instagram', social.instagram),
  ]
    .filter(Boolean)
    .join('\n');
  const matterTypes = list(contact.matter_types).filter((t) => str(t));
  const matterOptions = (matterTypes.length ? matterTypes : ['General enquiry'])
    .map((t) => `          <option>${esc(t)}</option>`)
    .join('\n');
  const formButtons = [
    wa && `        <button class="btn btn--solid" type="button" id="sendWa" data-roll>Send on WhatsApp</button>`,
    email && `        <button class="btn btn--ghost" type="button" id="sendMail" data-roll>Send by email</button>`,
  ]
    .filter(Boolean)
    .join('\n');

  /* ---- disclaimer ---- */
  const disclaimerItems = list(disclaimer.items)
    .filter((d) => str(d.title))
    .map(
      (d, i) =>
        `      <details${i === 0 ? ' open' : ''}><summary>${esc(d.title)}</summary>${para(d.text)}</details>`
    )
    .join('\n');

  /* ---- footer and WhatsApp button ---- */
  const footerSocials = [
    email && ['Email', 'i-mail', `mailto:${email}`, false],
    wa && ['WhatsApp', 'i-whatsapp', waHref, true],
    social.linkedin && ['LinkedIn', 'i-linkedin', social.linkedin, true],
    social.x && ['X', 'i-x', social.x, true],
    social.facebook && ['Facebook', 'i-facebook', social.facebook, true],
    social.instagram && ['Instagram', 'i-instagram', social.instagram, true],
  ]
    .filter(Boolean)
    .map(
      ([label, id, href, external]) =>
        `          <a href="${esc(href)}"${external ? ' ' + ext : ''} aria-label="${esc(label)}">${icon(id)}</a>`
    )
    .join('\n');
  const fab = wa
    ? `<a class="fab" id="fab" href="${esc(waHref)}" ${ext} aria-label="Message on WhatsApp">${icon('i-whatsapp')}<span>Message on WhatsApp</span></a>`
    : '';

  /* ---- script settings (kept minimal, safe to embed) ---- */
  const configJson = JSON.stringify({ name, email, whatsapp: wa }).replace(/</g, '\\u003c');

  /* ---- put it together ---- */
  const vars = {
    seo_title: seoTitle,
    seo_description: seoDescription,
    head_extra: headExtra,
    name,
    role,
    hero_slides: heroSlides,
    hero_status: heroStatus,
    hero_lead: heroLead,
    hero_contacts: heroContacts,
    marquee_items: marqueeItems,
    portrait_inner: portraitInner,
    about_heading: str(about.heading),
    about_paragraphs: aboutParagraphs,
    about_facts: aboutFacts,
    services_heading: str(services.heading),
    services_intro: str(services.intro) ? `      ${para(services.intro, 'lead')}` : '',
    areas: areaItems,
    process,
    band_quote: bandQuote,
    experience_heading: str(experience.heading),
    experience_intro: str(experience.intro) ? `      ${para(experience.intro, 'lead')}` : '',
    roles,
    matters_heading: str(matters.heading),
    matters_intro: str(matters.intro) ? `        ${para(matters.intro, 'lead')}` : '',
    matters_ctrl: mattersCtrl,
    matter_cards: matterCards,
    matters_note: str(matters.note) ? `    ${para(matters.note, 'matters__note')}` : '',
    recognition,
    band_cta: bandCta,
    contact_heading: str(contact.heading),
    contact_intro: str(contact.intro) ? `      ${para(contact.intro, 'lead')}` : '',
    contact_links: contactLinks,
    form_heading: str(contact.form_heading),
    matter_options: matterOptions,
    form_buttons: formButtons,
    form_note: str(contact.form_note),
    disclaimer_heading: str(disclaimer.heading),
    disclaimer_intro: str(disclaimer.intro) ? `      ${para(disclaimer.intro, 'lead')}` : '',
    disclaimer_items: disclaimerItems,
    footer_socials: footerSocials,
    year: new Date().getFullYear(),
    fab,
    config_json: configJson,
  };

  const html = render(readFileSync(join(ROOT, 'src', 'template.html'), 'utf8'), vars);

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  writeFileSync(join(DIST, 'index.html'), html);
  for (const dir of ['admin', 'assets']) {
    if (existsSync(join(ROOT, dir))) cpSync(join(ROOT, dir), join(DIST, dir), { recursive: true });
  }
  // Anything in /public (robots.txt, sitemap.xml, favicon...) is copied to the site root.
  if (existsSync(join(ROOT, 'public'))) cpSync(join(ROOT, 'public'), DIST, { recursive: true });

  console.log(`Built ${join('dist', 'index.html')} (${(html.length / 1024).toFixed(1)} KB)`);
}

/* ------------------------------------------------------------------ */
/* Optional local preview                                              */
/* ------------------------------------------------------------------ */
function serve(port = 8080) {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.yml': 'text/yaml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
  };
  createServer((req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (path === '/' || path === '/index.html') build(); // pick up edits made in the admin panel
      let file = resolve(DIST, '.' + path);
      if (file !== DIST && !file.startsWith(DIST + sep)) {
        res.writeHead(403);
        return res.end('Forbidden');
      }
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file)) {
        res.writeHead(404);
        return res.end('Not found');
      }
      res.writeHead(200, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(readFileSync(file));
    } catch (err) {
      res.writeHead(500);
      res.end(String(err.message));
    }
  }).listen(port, () => console.log(`Preview: http://localhost:${port}  (admin: http://localhost:${port}/admin/)`));
}

try {
  build();
  if (process.argv.includes('--serve')) serve();
} catch (err) {
  console.error(`\nBuild failed: ${err.message}\n`);
  process.exit(1);
}
