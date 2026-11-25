/*
 * Données initiales PERFEKT AGENCY — contenus extraits des publications de l'agence
 * (visuels Facebook fournis dans le dossier /images, optimisés dans client/public/img/content).
 *
 * ⚠️ À VÉRIFIER par l'agence : les prix des formations (sauf l'atelier TikTok à 10 000 F CFA),
 * la durée de la formation Word et de l'atelier TikTok. Les vidéos des leçons sont des extraits de démonstration.
 */
import bcrypt from 'bcryptjs';

const IMG = (n) => `/img/content/${n}.webp`;

// Vidéos de démonstration libres — à remplacer par les vraies vidéos depuis l'administration
const videos = [
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
  'https://download.samplelib.com/mp4/sample-10s.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
];

const categories = [
  ['Graphisme & Design', 'graphisme', 'Techniques de conception, logiciels de création et IA générative.'],
  ['Community Management', 'community-management', 'Réseaux sociaux, publicité en ligne et stratégie digitale.'],
  ['Vidéo & Montage', 'video', 'Tournage et montage vidéo, y compris sur mobile.'],
  ['Bureautique', 'bureautique', 'Maîtriser les outils informatiques du quotidien.'],
];

const CERT = 'Formation certifiante avec accompagnement personnalisé et conseils offerts.';

