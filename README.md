# Shotokan Karate-do Montfort-sur-Meu

Site internet du club de karaté Shotokan Karate-do Montfort-sur-Meu.

🔗 [Site en ligne](https://skd-montfort-sur-meu.github.io)

## Stack technique

| Technologie | Usage |
|---|---|
| [Astro](https://astro.build) | Framework statique |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling via Vite plugin |
| [astro-icon](https://www.astroicon.dev) | Icônes (Lucide) |
| [marked](https://marked.js.org) | Rendu markdown au build |
| [Decap CMS](https://decapcms.org) | Gestion de contenu |
| [Vitest](https://vitest.dev) | Tests unitaires, contenu & smoke (build) |
| [Playwright](https://playwright.dev) | Tests E2E navigateur (Chromium) |
| [zod](https://zod.dev) | Schémas de validation du contenu édité |

## Lancement local

```sh
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev
```

Le site est disponible sur `http://localhost:4321`.

### CMS local

Decap CMS tourne en local via un serveur dédié :

```sh
npm run cms
```

Puis accéder au panneau d'administration sur `/admin`.

En production, l'interface d'administration est servie par Netlify (`/admin`) ; la commande ci-dessus ne sert qu'au développement local (backend local Decap).

## Structure du projet

```text
/
├── public/
│   ├── admin/                    # Panneau Decap CMS
│   └── images/                   # Images statiques (hero, galerie)
├── src/
│   ├── components/               # Composants Astro (12 fichiers)
│   ├── content/config/           # Données JSON éditées par le CMS
│   ├── layouts/
│   │   └── Base.astro            # Layout unique (shell HTML + Header + Footer)
│   ├── lib/
│   │   ├── events.ts            # Logique dates / échéances (testée)
│   │   ├── gallery.ts          # Tri & icônes galerie (testée)
│   │   ├── markdown.ts         # Helper de rendu markdown
│   │   └── schemas.ts          # Schémas zod du contenu
│   ├── pages/
│   │   ├── index.astro           # Page d'accueil
│   │   ├── karate.astro          # Page karaté (histoire, katas, vocabulaire)
│   │   ├── evenements.astro      # Page événements (compétitions & stages)
│   │   └── photos.astro          # Galerie photos
│   └── styles/
│       └── global.css            # Import Tailwind CSS
├── tests/
│   ├── unit/                     # Logique src/lib (Vitest)
│   ├── content/                  # Validation zod des JSON CMS
│   ├── smoke/                    # Contrôles sur dist/ généré
│   └── e2e/                      # Playwright (Chromium)
├── astro.config.mjs
└── package.json
```

## Architecture

- **Composants `.astro` purs** — Pas de framework côté client (React, Vue, Svelte). Le JS côté navigateur se limite à du vanilla JS (menu mobile, lightbox galerie).
- **Contenu JSON** — Les données du site (infos club, compétitions, karaté) vivent dans `src/content/config/*.json` et sont importées directement par les composants au build.
- **Decap CMS** — Permet d'éditer les fichiers JSON via une interface web. Configuré pour un backend GitHub (`public/admin/config.yml`).
- **Rendu markdown** — Le contenu markdown stocké dans les JSON est converti en HTML au build via `marked` + `set:html`.
- **BASE_URL** — Les liens internes utilisent `import.meta.env.BASE_URL` pour la compatibilité avec le déploiement sous GitHub Pages.

## Tests

4 niveaux légers, exécutés sur le build local (jamais sur le site en ligne) :

| Niveau | Emplacement | Couvre |
|---|---|---|
| Typage | `npm run check` | `astro check` strict |
| Unitaires | `tests/unit/` | Logique `src/lib/` |
| Contenu | `tests/content/` | Conformité des JSON de `src/content/config/` aux schémas zod |
| Smoke | `tests/smoke/` | HTML de `dist/` : contenu, liens internes, images, pas de markdown brut |
| E2E | `tests/e2e/` | Navigation, lightbox, menu mobile |

Les tests smoke lisent `dist/` : lancer `npm run build` avant `npm test` (la CI le fait dans cet ordre).

## Commandes

| Commande | Action |
|---|---|
| `npm install` | Installer les dépendances |
| `npm run dev` | Serveur de dev sur `localhost:4321` |
| `npm run build` | Build de production dans `./dist/` |
| `npm run preview` | Prévisualiser le build locally |
| `npm run cms` | Lancer Decap CMS en local |
| `npm run check` | Typage strict (`astro check`) |
| `npm test` | Unitaires + contenu + smoke (nécessite `dist/`) |
| `npm run test:e2e` | E2E Playwright sur le build local |
| `npm run astro ...` | CLI Astro (`astro add`, `astro check`, etc.) |

## Déploiement

- **Site public — GitHub Pages** — `skd-montfort-sur-meu.github.io`. Build + déploiement via `.github/workflows/deploy.yml`, déclenché par la réussite de CI sur `main` (`workflow_run`) ou manuellement (`workflow_dispatch`).
- **Administration & preview — Netlify** — Sert l'interface d'administration (`/admin`, Decap CMS) ainsi qu'une preview du site complet (build `npm run build` via `netlify.toml`) pour valider le contenu avant publication.
- **Flux de contenu** — Une modification éditée via Decap est commitée sur `main` (backend GitHub), ce qui relance la CI puis le déploiement du site public sur GitHub Pages.
- **CI** — `.github/workflows/ci.yml` : check + build + tests sur chaque push et pull request.

## Prérequis

- Node.js >= 22.12.0
