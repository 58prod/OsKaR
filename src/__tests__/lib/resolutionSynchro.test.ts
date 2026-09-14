import {
  INITIAL_RESOLUTION_STATE, MAX_RETENUS, PROBLEME_MAX, SYNTHESE,
  buildResolutionSummary, candidats, coeursParProbleme, groupesProblemes, normalizeResolutionState, problemesRetenus, racine,
  resolutionReducer, resultatVote, solutionValidee, solutionsDe, votesUsedBy,
  type Commentaire, type Probleme, type ResolutionOp, type ResolutionState, type Solution,
} from '@/components/toolbox/resolution/resolutionLogic';

/*
 * Synchronisation de la Résolution collective : chaque écran applique les
 * opérations qu'il reçoit, dans l'ordre où elles lui arrivent. Ces tests
 * jouent le même lot d'opérations dans tous les ordres possibles et
 * vérifient que tous les écrans aboutissent au même état.
 */

const appliquer = (ops: ResolutionOp[], depart: ResolutionState = INITIAL_RESOLUTION_STATE) =>
  ops.reduce(resolutionReducer, depart);

/** Tous les ordres possibles d'une petite liste de messages. */
function permutations<T>(list: T[]): T[][] {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p]));
}

/** Vérifie qu'un lot d'opérations donne le même état quel que soit l'ordre d'arrivée. */
function memeEtatPartout(ops: ResolutionOp[], depart: ResolutionState = INITIAL_RESOLUTION_STATE) {
  const reference = appliquer(ops, depart);
  permutations(ops).forEach((ordre) => expect(appliquer(ordre, depart)).toEqual(reference));
  return reference;
}

const probleme = (id: string, authorId: string, text = `Problème ${id}`): Probleme => ({
  id, authorId, authorName: authorId, authorColor: '#000', text,
});
const coeur = (id: string, voterId: string, at: number, liked = true): ResolutionOp => ({ t: 'like', id, voterId, liked, at });
const solution = (id: string, authorId: string, problemId: string, kind: 'teste' | 'idee' = 'idee'): Solution => ({
  id, authorId, authorName: authorId, authorColor: '#000', problemId, kind, text: `Solution ${id}`,
});
const commentaire = (id: string, authorId: string, solutionId: string): Commentaire => ({
  id, authorId, authorName: authorId, authorColor: '#000', solutionId, kind: 'plus', text: `Commentaire ${id}`,
});
const ajoutP = (p: Probleme, round = 0): ResolutionOp => ({ t: 'addProblem', round, problem: p });
const ajoutS = (s: Solution, round = 0): ResolutionOp => ({ t: 'addSolution', round, solution: s });