const courses = [
  {
    slug: 'formation-pro-graphisme', title: 'Formation Pro en Graphisme', cat: 'graphisme', level: 'Débutant',
    price: 75000, promo: null, hours: 32, sessions: 16, featured: true, image: 'formation-graphisme',
    subtitle: 'Tout pour devenir un créatif de qualité.',
    instructor: 'Innocent M. Kutowogbe',
    intro: `32 heures de formation et 16 séances pratiques pour maîtriser les techniques de conception : affiches publicitaires, logotypes, illustrations, web design et utilisation de l'IA générative. ${CERT}`,
    objectives: ['Maîtriser les techniques de conception graphique', 'Concevoir des affiches publicitaires percutantes', 'Créer des logotypes professionnels', 'Réaliser des illustrations et du web design', 'Intégrer l’IA générative dans son processus créatif'],
    prerequisites: ['Un ordinateur (Photoshop et Illustrator installés)', 'Aucune expérience préalable requise', 'Motivation et curiosité créative'],
    skills: ['Photoshop', 'Illustrator', 'Affiches publicitaires', 'Logotypes', 'Illustration', 'Web design', 'IA générative'],
    modules: [
      ['Fondamentaux du design graphique', ['Qu’est-ce que le design graphique ?', 'Couleurs, typographies et composition', 'Prise en main de Photoshop et Illustrator']],
      ['Affiches publicitaires & logotypes', ['Concevoir une affiche publicitaire', 'Créer un logotype de A à Z', 'Exercice : affiche d’un événement']],
      ['Illustration, web design & IA générative', ['Illustration vectorielle', 'Bases du web design', 'L’IA générative au service du créatif']],
    ],
    quiz: [
      ['Le design graphique consiste à…', ['Créer une composition visuelle (images, textes, formes, couleurs) pour faire passer un message', 'Aménager un espace intérieur', 'Fabriquer un produit industriel', 'Programmer une application'], 0],
      ['Quel logiciel est adapté au dessin vectoriel (logos) ?', ['Word', 'Illustrator', 'Excel', 'PowerPoint'], 1],
      ['Avant de concevoir, le graphiste doit d’abord…', ['Choisir sa police préférée', 'Livrer une première version', 'Rencontrer le client et analyser sa demande', 'Publier sur les réseaux'], 2],
      ['Le Design Thinking est…', ['Un logiciel de dessin', 'Une méthode de résolution de problèmes basée sur les besoins des utilisateurs', 'Un format d’image', 'Un réseau social'], 1],
      ['Comment utiliser l’IA en design ?', ['La craindre et l’éviter', 'Copier ses résultats sans les retravailler', 'Se l’approprier comme un outil au service de sa créativité', 'Remplacer tout le travail créatif'], 2],
    ],
  },
  {
    slug: 'formation-pro-community-management', title: 'Formation Pro en Community Management', cat: 'community-management', level: 'Débutant',
    price: 50000, promo: null, hours: 24, sessions: 8, featured: true, image: 'formation-community-management',
    subtitle: 'Devenez un community manager efficace, des bases aux outils IA.',
    instructor: 'Jovial Sodatonou',
    intro: `24 heures de formation et 8 séances pratiques : les bases du community management, l’étude des réseaux sociaux et de leurs paramétrages, l’utilisation des publicités sponsorisées et les outils IA nécessaires pour être performant. ${CERT}`,
    objectives: ['Comprendre les bases du community management', 'Maîtriser les réseaux sociaux et leurs paramétrages', 'Lancer des publicités sponsorisées', 'Utiliser les outils IA pour être performant'],
    prerequisites: ['Un smartphone ou un ordinateur', 'Être à l’aise avec les réseaux sociaux'],
    skills: ['Stratégie social media', 'Paramétrage des pages', 'Publicité Facebook & Instagram', 'Création de contenu', 'Outils IA', 'Collaboration avec les influenceurs'],
    modules: [
      ['Les bases du community management', ['Définition et rôle du community manager', 'Ligne éditoriale et calendrier de publication', 'Publier ne suffit pas : la posture du CM']],
      ['Réseaux sociaux & paramétrages', ['Panorama des réseaux sociaux', 'Créer et paramétrer ses pages', 'Influenceurs et créateurs de contenu']],
      ['Publicité & outils IA', ['Les publicités sponsorisées', 'Mesurer ses performances', 'Les outils IA du community manager']],
    ],
    quiz: [
      ['Le community management regroupe…', ['Les actions en ligne visant à promouvoir et valoriser la notoriété d’une marque sur les réseaux sociaux', 'La comptabilité d’une entreprise', 'La gestion des stocks', 'La conception de logos'], 0],
      ['Publier simplement fait-il de vous un community manager ?', ['Oui, il suffit de publier', 'Non : c’est un métier qui consiste à surveiller, contrôler, influencer et défendre les intérêts d’une marque', 'Oui, avec beaucoup de likes', 'Seulement sur Facebook'], 1],
      ['Un micro-influenceur compte…', ['Moins de 1 000 abonnés', 'De 1 000 à 100K abonnés', 'Plus de 100K abonnés', 'Plusieurs millions d’abonnés'], 1],
      ['« Influenceur = Lifestyle », et créateur de contenu = …', ['Publicité', 'Créativité', 'Statistiques', 'Vente'], 1],
      ['Un bon critère de sélection d’un influenceur :', ['Le nombre de ses voitures', 'La qualité de son contenu et l’analyse de ses commentaires', 'Sa date de naissance uniquement', 'Le prix de son téléphone'], 1],
    ],
  },
  {
    slug: 'formation-pro-creation-montage-video', title: 'Formation Pro en Création & Montage Vidéo (version mobile)', cat: 'video', level: 'Débutant',
    price: 50000, promo: null, hours: 24, sessions: 8, featured: true, image: 'formation-montage-video',
    subtitle: 'Tout pour devenir meilleur en tournage et montage vidéo mobile.',
    instructor: 'Vivien Kutowogbe (Rico)',
    intro: `24 heures de formation et 8 séances pratiques pour filmer et monter des vidéos professionnelles avec votre smartphone : les bases de la vidéo mobile, les bons réglages, les techniques de tournage, les astuces de montage dynamique et les outils IA de nos jours. ${CERT}`,
    objectives: ['Comprendre les bases de la vidéo mobile', 'Effectuer les bons réglages', 'Maîtriser les techniques de tournage', 'Réaliser des montages dynamiques', 'Utiliser les outils IA pour la vidéo'],
    prerequisites: ['Un smartphone récent', 'Une application de montage mobile (présentée en formation)'],
    skills: ['Vidéo mobile', 'Réglages caméra', 'Techniques de tournage', 'Montage dynamique', 'Outils IA vidéo'],
    modules: [
      ['Les bases de la vidéo mobile', ['Introduction à la vidéo mobile', 'Les bons réglages', 'Le matériel indispensable']],
      ['Les techniques de tournage', ['Cadrage et mouvements', 'Lumière et son', 'Exercice : tourner une séquence']],
      ['Montage dynamique & outils IA', ['Les astuces de montage dynamique', 'Les outils IA de nos jours', 'Exporter pour les réseaux sociaux']],
    ],
    quiz: [
      ['Avant de tourner, il faut d’abord…', ['Effectuer les bons réglages', 'Publier la vidéo', 'Ajouter de la musique', 'Supprimer les rushes'], 0],
      ['À quoi sert un trépied ?', ['À recharger la batterie', 'À stabiliser l’image', 'À stocker les vidéos', 'À éclairer la scène'], 1],
      ['Un montage dynamique repose surtout sur…', ['Des plans très longs', 'Le rythme et des coupes bien placées', 'L’absence de son', 'Une seule prise'], 1],
      ['Le format idéal pour TikTok et les Reels est…', ['Horizontal 16:9', 'Carré 1:1', 'Vertical 9:16', 'Panoramique'], 2],
      ['Ton téléphone fait-il automatiquement de toi un professionnel ?', ['Oui', 'Non : la technique et le savoir-faire font la différence', 'Seulement s’il est récent', 'Seulement avec des filtres'], 1],
    ],
  },
  {
    slug: 'maitriser-le-logiciel-word', title: 'Maîtriser le logiciel Word', cat: 'bureautique', level: 'Débutant',
    price: 20000, promo: null, hours: 10, sessions: null, featured: false, image: 'formation-word',
    subtitle: 'Familiarisez-vous avec l’outil informatique et le traitement de texte.',
    instructor: 'Équipe PERFEKT Academy',
    intro: 'Cette formation vous permettra de vous familiariser avec l’outil informatique, de connaître les bases de la saisie et du traitement de texte. Elle vous permettra aussi de ne plus demander à vos proches à quoi sert Ctrl + X, comment créer un organigramme, etc.',
    objectives: ['Se familiariser avec l’outil informatique', 'Maîtriser la saisie et la mise en forme de texte', 'Utiliser les raccourcis clavier essentiels', 'Créer tableaux et organigrammes'],
    prerequisites: ['Un ordinateur avec Microsoft Word'],
    skills: ['Saisie de texte', 'Mise en forme', 'Raccourcis clavier', 'Tableaux', 'Organigrammes'],
    modules: [
      ['Prise en main', ['Découvrir l’interface de Word', 'Saisir et enregistrer un document', 'Les raccourcis essentiels']],
      ['Mise en forme & documents pro', ['Mettre en forme un texte', 'Tableaux et images', 'Créer un organigramme']],
    ],
    quiz: [
      ['À quoi sert le raccourci Ctrl + X ?', ['Copier', 'Couper', 'Coller', 'Annuler'], 1],
      ['Microsoft Word est un logiciel de…', ['Retouche photo', 'Traitement de texte', 'Montage vidéo', 'Comptabilité'], 1],
      ['Quel raccourci permet d’enregistrer un document ?', ['Ctrl + S', 'Ctrl + P', 'Ctrl + Z', 'Ctrl + A'], 0],
      ['Pour créer un organigramme dans Word, on utilise…', ['SmartArt', 'Le correcteur', 'Le zoom', 'L’impression'], 0],
      ['Ctrl + Z permet de…', ['Tout sélectionner', 'Annuler la dernière action', 'Imprimer', 'Fermer Word'], 1],
    ],
  },
  {
    slug: 'atelier-argent-tiktok', title: 'Atelier pratique : comment se faire de l’argent avec TikTok', cat: 'community-management', level: 'Débutant',
    price: 10000, promo: null, hours: 4, sessions: 1, featured: false, image: 'atelier-tiktok',
    subtitle: 'Vous souhaitez rentabiliser votre présence en ligne ? Arrondir vos fins de mois ?',
    instructor: 'Équipe PERFEKT AGENCY',
    intro: 'Un atelier pratique pour apprendre à rentabiliser votre présence sur TikTok : positionnement, création de contenu et sources de revenus. Atelier organisé au siège de PERFEKT AGENCY, consommation offerte.',
    objectives: ['Définir son positionnement sur TikTok', 'Créer du contenu qui engage', 'Identifier les sources de revenus possibles'],
    prerequisites: ['Un smartphone avec TikTok installé'],
    skills: ['TikTok', 'Création de contenu', 'Monétisation'],
    modules: [
      ['Rentabiliser sa présence sur TikTok', ['Comprendre l’algorithme', 'Créer du contenu qui engage', 'Les sources de revenus']],
    ],
    quiz: [
      ['Pour réussir sur TikTok, il faut d’abord…', ['Une ligne éditoriale claire et de la régularité', 'Acheter des abonnés', 'Publier une fois par an', 'Copier les autres'], 0],
      ['Le format vidéo de TikTok est…', ['Horizontal', 'Vertical', 'Carré', 'Panoramique'], 1],
      ['Un indicateur clé de performance est…', ['Le taux d’engagement', 'La couleur du logo', 'Le prix du téléphone', 'L’heure de création du compte'], 0],
    ],
  },
];

