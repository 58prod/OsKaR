/*
 * Atelier Fit — transposition de `Oskar/plateforme/fit-atelier.html`.
 *
 * Quatre étapes de saisie, puis le diagnostic, qui figure dans la barre
 * d'étapes comme dans la maquette :
 *   1. L'offre            — intitulé, bénéfice, périmètre, pitch, lisibilité
 *   2. La différenciation — avantage, perception client, durabilité
 *   3. La concurrence     — tableau des alternatives, raison du choix
 *   4. Les signaux        — qualitatifs, quantitatifs, demande entrante
 *   5. Le diagnostic      — statut Market Fit calculé, récapitulatif
 *
 * Le calcul du statut reprend à l'identique celui de la maquette
 * (`computeFitScore`, `getFitStatut`, `buildDiagnostic`).
 */

export const ETAPES_FIT = ['offre', 'differenciation', 'concurrence', 'signaux', 'diagnostic'] as const;

export type EtapeFit = (typeof ETAPES_FIT)[number];

/** Libellés de la barre d'étapes (`stepLabels` de la maquette). */
export const LIBELLES_ETAPES_FIT: Record<EtapeFit, string> = {
  offre: 'Offre',
  differenciation: 'Différenciation',
  concurrence: 'Concurrence',
  signaux: 'Signaux',
  diagnostic: 'Diagnostic',
};

export const TYPES_CONCURRENT = ['Direct', 'Indirect', 'Substitut', 'Statu quo'] as const;

/** Réponses des questions à trois choix, valeurs de la maquette. */
export type Reponse = '' | 'oui' | 'parfois' | 'non';
export type Durabilite = '' | 'oui' | 'moyen' | 'non';
export type Demande = '' | 'forte' | 'stable' | 'faible';

export interface Concurrent {
  id: string;
  nom: string;
  type: string;
  /** Ce qu'ils font bien. */
  bien: string;
  /** Notre avantage face à eux. */
  avantage: string;
}

/** L'ensemble de ce qu'un atelier Fit produit. */
export interface AtelierFit {
  /* Étape 1 — l'offre */
  offreNom: string;
  offreValeur: string;
  offreLimite: string;
  offrePitch: string;
  lisibilite: Reponse;
  /* Étape 2 — la différenciation */
  diffAvantage: string;
  diffClients: Reponse;
  diffMieux: string;
  diffDurable: Durabilite;
  /* Étape 3 — la concurrence */
  concurrents: Concurrent[];
  concRaison: string;
  concSans: string;
  /* Étape 4 — les signaux */
  sigVerbatim: string;
  sigBouche: Reponse;
  sigRetention: string;
  sigOrganique: string;
  sigNps: string;
  sigAutre: string;
  sigDemande: Demande;
}

const nouvelId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

export const nouveauConcurrent = (): Concurrent => ({ id: nouvelId(), nom: '', type: '', bien: '', avantage: '' });

/** La maquette ouvre le tableau avec trois lignes vides. */
export const ATELIER_FIT_VIDE: AtelierFit = {
  offreNom: '',
  offreValeur: '',
  offreLimite: '',
  offrePitch: '',
  lisibilite: '',
  diffAvantage: '',
  diffClients: '',
  diffMieux: '',
  diffDurable: '',
  concurrents: [
    { id: 'c1', nom: '', type: '', bien: '', avantage: '' },
    { id: 'c2', nom: '', type: '', bien: '', avantage: '' },
    { id: 'c3', nom: '', type: '', bien: '', avantage: '' },
  ],
  concRaison: '',
  concSans: '',
  sigVerbatim: '',
  sigBouche: '',
  sigRetention: '',
  sigOrganique: '',
  sigNps: '',
  sigAutre: '',
  sigDemande: '',
};

/** Complète un contenu enregistré avec les champs que l'atelier vide définit. */
export function fusionnerFit(contenu: unknown): AtelierFit {
  const brut = (contenu ?? {}) as Partial<AtelierFit>;
  return {
    ...ATELIER_FIT_VIDE,
    ...brut,
    concurrents: brut.concurrents?.length ? brut.concurrents : ATELIER_FIT_VIDE.concurrents,
  };
}

/* ── Diagnostic ── */

/** Score de 0 à 17, barème de `computeFitScore`. */
export function scoreFit(a: AtelierFit): number {
  let score = 0;
  if (a.lisibilite === 'oui') score += 3;
  else if (a.lisibilite === 'parfois') score += 1;
  if (a.offrePitch.trim().length > 20) score += 1;
  if (a.diffClients === 'oui') score += 3;
  else if (a.diffClients === 'parfois') score += 1;
  if (a.diffDurable === 'oui') score += 2;
  else if (a.diffDurable === 'moyen') score += 1;
  if (a.sigBouche === 'oui') score += 3;
  else if (a.sigBouche === 'parfois') score += 1;
  if (a.sigDemande === 'forte') score += 3;
  else if (a.sigDemande === 'stable') score += 1;
  if (a.sigRetention.trim().length > 3) score += 2;
  return score;
}

export interface StatutFit {
  libelle: string;
  couleur: string;
  fond: string;
  description: string;
  /** Texte de la carte « Prochaine étape recommandée ». */
  prochaineEtape: string;
  /** Version courte, reprise dans le PDF comme dans la maquette. */
  prochaineEtapePdf: string;
}

