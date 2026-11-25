# PERFEKT AGENCY — Site vitrine & PERFEKT Academy

Plateforme premium réunissant le site de l'agence (services, portfolio, blog, devis) et une académie en ligne complète
(vente de formations, paiement, lecture des cours, quiz, attestations vérifiables, tableau de bord administrateur).

- **Frontend** : React 19 + Vite + React Router (`client/`)
- **Backend** : Node.js + Express (`server/`)
- **Base de données** : PostgreSQL (`server/src/db/schema.sql`)

## Démarrage rapide

Prérequis : Node.js 20+ et PostgreSQL 14+.

```bash
# 1. Configuration : copier puis compléter le fichier d'environnement
cp server/.env.example server/.env      # renseigner PGPASSWORD, JWT_SECRET…

# 2. Installer les dépendances
npm run install:all

# 3. Créer la base, le schéma et les données de démonstration
npm run db:setup          # (npm run db:reset pour tout réinitialiser)

# 4. Lancer en développement (API :4000 + site :5173)
npm run dev
```

Ouvrir http://localhost:5173

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@perfektagency.com | `Admin@2026` |
| Apprenant | etudiant@perfektagency.com | `Etudiant@2026` |

> ⚠️ Changez ces mots de passe (ou supprimez ces comptes) avant toute mise en ligne.
> Codes promo de démonstration : `BIENVENUE10` (-10 %), `PERFEKT25` (-25 %).

## Fonctionnalités

**Site vitrine** — Accueil (hero, agence, services filtrables par public, résultats, statistiques animées, formations, témoignages,
actualités, FAQ, CTA), À propos, Services (16 services / 4 pôles), Portfolio (filtres, galerie, avant/après), Blog (catégories,
recherche), Contact (carte Google, WhatsApp, formulaire, réseaux), Demande de devis, mode sombre, chat WhatsApp/Messenger.

**PERFEKT Academy** — Catalogue (recherche instantanée, filtres catégorie/niveau/prix/durée, tri, favoris, comparateur),
fiche formation (programme, prérequis, objectifs, compétences, aperçu vidéo, avis, FAQ, bouton Acheter), paiement (carte,
Flooz, Mixx by Yas, international, coupons, facture/reçu PDF), lecteur de cours (vidéo HD en streaming protégé, vitesse de
lecture, reprise automatique, progression, PDF, quiz, exercices/TP, notes personnelles, forum, questions au formateur),
examen final → **attestation PDF automatique** (numéro unique, QR code, signature électronique, logo, page de vérification publique).

**Espace apprenant** — inscription, connexion, mot de passe oublié, profil + photo, historique des achats et des formations,
progression, notes, attestations, favoris, notifications, gestion des appareils connectés.

**Administration** — tableau de bord (CA, ventes, inscriptions, graphiques), formations (éditeur complet : infos, modules,
leçons, vidéos, documents, quiz, examen final), catégories, exercices à corriger, attestations (révocation), avis, commentaires,
paiements, coupons, devis, messages, portfolio, blog (SEO), newsletter (envoi), utilisateurs & rôles, contenu du site, journal d'activité.

**Sécurité** — mots de passe chiffrés (bcrypt), JWT + sessions en base, **limitation du nombre d'appareils** (`MAX_DEVICES`),
vidéos jamais exposées (jeton de lecture lié à la session, pas d'URL directe, téléchargement désactivé), droits de téléchargement
par formation, rôles (admin / formateur / apprenant), limitation de débit anti-force brute, en-têtes Helmet, requêtes SQL
paramétrées, journal des activités, **sauvegardes automatiques quotidiennes** (`pg_dump`, rotation 14 jours).

**Automatisations** — validation automatique des paiements, inscription, facture, emails, notifications, relances des apprenants
inactifs (7 jours) et des paiements en attente.

**SEO** — URLs propres, balises title/description/Open Graph/canonical par page, Schema.org (Organization, Course,
BlogPosting), `sitemap.xml` et `robots.txt` dynamiques, code découpé par page pour un chargement rapide.

## Déploiement avec Docker (recommandé)

Sur un serveur (VPS Ubuntu par exemple) avec Docker installé :

```bash
git clone https://github.com/XB19/PerfektAgency.git
cd PerfektAgency
cp .env.docker.example .env      # renseigner PGPASSWORD, JWT_SECRET, CLIENT_URL, DOMAIN
docker compose up -d --build     # site + API sur http://IP_DU_SERVEUR:4000
```

Avec un nom de domaine pointant vers le serveur, HTTPS automatique (Let's Encrypt via Caddy) :

```bash
docker compose --profile https up -d --build   # https://votre-domaine
```

- La base PostgreSQL, les fichiers téléversés et les sauvegardes sont conservés dans des volumes Docker.
- Au premier démarrage, le schéma et les contenus initiaux sont créés automatiquement.
- Mise à jour : `git pull && docker compose up -d --build`
- Journaux : `docker compose logs -f app`

## Production sans Docker

```bash
npm run build                    # génère client/dist
NODE_ENV=production npm start    # l'API sert aussi le site sur le port PORT
```

Derrière un reverse proxy (Nginx/Caddy) avec HTTPS (Let's Encrypt). Mettre `CLIENT_URL` sur le domaine final
(utilisé dans les QR codes, emails et le sitemap).

### À brancher avant la mise en ligne

1. **Paiement réel** : `server/src/routes/payments.js` est en mode `PAYMENT_MODE=simulation`. Remplacer la confirmation
   manuelle par l'API d'un agrégateur couvrant Flooz et Mixx by Yas (ex. PayGate Global, FedaPay, CinetPay) et/ou Stripe pour
   les cartes ; activer la route webhook (`PAYMENT_WEBHOOK_SECRET`).
2. **Emails** : `sendMail` (`server/src/lib.js`) affiche les emails dans la console ; brancher un SMTP (Brevo, Mailjet…).
3. **Vidéos** : les vidéos de démonstration sont des extraits libres ; téléverser les vraies vidéos depuis l'administration.
   Pour de gros volumes, prévoir un stockage objet / CDN avec URL signées.
4. **Contenus** : le site est alimenté avec les contenus réels de l'agence (visuels du dossier `images/`, optimisés en WebP dans
   `client/public/img/content/`) : formations, formateurs, partenaires, portfolio et articles « Esseuh tu sais que… ».
   **À vérifier** : prix des formations (seul l'atelier TikTok à 10 000 F CFA est connu), durée de la formation Word et de l'atelier,
   liens Instagram / LinkedIn / TikTok (seul Facebook est renseigné), adresse précise du siège, témoignages clients (aucun pour l'instant).
5. **Mentions légales / CGV / confidentialité** : textes à faire valider.

Documentation : [docs/guide-utilisateur.md](docs/guide-utilisateur.md) · [docs/guide-administrateur.md](docs/guide-administrateur.md)