const post = (slug, title, category, cover, created_at, excerpt, content, author = 'Innocent M. Kutowogbe') =>
  ({ slug, title, category, cover, created_at, excerpt, content, author });

const posts = [
  post('esseuh-tu-sais-que-le-concept', '« Esseuh tu sais que… » : le concept', 'Actualités', 'esseuh-concept', '2025-01-20',
    'Une série pour mettre en avant les métiers du digital, leurs différences, leurs prérequis, les tendances et nos conseils.',
    `## En vérité, je vous le dis…
« Esseuh tu sais que… » est un concept qui met en avant les **métiers du digital**, leurs différences, les acteurs et actrices nationaux et internationaux connus, les prérequis, les tendances et nos conseils.

Cette démarche permettra d’une part à nos chèr·e·s client·e·s de connaître la nature du prestataire en face, et d’autre part d’assainir les perceptions des métiers du digital pour les prochaines générations.

## Webinaires, master class et rencontres
Des **webinaires, master class, rencontres et échanges** sont prévus en présence de toute personne physique ou entité désireuse de maîtriser les contours des métiers du digital, pour une prise en main et une appropriation efficaces.

#VouSavezAquiConfierVosProjets #OnVaPluSeTromper #OnVaAvancerSereinement

![Le concept Esseuh tu sais que](${IMG('esseuh-concept')})`),

  post('tout-le-monde-ne-peut-pas-etre-designer', 'Tout le monde ne peut pas être un designer', 'Conseils', 'esseuh-tout-le-monde-designer', '2025-01-24',
    'Le design est un processus intellectuel créatif, pluridisciplinaire et humaniste. Découvrez ses trois grands domaines.',
    `## En vérité, je vous le dis
Le design est un **processus intellectuel créatif, pluridisciplinaire et humaniste**, dont le but est de traiter et d’apporter des solutions aux problématiques quotidiennes adaptées à l’écosystème.

## Les trois domaines du design
- **Le design d’espace** : une discipline d’aménagement intérieur et extérieur, qui consiste à créer des espaces différents et innovants afin de les rendre beaux et agréables.
- **Le design graphique** : il consiste à créer une composition visuelle fixe à base d’images, de textes, de formes et de couleurs pour faire passer un message à l’attention du public.
- **Le design produit** : une démarche centrée sur l’utilisateur qui consiste à imaginer, conceptualiser, tester et perfectionner un produit.

## Commentaires
Comme décrit, le design englobe beaucoup d’autres métiers dits artisanaux, intellectuels et mécaniques. Ainsi vous comprenez qu’un architecte, une décoratrice, un styliste, un potier, un graphiste, un développeur d’interfaces web… sont tous et toutes des designers.

![Les domaines du design](${IMG('esseuh-design-domaines')})`),

  post('missions-graphiste-infographiste', 'Les missions d’un graphiste et d’un infographiste', 'Articles', 'esseuh-missions-graphiste', '2025-01-28',
    'Graphiste ou infographiste : des missions très proches, mais des différences techniques importantes.',
    `## Les missions d’un infographiste
- Rencontrer les clients et analyser leur demande
- Réaliser des travaux dits « préparatoires » (prémaquettes, croquis, etc.)
- Travailler sur des supports multiples et variés (affiche, présentoir, livre, journal, dépliant, film, emballage, bande dessinée, film d’animation, motion, 2D, 3D, etc.)
- Suivre la fabrication du produit (si celle-ci est sous-traitée)
- Présenter sa création au client et y apporter les modifications nécessaires
- S’adapter aux évolutions technologiques du design
- Encadrer une équipe de créatifs

## Graphiste et infographiste : quelle différence ?
Les deux ont pratiquement les mêmes missions, mais diffèrent techniquement en termes de **domaine d’expertise, d’outils de travail, de compétences techniques, de types de projets et de besoin organisationnel**.

Il est souvent conseillé aux clients de **définir clairement ce qu’ils veulent comme conception** et d’**écouter l’infographiste** quand il ou elle fait des retours.

![Les missions d'un infographiste](${IMG('esseuh-missions-infographiste')})`),

  post('ou-se-former-en-graphisme', 'Où se former en graphisme ?', 'Conseils', 'esseuh-ou-se-former', '2025-02-01',
    'École, institut universitaire ou agence créative qualifiée : comment choisir sa formation en design ?',
    `## Qui peut suivre une formation en design ?
Toute personne motivée, curieuse et créative peut se former au design graphique : étudiants, jeunes professionnels, entrepreneurs ou passionnés en reconversion.

## Où se former ?
Si vous souhaitez avoir une **formation professionnelle** dans le domaine, vous avez le choix entre une **école de design**, un **institut universitaire de design**, ou une **agence créative qualifiée** offrant des formations certifiantes.

## Faites-vous former chez nous
PERFEKT AGENCY propose la **Formation Pro en Graphisme** : 32 heures de formation, 16 séances pratiques, formation certifiante avec accompagnement personnalisé et conseils offerts. Infoline & inscription : **+228 92 86 60 43**.

![Où se former en graphisme](${IMG('esseuh-ou-se-former')})`),

  post('debouches-en-graphisme', 'Les débouchés en graphisme', 'Articles', 'esseuh-debouches', '2025-02-05',
    'À l’ère du digital, les métiers liés au design offrent de nombreuses opportunités professionnelles.',
    `## Une vraie opportunité
Vous avez toute la chance et l’opportunité de vous en sortir gagnant avec les métiers liés au design, à cette ère.

## La formation en design graphique ouvre aux métiers de :
- Graphiste
- Infographiste 2D/3D
- Webdesigner
- Designer produit / industriel
- Illustrateur·trice
- Maquettiste
- Directeur·trice artistique
- Motion designer
- UX designer
- UI designer
- Roughman
- Game designer

## Commentaires
Concernant le **Design Thinking**, il s’agit d’une méthode de résolution de problèmes basée sur la compréhension des besoins des utilisateurs.

![Les débouchés en graphisme](${IMG('esseuh-debouches')})`),

  post('intelligence-artificielle-et-design', 'L’intelligence artificielle et le design', 'Articles', 'esseuh-ia-design', '2025-02-09',
    'Tu peux vraiment percer et t’améliorer en design avec l’IA. Encore faut-il se l’approprier.',
    `## « L’ordinateur est un vélo pour l’esprit »
**Steve Jobs** avait dit dans les années 80 : « L’ordinateur est un vélo pour l’esprit ». Moi, je vous le dis en 2023 : « l’intelligence artificielle est la réponse de la conscience ».

## Créer sans limites
Aujourd’hui, avec l’avènement des intelligences artificielles, nous pouvons créer sans limites, grâce au système d’apprentissage automatique des IA, du deep learning et de leurs algorithmes, qui renouvellent sans cesse leur style, leurs compétences et leur rapidité.

Les designers s’affranchiront des méthodologies classiques pour des insertions de prompts qui vont générer des espaces, images, textes, voix, vidéos et animations, défiant la notion de temps.

## Commentaires
Il s’agit pour chaque designer de **s’approprier la notion d’IA** et ses applications selon leur usage, pour un fonctionnement optimal, et non de développer une haine ou une crainte envers la technologie.

![L'intelligence artificielle et le design](${IMG('esseuh-ia-texte')})`),

  post('publier-ne-fait-pas-de-vous-un-community-manager', 'Publier simplement ne fait pas de vous un community manager', 'Conseils', 'esseuh-cm-cover', '2025-02-13',
    'Liker, partager ou publier ne suffit pas pour s’autoproclamer community manager. Définition d’un vrai métier.',
    `## Définition
Le **community management** regroupe l’ensemble des actions en ligne visant à promouvoir, à rendre visible et à valoriser la notoriété d’une marque, d’une structure ou d’une personnalité sur les médias et réseaux sociaux.

Cette démarche consiste à **surveiller, contrôler, influencer et défendre les intérêts** d’une entreprise ou d’une marque sur la toile.

## Commentaires
Il ne suffit pas de liker, partager ou publier un contenu pour s’autoproclamer community manager. Ce métier constitue une prise de position pour celui ou celle qui l’exerce.

## À venir
- Comment piloter efficacement des projets réseaux sociaux en tant que CM
- Les vérités qui ne se disent pas : client vs community manager

![Définition du community management](${IMG('esseuh-cm-definition')})`),

  post('influenceurs-le-metier', 'Les influenceurs : le métier', 'Articles', 'esseuh-influenceurs-cover', '2025-02-17',
    'Types d’influenceurs, critères de sélection et différence avec les créateurs de contenu.',
    `## Les types d’influenceurs
- **Nano-influenceurs** : moins de 1 000 abonnés
- **Micro-influenceurs** : de 1 000 à 100K abonnés
- **Macro-influenceurs** : plus de 100K abonnés
- **Influenceurs stars** : jusqu’à plusieurs millions d’abonnés

## Les critères de sélection d’un bon influenceur
- La qualité du contenu, le sexe, l’âge, la ville habitée
- L’analyse des commentaires et la ligne éditoriale de l’influenceur
- Les domaines ou affinités, et les formats privilégiés par l’influenceur

## Influenceur ou créateur de contenu ?
**L’influenceur** a un rôle direct d’influence : il va suggérer à sa communauté de consommer un produit ou un service via une communication précise et suivant ses prescriptions. Il dispose d’un public qui le suit et l’écoute attentivement.

**Le créateur de contenu** va, lui, avoir une approche plus originale et plus personnelle sur les campagnes qui lui sont confiées. Les créateurs de contenu sont plus libres que les influenceurs, tant sur le choix des mots que des plateformes sociales. Ils ont leurs propres univers, leurs propres expertises et sont souvent spécialisés dans un domaine.

Bref, pour résumer : **Influenceur = Lifestyle · Créateur de contenu = Créativité**.

## Maintenant vous savez
Avec qui collaborer, comment s’y prendre, distinguer le faux du vrai… qui est qui.

![Les types d'influenceurs](${IMG('esseuh-influenceurs-types')})`),

  post('ton-phone-ne-fait-pas-de-toi-un-photographe', 'Ton phone ne fait pas de toi un photographe', 'Conseils', 'esseuh-phone-photographe', '2025-02-21',
    'Le matériel d’un photographe professionnel et les 5 phrases à éviter face à lui.',
    `## Le matériel et les accessoires basiques d’un photographe pro
- Appareil photo
- Carte mémoire
- Objectifs
- Pare-soleil
- Batteries
- Trépied
- Sac à dos

En termes clairs : si tu n’as pas ceux-ci, tu sais quoi faire !

## 5 phrases à éviter face à un photographe pro
- « Je veux être beau / belle sur la photo »
- « Moi aussi mon phone peut faire ça ! »
- « Shooting à 0 F et je te fais la pub ! Allez ! »
- « Ton boulot est facile ! Juste un bouton, clic ! »
- « Tu peux enlever ta signature, s’il te plaît ? »

Quoi qu’importe la situation, faites un effort 😉

![Le matériel d'un photographe pro](${IMG('esseuh-materiel-photo')})`),

  post('nos-formations-pro-et-nos-formateurs', 'Nos formations Pro et nos formateurs', 'Actualités', 'nos-formateurs', '2025-02-25',
    'Graphisme, Community Management, Création & Montage Vidéo : découvrez les formations Pro de PERFEKT et leurs formateurs.',
    `## Trois formations Pro certifiantes
- **Formation Pro en Graphisme** : 32 heures, 16 séances pratiques — affiches pubs, logotypes, illustrations, web design et IA générative.
- **Formation Pro en Community Management** : 24 heures, 8 séances pratiques — bases du CM, réseaux sociaux, publicité sponsorisée, outils IA.
- **Formation Pro en Création & Montage Vidéo (version mobile)** : 24 heures, 8 séances pratiques — réglages, tournage, montage dynamique, outils IA.

Toutes sont **certifiantes**, avec **accompagnement personnalisé et conseils offerts**.

## Nos formateurs
- **Jovial Sodatonou** (alias The Goat) — Social Media Manager
- **Innocent Kutowogbe** (alias Perfekt) — Graphic Designer / UX Designer
- **Vivien Kutowogbe** (alias Rico) — Animateur digital / Vidéaste

Infoline & inscription : **+228 92 86 60 43**

![Nos formateurs](${IMG('nos-formateurs')})`, 'Équipe PERFEKT'),

  post('atelier-tiktok-18-mai-2024', 'Atelier pratique : comment se faire de l’argent avec TikTok', 'Actualités', 'atelier-tiktok', '2024-05-10',
    'Samedi 18 mai 2024 au siège de PERFEKT AGENCY : un atelier pour rentabiliser votre présence en ligne.',
    `## Rentabilisez votre présence en ligne
Vous souhaitez rentabiliser votre présence en ligne ? Arrondir vos fins de mois ? PERFEKT AGENCY organise un **atelier pratique** : comment se faire de l’argent avec TikTok.

- **Date** : samedi 18 mai 2024, à partir de 9 heures
- **Lieu** : siège de PERFEKT AGENCY
- **Participation** : 10 000 F CFA (consommation offerte)
- **Inscription** : +228 92 86 60 43 (jusqu’au 16 mai 2024)

![Atelier TikTok](${IMG('atelier-tiktok')})`, 'Équipe PERFEKT'),

  post('offre-inscriptions-feminines-2024', '-25 % sur toutes les inscriptions féminines', 'Actualités', 'promo-femmes-2024', '2024-03-01',
    'Pour encourager les femmes dans les métiers du digital : -25 % sur les inscriptions féminines aux formations Pro.',
    `## Les femmes à l’honneur
Pour encourager les femmes à embrasser les métiers du digital, PERFEKT AGENCY a offert **-25 % sur toutes les inscriptions féminines** à ses formations en Community Management, Graphisme et Montage vidéo, avant le 15 mars 2024.

Inscriptions : **228 92 86 60 43**

![Offre inscriptions féminines](${IMG('promo-femmes-2024')})`, 'Équipe PERFEKT'),
];

