import {
  compteurCoach,
  compteurDirigeant,
  derniereActivite,
  emailValide,
  peutEtreAccompagne,
  rangerAccompagnements,
  sujetsNouveaux,
} from '@/lib/accompagnement/regles';
import {
  emailResumeQuotidien,
  estLHeureDuResume,
  partiesParis,
  sujetsDuJour,
  veilleParis,
} from '@/lib/accompagnement/resume';
import { emailInvitation, versInvitation } from '@/lib/accompagnement/emails';
import { arbreOkr, avancementResultat, lectureFinance, lectureFit, lectureVision } from '@/lib/accompagnement/lecture';
import { versAccompagnement, versFicheDirigeant, versResume } from '@/services/db/accompagnements';
import type { Accompagnement, ActivitePiliers, ResumeCoach } from '@/lib/accompagnement/types';

jest.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

const rien: ActivitePiliers = { vision: null, fit: null, finance: null, okr: null, team: null, bilans: null };
const d = (iso: string) => new Date(iso);

function lien(p: Partial<Accompagnement> & Pick<Accompagnement, 'id' | 'role'>): Accompagnement {
  return {
    statut: 'actif',
    initiePar: 'coach',
    aMoiDeRepondre: false,
    autre: { id: 'x', nom: null, email: 'x@exemple.fr', entreprise: null, activite: null, structure: null },
    resumeQuotidien: true,
    coachVuLe: null,
    creeLe: d('2026-09-01T08:00:00Z'),
    reponduLe: null,
    activite: null,
    ...p,
  };
}

describe('règles de l’accompagnement', () => {
  it('réserve l’accompagnement à la formule Dirigeant', () => {
    expect(peutEtreAccompagne('visiteur')).toBe(false);
    expect(peutEtreAccompagne('gratuit')).toBe(false);
    expect(peutEtreAccompagne('abonne')).toBe(true);
  });

  it('contrôle les adresses comme la base', () => {
    expect(emailValide('coach@cabinet.fr')).toBe(true);
    expect(emailValide('  coach@cabinet.fr ')).toBe(true);
    expect(emailValide('coach@cabinet')).toBe(false);
    expect(emailValide('co ach@cabinet.fr')).toBe(false);
    expect(emailValide('')).toBe(false);
  });

  it('repère ce qui a bougé depuis la dernière visite', () => {
    const activite = { ...rien, vision: d('2026-09-15T09:00:00Z'), okr: d('2026-09-10T09:00:00Z') };
    expect(sujetsNouveaux(activite, d('2026-09-12T00:00:00Z'))).toEqual(['vision']);
    // Jamais venu : tout ce qui est commencé est nouveau.
    expect(sujetsNouveaux(activite, null)).toEqual(['vision', 'okr']);
    expect(sujetsNouveaux(null, null)).toEqual([]);
    expect(derniereActivite(activite)).toEqual(d('2026-09-15T09:00:00Z'));
    expect(derniereActivite(rien)).toBeNull();
  });

  it('range les liens et compte ce qui attend', () => {
    const liste = [
      lien({ id: 'a', role: 'coach', activite: { ...rien, fit: d('2026-09-14T00:00:00Z') }, coachVuLe: d('2026-09-13T00:00:00Z') }),
      lien({ id: 'b', role: 'coach', activite: { ...rien, fit: d('2026-09-12T00:00:00Z') }, coachVuLe: d('2026-09-13T00:00:00Z') }),
      lien({ id: 'c', role: 'coach', statut: 'en_attente', initiePar: 'dirigeant', aMoiDeRepondre: true }),
      lien({ id: 'e', role: 'coach', statut: 'en_attente' }),
      lien({ id: 'f', role: 'dirigeant', statut: 'en_attente', aMoiDeRepondre: true }),
    ];
    const coach = rangerAccompagnements(liste, 'coach');
    expect(coach.actifs.map((a) => a.id)).toEqual(['a', 'b']);
    expect(coach.aRepondre.map((a) => a.id)).toEqual(['c']);
    expect(coach.envoyees.map((a) => a.id)).toEqual(['e']);
    expect(compteurCoach(liste)).toBe(2); // une demande + un dirigeant qui a avancé
    expect(compteurDirigeant(liste)).toBe(1);
  });
});

