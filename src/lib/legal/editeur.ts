/*
 * Informations légales d'Oskar, communes aux pages de src/pages/legal.
 *
 * Éditeur : HaSenso, la société de Christophe Grassi (extrait Kbis du
 * 28/01/2026, numéro de TVA relevé sur ses factures). À mettre à jour ici
 * seulement : les pages lisent ces constantes.
 */

export const MISE_A_JOUR = '13 septembre 2026';

export const EDITEUR = {
  nom: 'HaSenso',
  forme: 'SARL à associé unique au capital de 5 000 €',
  siege: '151 rue de la Fouillade, 34820 Teyran, France',
  rcs: 'RCS Montpellier 933 548 737',
  tva: 'FR46 933 548 737',
  directeurPublication: 'Christophe Grassi, gérant',
  email: 'contact@oskar-coach.fr',
  telephone: { affiche: '06 63 07 04 35', lien: 'tel:+33663070435' },
};

/** Adresse dédiée aux données personnelles (redirection OVH). */
export const EMAIL_DONNEES = 'privacy@oskar-coach.fr';

/** Hébergeur du site, au sens de la loi pour la confiance dans l'économie numérique. */
export const HEBERGEUR = {
  nom: 'Netlify, Inc.',
  adresse: '101 2nd Street, San Francisco, CA 94105, États-Unis',
  site: 'https://www.netlify.com',
};

/** Prestataires qui traitent des données pour le compte de HaSenso. */
export const SOUS_TRAITANTS: { nom: string; role: string }[] = [
  { nom: 'Supabase', role: 'base de données et connexion aux comptes' },
  { nom: 'Netlify', role: 'hébergement du site' },
  { nom: 'Resend', role: 'envoi des emails (bilans, confirmations, notifications)' },
  { nom: 'Google (Gemini)', role: 'suggestions par intelligence artificielle, uniquement lorsque vous les demandez' },
];