const project = (title, category, client, year, cover, description, gallery = [], featured = false) =>
  ({ title, category, client, year, cover, description, gallery, featured });

const projects = [
  project('Marché des Soldes des produits locaux', 'Affiches & événements', 'Togo Nou', 2024, 'togonou-marche-soldes',
    'Campagne visuelle du Marché des Soldes des produits locaux à Aného : affiches, visuels réseaux sociaux et visuel du panel « La marque : quelle importance pour l’entrepreneur ? » tenu au CETEF Lomé.',
    ['togonou-marche-soldes', 'togonou-panel'], true),
  project('Célébration de l’indépendance du Togo', 'Publicité', 'MIATO — Marché International de l’Artisanat du Togo', 2023, 'miato-independance',
    'Visuel institutionnel pour le 63e anniversaire de l’indépendance du Togo : « Viens, bâtissons la cité ».', ['miato-independance'], true),
  project('Fête de l’indépendance — ADJAFI', 'Publicité', 'ADJAFI — La Foire des Jeunes Entrepreneurs', 2023, 'adjafi-independance',
    'Visuel de célébration de la fête de l’indépendance « à tous les fils et toutes les filles du Togo ».', ['adjafi-independance']),
  project('Together 4 Change — goodies & visuel', 'Branding', 'Together 4 Change', 2023, 'together4change-casquettes',
    'Mise en scène des casquettes brodées Together 4 Change pour la fête de l’indépendance : #RéussirEnsemble #PourLeTogo.', ['together4change-casquettes']),
  project('Affiche du spectacle EGLI — Acte III', 'Affiches & événements', 'Burger Fabric · Compagnie artistique EDU', 2023, 'egli-acte3-affiche',
    'Affiche du spectacle « EGLI Acte III — Les fils du soleil », le 12 août 2023 au jardin de Burger Fabric, Agbalépédogan.', ['egli-acte3-affiche']),
  project('La Soirée des 100', 'Affiches & événements', 'Panorama Review', null, 'panorama-soiree-des-100',
    'Affiche de « La Soirée des 100 », du cinéma avec des écouteurs à l’Onomo Hôtel.', ['panorama-soiree-des-100']),
  project('Design intérieur modélisé en 3D', 'Design 3D', 'PERFEKT AGENCY', null, 'design-interieur-3d',
    'Modélisation 3D d’un espace de bureau : vos designs intérieurs modélisés en 3D, avant même les travaux.', ['design-interieur-3d'], true),
  project('Identité PERFEKT — déclinaison textile', 'Branding', 'PERFEKT AGENCY', null, 'perfekt-polo-branding',
    '« …Vous démarquer, voilà ce qu’il vous faut » : déclinaison de l’identité sur polos et supports, et visuel de remerciement à nos partenaires.',
    ['perfekt-polo-branding', 'perfekt-merci-partenaires']),
  project('Campagnes PERFEKT Academy', 'Réseaux sociaux', 'PERFEKT AGENCY', 2025, 'formation-graphisme',
    'Campagnes de lancement des formations Pro (Graphisme, Community Management, Montage vidéo, Word) : visuels, déclinaisons et teasers.',
    ['formation-graphisme', 'formation-community-management', 'formation-montage-video', 'nos-formateurs', 'campagne-fatigues', 'campagne-ratez', 'campagne-canva', 'formation-word', 'formations-reprennent', 'inscriptions-septembre-2024'], true),
  project('Série éditoriale « Esseuh tu sais que… »', 'Réseaux sociaux', 'PERFEKT AGENCY', 2025, 'esseuh-tout-le-monde-designer',
    'Série de carrousels pédagogiques sur les métiers du digital : design, graphisme, IA, community management, influence et photographie.',
    ['esseuh-tout-le-monde-designer', 'esseuh-missions-graphiste', 'esseuh-ia-design', 'esseuh-cm-cover', 'esseuh-influenceurs-cover', 'esseuh-phone-photographe', 'esseuh-bref-missions', 'esseuh-client-vs-cm'], true),
  project('Visuels de vœux & fêtes', 'Réseaux sociaux', 'PERFEKT AGENCY', null, 'voeux-ramadan',
    'Visuels de vœux pour les fêtes religieuses et le Nouvel An, et offre spéciale « visuels de fin d’année ».',
    ['voeux-ramadan', 'voeux-nouvel-an', 'visuels-fin-annee']),
];

