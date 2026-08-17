# Chrome template — Defra brand mode

Sidecar to `SKILL.md`. Used by `ixd-preview-spec` when the brand mode is `defra`
(explicit `--brand=defra` argument or `brand: defra` frontmatter on the spec).
For the GOV.UK brand mode see `chrome-gov-uk.md`.

Modeled on the live source of <https://digital.defra.gov.uk/design/branding> (a
real Defra-branded service we can inspect via `curl`). Preserves the canonical
Defra classes — `defra-header`, `defra-header__brand-group`,
`defra-header__logo`, `defra-header__service-name`, `defra-footer`,
`defra-footer__meta`, `defra-footer__licence-description` — and omits
site-specific elements (search box, service-manual sub-nav, breadcrumbs) that
don't apply to a single-page preview.

Loads `govuk-frontend@6.1.0` via jsdelivr as the base (for form components —
radios, inputs, buttons, etc.) and references two vendored sibling files in the
same `previews/` directory:

- `defra.css` — the Defra theme overlay (font stack, header, footer, accent
  placement). Loaded via `<link rel="stylesheet" href="defra.css">`.
- `defra-logo.svg` — the Defra logo. Referenced via
  `<img src="defra-logo.svg" class="defra-header__logo">`.

The sibling-file approach replaces the inline-everything strategy this skill
used in an earlier draft. Trade-off: a Defra preview is now a _directory_ of
three files (HTML + CSS + SVG), not a single file. Upside: the rendered HTML is
small (~4KB instead of ~63KB), the SKILL doesn't need to shuffle 52KB of SVG
through string substitution on every render, and the asset files stay opaque to
the HTML template.

## Template

```html
<!doctype html>
<html lang="en" class="govuk-template">
  <head>
    <meta charset="utf-8" />
    <title>{{question}} — {{service-title}}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#00a33b" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/govuk-frontend@6.1.0/dist/govuk/govuk-frontend.min.css"
    />
    <link rel="stylesheet" href="defra.css" />
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
      Defra service styling — not production styling.
    </div>

    <a href="#main-content" class="govuk-skip-link" data-module="govuk-skip-link"
      >Skip to main content</a
    >

    <header class="defra-header">
      <div class="defra-header__inner">
        <div class="defra-header__brand-group">
          <img src="defra-logo.svg" alt="" role="presentation" class="defra-header__logo" />
          <a href="#" class="defra-header__service-name">
            <span class="govuk-visually-hidden"
              >Department for Environment, Food and Rural Affairs: </span
            >{{service-title}}
          </a>
        </div>
      </div>
    </header>

    <div class="govuk-width-container">
      <div class="govuk-phase-banner">
        <p class="govuk-phase-banner__content">
          <strong class="govuk-tag govuk-phase-banner__content__tag">Alpha</strong>
          <span class="govuk-phase-banner__text">
            This is a new service — your <a class="govuk-link" href="#feedback">feedback</a> will
            help us to improve it.
          </span>
        </p>
      </div>

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

    <footer class="defra-footer">
      <div class="govuk-width-container">
        <div class="defra-footer__meta">
          <div class="defra-footer__meta-item">
            <span class="defra-footer__licence-description">
              Preview only — not a deployable artefact.
            </span>
          </div>
        </div>
      </div>
    </footer>
  </body>
</html>
```

## Placeholders

Same as `chrome-gov-uk.md` — no Defra-only placeholders:

- `{{question}}`, `{{service-title}}`, `{{slug}}`, `{{date}}`,
  `{{form-body}}`, `{{open-decisions}}` — substituted by the skill, see
  `SKILL.md` step 5.

The Defra-specific theme CSS and logo are sibling files in the same `previews/`
directory, not inline placeholders. `SKILL.md` step 4 handles copying them into
place.

## Differences from `chrome-gov-uk.md`

- **Header**: `defra-header` instead of `govuk-template__header` +
  `govuk-header`. Defra logo (sibling SVG) instead of the GOV.UK inline
  crown wordmark. Service title is part of the header itself (not a
  separate service-navigation strip below it).
- **No service-navigation strip**. The Defra header carries the
  service title directly; GOV.UK's pattern of a separate strip
  doesn't apply here.
- **Phase banner**: stays the same — `govuk-phase-banner` is a GOV.UK
  Design System component and Defra reuses it. Sits below the header,
  inside the width container, not inside `<header>` as in
  `chrome-gov-uk.md`.
- **Footer**: `defra-footer` instead of `govuk-template__footer` +
  `govuk-footer`. Light grey background with a 10px `#008531`
  (Defra-dark-green) top border per the live source.
- **Title bar**: ends with the service title, not " — GOV.UK". Defra
  services on non-GOV.UK domains must not present themselves as
  GOV.UK.
- **Theme colour meta tag**: `#00a33b` (Defra Green) instead of
  `#0b0c0c` (GOV.UK black-blue).
- **Two stylesheets loaded**, not one: `govuk-frontend.min.css` from the
  CDN as the base, then the local `defra.css` as the theme overlay.

## Notes

- Form body components keep their `govuk-*` classes under Defra mode —
  Defra reuses the GOV.UK Design System for radios, inputs, buttons,
  etc. The Defra theme CSS in `assets/defra.css` re-asserts the
  Helvetica/Arial font stack on those classes so the form body matches
  the rest of the page.
- The phase banner deliberately uses `govuk-phase-banner` (a GOV.UK
  Design System component reused by Defra) rather than a Defra-specific
  variant. The Defra design hub itself does this.
- `chrome-defra.md` does not declare " — GOV.UK" in `<title>` to avoid
  any confusion about the service's hosting domain.
- The sibling-file design means a Defra preview is **three files**:
  `previews/<slug>--defra.html`, `previews/defra.css`,
  `previews/defra-logo.svg`. Moving or sharing the HTML alone won't
  carry the styling. If a designer needs to send just the HTML, they
  need to send the whole directory.
