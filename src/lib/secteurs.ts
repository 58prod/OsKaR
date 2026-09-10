/*
 * Domaines d'activité — liste reprise telle quelle des maquettes
 * (`Oskar/plateforme/vision.html`, liste « profil-secteur »), familles et
 * intitulés compris. Les maquettes font référence : cette liste est la seule de
 * l'application, pour que le secteur choisi ici veuille dire la même chose
 * partout.
 *
 * 14 familles, 95 activités.
 */

export interface FamilleSecteurs {
  /** Intitulé de la famille, affiché comme titre de groupe. */
  famille: string;
  activites: string[];
}

export const SECTEURS: FamilleSecteurs[] = [
  {
    famille: "Artisanat & bâtiment",
    activites: [
      "Plombier",
      "Électricien",
      "Chauffagiste / climatisation",
      "Menuisier",
      "Maçon",
      "Peintre",
      "Couvreur",
      "Serrurier",
      "Artisan multi-services",
      "Bureau d'études / maîtrise d'œuvre",
      "Architecte",
      "Diagnostiqueur immobilier",
    ],
  },
  {
    famille: "Immobilier & habitat",
    activites: [
      "Agent immobilier",
      "Gestion locative / syndic",
      "Promoteur immobilier",
      "Décoration / architecture d'intérieur",
      "Maintenance / entretien",
      "Détection de fuites",
      "Sécurité / alarmes / domotique",
    ],
  },
  {
    famille: "Conseil & accompagnement",
    activites: [
      "Consultant",
      "Coach professionnel",
      "Formateur",
      "Facilitateur / agile coach",
      "Cabinet de conseil",
      "Accompagnement RH",
      "Accompagnement dirigeant",
    ],
  },
  {
    famille: "Comptabilité, finance & juridique",
    activites: [
      "Expert-comptable",
      "Cabinet comptable",
      "Gestion de patrimoine",
      "Courtier",
      "Assurance / prévoyance",
      "Banque / finance",
      "Avocat / juridique",
      "Fiscalité",
    ],
  },
  {
    famille: "Santé, social & bien-être",
    activites: [
      "Professionnel de santé",
      "Thérapeute",
      "Psychologue",
      "Bien-être / relaxation",
      "Nutrition / sport",
      "Crèche / petite enfance",
      "Médico-social",
      "Association / fondation",
    ],
  },
  {
    famille: "Commerce & services",
    activites: [
      "Commerce de proximité",
      "E-commerce",
      "Vente / distribution",
      "Service aux particuliers",
      "Service aux entreprises",
      "Franchise",
      "Relation client / support",
    ],
  },
  {
    famille: "Numérique & innovation",
    activites: [
      "Développement web / logiciel",
      "Startup",
      "SaaS",
      "Produit numérique",
      "IA / data",
      "UX / UI / design",
      "Cybersécurité",
      "Marketing digital",
      "Communication digitale",
    ],
  },
  {
    famille: "Communication & création",
    activites: [
      "Agence de communication",
      "Graphisme / design",
      "Vidéo / photo",
      "Création de contenu",
      "Community management",
      "Événementiel",
      "Branding / publicité",
    ],
  },
  {
    famille: "Industrie & logistique",
    activites: [
      "Industrie",
      "Production",
      "Maintenance industrielle",
      "Logistique",
      "Transport",
      "Supply chain",
      "Qualité / sécurité",
    ],
  },
  {
    famille: "Éducation, sport & loisirs",
    activites: [
      "Enseignement",
      "Centre de formation",
      "Coaching sportif",
      "Club sportif",
      "Loisirs / animation",
      "Culture / spectacle",
    ],
  },
  {
    famille: "Tourisme & restauration",
    activites: [
      "Hôtellerie",
      "Restauration",
      "Café / bar",
      "Tourisme",
      "Voyage / organisation de séjours",
    ],
  },
  {
    famille: "Agriculture & environnement",
    activites: [
      "Agriculture",
      "Viticulture",
      "Paysagisme",
      "Énergies renouvelables",
      "Transition écologique",
      "Gestion environnementale",
    ],
  },
  {
    famille: "Secteur public & intérêt général",
    activites: [
      "Administration publique",
      "Collectivité territoriale",
      "Service public",
      "ONG / association",
      "Fondation",
    ],
  },
  {
    famille: "Autre",
    activites: [
      "Autre activité",
    ],
  },
];

/** Toutes les activités, à plat — pour vérifier qu'une valeur enregistrée existe encore. */
export const TOUTES_ACTIVITES: string[] = SECTEURS.flatMap((s) => s.activites);

/** La famille à laquelle appartient une activité, ou null si elle est inconnue. */
export function familleDe(activite: string | undefined | null): string | null {
  if (!activite) return null;
  return SECTEURS.find((s) => s.activites.includes(activite))?.famille ?? null;
}