const settings = {
  contact: {
    phone: '+228 92 86 60 43',
    phone2: '+228 70 54 19 63',
    whatsapp: '22892866043',
    email: 'perfektagency@gmail.com',
    address: 'Lomé, Togo',
    hours: 'Lun – Sam · sur rendez-vous',
    map_query: 'Lomé, Togo',
    messenger: 'https://m.me/Agencecreativetg',
  },
  socials: {
    facebook: 'https://www.facebook.com/Agencecreativetg/', instagram: '', linkedin: '', tiktok: '', youtube: '',
  },
  stats: [
    { value: 13, suffix: '+', label: 'Marques & organisations accompagnées' },
    { value: 3, suffix: '', label: 'Formations Pro certifiantes' },
    { value: 32, suffix: ' h', label: 'De formation en graphisme' },
    { value: 16, suffix: '', label: 'Séances pratiques par cursus graphisme' },
  ],
  hero: {
    title: 'Nous créons des marques qui inspirent. Nous formons ceux qui les créent.',
    subtitle: 'Agence créative basée à Lomé : créations digitales, formations, stratégies & communication, UX/UI design. Perfekt, tout simplement.',
  },
  results: [
    { client: 'Togo Nou', work: 'Marché des Soldes des produits locaux & panel', metric: 'Campagne', label: 'Affiches & réseaux sociaux' },
    { client: 'MIATO', work: 'Célébration de l’indépendance du Togo', metric: 'Visuel', label: 'Institutionnel' },
    { client: 'ADJAFI', work: 'Foire des Jeunes Entrepreneurs — fête de l’indépendance', metric: 'Visuel', label: 'Publicité' },
    { client: 'Together 4 Change', work: 'Goodies brodés & visuel', metric: 'Branding', label: 'Textile' },
    { client: 'Burger Fabric', work: 'Affiche du spectacle EGLI — Acte III', metric: 'Affiche', label: 'Événementiel' },
    { client: 'Panorama Review', work: 'La Soirée des 100', metric: 'Affiche', label: 'Événementiel' },
  ],
  testimonials: [],
  team: [
    { name: 'Innocent M. Kutowogbe', role: 'Manager · Consultant en communication visuelle · Graphic & UI Designer · Formateur arts graphiques', photo: IMG('equipe/innocent-kutowogbe') },
    { name: 'Jovial Sodatonou', role: 'Social Media Manager · Formateur Community Management', photo: IMG('equipe/jovial-sodatonou') },
    { name: 'Vivien Kutowogbe', role: 'Animateur digital · Vidéaste · Formateur Montage vidéo', photo: IMG('equipe/vivien-kutowogbe') },
  ],
  partners: ['ADJAFI', 'Maxkom', 'ISLA', 'Langcenter International', 'Attoté de la Source', 'JIVA Corporation', 'Sentinelle', 'Together 4 Change', 'Burger Fabric', 'Saviour', 'MIATO', 'Togo Nou', 'Panorama Review'],
  home_faq: [
    { q: 'Quels services propose PERFEKT AGENCY ?', a: 'Créations digitales (graphisme, branding, logos, affiches, visuels réseaux sociaux), stratégies & communication, community management, vidéo, UX/UI design et design intérieur 3D — ainsi que des formations professionnelles.' },
    { q: 'Comment obtenir un devis ?', a: 'Remplissez le formulaire de devis ou appelez le +228 92 86 60 43 (WhatsApp). Nous revenons vers vous rapidement avec une proposition adaptée.' },
    { q: 'Les formations sont-elles certifiantes ?', a: 'Oui. Nos formations Pro sont certifiantes, avec accompagnement personnalisé et conseils offerts. En ligne, une attestation vérifiable par QR code est délivrée après réussite de l’examen final.' },
    { q: 'Combien de temps durent les formations ?', a: 'Graphisme : 32 heures en 16 séances pratiques. Community Management et Création & Montage Vidéo : 24 heures en 8 séances pratiques chacune.' },
    { q: 'Comment s’inscrire ?', a: 'Directement en ligne sur PERFEKT Academy (paiement Flooz, Mixx by Yas ou carte), ou via l’infoline +228 92 86 60 43.' },
  ],
};

