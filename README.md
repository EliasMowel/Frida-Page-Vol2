<div align="center">

# Frida Page | Legal Consulting Portfolio

A minimalist single-page website for an attorney and legal consultant,
with a simple admin panel so the owner can update her own details at any time.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Decap CMS](https://img.shields.io/badge/Admin-Decap_CMS-ffb800)
![Netlify](https://img.shields.io/badge/Hosting-Netlify-00C7B7?logo=netlify&logoColor=white)
![Dependencies](https://img.shields.io/badge/Dependencies-none-2fd35f)

[How editing works](#how-editing-works) &nbsp;|&nbsp; [Setup guide](#setup-guide) &nbsp;|&nbsp; [Editing guide for the client](docs/EDITING-GUIDE.md) &nbsp;|&nbsp; [Launch checklist](#launch-checklist)

</div>

<!--
Add a screenshot of the site at docs/screenshot.png, then uncomment the line below.
![Preview of the portfolio home page](docs/screenshot.png)
-->

---

## Overview

This project is a professional portfolio site that invites clients to book legal consulting services. It presents the consultant's name, biography, career background, practice areas, notable matters and contact channels, with the legal notice a law practice needs on its website.

The visual design follows the [Apex](https://apex-template.framer.website/) portfolio template: a full-screen hero, amber accents on charcoal, a bold typeface and a floating navigation dock.

The owner edits every detail through a password-protected admin page at `/admin`. Visitors only ever see the finished website.

## How editing works

```text
   She logs in at /admin  ->  edits labelled boxes  ->  clicks Publish
                                     |
                       saved as a small file in your GitHub repository
                                     |
                    Netlify notices the change and rebuilds the site
                                     |
                       the live website updates (usually 1 to 2 minutes)
```

- **Where her details are stored:** in plain files inside the `content/` folder of the repository. Nothing is stored in a hidden database.
- **Who can change them:** only people who can log in with GitHub and have write access to the repository. Visitors can only view the site.
- **Safety net:** every change is saved in the repository history, so any mistake can be undone.

## Features

| Area | What it does |
| --- | --- |
| **Admin panel** | Labelled boxes for every detail: contact information, biography, services, experience, notable matters, disclaimer and photos |
| **Hero** | Full-screen slideshow, animated name reveal, availability badge and quick contact details |
| **Navigation** | Floating dock with a sliding highlight that follows the section in view |
| **Practice areas** | Scrolling ticker, a clean list of services and a four-step process |
| **Career background** | Timeline of roles with key responsibilities |
| **Notable matters** | Swipeable slider of anonymised engagements |
| **Parallax bands** | Two full-width sections whose backgrounds move at a different speed from the page |
| **Contact** | Email, WhatsApp and social links, plus an enquiry form that opens WhatsApp or email with the message ready to send |
| **Legal notice** | Expandable disclaimer section |
| **Themes** | Light and dark appearance with a manual toggle |
| **Search settings** | Editable page title, description and website address for Google |
| **Accessibility** | Semantic HTML, keyboard navigation, visible focus states and reduced-motion support |

## Project structure

```text
.
├── admin/
│   ├── index.html        The admin screen (loads Decap CMS)
│   └── config.yml        Defines the boxes she sees in the admin panel
├── content/              Everything she can edit (one file per admin section)
│   ├── general.json      Name, title, contact details, photos, search settings
│   ├── about.json        Biography and credentials
│   ├── services.json     Practice areas and process steps
│   ├── experience.json   Career background
│   ├── matters.json      Notable matters and recognition
│   ├── contact.json      Contact section and enquiry form
│   ├── banners.json      The two full-width banners
│   └── disclaimer.json   Legal notice
├── src/
│   ├── template.html     The page design: layout, styles and behaviour
│   └── hero-slides.html  Built-in hero artwork, used when no photos are added
├── public/
│   └── robots.txt        Copied to the site root (keeps /admin out of search results)
├── assets/uploads/       Photos uploaded through the admin panel
├── build.mjs             Assembles the finished site (no dependencies)
├── netlify.toml          Tells Netlify how to build and publish
├── package.json
└── docs/EDITING-GUIDE.md A plain-language guide to give to the client
```

The build reads `content/` and `src/template.html` and writes the finished website to `dist/`. The `dist/` folder is generated, so it is not stored in Git.

## Setup guide

This is a one-time job for the developer. It takes about 20 minutes. Hosting is on [Netlify](https://www.netlify.com), which also provides the secure login for the admin panel. GitHub Pages cannot be used, because the site has a build step and the login needs a server.

### 1. Put the project on GitHub

1. Create a new repository, for example `frida-page-website`.
2. Upload the contents of this folder to it (the folder's contents, not the folder itself), on the `main` branch.

### 2. Point the admin panel at your repository

Open `admin/config.yml` and change these lines:

```yaml
backend:
  name: github
  repo: YOUR-GITHUB-USERNAME/YOUR-REPOSITORY   # for example  jane-doe/frida-page-website
  branch: main

site_url: https://YOUR-SITE.netlify.app
display_url: https://YOUR-SITE.netlify.app
```

If the live address is not known yet, come back and update the two `site_url` lines after step 3.

### 3. Create the site on Netlify

1. Sign in to Netlify and create a new project from your GitHub repository.
2. Netlify reads the build settings from `netlify.toml` (build command `node build.mjs`, publish folder `dist`). Deploy.
3. Note the address Netlify gives you, or connect the client's own domain later.

### 4. Enable the admin login

The admin panel uses GitHub for login. The steps below follow the current [Netlify documentation](https://docs.netlify.com/manage/security/secure-access-to-sites/oauth-provider-tokens/) and [Decap CMS documentation](https://decapcms.org/docs/github-backend/). Menu names can change, so check those pages if something looks different.

1. In GitHub, open **Settings**, then **Developer settings**, then **OAuth Apps**, and choose **Register a new application**.
2. Set the **Authorization callback URL** to exactly `https://api.netlify.com/auth/done`. The other fields can hold anything.
3. Save, then copy the **Client ID** and generate a **Client Secret**. The secret is shown only once.
4. In Netlify, open your project, then **Project configuration**, **Security**, **OAuth**.
5. Under **Authentication Providers**, choose **Install Provider**, select GitHub and paste in the Client ID and Client Secret.

### 5. Give the client access

Decap requires that every admin user has **push access** to the repository. Ask the client to create a free GitHub account, then in your repository open **Settings**, **Collaborators**, and add her with write access. She accepts the invitation by email.

### 6. Test it

1. Open `https://your-site.netlify.app/admin/` and choose **Login with GitHub**.
2. Change one small thing, such as the tagline, and click **Publish**.
3. Wait a minute or two and refresh the site to confirm the change appears.
4. Sit with the client and let her make a change herself, then give her [docs/EDITING-GUIDE.md](docs/EDITING-GUIDE.md).

## Running it on your computer

Requires [Node.js](https://nodejs.org) 18 or newer. There is nothing to install.

```bash
npm start
```

This builds the site and serves it at <http://localhost:8080>. The page is rebuilt every time you refresh, so edits appear straight away.

To try the admin panel locally, open a second terminal in the same folder and run:

```bash
npx decap-server
```

Then visit <http://localhost:8080/admin/>. Changes you publish there are written to the files in `content/` on your computer, with no login and nothing sent to GitHub. Commit them when you are happy.

To build once without a preview server, run `npm run build` and open `dist/index.html`.

## What each admin section controls

| Admin section | File | Controls |
| --- | --- | --- |
| 1. Contact details and home page | `content/general.json` | Name, title, introduction, availability badge, email, WhatsApp, phone, location, social links, portrait, hero photos, Google title and description |
| 2. About her | `content/about.json` | Biography and credentials |
| 3. Practice areas | `content/services.json` | Legal services, the scrolling ticker and the process steps |
| 4. Career background | `content/experience.json` | Roles and key responsibilities |
| 5. Notable matters | `content/matters.json` | Matters, the note under them, and recognition |
| 6. Contact section and enquiry form | `content/contact.json` | Contact heading, form choices and form note |
| 7. Quote banners | `content/banners.json` | The two full-width banners |
| 8. Legal notice and disclaimer | `content/disclaimer.json` | Every disclaimer item |

How the site reacts to empty boxes:

- Leave the **WhatsApp number** empty and every WhatsApp button and link disappears.
- Leave the **email** empty and the email links and form button disappear.
- Leave a **social link** empty and that link disappears.
- Leave a **banner** empty and the banner is not shown.
- Turn off the **availability badge** and it disappears from the home page.

## Customising the design

The look lives in `src/template.html`. Colours are CSS variables at the top of its `<style>` block:

```css
:root {
  --accent: #ffb800;   /* amber accent */
  --bg: #f4f4f6;       /* page background, light mode */
  --text: #141519;     /* body text, light mode */
}
```

Dark-mode values sit directly below. To change the typeface, update the Google Fonts `<link>` in the `<head>` and the `--display` variable. The layout of each section is plain HTML in the same file, with placeholders such as `{{{roles}}}` that `build.mjs` fills from `content/`. Adding a new field means adding it to the JSON file, to `admin/config.yml` and to `build.mjs`.

## Launch checklist

- [ ] Admin panel login works for the client on the live site
- [ ] `repo` and `site_url` are correct in `admin/config.yml`
- [ ] Email, WhatsApp number, location and social links are the real ones
- [ ] Every `[bracketed]` placeholder is replaced with real details
- [ ] Biography, practice areas and notable matters are accurate
- [ ] Every notable matter is shareable, anonymised and approved by the client
- [ ] A professional portrait (and hero photos, if wanted) has been uploaded
- [ ] The legal notice has been reviewed against local bar or law society rules
- [ ] The WhatsApp and email buttons open correctly on a phone
- [ ] The Google title, description and website address are filled in
- [ ] The client has the [editing guide](docs/EDITING-GUIDE.md)

## Getting found on Google

1. Fill in the search title, description and website address in admin section 1.
2. Verify the site in [Google Search Console](https://search.google.com/search-console).
3. Add a `sitemap.xml` to the `public/` folder, for example:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url><loc>https://your-domain.com/</loc></url>
   </urlset>
   ```

4. Add this line to `public/robots.txt` and submit the sitemap in Search Console:

   ```text
   Sitemap: https://your-domain.com/sitemap.xml
   ```

`public/robots.txt` already keeps the `/admin/` page out of search results.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| "Login with GitHub" does nothing or fails | The callback URL in the GitHub OAuth app must be exactly `https://api.netlify.com/auth/done`, and the provider must be installed in the Netlify project |
| Login works but the editor shows an error or cannot save | The person must have write access to the repository, and `repo` and `branch` in `admin/config.yml` must match it exactly |
| A change is published but the site looks the same | Wait a couple of minutes, check the latest deploy in Netlify, and hard-refresh the browser |
| The build fails on Netlify | Open the deploy log. A message such as "Could not read content/about.json" means a content file has a formatting error. Restore the previous version from the repository history |
| Uploaded photos do not appear | Photos are stored in `assets/uploads/`. Check they were committed, and that the file name has no unusual characters |

## Security notes

- The admin page address is public, but only people with write access to the repository can log in and change anything.
- Never share the OAuth Client Secret or commit it to the repository. It belongs only in the Netlify settings.
- To remove someone's access, remove them as a collaborator on GitHub.
- Enable two-factor authentication on the GitHub accounts that can edit the site.

## Privacy

The website has no analytics, no cookies and no tracking. The enquiry form does not send data to a server: it opens WhatsApp or the visitor's email app with the message pre-filled, and the visitor chooses whether to send it. The only value stored in a visitor's browser is their light or dark preference.

## Credits

- Layout and motion inspired by the [Apex](https://apex-template.framer.website/) portfolio template.
- Admin panel: [Decap CMS](https://decapcms.org), MIT licensed.
- Typeface: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans), licensed under the SIL Open Font License.
- Icons and background artwork are drawn inline as SVG for this project.

## License

Add your chosen license here, for example MIT, or state that all rights are reserved. Content such as the biography, case summaries and photographs belongs to the consultant.
