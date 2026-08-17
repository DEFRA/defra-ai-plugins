# Chrome template — GOV.UK brand mode

Sidecar to `SKILL.md`. Used by `ixd-preview-spec` when the brand mode is `gov.uk`
(the default — no `--brand=` argument, no `brand:` frontmatter on the spec, or
an explicit `--brand=gov.uk`). For the Defra brand mode see `chrome-defra.md`.

Modeled on `govuk-frontend@6.1.0` canonical examples at
<https://design-system.service.gov.uk/components/>. Every class is from v6's
brand-refreshed conventions: `govuk-template__header` / `govuk-template__footer`
wrappers, `govuk-header__homepage-link` (not the v5
`govuk-header__link--homepage`), inline SVG wordmark (not a text span),
`govuk-service-navigation` for the service title, phase banner inside `<header>`
with the collapsed `govuk-phase-banner govuk-width-container` dual-class
pattern.

Loads `govuk-frontend@6.1.0` via jsdelivr. No vendored assets — the GOV.UK
Design System ships the wordmark inline as part of the template and the rest of
the styling comes from the CDN stylesheet.

## Template

```html
<!doctype html>
<html lang="en" class="govuk-template">
  <head>
    <meta charset="utf-8" />
    <title>{{question}} — {{service-title}} — GOV.UK</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0b0c0c" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/govuk-frontend@6.1.0/dist/govuk/govuk-frontend.min.css"
    />
    <style>
      .preview-banner {
        background: #fff7bf;
        padding: 8px 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        border-bottom: 1px solid #e6c200;
      }
      .preview-banner code {
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      }
    </style>
  </head>
  <body class="govuk-template__body">
    <div class="preview-banner">
      Preview: rendered from <code>specs/{{slug}}.md</code> on {{date}}. Visual approximation of
      GOV.UK styling — not production styling.
    </div>

    <a href="#main-content" class="govuk-skip-link" data-module="govuk-skip-link"
      >Skip to main content</a
    >

    <header class="govuk-template__header">
      <div class="govuk-header">
        <div class="govuk-header__container govuk-width-container">
          <div class="govuk-header__logo">
            <a href="#" class="govuk-header__homepage-link">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                focusable="false"
                role="img"
                viewBox="0 0 324 60"
                height="30"
                width="162"
                fill="currentcolor"
                class="govuk-header__logotype"
                aria-label="GOV.UK"
              >
                <title>GOV.UK</title>
                <g>
                  <circle cx="20" cy="17.6" r="3.7"></circle>
                  <circle cx="10.2" cy="23.5" r="3.7"></circle>
                  <circle cx="3.7" cy="33.2" r="3.7"></circle>
                  <circle cx="31.7" cy="30.6" r="3.7"></circle>
                  <circle cx="43.3" cy="17.6" r="3.7"></circle>
                  <circle cx="53.2" cy="23.5" r="3.7"></circle>
                  <circle cx="59.7" cy="33.2" r="3.7"></circle>
                  <circle cx="31.7" cy="30.6" r="3.7"></circle>
                  <path
                    d="M33.1,9.8c.2-.1.3-.3.5-.5l4.6,2.4v-6.8l-4.6,1.5c-.1-.2-.3-.3-.5-.5l1.9-5.9h-6.7l1.9,5.9c-.2.1-.3.3-.5.5l-4.6-1.5v6.8l4.6-2.4c.1.2.3.3.5.5l-2.6,8c-.9,2.8,1.2,5.7,4.1,5.7h0c3,0,5.1-2.9,4.1-5.7l-2.6-8ZM37,37.9s-3.4,3.8-4.1,6.1c2.2,0,4.2-.5,6.4-2.8l-.7,8.5c-2-2.8-4.4-4.1-5.7-3.8.1,3.1.5,6.7,5.8,7.2,3.7.3,6.7-1.5,7-3.8.4-2.6-2-4.3-3.7-1.6-1.4-4.5,2.4-6.1,4.9-3.2-1.9-4.5-1.8-7.7,2.4-10.9,3,4,2.6,7.3-1.2,11.1,2.4-1.3,6.2,0,4,4.6-1.2-2.8-3.7-2.2-4.2.2-.3,1.7.7,3.7,3,4.2,1.9.3,4.7-.9,7-5.9-1.3,0-2.4.7-3.9,1.7l2.4-8c.6,2.3,1.4,3.7,2.2,4.5.6-1.6.5-2.8,0-5.3l5,1.8c-2.6,3.6-5.2,8.7-7.3,17.5-7.4-1.1-15.7-1.7-24.5-1.7h0c-8.8,0-17.1.6-24.5,1.7-2.1-8.9-4.7-13.9-7.3-17.5l5-1.8c-.5,2.5-.6,3.7,0,5.3.8-.8,1.6-2.3,2.2-4.5l2.4,8c-1.5-1-2.6-1.7-3.9-1.7,2.3,5,5.2,6.2,7,5.9,2.3-.4,3.3-2.4,3-4.2-.5-2.4-3-3.1-4.2-.2-2.2-4.6,1.6-6,4-4.6-3.7-3.7-4.2-7.1-1.2-11.1,4.2,3.2,4.3,6.4,2.4,10.9,2.5-2.8,6.3-1.3,4.9,3.2-1.8-2.7-4.1-1-3.7,1.6.3,2.3,3.3,4.1,7,3.8,5.4-.5,5.7-4.2,5.8-7.2-1.3-.2-3.7,1-5.7,3.8l-.7-8.5c2.2,2.3,4.2,2.7,6.4,2.8-.7-2.3-4.1-6.1-4.1-6.1h10.6,0Z"
                  ></path>
                </g>
                <circle class="govuk-logo-dot" cx="227" cy="36" r="7.3"></circle>
                <path
                  d="M94.7,36.1c0,1.9.2,3.6.7,5.4.5,1.7,1.2,3.2,2.1,4.5.9,1.3,2.2,2.4,3.6,3.2,1.5.8,3.2,1.2,5.3,1.2s3.6-.3,4.9-.9c1.3-.6,2.3-1.4,3.1-2.3.8-.9,1.3-2,1.6-3,.3-1.1.5-2.1.5-3v-.4h-11v-6.6h19.5v24h-7.7v-5.4c-.5.8-1.2,1.6-2,2.3-.8.7-1.7,1.3-2.7,1.8-1,.5-2.1.9-3.3,1.2-1.2.3-2.5.4-3.8.4-3.2,0-6-.6-8.4-1.7-2.5-1.1-4.5-2.7-6.2-4.7-1.7-2-3-4.4-3.8-7.1-.9-2.7-1.3-5.6-1.3-8.7s.5-6,1.5-8.7,2.4-5.1,4.2-7.1c1.8-2,4-3.6,6.5-4.7s5.4-1.7,8.6-1.7,4,.2,5.9.7c1.8.5,3.5,1.1,5.1,2,1.5.9,2.9,1.9,4,3.2,1.2,1.2,2.1,2.6,2.8,4.1l-7.7,4.3c-.5-.9-1-1.8-1.6-2.6-.6-.8-1.3-1.5-2.2-2.1-.8-.6-1.7-1-2.8-1.4-1-.3-2.2-.5-3.5-.5-2,0-3.8.4-5.3,1.2s-2.7,1.9-3.6,3.2c-.9,1.3-1.7,2.8-2.1,4.6s-.7,3.5-.7,5.3v.3h0ZM152.9,13.7c3.2,0,6.1.6,8.7,1.7,2.6,1.2,4.7,2.7,6.5,4.7,1.8,2,3.1,4.4,4.1,7.1s1.4,5.6,1.4,8.7-.5,6-1.4,8.7c-.9,2.7-2.3,5.1-4.1,7.1s-4,3.6-6.5,4.7c-2.6,1.1-5.5,1.7-8.7,1.7s-6.1-.6-8.7-1.7c-2.6-1.1-4.7-2.7-6.5-4.7-1.8-2-3.1-4.4-4.1-7.1-.9-2.7-1.4-5.6-1.4-8.7s.5-6,1.4-8.7,2.3-5.1,4.1-7.1c1.8-2,4-3.6,6.5-4.7s5.4-1.7,8.7-1.7h0ZM152.9,50.4c1.9,0,3.6-.4,5-1.1,1.4-.7,2.7-1.7,3.6-3,1-1.3,1.7-2.8,2.2-4.5.5-1.7.8-3.6.8-5.7v-.2c0-2-.3-3.9-.8-5.7-.5-1.7-1.3-3.3-2.2-4.5-1-1.3-2.2-2.3-3.6-3-1.4-.7-3.1-1.1-5-1.1s-3.6.4-5,1.1c-1.5.7-2.7,1.7-3.6,3s-1.7,2.8-2.2,4.5c-.5,1.7-.8,3.6-.8,5.7v.2c0,2.1.3,4,.8,5.7.5,1.7,1.2,3.2,2.2,4.5,1,1.3,2.2,2.3,3.6,3,1.5.7,3.1,1.1,5,1.1ZM189.1,58l-12.3-44h9.8l8.4,32.9h.3l8.2-32.9h9.7l-12.3,44M262.9,50.4c1.3,0,2.5-.2,3.6-.6,1.1-.4,2-.9,2.8-1.7.8-.8,1.4-1.7,1.9-2.9.5-1.2.7-2.5.7-4.1V14h8.6v28.5c0,2.4-.4,4.6-1.3,6.6-.9,2-2.1,3.6-3.7,5-1.6,1.4-3.4,2.4-5.6,3.2-2.2.7-4.5,1.1-7.1,1.1s-4.9-.4-7.1-1.1c-2.2-.7-4-1.8-5.6-3.2s-2.8-3-3.7-5c-.9-2-1.3-4.1-1.3-6.6V14h8.7v27.2c0,1.6.2,2.9.7,4.1.5,1.2,1.1,2.1,1.9,2.9.8.8,1.7,1.3,2.8,1.7s2.3.6,3.6.6h0ZM288.5,14h8.7v19.1l15.5-19.1h10.8l-15.1,17.6,16.1,26.4h-10.2l-11.5-19.7-5.6,6.3v13.5h-8.7"
                ></path>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <section
        aria-label="Service information"
        class="govuk-service-navigation"
        data-module="govuk-service-navigation"
      >
        <div class="govuk-width-container">
          <div class="govuk-service-navigation__container">
            <span class="govuk-service-navigation__service-name">
              <a href="#" class="govuk-service-navigation__link">{{service-title}}</a>
            </span>
          </div>
        </div>
      </section>

      <div class="govuk-phase-banner govuk-width-container">
        <p class="govuk-phase-banner__content">
          <strong class="govuk-tag govuk-phase-banner__content__tag">Alpha</strong>
          <span class="govuk-phase-banner__text">
            This is a new service — your <a class="govuk-link" href="#feedback">feedback</a> will
            help us to improve it.
          </span>
        </p>
      </div>
    </header>

    <div class="govuk-width-container">
      <main class="govuk-main-wrapper" id="main-content">
        <div class="govuk-grid-row">
          <div class="govuk-grid-column-two-thirds">
            <form action="#" method="post" novalidate>
              {{form-body}}
              <button type="submit" class="govuk-button" data-module="govuk-button">
                Continue
              </button>
            </form>

            {{open-decisions}}
          </div>
        </div>
      </main>
    </div>

    <footer class="govuk-template__footer">
      <div class="govuk-footer">
        <div class="govuk-width-container">
          <div class="govuk-footer__meta">
            <div class="govuk-footer__meta-item govuk-footer__meta-item--grow">
              <span class="govuk-footer__licence-description">
                Preview only — not a deployable artefact.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </body>
</html>
```