export async function seed(c) {
  const hash = (p) => bcrypt.hashSync(p, 10);
  await c.query(
    `INSERT INTO users (name,email,password_hash,role,phone,country,city) VALUES
     ('Administrateur PERFEKT','admin@perfektagency.com',$1,'admin','+228 92 86 60 43','Togo','Lomé'),
     ('Apprenant Démo','etudiant@perfektagency.com',$2,'student',NULL,'Togo','Lomé')`,
    [hash('Admin@2026'), hash('Etudiant@2026')]
  );

  const catIds = {};
  for (const [name, slug, d] of categories) {
    catIds[slug] = (await c.query('INSERT INTO categories (name,slug,description) VALUES ($1,$2,$3) RETURNING id', [name, slug, d])).rows[0].id;
  }

  let vi = 0;
  const courseIds = [];
  for (const co of courses) {
    const { rows } = await c.query(
      `INSERT INTO courses (slug,title,subtitle,description,category_id,level,price,promo_price,duration_hours,sessions,image_url,
        objectives,prerequisites,skills,faq,final_project,instructor_name,featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
      [
        co.slug, co.title, co.subtitle,
        `${co.intro}\n\nEn ligne sur PERFEKT Academy, vous avancez à votre rythme : leçons vidéo, exercices, quiz et projet final. Votre progression est enregistrée automatiquement et une attestation vérifiable vous est délivrée à la réussite de l’examen final.`,
        catIds[co.cat], co.level, co.price, co.promo, co.hours, co.sessions, IMG(co.image),
        JSON.stringify(co.objectives), JSON.stringify(co.prerequisites), JSON.stringify(co.skills),
        JSON.stringify([
          { q: 'La formation est-elle certifiante ?', a: 'Oui. Après réussite de l’examen final, une attestation PERFEKT avec numéro unique et QR code de vérification est générée automatiquement.' },
          { q: 'Puis-je poser des questions au formateur ?', a: `Oui, chaque leçon dispose d’un espace de discussion et de questions directes à ${co.instructor}. L’accompagnement personnalisé et les conseils sont offerts.` },
          { q: 'Comment s’inscrire ou obtenir plus d’informations ?', a: 'Achetez la formation en ligne (Flooz, Mixx by Yas, carte) ou contactez l’infoline : +228 92 86 60 43.' },
        ]),
        `Réalisez un projet complet mettant en pratique « ${co.title} » et déposez-le dans la dernière leçon pour évaluation par le formateur.`,
        co.instructor, co.featured,
      ]
    );
    const courseId = rows[0].id;
    courseIds.push(courseId);
    for (let m = 0; m < co.modules.length; m++) {
      const [mTitle, lessons] = co.modules[m];
      const moduleId = (await c.query('INSERT INTO modules (course_id,title,position) VALUES ($1,$2,$3) RETURNING id', [courseId, mTitle, m])).rows[0].id;
      const isLastModule = m === co.modules.length - 1;
      const list = isLastModule ? [...lessons, 'Projet final'] : lessons;
      for (let l = 0; l < list.length; l++) {
        const title = list[l];
        const type = title === 'Projet final' ? 'exercise' : l === 2 && m === 0 ? 'pdf' : 'video';
        await c.query(
          `INSERT INTO lessons (module_id,title,type,video_url,file_url,content,duration_min,position,is_preview) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            moduleId, title, type,
            type === 'video' ? videos[vi++ % videos.length] : null,
            type === 'pdf' ? 'support' : null,
            type === 'exercise'
              ? `Projet final : réalisez un livrable complet mettant en pratique « ${co.title} ». Décrivez votre démarche et partagez le lien de votre travail (Drive, Behance, YouTube…).`
              : `Leçon « ${title} » du module « ${mTitle} ». Contenu détaillé et vidéo à compléter par le formateur depuis l’administration.`,
            type === 'video' ? 10 + ((m + l) % 3) * 5 : 15, l, m === 0 && l === 0,
          ]
        );
      }
      const qz = await c.query('INSERT INTO quizzes (course_id,module_id,title,is_final) VALUES ($1,$2,$3,false) RETURNING id', [courseId, moduleId, `Quiz — ${mTitle}`]);
      await insertQuestions(c, qz.rows[0].id, co.quiz.slice(m % 2, (m % 2) + 3));
    }
    const fq = await c.query('INSERT INTO quizzes (course_id,title,is_final) VALUES ($1,$2,true) RETURNING id', [courseId, `Examen final — ${co.title}`]);
    await insertQuestions(c, fq.rows[0].id, co.quiz);
  }

  // Apprenant de démonstration inscrit à 2 formations
  await c.query('INSERT INTO enrollments (user_id,course_id) VALUES (2,$1),(2,$2)', [courseIds[0], courseIds[3]]);
  await c.query(
    `INSERT INTO orders (reference,user_id,course_id,original_amount,amount,method,status,paid_at) VALUES
     ('PA-DEMO-0001',2,$1,$3,$3,'flooz','paid',now()),('PA-DEMO-0002',2,$2,$4,$4,'mixx','paid',now())`,
    [courseIds[0], courseIds[3], courses[0].price, courses[3].price]
  );

  await c.query(`INSERT INTO coupons (code,percent,max_uses) VALUES ('BIENVENUE10',10,500),('FEMMES25',25,100)`);

  for (const p of posts) {
    await c.query(
      `INSERT INTO posts (slug,title,category,excerpt,content,author,cover_url,read_minutes,seo_description,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$4,$9)`,
      [p.slug, p.title, p.category, p.excerpt, p.content, p.author, IMG(p.cover), Math.max(2, Math.round(p.content.split(/\s+/).length / 180)), p.created_at]
    );
  }

  for (const p of projects) {
    const slug = p.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await c.query(
      `INSERT INTO projects (slug,title,category,client,year,description,cover_url,gallery,featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [slug, p.title, p.category, p.client, p.year, p.description, IMG(p.cover), JSON.stringify(p.gallery.map(IMG)), p.featured]
    );
  }

  for (const [k, v] of Object.entries(settings)) {
    await c.query('INSERT INTO settings (key,value) VALUES ($1,$2)', [k, JSON.stringify(v)]);
  }
}

async function insertQuestions(c, quizId, list) {
  for (let i = 0; i < list.length; i++) {
    const [q, opts, ci] = list[i];
    await c.query('INSERT INTO questions (quiz_id,question,options,correct_index,position) VALUES ($1,$2,$3,$4,$5)', [quizId, q, JSON.stringify(opts), ci, i]);
  }
}