/** Les quatre statuts de `getFitStatut`, seuils 13 / 8 / 4. */
export function statutFit(score: number): StatutFit {
  if (score >= 13)
    return {
      libelle: '✅ FIT Confirmé',
      couleur: '#00b89c',
      fond: '#e0faf6',
      description: 'Votre offre correspond bien à votre marché. Les signaux sont solides. Capitalisez et développez.',
      prochaineEtape:
        'Traduisez votre FIT en OKR avec le module OSKAR OKR — et documentez ce qui fonctionne pour le répliquer.',
      prochaineEtapePdf: 'Traduisez votre FIT en OKR avec le module OSKAR OKR.',
    };
  if (score >= 8)
    return {
      libelle: '🧪 FIT en construction',
      couleur: '#f59e0b',
      fond: '#fffbeb',
      description:
        'Des signaux positifs existent mais certaines dimensions restent à consolider. Continuez à tester et ajuster.',
      prochaineEtape:
        'Renforcez vos signaux terrain : collectez des verbatims clients, mesurez la rétention, et affinez votre différenciation.',
      prochaineEtapePdf: 'Renforcez vos signaux terrain et affinez votre différenciation.',
    };
  if (score >= 4)
    return {
      libelle: '🔍 FIT en exploration',
      couleur: '#3b82f6',
      fond: '#eff6ff',
      description:
        'Votre offre et votre positionnement sont en cours de définition. Priorité : collecte de signaux terrain.',
      prochaineEtape:
        'Priorité aux entretiens clients — 5 conversations honnêtes valent plus que 100 hypothèses. Revenez sur l’étape Offre.',
      prochaineEtapePdf: 'Priorité aux entretiens clients — 5 conversations valent plus que 100 hypothèses.',
    };
  return {
    libelle: '❌ FIT à construire',
    couleur: '#ef4444',
    fond: '#fef2f2',
    description:
      'L’adéquation marché n’est pas encore établie. Revenez sur la clarté de l’offre et la différenciation.',
    prochaineEtape:
      'Retravaillez la clarté de votre offre avec l’atelier OSKAR Vision, puis revenez tester votre positionnement sur ce module.',
    prochaineEtapePdf: 'Revenez sur l’atelier Vision pour clarifier votre offre et votre positionnement.',
  };
}

/** Les concurrents réellement nommés. */
export const concurrentsRenseignes = (a: AtelierFit) => a.concurrents.filter((c) => c.nom.trim());

/** Les quatre cases du récapitulatif, formulées comme dans la maquette. */
export function recapFit(a: AtelierFit) {
  const offre =
    a.lisibilite === 'oui'
      ? '✅ Lisible'
      : a.lisibilite === 'parfois'
        ? '⚠️ À préciser'
        : a.lisibilite === 'non'
          ? '❌ À retravailler'
          : '—';

  const diffOk =
    (a.diffClients === 'oui' || a.diffClients === 'parfois') && (a.diffDurable === 'oui' || a.diffDurable === 'moyen');
  const differenciation =
    a.diffClients === 'oui' && a.diffDurable === 'oui' ? '✅ Forte' : diffOk ? '⚠️ À renforcer' : '❌ À définir';

  const n = concurrentsRenseignes(a).length;
  const concurrence = n > 0 ? `✅ Cartographié (${n})` : '⚠️ À compléter';

  const signaux =
    a.sigBouche === 'oui' && a.sigDemande === 'forte'
      ? '✅ Solides'
      : a.sigBouche === 'parfois' || a.sigDemande === 'stable'
        ? '⚠️ Partiels'
        : '❌ Faibles';

  return { offre, differenciation, concurrence, signaux };
}

/** Les signaux chiffrés mis bout à bout, séparés par « · ». */
export function signauxResumes(a: AtelierFit, avecVerbatim: boolean): string {
  const parts: string[] = [];
  if (a.sigRetention.trim()) parts.push(`Rétention : ${a.sigRetention.trim()}`);
  if (a.sigOrganique.trim()) parts.push(`Croissance organique : ${a.sigOrganique.trim()}`);
  if (a.sigNps.trim()) parts.push(`NPS : ${a.sigNps.trim()}`);
  if (avecVerbatim && a.sigVerbatim.trim()) parts.push(a.sigVerbatim.trim());
  return parts.join(' · ');
}

/** Les quatre textes de détail du diagnostic. */
export function detailsFit(a: AtelierFit) {
  return {
    offre: a.offrePitch.trim() || a.offreValeur.trim() || '—',
    differenciation: a.diffAvantage.trim() || '—',
    concurrence: a.concRaison.trim() || '—',
    signaux: signauxResumes(a, true) || '—',
  };
}

/** Une étape est-elle entamée ? */
export function etapeFitRemplie(a: AtelierFit, etape: EtapeFit): boolean {
  switch (etape) {
    case 'offre':
      return Boolean(a.offreNom.trim() || a.offreValeur.trim() || a.offrePitch.trim() || a.lisibilite);
    case 'differenciation':
      return Boolean(a.diffAvantage.trim() || a.diffMieux.trim() || a.diffClients || a.diffDurable);
    case 'concurrence':
      return concurrentsRenseignes(a).length > 0 || Boolean(a.concRaison.trim());
    case 'signaux':
      return Boolean(a.sigVerbatim.trim() || a.sigRetention.trim() || a.sigBouche || a.sigDemande);
    default:
      return false;
  }
}
