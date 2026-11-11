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

### Importer le calendrier fédéral

L'import Castor utilise Symfony AI avec Ollama en local. Installez les dépendances Castor et téléchargez un modèle avant le premier lancement :

```sh
castor composer install
ollama pull qwen2.5
castor events:import --dry-run
castor events:import
```

La commande lit le calendrier du comité départemental, suit sa pagination et ajoute les événements manquants dans `src/content/config/events.json`. Les événements déjà présents sont conservés. Le modèle, l'URL et le délai d'attente d'Ollama peuvent être remplacés via `OLLAMA_MODEL`, `OLLAMA_URL` et `OLLAMA_TIMEOUT` (valeurs par défaut : `qwen2.5:latest`, `http://127.0.0.1:11434` et 600 secondes).

#### Import automatique hebdomadaire (macOS)

L'import peut tourner chaque vendredi à 12h et ouvrir une PR quand le calendrier a changé :

```sh
castor events:schedule
```

La commande copie [`scripts/import-events-pr.sh`](scripts/import-events-pr.sh) dans `~/.local/bin/skd-events-import` et installe un agent launchd (`~/Library/LaunchAgents/fr.skdmontfort.events-import.plist`). À chaque lancement, le script démarre Ollama si besoin, lance l'import dans un worktree séparé à jour de `origin/main` (le checkout de travail n'est pas touché), puis pousse la branche `auto/import-events` et ouvre ou met à jour la PR s'il y a des changements. Une notification macOS signale chaque PR et chaque échec.

- Logs : `~/Library/Logs/skd-events-import.log`
- Lancer tout de suite : `launchctl kickstart gui/$(id -u)/fr.skdmontfort.events-import`
- Tester sans pousser ni ouvrir de PR : `DRY_RUN=1 scripts/import-events-pr.sh`
- Après une modification du script, relancer `castor events:schedule` pour mettre à jour la version installée.
- Supprimer la planification : `castor events:unschedule`

Prérequis : `gh` authentifié et un accès en push au dépôt. Si le Mac est éteint à l'heure prévue, l'import de la semaine est sauté ; s'il est en veille, il se lance au réveil.

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
