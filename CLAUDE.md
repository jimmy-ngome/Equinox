# Equinox - Journal de Projet & Changelog

## Instructions pour Claude

- **Après chaque commit** créé dans une conversation, ajouter une entrée dans le Changelog ci-dessous.
- **Après un changement majeur** (nouveau composant, refacto, changement de design), mettre à jour les sections concernées (Architecture, Design System, etc.).
- Si le travail n'est pas committé, mettre à jour la section `[Non committé]` en haut du changelog.

## Vue d'ensemble

**Equinox** est un tracker d'habitudes et d'entraînements avec interface en français.
Stack : React + Vite (JSX, CSS), API serverless Vercel, base PostgreSQL (Neon).

---

## Changelog

### [Non committé] - 2026-03-27
Travail en cours sur la branche `master` :
- **Auth** : Ajout système d'authentification (`api/auth/`, `api/_auth.js`, `AuthScreen.jsx`)
- **Admin** : Panneau d'administration (`api/admin/`, `AdminPanel.jsx`, `AdminPanel.css`)
- **Multi-utilisateur** : Migration DB pour `user_id` (`db/migrate-add-userid.js`), toutes les routes API protégées par auth
- **DayEditModal** : Nouveau composant modal pour éditer un jour
- **CalendarOverview** : Améliorations CSS et logique (+107 lignes CSS, refacto JSX)
- **CalisthenicsProgress** : Refonte majeure (+91 lignes CSS, +159 lignes JSX)
- **WorkoutTracker** : Extension importante (+192 lignes CSS, +300 lignes JSX refacto)
- **Dashboard** : Simplification (~90 lignes retirées)
- **DB schema** : Modifications du schéma pour supporter multi-user

### v0.2.0 - 2026-02-13
Commit `28ceb47` — *Fix timezone dates, connect Dashboard to real data, add habit filter*
- Correction des dates timezone
- Dashboard connecté aux données réelles (API)
- Ajout du filtre d'habitudes

### v0.1.0 - 2026-02-11
Commit `07ae12e` — *Initial clean commit - Equinox habit & workout tracker*
- Setup initial : React + Vite, API serverless
- Composants : Dashboard, HabitTracker, WorkoutTracker, CalendarOverview, CalisthenicsProgress
- Design system brutalist/terminal (IBM Plex Mono, noir & blanc, border-radius 0)
- Navigation par onglets avec underline

---

## Design System

- **Thème** : Noir pur (#000), blanc (#fff), monospace
- **Police** : IBM Plex Mono (Google Fonts)
- **Style** : Brutalist/terminal — aucun border-radius, pas de glassmorphism ni effets
- **Navigation** : Onglets avec soulignement

## Architecture

```
├── api/              # Routes API serverless (Vercel)
│   ├── auth/         # Authentification
│   ├── admin/        # Administration
│   ├── exercises/    # CRUD exercices & logs
│   ├── habits/       # CRUD habitudes & completions
│   └── sessions/     # CRUD sessions d'entraînement
├── db/               # Schéma DB & migrations
├── src/
│   ├── App.jsx       # Layout principal, navigation
│   ├── App.css       # Variables CSS globales
│   └── components/   # Composants React
└── index.html        # Point d'entrée, fonts
```
