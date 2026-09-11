import { formuleDuCompte, dernierJour, ilYA, dateDeChamp } from '@/lib/admin/formule';
import {
  aTraiter,
  chiffresCles,
  contactsSansCompte,
  entonnoir,
  inscriptionsParSemaine,
  semaineIso,
} from '@/lib/admin/tableauDeBord';
import { avancementDuCompte } from '@/lib/admin/avancement';
import { contactsEnCsv } from '@/lib/admin/csv';
import { emailNouvelleCandidature } from '@/lib/coachs/notification';
import { CANDIDATURE_VIDE } from '@/lib/coachs/candidature';
import type { BilanAdmin, CandidatureAdmin, CompteAdmin, FicheCompte } from '@/lib/admin/types';

/*
 * Règles de l'administration : formule affichée, chiffres du tableau de bord,
 * avancement des ateliers, export et email de notification.
 */

const MAINTENANT = new Date(2026, 8, 11, 12, 0); // vendredi 11 septembre 2026, midi
const jours = (n: number) => new Date(MAINTENANT.getTime() + n * 24 * 60 * 60 * 1000);

const compte = (p: Partial<CompteAdmin> = {}): CompteAdmin => ({
  id: Math.random().toString(36).slice(2),
  email: 'a@exemple.fr',
  nom: 'Alice Martin',
  entreprise: null,
  activite: null,
  creeLe: jours(-1),
  derniereConnexion: null,
  plan: 'free',
  statut: 'active',
  expireLe: null,
  offerte: false,
  motif: null,
  stripe: false,
  demo: false,
  ateliers: { vision: false, fit: false, finance: false, okr: false, team: false },
  nbBilans: 0,
  ...p,
});

const offerte = (fin: Date, p: Partial<CompteAdmin> = {}) =>
  compte({ plan: 'unlimited', offerte: true, motif: 'Membre fondateur', expireLe: fin, ...p });

const bilan = (p: Partial<BilanAdmin> = {}): BilanAdmin => ({
  id: Math.random().toString(36).slice(2),
  creeLe: jours(-1),
  email: 'b@exemple.fr',
  type: 'organisation',
  note: 5.8,
  accepteRecontact: false,
  aUnCompte: false,
  compteExiste: false,
  ...p,
});

describe('Formule affichée', () => {
  it('le compte de démo reste « Démo », quelle que soit sa formule', () => {
    expect(formuleDuCompte(compte({ demo: true, plan: 'unlimited' }), MAINTENANT).genre).toBe('demo');
  });

  it('une formule offerte en cours affiche son dernier jour, la veille de l’échéance enregistrée', () => {
    const f = formuleDuCompte(offerte(new Date('2027-01-01T00:00:00+01:00')), MAINTENANT);
    expect(f.genre).toBe('offerte');
    expect(f.motif).toBe('Membre fondateur');
    expect(dateDeChamp(f.jusquAu as Date)).toBe('2026-12-31');
  });

  it('une formule offerte échue redevient gratuite, en gardant la date de fin', () => {
    const f = formuleDuCompte(offerte(jours(-2)), MAINTENANT);
    expect(f.genre).toBe('gratuit');
    expect(f.offreExpireeLe).toEqual(dernierJour(jours(-2)));
  });

  it('un abonnement Stripe actif est un abonné ; un abonnement annulé est gratuit', () => {
    expect(formuleDuCompte(compte({ plan: 'pro', stripe: true }), MAINTENANT).libelle).toBe('Abonné');
    expect(formuleDuCompte(compte({ plan: 'pro', statut: 'cancelled' }), MAINTENANT).genre).toBe('gratuit');
  });

  it('« il y a » reste lisible', () => {
    expect(ilYA(null, MAINTENANT)).toBe('jamais');
    expect(ilYA(new Date(MAINTENANT.getTime() - 40 * 60000), MAINTENANT)).toBe('il y a 40 min');
    expect(ilYA(jours(-1), MAINTENANT)).toBe('hier');
    expect(ilYA(jours(-3), MAINTENANT)).toBe('il y a 3 jours');
  });
});