describe('résumé de 8 h', () => {
  it('ne part qu’à 8 h à Paris, en été comme en hiver', () => {
    expect(partiesParis(d('2026-09-15T06:00:00Z'))).toEqual({ jour: '2026-09-15', heure: 8 });
    expect(estLHeureDuResume(d('2026-09-15T06:10:00Z'))).toBe(true);
    expect(estLHeureDuResume(d('2026-09-15T07:10:00Z'))).toBe(false);
    expect(estLHeureDuResume(d('2026-12-15T07:10:00Z'))).toBe(true);
    expect(estLHeureDuResume(d('2026-12-15T06:10:00Z'))).toBe(false);
  });

  it('résume la veille à l’heure de Paris', () => {
    expect(veilleParis(d('2026-09-15T06:00:00Z'))).toBe('2026-09-14');
    expect(veilleParis(d('2026-03-01T07:00:00Z'))).toBe('2026-02-28');
    // 0 h 30 à Paris, encore la veille en UTC.
    expect(veilleParis(d('2026-09-14T22:30:00Z'))).toBe('2026-09-14');
  });

  const resume: ResumeCoach = {
    coachId: 'c1',
    coachEmail: 'coach@exemple.fr',
    coachNom: 'Élodie Vasseur',
    dirigeants: [
      {
        id: 'd1',
        nom: 'Sophie <b>Lemaire</b>',
        email: 's@exemple.fr',
        entreprise: 'Boulangerie',
        activite: { vision: true, fit: false, finance: false, team: false, okr: 3, bilans: 1 },
      },
      {
        id: 'd2',
        nom: null,
        email: 'karim@exemple.fr',
        entreprise: null,
        activite: { vision: false, fit: false, finance: true, team: false, okr: 0, bilans: 0 },
      },
    ],
  };

  it('dit, pilier par pilier, ce qui a bougé', () => {
    expect(sujetsDuJour(resume.dirigeants[0].activite).map((s) => s.libelle)).toEqual([
      'Vision',
      'OKR (3 éléments)',
      '1 bilan',
    ]);
  });

  it('compose un email échappé, avec un lien vers chaque fiche', () => {
    const { sujet, html, texte } = emailResumeQuotidien(resume, '2026-09-14', 'https://oskar-coach.fr');
    expect(sujet).toBe('Oskar — 2 dirigeants ont avancé lundi 14 septembre');
    expect(html).toContain('Bonjour Élodie,');
    expect(html).toContain('Sophie &lt;b&gt;Lemaire&lt;/b&gt;');
    expect(html).not.toContain('<b>Lemaire</b>');
    expect(html).toContain('https://oskar-coach.fr/app/mes-dirigeants/d1');
    expect(html).toContain('https://oskar-coach.fr/app/mes-dirigeants#reglages');
    expect(texte).toContain('• karim@exemple.fr : Finance');
  });
});

describe('email d’invitation', () => {
  it('refuse une réponse incomplète de la base', () => {
    expect(versInvitation(null)).toBeNull();
    expect(versInvitation({ destinataire_email: 'a@b.fr' })).toBeNull();
  });

  it('invite un dirigeant sans compte à le créer avec la bonne adresse', () => {
    const i = versInvitation({
      sens: 'coach_vers_dirigeant',
      destinataire_email: 'sophie@exemple.fr',
      a_un_compte: false,
      auteur_nom: 'Élodie <i>Vasseur</i>',
      auteur_email: 'elodie@exemple.fr',
      auteur_structure: 'Vasseur Coaching',
    });
    const e = emailInvitation(i!, 'https://oskar-coach.fr');
    expect(e.sujet).toBe('Élodie <i>Vasseur</i> vous propose de vous accompagner sur Oskar');
    expect(e.html).toContain('Élodie &lt;i&gt;Vasseur&lt;/i&gt; (Vasseur Coaching)');
    expect(e.html).toContain('Créer mon compte et répondre');
    expect(e.html).toContain('sophie@exemple.fr');
    expect(e.html).toContain('https://oskar-coach.fr/app/mes-coachs');
  });

  it('adresse la demande d’un dirigeant à l’espace du coach', () => {
    const i = versInvitation({
      sens: 'dirigeant_vers_coach',
      destinataire_email: 'elodie@exemple.fr',
      destinataire_nom: 'Élodie Vasseur',
      a_un_compte: true,
      auteur_nom: 'Sophie Lemaire',
      auteur_email: 's@exemple.fr',
      auteur_entreprise: 'Boulangerie',
    });
    const e = emailInvitation(i!, 'https://oskar-coach.fr');
    expect(e.sujet).toBe('Sophie Lemaire vous demande de l’accompagner sur Oskar');
    expect(e.html).toContain('Bonjour Élodie,');
    expect(e.html).toContain('https://oskar-coach.fr/app/mes-dirigeants');
  });
});