describe('Résolution collective — contributions simultanées', () => {
  const equipe = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo'];
  const ops = equipe.map((a, i) => ajoutP(probleme(`m1a${i}-x`, a)));

  it('garde tous les problèmes, dans le même ordre, quel que soit l’ordre d’arrivée', () => {
    const x = appliquer(ops);
    const y = appliquer([...ops].reverse());
    expect(x.problems).toHaveLength(8);
    expect(y).toEqual(x);
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    expect(appliquer([...ops, ...ops])).toEqual(appliquer(ops));
  });

  it('cumule les cœurs de toute l’équipe envoyés au même moment', () => {
    const votes = equipe.slice(1).map((v) => coeur('m1a0-x', v, 1));
    const depart = appliquer([{ t: 'voteLimit', value: 0 }, ...ops]);
    const x = appliquer(votes, depart);
    const y = appliquer([...votes].reverse(), depart);
    expect(coeursParProbleme(x).get('m1a0-x')).toHaveLength(7);
    expect(y).toEqual(x);
  });

  it('applique la limite de cœurs de la même façon, quel que soit l’ordre d’arrivée', () => {
    // Alice donne 4 cœurs alors que la limite est de 3 : ses 3 premiers comptent, partout.
    const depart = appliquer([{ t: 'voteLimit', value: 3 }, ...ops]);
    const etat = memeEtatPartout([
      coeur('m1a1-x', 'alice', 1), coeur('m1a2-x', 'alice', 2), coeur('m1a3-x', 'alice', 3), coeur('m1a4-x', 'alice', 4),
    ], depart);
    const compte = coeursParProbleme(etat);
    expect(['m1a1-x', 'm1a2-x', 'm1a3-x', 'm1a4-x'].map((id) => compte.get(id))).toEqual([['alice'], ['alice'], ['alice'], []]);
    expect(votesUsedBy(etat, 'alice')).toBe(3);
    // Retirer un cœur libère la place : le quatrième compte alors.
    const apresRetrait = appliquer([coeur('m1a2-x', 'alice', 5, false)], etat);
    expect(coeursParProbleme(apresRetrait).get('m1a4-x')).toEqual(['alice']);
  });

  it('ne fait jamais revenir une contribution supprimée, quel que soit l’ordre', () => {
    const p = probleme('m2-a', 'alice');
    const s = solution('m2-s', 'bruno', 'm2-a');
    const c = commentaire('m2-c', 'chloe', 'm2-s');
    permutations<ResolutionOp>([
      ajoutP(p), ajoutS(s), { t: 'comment', round: 0, comment: c },
      { t: 'delete', id: 'm2-s', by: 'bruno' }, { t: 'delete', id: 'm2-c', by: 'dora', moderator: true },
    ]).forEach((ordre) => {
      const etat = appliquer(ordre);
      expect(etat.problems).toHaveLength(1);
      expect(etat.solutions).toHaveLength(0);
      expect(etat.comments).toHaveLength(0);
    });
  });

  it('les textes partagés gardent le plus récent, quel que soit l’ordre', () => {
    const etat = memeEtatPartout([
      { t: 'theme', text: 'Réunions', at: 10 },
      { t: 'theme', text: 'Nos réunions', at: 30 },
      { t: 'theme', text: 'Les réunions', at: 20 },
      { t: 'synthese', problemId: 'p', text: 'v1', at: 5 },
      { t: 'synthese', problemId: 'p', text: 'v2', at: 6 },
    ]);
    expect(etat.theme.text).toBe('Nos réunions');
    expect(etat.syntheses.p.text).toBe('v2');
  });

  it('départage deux textes envoyés à la même milliseconde de la même façon partout', () => {
    const etat = memeEtatPartout([
      { t: 'question', id: 'p', text: 'Comment A ?', at: 50 },
      { t: 'question', id: 'p', text: 'Comment B ?', at: 50 },
    ]);
    expect(etat.questions.p.text).toBe('Comment B ?');
  });

  it('l’étape en cours est la dernière demandée, quel que soit l’ordre', () => {
    const etat = memeEtatPartout([
      { t: 'phase', phase: 'choix', at: 1 },
      { t: 'phase', phase: 'solutions', at: 2 },
      { t: 'phase', phase: 'choix', at: 3 },
    ]);
    expect(etat.phase).toBe('choix');
  });

  it('votes, validation et premier pas convergent quel que soit l’ordre', () => {
    const etat = memeEtatPartout([
      { t: 'vote', problemId: 'p', voterId: 'alice', c: 's1', at: 1 },
      { t: 'vote', problemId: 'p', voterId: 'alice', c: 's2', at: 2 },
      { t: 'validate', problemId: 'p', c: 's2', at: 3 },
      { t: 'plan', problemId: 'p', field: 'porteur', text: 'Chloé', at: 4 },
      { t: 'rapporteur', problemId: 'p', id: 'bruno', name: 'Bruno', color: '#000', at: 1 },
    ]);
    expect(etat.votes.p.alice.c).toBe('s2');
    expect(etat.validated.p.c).toBe('s2');
    expect(etat.plans.p.porteur.text).toBe('Chloé');
    expect(etat.rapporteurs.p.name).toBe('Bruno');
  });
});

