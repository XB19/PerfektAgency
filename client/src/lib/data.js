import {
  PenTool, Gem, Sparkles, Palette, Megaphone, FileText, Film, Video, Users, Share2, Search,
  Compass, MessagesSquare, Briefcase, LayoutTemplate, Box,
} from 'lucide-react';
import { Facebook, Instagram } from '../components/BrandIcons';

export const POLES = [
  { id: 'design', name: 'Design & Branding', desc: 'Des identités fortes, cohérentes et mémorables.' },
  { id: 'video', name: 'Vidéo & Motion', desc: 'Des images qui racontent et qui émeuvent.' },
  { id: 'digital', name: 'Social & Publicité', desc: 'Des communautés engagées et des campagnes rentables.' },
  { id: 'conseil', name: 'Stratégie & Conseil', desc: 'Une vision claire pour une communication efficace.' },
];

export const SERVICES = [
  { slug: 'graphisme', pole: 'design', icon: PenTool, title: 'Graphisme', desc: 'Création graphique sur mesure pour tous vos supports print et digitaux.', aud: ['entreprises', 'ong', 'entrepreneurs'] },
  { slug: 'branding', pole: 'design', icon: Gem, title: 'Branding', desc: 'Plateforme de marque, positionnement, ton et univers visuel.', aud: ['entreprises', 'entrepreneurs'] },
  { slug: 'creation-de-logo', pole: 'design', icon: Sparkles, title: 'Création de logo', desc: 'Un logo intemporel, simple et distinctif, décliné sur tous formats.', aud: ['entrepreneurs', 'ong', 'entreprises'] },
  { slug: 'identite-visuelle', pole: 'design', icon: Palette, title: 'Identité visuelle', desc: 'Charte graphique complète : couleurs, typographies, règles d’usage.', aud: ['entreprises', 'ong', 'institutions'] },
  { slug: 'conception-publicitaire', pole: 'design', icon: Megaphone, title: 'Conception publicitaire', desc: 'Affiches, bannières et campagnes qui captent l’attention.', aud: ['entreprises', 'institutions'] },
  { slug: 'supports-de-communication', pole: 'design', icon: FileText, title: 'Supports de communication', desc: 'Plaquettes, flyers, rapports annuels, kakémonos, packagings.', aud: ['entreprises', 'ong', 'institutions'] },
  { slug: 'ux-ui-design', pole: 'design', icon: LayoutTemplate, title: 'UX/UI Design', desc: 'Interfaces web et mobiles claires, belles et centrées sur l’utilisateur.', aud: ['entreprises', 'entrepreneurs', 'institutions'] },
  { slug: 'design-interieur-3d', pole: 'design', icon: Box, title: 'Design intérieur 3D', desc: 'Vos espaces modélisés en 3D avant les travaux : bureaux, boutiques, showrooms.', aud: ['entreprises', 'entrepreneurs'] },
  { slug: 'montage-video', pole: 'video', icon: Film, title: 'Montage vidéo', desc: 'Montage rythmé, étalonnage et sound design pour tous les écrans.', aud: ['entreprises', 'entrepreneurs', 'ong'] },
  { slug: 'videographie', pole: 'video', icon: Video, title: 'Vidéographie', desc: 'Films institutionnels, spots, événements et contenus de marque.', aud: ['entreprises', 'institutions', 'ong'] },
  { slug: 'community-management', pole: 'digital', icon: Users, title: 'Community Management', desc: 'Animation quotidienne et modération de vos communautés.', aud: ['entreprises', 'entrepreneurs'] },
  { slug: 'gestion-reseaux-sociaux', pole: 'digital', icon: Share2, title: 'Gestion des réseaux sociaux', desc: 'Ligne éditoriale, calendrier, création de contenus et reporting.', aud: ['entreprises', 'ong', 'entrepreneurs'] },
  { slug: 'publicite-facebook', pole: 'digital', icon: Facebook, title: 'Publicité Facebook', desc: 'Campagnes ciblées optimisées pour vos objectifs business.', aud: ['entreprises', 'entrepreneurs'] },
  { slug: 'publicite-instagram', pole: 'digital', icon: Instagram, title: 'Publicité Instagram', desc: 'Reels, stories et posts sponsorisés à fort impact visuel.', aud: ['entreprises', 'entrepreneurs'] },
  { slug: 'publicite-google', pole: 'digital', icon: Search, title: 'Publicité Google', desc: 'Search, Display et YouTube Ads pour capter la demande.', aud: ['entreprises', 'institutions'] },
  { slug: 'strategie-digitale', pole: 'conseil', icon: Compass, title: 'Stratégie digitale', desc: 'Audit, feuille de route et indicateurs de performance.', aud: ['entreprises', 'institutions', 'ong'] },
  { slug: 'conseil-en-communication', pole: 'conseil', icon: MessagesSquare, title: 'Conseil en communication', desc: 'Messages clés, plan de communication et gestion de crise.', aud: ['institutions', 'ong', 'entreprises'] },
  { slug: 'accompagnement-entreprises', pole: 'conseil', icon: Briefcase, title: 'Accompagnement des entreprises', desc: 'Transformation digitale et montée en compétences de vos équipes.', aud: ['entreprises', 'institutions', 'ong'] },
];

export const AUDIENCES = [
  { id: 'all', label: 'Tous' },
  { id: 'entreprises', label: 'Entreprises' },
  { id: 'institutions', label: 'Institutions' },
  { id: 'ong', label: 'ONG' },
  { id: 'entrepreneurs', label: 'Entrepreneurs' },
];

export const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'];
export const PROJECT_CATEGORIES = ['Affiches & événements', 'Publicité', 'Branding', 'Réseaux sociaux', 'Design 3D'];
export const BLOG_CATEGORIES = ['Articles', 'Actualités', 'Tutoriels', 'Conseils', 'SEO'];

export const VALUES = [
  { t: 'Excellence', d: 'Chaque détail compte. Nous visons la perfection dans chaque livrable.' },
  { t: 'Créativité', d: 'Des idées audacieuses, ancrées dans la culture et les usages africains.' },
  { t: 'Confiance', d: 'Transparence, respect des délais et engagement sur les résultats.' },
  { t: 'Transmission', d: 'Partager notre savoir-faire pour faire grandir les talents de demain.' },
];
