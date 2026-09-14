import { lundi, semaineIso } from '@/lib/admin/tableauDeBord';
import type { Appareil } from './mesure';

/*
 * Les chiffres de l'écran /admin/statistiques : ce que renvoie la fonction
 * admin_statistiques, et les mises en forme (durées, évolutions, regroupement
 * des jours en semaines ou en mois, noms des pages).
 */

export type Ligne = Record<string, any>;

export interface JourStats {
  /** AAAA-MM-JJ, jour de Paris. */
  jour: string;
  vues: number;
  visites: number;
}

export interface PageStats {
  chemin: string;
  vues: number;
  visiteurs: number;
  /** Secondes, moyenne des pages dont on connaît la durée. */
  dureeMoyenne: number;
  /** Visites qui ont commencé par cette page. */
  entrees: number;
}

export interface Statistiques {
  jours: number;
  debut: Date;
  totaux: {
    vues: number;
    visiteurs: number;
    visites: number;
    dureeTotale: number;
    rebonds: number;
    visitesConnectees: number;
    nouveaux: number;
    actifs: number;
  };
  precedent: { vues: number; visiteurs: number; visites: number };
  parJour: JourStats[];
  /** 24 valeurs : pages vues par heure de la journée (Paris). */
  parHeure: number[];
  pages: PageStats[];
  provenances: { provenance: string | null; visites: number }[];
  appareils: Record<Appareil, number>;
  hotes: { hote: string; vues: number }[];
}

const n = (v: unknown) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));

export function versStatistiques(r: Ligne): Statistiques {
  const t = r.totaux ?? {};
  const p = r.precedent ?? {};
  const a = r.appareils ?? {};
  const heures = Array.isArray(r.par_heure) ? r.par_heure.map(n) : [];
  return {
    jours: n(r.jours),
    debut: new Date(r.debut),
    totaux: {
      vues: n(t.vues),
      visiteurs: n(t.visiteurs),
      visites: n(t.visites),
      dureeTotale: n(t.duree_totale),
      rebonds: n(t.rebonds),
      visitesConnectees: n(t.visites_connectees),
      nouveaux: n(t.nouveaux),
      actifs: n(t.actifs),
    },
    precedent: { vues: n(p.vues), visiteurs: n(p.visiteurs), visites: n(p.visites) },
    parJour: (r.par_jour ?? []).map((j: Ligne) => ({ jour: String(j.jour), vues: n(j.vues), visites: n(j.visites) })),
    parHeure: Array.from({ length: 24 }, (_, h) => heures[h] ?? 0),
    pages: (r.pages ?? []).map((pg: Ligne) => ({
      chemin: String(pg.chemin),
      vues: n(pg.vues),
      visiteurs: n(pg.visiteurs),
      dureeMoyenne: n(pg.duree_moyenne),
      entrees: n(pg.entrees),
    })),
    provenances: (r.provenances ?? []).map((pv: Ligne) => ({ provenance: pv.provenance ?? null, visites: n(pv.visites) })),
    appareils: { mobile: n(a.mobile), tablette: n(a.tablette), ordinateur: n(a.ordinateur) },
    hotes: (r.hotes ?? []).map((h: Ligne) => ({ hote: String(h.hote), vues: n(h.vues) })),
  };
}

/** « 45 s », « 3 min 05 », « 1 h 12 ». */
export function dureeLisible(secondes: number): string {
  const s = Math.max(0, Math.round(secondes));
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60);
  if (min < 60) return `${min} min ${String(s % 60).padStart(2, '0')}`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

/** Évolution en % par rapport à la période précédente ; null sans point de comparaison. */
export function evolution(actuel: number, precedent: number): number | null {
  if (!precedent) return null;
  return Math.round(((actuel - precedent) / precedent) * 100);
}

/** Part en %, arrondie ; 0 quand le total est nul. */
export function part(nombre: number, total: number): number {
  return total ? Math.round((nombre / total) * 100) : 0;
}

/** Nombre à une décimale, virgule française : « 2,4 ». */
export function uneDecimale(v: number): string {
  return String(Math.round(v * 10) / 10).replace('.', ',');
}

export type Pas = 'jour' | 'semaine' | 'mois';

/** Barres lisibles : jours jusqu'à un mois, semaines jusqu'à 4 mois, mois au-delà. */
export function pasPour(jours: number): Pas {
  if (jours <= 31) return 'jour';
  if (jours <= 120) return 'semaine';
  return 'mois';
}

export interface Barre {
  cle: string;
  libelle: string;
  /** Pour l'infobulle : « lundi 14 septembre », « semaine du 7 septembre »… */
  detail: string;
  visites: number;
  vues: number;
  courante: boolean;
}

const deux = (v: number) => String(v).padStart(2, '0');
const cleJour = (d: Date) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
const midi = (jour: string) => new Date(`${jour}T12:00:00`);

/** Les jours de la période, regroupés selon le pas ; la dernière barre est la période en cours. */
export function regrouper(parJour: JourStats[], jours: number): Barre[] {
  const pas = pasPour(jours);
  const barres = new Map<string, Barre>();
  for (const j of parJour) {
    const d = midi(j.jour);
    let cle = j.jour;
    let libelle = `${deux(d.getDate())}/${deux(d.getMonth() + 1)}`;
    let detail = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (pas === 'semaine') {
      const l = lundi(d);
      cle = cleJour(l);
      libelle = `S${semaineIso(l)}`;
      detail = `semaine du ${l.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
    } else if (pas === 'mois') {
      cle = j.jour.slice(0, 7);
      libelle = d.toLocaleDateString('fr-FR', { month: 'short' });
      detail = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    const b = barres.get(cle) ?? { cle, libelle, detail, visites: 0, vues: 0, courante: false };
    b.visites += j.visites;
    b.vues += j.vues;
    barres.set(cle, b);
  }
  const liste = [...barres.values()];
  if (liste.length) liste[liste.length - 1].courante = true;
  return liste;
}

/* Noms lisibles des pages les plus courantes ; les autres gardent leur adresse. */
const NOMS_PAGES: Record<string, string> = {
  '/': 'Accueil',
  '/about': 'À propos',
  '/pricing': 'Tarifs',
  '/diagnostic': 'Diagnostic',
  '/diagnostic-produit': 'Diagnostic produit',
  '/mes-bilans': 'Mes bilans',
  '/coachs': 'Espace coachs',
  '/auth/login': 'Connexion',
  '/auth/register': 'Inscription',
  '/auth/forgot-password': 'Mot de passe oublié',
  '/settings': 'Paramètres du compte',
  '/app/vision': 'Atelier Vision',
  '/app/fit': 'Atelier Market Fit',
  '/app/finance': 'Atelier Finance',
  '/app/okr': 'OKR',
  '/app/outils': 'Boîte à outils',
  '/invitations/[token]': 'Invitation reçue',
  '/legal/cookies-policy': 'Cookies',
  '/legal/privacy-policy': 'Confidentialité',
  '/legal/terms-of-service': 'Conditions d’utilisation',
};

export function nomPage(chemin: string): string | null {
  return NOMS_PAGES[chemin] ?? null;
}
