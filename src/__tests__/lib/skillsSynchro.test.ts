import {
  INITIAL_SKILLS_STATE,
  MAX_SKILLS,
  MIN_SKILLS,
  buildDefaultSkills,
  buildSkillsSummary,
  normalizeSkillsState,
  peopleOf,
  skillsHighlights,
  skillsReducer,
  type SkillsOp,
  type SkillsState,
} from '@/components/toolbox/skills/skillsLogic';

/*
 * Synchronisation de « Compétences de l'équipe » : chaque écran applique les
 * opérations qu'il reçoit, dans l'ordre où elles lui arrivent. Ces tests
 * jouent les mêmes opérations dans des ordres différents et vérifient que
 * tous les écrans aboutissent au même état.
 */

const appliquer = (ops: SkillsOp[], depart: SkillsState = INITIAL_SKILLS_STATE) => ops.reduce(skillsReducer, depart);
const perso = (id: string) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1), color: '#000' });
const [c1, c2, c3] = buildDefaultSkills();

describe('Compétences — notes simultanées', () => {
  const equipe = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo'];
  const ops: SkillsOp[] = equipe.flatMap((id, i) => [
    { t: 'join', round: 0, person: perso(id) },
    ...buildDefaultSkills().map((k, j): SkillsOp => ({ t: 'score', round: 0, person: perso(id), skillId: k.id, value: 1 + ((i + j) % 10) })),
  ]);

  it('garde toutes les fiches et toutes les notes, quel que soit l’ordre d’arrivée', () => {
    const x = appliquer(ops);
    const y = appliquer([...ops].reverse());
    expect(Object.keys(x.people)).toHaveLength(8);
    expect(Object.values(x.people).every((p) => Object.keys(p.scores).length === 7)).toBe(true);
    expect(y.people).toEqual(x.people);
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    expect(appliquer([...ops, ...ops])).toEqual(appliquer(ops));
  });

  it('crée la fiche avec la note si l’arrivée n’est pas encore reçue', () => {
    const s = appliquer([{ t: 'score', round: 0, person: perso('alice'), skillId: c1.id, value: 7 }]);
    expect(s.people.alice.scores[c1.id]).toBe(7);
    expect(appliquer([{ t: 'join', round: 0, person: perso('alice') }], s)).toEqual(s);
  });

  it('borne la note entre 1 et 10 et ignore une compétence inconnue', () => {
    const s = appliquer([
      { t: 'score', round: 0, person: perso('alice'), skillId: c1.id, value: 42 },
      { t: 'score', round: 0, person: perso('alice'), skillId: 'inconnue', value: 5 },
    ]);
    expect(s.people.alice.scores).toEqual({ [c1.id]: 10 });
  });

  it('affiche les fiches dans le même ordre partout (alphabétique)', () => {
    expect(peopleOf(appliquer([...ops].reverse())).map((p) => p.id)).toEqual(peopleOf(appliquer(ops)).map((p) => p.id));
  });
});

describe('Compétences — liste des compétences', () => {
  it('ajoute sans doublon et sans dépasser le maximum', () => {
    const s = appliquer([
      { t: 'skillAdd', skill: { id: 'sk1', name: 'Rigueur' } },
      { t: 'skillAdd', skill: { id: 'sk2', name: 'rigueur' } },
      { t: 'skillAdd', skill: { id: 'sk1', name: 'Rigueur' } },
      ...['A', 'B', 'C', 'D'].map((n, i): SkillsOp => ({ t: 'skillAdd', skill: { id: `x${i}`, name: n } })),
    ]);
    expect(s.skills).toHaveLength(MAX_SKILLS);
    expect(s.skills.filter((k) => k.name.toLowerCase() === 'rigueur')).toHaveLength(1);
  });

  it('supprimer une compétence efface ses notes ; une note en retard est ignorée', () => {
    const s = appliquer([
      { t: 'score', round: 0, person: perso('alice'), skillId: c2.id, value: 6 },
      { t: 'skillDelete', id: c2.id },
      { t: 'score', round: 0, person: perso('bruno'), skillId: c2.id, value: 9 },
    ]);
    expect(s.skills.some((k) => k.id === c2.id)).toBe(false);
    expect(s.people.alice.scores[c2.id]).toBeUndefined();
    expect(s.people.bruno).toBeUndefined();
  });

  it('garde au moins trois compétences', () => {
    const s = appliquer(buildDefaultSkills().map((k): SkillsOp => ({ t: 'skillDelete', id: k.id })));
    expect(s.skills).toHaveLength(MIN_SKILLS);
  });

  it('refuse de renommer vers un nom déjà pris', () => {
    const s = appliquer([{ t: 'skillRename', id: c3.id, name: c1.name }]);
    expect(s.skills.find((k) => k.id === c3.id)?.name).toBe(c3.name);
  });
});

describe('Compétences — réinitialisation, points clés et export', () => {
  it('efface les fiches et ignore une note envoyée avant la remise à zéro', () => {
    const s = appliquer([
      { t: 'score', round: 0, person: perso('alice'), skillId: c1.id, value: 8 },
      { t: 'reset', round: 1, skills: buildDefaultSkills() },
      { t: 'score', round: 0, person: perso('bruno'), skillId: c1.id, value: 3 },
      { t: 'reset', round: 1, skills: buildDefaultSkills() },
    ]);
    expect(s).toMatchObject({ round: 1, people: {} });
    // Chacun peut revenir et se noter dans la nouvelle séance.
    expect(appliquer([{ t: 'join', round: 1, person: perso('alice') }], s).people.alice).toBeDefined();
  });

  it('dégage forces, axes de progrès et avis très partagés', () => {
    const s = appliquer([
      { t: 'score', round: 0, person: perso('alice'), skillId: c1.id, value: 9 },
      { t: 'score', round: 0, person: perso('bruno'), skillId: c1.id, value: 8 },
      { t: 'score', round: 0, person: perso('alice'), skillId: c2.id, value: 2 },
      { t: 'score', round: 0, person: perso('bruno'), skillId: c2.id, value: 9 },
      { t: 'score', round: 0, person: perso('alice'), skillId: c3.id, value: 3 },
      { t: 'score', round: 0, person: perso('bruno'), skillId: c3.id, value: 4 },
    ]);
    const h = skillsHighlights(s);
    expect(h.forces.map((r) => r.skill.id)).toEqual([c1.id]);
    expect(h.progres.map((r) => r.skill.id)).toEqual([c3.id, c2.id]);
    expect(h.heterogenes.map((r) => r.skill.id)).toEqual([c2.id]);
    const txt = buildSkillsSummary(s, new Date(2026, 8, 14));
    expect(txt).toContain('Forces : Communication (8,5)');
    expect(txt).toContain('Avis très partagés : Autonomie (de 2 à 9)');
  });

  it('reprend un état enregistré par l’ancienne version', () => {
    const ancien = { skills: [{ id: 'a', name: 'Écoute' }, { id: 'b', name: 'Rigueur' }, { id: 'c', name: 'Créativité' }], people: { alice: { ...perso('alice'), scores: { a: 7 } } } } as Partial<SkillsState>;
    const s = normalizeSkillsState(ancien);
    expect(s).toMatchObject({ round: 0 });
    expect(s.people.alice.scores).toEqual({ a: 7 });
  });
});