describe('Résolution collective — règles', () => {
  const base = appliquer([ajoutP(probleme('p1', 'alice')), ajoutP(probleme('p2', 'bruno')), ajoutP(probleme('p3', 'chloe'))]);

  it('interdit de donner un cœur à son propre problème et respecte la limite de cœurs', () => {
    const s = appliquer([
      { t: 'voteLimit', value: 1 },
      coeur('p1', 'alice', 1), coeur('p2', 'alice', 2), coeur('p3', 'alice', 3),
    ], base);
    expect(votesUsedBy(s, 'alice')).toBe(1);
    // Le cœur sur son propre problème ne compte pas et ne consomme rien.
    expect(coeursParProbleme(s).get('p1')).toEqual([]);
    expect(coeursParProbleme(s).get('p2')).toEqual(['alice']);
    // Un problème supprimé rend ses cœurs.
    const sansP2 = appliquer([{ t: 'delete', id: 'p2', by: 'bruno' }], s);
    expect(coeursParProbleme(sansP2).get('p3')).toEqual(['alice']);
  });

  it('ne laisse supprimer que ses propres contributions, sauf l’animateur', () => {
    expect(appliquer([{ t: 'delete', id: 'p1', by: 'bruno' }], base).problems).toHaveLength(3);
    expect(appliquer([{ t: 'delete', id: 'p1', by: 'alice' }], base).problems).toHaveLength(2);
    expect(appliquer([{ t: 'delete', id: 'p1', by: 'bruno', moderator: true }], base).problems).toHaveLength(2);
  });

  it('ne retient que 3 problèmes, dans l’ordre où ils ont été retenus', () => {
    const quatre = appliquer([ajoutP(probleme('p4', 'david'))], base);
    const s = memeEtatPartout([
      { t: 'retain', id: 'p4', on: true, at: 1 },
      { t: 'retain', id: 'p2', on: true, at: 2 },
      { t: 'retain', id: 'p1', on: true, at: 3 },
      { t: 'retain', id: 'p3', on: true, at: 4 },
    ], quatre);
    expect(problemesRetenus(s).map((g) => g.racine.id)).toEqual(['p4', 'p2', 'p1']);
    expect(MAX_RETENUS).toBe(3);
    // Retirer un problème libère la place pour le suivant.
    const s2 = appliquer([{ t: 'retain', id: 'p2', on: false, at: 5 }], s);
    expect(problemesRetenus(s2).map((g) => g.racine.id)).toEqual(['p4', 'p1', 'p3']);
  });

  it('regroupe les doublons : les cœurs se cumulent sans compter deux fois la même personne', () => {
    const s = appliquer([
      { t: 'voteLimit', value: 0 },
      coeur('p1', 'david', 1), coeur('p2', 'david', 2), coeur('p2', 'emma', 1),
      { t: 'merge', id: 'p2', into: 'p1', at: 1 },
    ], base);
    const groupes = groupesProblemes(s);
    expect(groupes.map((g) => g.racine.id)).toEqual(['p1', 'p3']);
    expect(groupes[0].membres.map((m) => m.id)).toEqual(['p2']);
    expect(new Set(groupes[0].voix)).toEqual(new Set(['david', 'emma']));
    // Détacher remet le problème à part.
    const detache = appliquer([{ t: 'merge', id: 'p2', into: null, at: 2 }], s);
    expect(groupesProblemes(detache)).toHaveLength(3);
  });

  it('suit un regroupement en chaîne et ignore une boucle', () => {
    const chaine = appliquer([
      { t: 'merge', id: 'p3', into: 'p2', at: 1 },
      { t: 'merge', id: 'p2', into: 'p1', at: 2 },
    ], base);
    expect(racine(chaine, 'p3')).toBe('p1');
    const boucle = appliquer([{ t: 'merge', id: 'p1', into: 'p3', at: 3 }], chaine);
    expect(groupesProblemes(boucle).length).toBeGreaterThan(0);
    boucle.problems.forEach((p) => expect(boucle.problems.map((x) => x.id)).toContain(racine(boucle, p.id)));
  });

  it('rattache les solutions d’un problème regroupé au problème qui l’accueille', () => {
    const s = appliquer([
      ajoutS(solution('s1', 'david', 'p2')),
      ajoutS(solution('s2', 'emma', 'p1', 'teste')),
      { t: 'merge', id: 'p2', into: 'p1', at: 1 },
    ], base);
    expect(solutionsDe(s, 'p1').map((x) => x.id)).toEqual(['s1', 's2']);
  });

  it('compte une voix par personne et par problème, et repère l’égalité', () => {
    const s = appliquer([
      ajoutS(solution('s1', 'david', 'p1')),
      ajoutS(solution('s2', 'emma', 'p1')),
      { t: 'synthese', problemId: 'p1', text: 'La solution du groupe', at: 1 },
      { t: 'vote', problemId: 'p1', voterId: 'alice', c: 's1', at: 1 },
      { t: 'vote', problemId: 'p1', voterId: 'alice', c: SYNTHESE, at: 2 },
      { t: 'vote', problemId: 'p1', voterId: 'bruno', c: 's2', at: 1 },
    ], base);
    expect(candidats(s, 'p1').map((c) => c.id)).toEqual([SYNTHESE, 's1', 's2']);
    const res = resultatVote(s, 'p1');
    expect(res.votants).toBe(2);
    expect(res.voix).toEqual({ [SYNTHESE]: 1, s2: 1 });
    expect(res.enTete.sort()).toEqual([SYNTHESE, 's2'].sort());
    // Une solution supprimée ne compte plus, ni ne peut rester validée.
    const s2 = appliquer([
      { t: 'validate', problemId: 'p1', c: 's2', at: 1 },
      { t: 'delete', id: 's2', by: 'emma' },
    ], s);
    expect(resultatVote(s2, 'p1')).toMatchObject({ votants: 1, enTete: [SYNTHESE] });
    expect(solutionValidee(s2, 'p1')).toBeNull();
  });

  it('borne les textes et ignore une contribution vide ou mal formée', () => {
    const s = appliquer([
      ajoutP(probleme('p9', 'alice', 'x'.repeat(900))),
      ajoutP({ ...probleme('p10', 'alice'), text: '   ' }),
      { t: 'addProblem', round: 0, problem: null as unknown as Probleme },
    ]);
    expect(s.problems).toHaveLength(1);
    expect(s.problems[0].text).toHaveLength(PROBLEME_MAX);
  });
});