describe('lecture des ateliers par le coach', () => {
  it('ne montre que ce qui est rempli', () => {
    expect(lectureVision({})).toEqual([]);
    const r = lectureVision({
      pourquoi: 'Nourrir le quartier',
      cibles: [{ id: '1', nom: 'Familles', type: 'B2C', segment: '', priorite: '+++', notes: '' }],
      valeurs: [{ nom: 'Exigence', traduction: '' }],
    });
    expect(r.map((x) => x.titre)).toEqual(['Le sens', 'Cibles', 'Valeurs', 'Votre vision']);
    expect(r[0].lignes).toEqual([{ libelle: 'Pourquoi l’entreprise existe', valeur: 'Nourrir le quartier' }]);
    expect(r[1].tableau?.lignes).toEqual([['Familles', 'B2C', '', '+++', '']]);
    expect(r[2].lignes).toEqual([{ libelle: 'Exigence', valeur: '—' }]);
  });

  it('reprend le statut Market Fit calculé par l’atelier', () => {
    const { statut, score, rubriques } = lectureFit({ lisibilite: 'oui', diffClients: 'oui', sigBouche: 'oui', sigDemande: 'forte', diffDurable: 'oui' });
    expect(score).toBe(14);
    expect(statut.libelle).toBe('✅ FIT Confirmé');
    expect(rubriques.map((x) => x.titre)).toEqual(['L’offre', 'La différenciation', 'Les signaux marché']);
  });

  it('reprend les chiffres clés de l’atelier Finance', () => {
    const { chiffres } = lectureFinance({ beCa: '500000', beCf: '200000', beCv: '100000', beTreso: '50000' });
    expect(chiffres.map((c) => c.libelle)).toEqual(['CA annuel', 'Point mort', 'Marge de sécurité', 'Runway']);
    expect(chiffres[3].valeur).toBe('2 mois');
  });

  it('range les OKR en arbre, même incomplets', () => {
    const arbre = arbreOkr({
      ambitions: [{ id: 'a1', titre: 'A', description: null, annee: 2026, cible: null, unite: null }],
      objectifs: [
        { id: 'o1', ambitionId: 'a1', titre: 'O1', description: null, trimestre: 'Q4', annee: 2026 },
        { id: 'o2', ambitionId: null, titre: 'O2', description: null, trimestre: 'Q4', annee: 2026 },
      ],
      resultats: [{ id: 'k1', objectifId: 'o1', titre: 'K1', cible: 10, actuel: 4, unite: null, echeance: null }],
      actions: [
        { id: 'x1', resultatId: 'k1', titre: 'X1', statut: 'DONE', echeance: null },
        { id: 'x2', resultatId: null, titre: 'X2', statut: 'TODO', echeance: null },
      ],
    });
    expect(arbre.ambitions[0].objectifs[0].resultats[0].actions.map((a) => a.id)).toEqual(['x1']);
    expect(arbre.objectifsSeuls.map((b) => b.objectif.id)).toEqual(['o2']);
    expect(arbre.actionsSeules.map((a) => a.id)).toEqual(['x2']);
    expect(avancementResultat({ cible: 10, actuel: 4 })).toBe(40);
    expect(avancementResultat({ cible: 10, actuel: 25 })).toBe(100);
    expect(avancementResultat({ cible: 0, actuel: 4 })).toBeNull();
  });
});

describe('conversion des réponses de la base', () => {
  it('convertit une ligne de mes_accompagnements', () => {
    const a = versAccompagnement({
      id: 'l1',
      role: 'coach',
      statut: 'actif',
      initie_par: 'dirigeant',
      a_moi_de_repondre: false,
      autre_id: 'u1',
      autre_nom: 'Sophie',
      autre_email: 's@exemple.fr',
      autre_entreprise: '',
      resume_quotidien: false,
      coach_vu_le: '2026-09-14T08:00:00Z',
      cree_le: '2026-09-01T08:00:00Z',
      activite: { vision: '2026-09-14T09:00:00Z', fit: null },
    });
    expect(a.initiePar).toBe('dirigeant');
    expect(a.autre.entreprise).toBeNull();
    expect(a.resumeQuotidien).toBe(false);
    expect(a.activite?.vision).toEqual(d('2026-09-14T09:00:00Z'));
    expect(a.activite?.okr).toBeNull();
  });

  it('convertit une fiche et un résumé', () => {
    const f = versFicheDirigeant({
      accompagnement_id: 'l1',
      depuis: '2026-09-01T08:00:00Z',
      vu_precedemment: null,
      profil: { nom: 'Sophie', email: 's@exemple.fr' },
      okr: { resultats: [{ id: 'k', objectif_id: 'o', titre: 'K', cible: '40', actuel: 10 }] },
      bilans: [{ id: 'b', type: 'produit', cree_le: '2026-09-05T08:00:00Z', note: 6.8 }],
    });
    expect(f.okr.resultats[0].cible).toBe(40);
    expect(f.okr.ambitions).toEqual([]);
    expect(f.bilans[0].type).toBe('produit');
    expect(f.activite.vision).toBeNull();

    const r = versResume({
      coach_id: 'c',
      coach_email: 'c@exemple.fr',
      coach_nom: null,
      dirigeants: [{ id: 'd', nom: 'S', email: 's@exemple.fr', activite: { vision: true, okr: 2 } }],
    });
    expect(r.dirigeants[0].activite).toEqual({ vision: true, fit: false, finance: false, team: false, okr: 2, bilans: 0 });
  });
});