## Placeholders

- `{{question}}` — escaped page question text, becomes the `<title>` lead.
- `{{service-title}}` — brief title from the `ixd-frame-policy` entry's
  `on <subject>` clause; appears in `<title>` and in the
  `govuk-service-navigation` strip.
- `{{slug}}` — the page slug.
- `{{date}}` — `YYYY-MM-DD` today.
- `{{form-body}}` — built by `SKILL.md` step 5.
- `{{open-decisions}}` — built by `SKILL.md` step 6.

No vendored-asset placeholders — GOV.UK mode loads everything from the jsdelivr
CDN, and the wordmark SVG is part of the template literal above.

## Notes

- **`govuk-frontend` version is pinned in two places**: the CDN
  `<link>` URL in this template, and the literal version string in
  the journal-entry template at `SKILL.md` step 8. Bumping the
  renderer means updating both. On a major-version crossing, also
  reverify the inline wordmark SVG and the chrome HTML row-by-row
  against the new version's canonical examples.
- **The wordmark SVG is inline, not referenced**. v6's brand refresh
  moved the GOV.UK wordmark from a text span (styled by the GDS
  Transport font) to an inline SVG combining the crown logo and the
  letterforms. Vendoring is unnecessary because the SVG is
  self-contained in the markup; updating it means re-extracting from
  design-system.service.gov.uk on the next major bump.