describe('Résolution collective — nouvel atelier et synthèse', () => {
  it('efface tout sauf le thème et les réglages, et ignore un message de l’atelier précédent', () => {
    const s = appliquer([
      { t: 'theme', text: 'Nos réunions', at: 1 },
      { t: 'anonymous', value: true },
      { t: 'voteLimit', value: 5 },
      ajoutP(probleme('p1', 'alice')),
      { t: 'phase', phase: 'vote', at: 5 },
      { t: 'reset', round: 1, at: 6 },
      ajoutP(probleme('p2', 'bruno'), 0),
      { t: 'phase', phase: 'plan', at: 4 },
      { t: 'reset', round: 1, at: 6 },
    ]);
    expect(s).toMatchObject({ round: 1, problems: [], phase: 'problemes', anonymous: true, voteLimit: 5 });
    expect(s.theme.text).toBe('Nos réunions');
  });

  it('rédige une synthèse complète, sans les noms quand l’atelier est anonyme', () => {
    const s = appliquer([
      { t: 'theme', text: 'Nos réunions', at: 1 },
      ajoutP({ ...probleme('p1', 'alice', 'Quand il n’y a pas d’ordre du jour, alors on ne décide rien'), authorName: 'Alice' }),
      ajoutP({ ...probleme('p2', 'bruno', 'Les réunions débordent'), authorName: 'Bruno' }),
      { t: 'retain', id: 'p1', on: true, at: 1 },
      { t: 'question', id: 'p1', text: 'Comment pourrions-nous décider à chaque réunion ?', at: 1 },
      ajoutS({ ...solution('s1', 'chloe', 'p1', 'teste'), text: 'Ordre du jour la veille', authorName: 'Chloé' }),
      { t: 'comment', round: 0, comment: { ...commentaire('c1', 'david', 's1'), kind: 'risque', text: 'Il faut s’y tenir', authorName: 'David' } },
      { t: 'vote', problemId: 'p1', voterId: 'alice', c: 's1', at: 1 },
      { t: 'validate', problemId: 'p1', c: 's1', at: 2 },
      { t: 'plan', problemId: 'p1', field: 'premierPas', text: 'Écrire le modèle', at: 1 },
      { t: 'plan', problemId: 'p1', field: 'echeance', text: '2026-10-03', at: 1 },
    ]);
    const txt = buildResolutionSummary(s, new Date(2026, 8, 14));
    expect(txt).toContain('RÉSOLUTION COLLECTIVE OSKAR — 14/09/2026');
    expect(txt).toContain('Thème : Nos réunions');
    expect(txt).toContain('PROBLÈME 1 — Comment pourrions-nous décider à chaque réunion ?');
    expect(txt).toContain('- [Déjà testé] Ordre du jour la veille — Chloé');
    expect(txt).toContain('! Il faut s’y tenir — David');
    expect(txt).toContain('Solution validée : Ordre du jour la veille');
    expect(txt).toContain('Premier pas : Écrire le modèle');
    expect(txt).toContain('Échéance : 3 oct. 2026');
    expect(txt).toContain('- Les réunions débordent  (0 cœur — Bruno)');
    const anonyme = buildResolutionSummary({ ...s, anonymous: true }, new Date(2026, 8, 14));
    ['Alice', 'Bruno', 'Chloé', 'David'].forEach((nom) => expect(anonyme).not.toContain(nom));
  });

  it('reprend un état vide, ancien ou abîmé sans planter', () => {
    expect(normalizeResolutionState(null)).toEqual(INITIAL_RESOLUTION_STATE);
    const abime = normalizeResolutionState({
      phase: 'nimportequoi', problems: [{ id: 'x' }, probleme('p1', 'alice')], votes: 'oups', voteLimit: 999,
    } as unknown as ResolutionState);
    expect(abime.phase).toBe('problemes');
    expect(abime.problems).toHaveLength(1);
    expect(abime.votes).toEqual({});
    expect(abime.voteLimit).toBe(50);
  });
});