describe('Tableau de bord', () => {
  it('numérote les semaines comme les agendas français (ISO)', () => {
    expect(semaineIso(MAINTENANT)).toBe(37);
    expect(semaineIso(new Date(2026, 0, 1))).toBe(1);
    expect(semaineIso(new Date(2025, 11, 29))).toBe(1);
  });

  it('compte les inscriptions des 8 dernières semaines, la semaine en cours à la fin', () => {
    const semaines = inscriptionsParSemaine(
      [compte({ creeLe: jours(-1) }), compte({ creeLe: jours(-2) }), compte({ creeLe: jours(-14) }), compte({ creeLe: jours(-90) })],
      MAINTENANT
    );
    expect(semaines).toHaveLength(8);
    expect(semaines[7]).toEqual({ libelle: 'S37', nombre: 2, courante: true });
    expect(semaines[5]).toMatchObject({ libelle: 'S35', nombre: 1 });
    expect(semaines.reduce((n, s) => n + s.nombre, 0)).toBe(3);
  });

  it('sépare formules offertes et abonnements, sans compter la démo', () => {
    const cles = chiffresCles(
      [
        offerte(jours(30)),
        offerte(jours(-1)),
        compte({ plan: 'pro', stripe: true }),
        compte({ demo: true, plan: 'unlimited' }),
        compte({ ateliers: { vision: true, fit: true, finance: false, okr: false, team: false } }),
      ],
      [bilan(), bilan({ aUnCompte: true })],
      MAINTENANT
    );
    expect(cles).toMatchObject({
      comptes: 5,
      payantes: 2,
      offertes: 1,
      abonnements: 1,
      ateliers: 2,
      comptesAvecAtelier: 1,
      bilans: 2,
      bilansSansCompte: 1,
    });
  });

  it('calcule l’entonnoir sur 30 jours, chaque taux rapporté à l’étape précédente', () => {
    const atelier = { vision: true, fit: false, finance: false, okr: false, team: false };
    const etapes = entonnoir(
      [compte({ ateliers: atelier }), offerte(jours(60), { ateliers: atelier }), compte(), compte({ creeLe: jours(-45) })],
      [bilan(), bilan(), bilan(), bilan(), bilan({ creeLe: jours(-40) })],
      MAINTENANT
    );
    expect(etapes.map((e) => e.nombre)).toEqual([4, 3, 2, 1]);
    expect(etapes.map((e) => e.taux)).toEqual([null, 75, 67, 50]);
  });

  it('liste ce qui attend une réponse', () => {
    const candidature = (statut: CandidatureAdmin['statut'], creeLe: Date) =>
      ({ statut, creeLe } as CandidatureAdmin);
    const bientot = offerte(jours(5), { nom: 'Julie' });
    const t = aTraiter(
      [offerte(jours(90)), bientot, offerte(jours(20))],
      [candidature('nouvelle', jours(-3)), candidature('nouvelle', jours(-1)), candidature('validee', jours(-9))],
      [bilan({ accepteRecontact: true }), bilan({ accepteRecontact: true, creeLe: jours(-10), email: 'c@x.fr' })],
      MAINTENANT
    );
    expect(t.candidaturesNouvelles).toBe(2);
    expect(t.plusAncienneCandidature).toEqual(jours(-3));
    expect(t.offresQuiExpirent.map((o) => o.compte.nom)).toEqual(['Julie', 'Alice Martin']);
    expect(t.contactsARecontacter).toBe(1);
  });

  it('ne garde qu’un contact par email, le bilan le plus récent', () => {
    const contacts = contactsSansCompte([
      bilan({ email: 'X@exemple.fr', creeLe: jours(-5), note: 3 }),
      bilan({ email: 'x@exemple.fr', creeLe: jours(-1), note: 7 }),
      bilan({ email: 'y@exemple.fr', aUnCompte: true }),
    ]);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].note).toBe(7);
  });
});

describe('Avancement des ateliers', () => {
  const fiche = (p: Partial<FicheCompte>): FicheCompte => ({
    vision: null,
    fit: null,
    finance: null,
    team: null,
    okr: { ambitions: 0, objectifs: 0, actions: 0 },
    bilans: [],
    ...p,
  });

  it('compte les étapes remplies avec les règles des ateliers', () => {
    const a = avancementDuCompte(
      fiche({ vision: { pourquoi: 'Parce que', probleme: 'Un vrai problème' }, okr: { ambitions: 3, objectifs: 2, actions: 0 } })
    );
    // Sens + problème, et « Votre vision », que l'atelier assemble à partir du sens.
    expect(a.vision).toEqual({ commence: true, faites: 3, total: 7 });
    expect(a.okr).toEqual({ commence: true, faites: 2, total: 3 });
    expect(a.fit).toEqual({ commence: false, faites: 0, total: 4 });
    expect(a.finance.total).toBe(4);
    expect(a.team).toEqual({ commence: false, faites: 0, total: null });
  });
});

describe('Export des contacts', () => {
  it('produit un CSV lisible par Excel en français', () => {
    const csv = contactsEnCsv([bilan({ email: 'a;b@exemple.fr', note: 5.75, accepteRecontact: true, creeLe: MAINTENANT })]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const [entete, ligne] = csv.slice(1).split('\r\n');
    expect(entete).toBe('Email;Bilan;Date;Note sur 10;Recontact accepté;Compte créé depuis');
    expect(ligne).toBe('"a;b@exemple.fr";Bilan de maturité;11/09/2026;5,8;Oui;Non');
  });
});

describe('Email de nouvelle candidature', () => {
  it('échappe tout ce que la personne a saisi', () => {
    const { sujet, html, texte } = emailNouvelleCandidature(
      {
        ...CANDIDATURE_VIDE,
        prenom: 'Élodie',
        nom: '<script>alert(1)</script>',
        email: 'elodie@exemple.fr',
        piliers: ['vision', 'team'],
        approche: 'Coach "TPE" & <b>PME</b>',
      },
      'https://oskar-coach.fr/admin/candidatures'
    );
    expect(sujet).toBe('Nouvelle candidature coach — Élodie <script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Coach &quot;TPE&quot; &amp; &lt;b&gt;PME&lt;/b&gt;');
    expect(texte).toContain('Piliers : Vision, Team');
  });
});
