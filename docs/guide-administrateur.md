# Guide administrateur — PERFEKT AGENCY

Accès : se connecter avec un compte **administrateur** → menu avatar → **Administration** (ou `/admin`).
Les **formateurs** voient la partie Academy (formations, exercices, commentaires…) mais pas les paiements, utilisateurs ni le contenu du site.

## Tableau de bord
Chiffre d'affaires (total et mois), ventes, étudiants, inscriptions, attestations, devis et messages en attente,
revenus sur 12 mois, moyens de paiement, formations les plus suivies, dernières commandes et activité.

## Formations
**Formations → Nouvelle formation**, puis l'éditeur en 3 onglets :
1. **Informations** : titre, accroche, catégorie, niveau, durée, prix et prix promo, présentation, objectifs / compétences /
   prérequis (une ligne par élément), projet final, FAQ, image de couverture, vidéo d'aperçu, score minimum de l'examen,
   autorisation de téléchargement des documents, mise à la une, **publication** (une formation non publiée est un brouillon).
2. **Programme** : modules et leçons (vidéo, PDF, texte, exercice). Les vidéos MP4 téléversées restent privées et ne sont
   lues qu'en streaming protégé. Une leçon « aperçu » est visible gratuitement. Flèches ↑ ↓ pour réordonner.
3. **Quiz & examen** : un examen final est créé automatiquement ; ajoutez les questions (réponses une par ligne + numéro de
   la bonne réponse). Ajoutez des quiz de module si besoin.

## Suivi pédagogique
- **Exercices & projets** : corrigez les travaux rendus (note /20 + commentaire) ; l'apprenant est notifié.
- **Attestations** : liste, téléchargement PDF, **révocation** (la vérification publique affichera « révoquée »).
- **Avis** et **Commentaires & forum** : modération (publier / masquer, supprimer). Répondez aux questions depuis le lecteur de cours.

## Ventes
- **Paiements** : toutes les commandes, statut, facture PDF. Changer un statut manuellement si besoin (remboursement…).
- **Coupons** : code, pourcentage, nombre d'utilisations maximum, date d'expiration, activation.

## Agence
- **Demandes de devis** et **Messages** : suivi des statuts, réponse par email en un clic.
- **Portfolio** : projets (catégorie, client, année, images principale / avant / après, mise à la une).
- **Blog** : articles (catégorie Articles, Actualités, Tutoriels, Conseils, SEO), contenu en Markdown simple
  (`## Titre`, `- liste`, `**gras**`), titre et description SEO, publication.
- **Newsletter** : liste des abonnés et envoi d'une campagne.

## Système
- **Utilisateurs** : créer / modifier / désactiver des comptes, attribuer les rôles, réinitialiser un mot de passe.
- **Contenu du site** : textes du hero, coordonnées (téléphone, WhatsApp, email, adresse, carte), réseaux sociaux,
  statistiques, résultats clients, témoignages, équipe, partenaires et FAQ de l'accueil.
- **Journal d'activité** : connexions, échecs de connexion, paiements, téléchargements, actions d'administration.

## Exploitation
- Sauvegarde manuelle : `npm run backup` (fichiers dans `server/backups`, 14 derniers conservés). Une sauvegarde automatique
  est faite chaque jour tant que le serveur tourne. Restauration : `pg_restore -d perfekt_academy fichier.dump`.
- Limite d'appareils par apprenant : variable `MAX_DEVICES` dans `server/.env`.
