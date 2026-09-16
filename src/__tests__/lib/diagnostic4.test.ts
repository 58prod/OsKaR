import { analyser4, etatInitial4, note4, REPONSES4, type Etat4, type Saisie4, type Reponse4 } from '@/lib/diagnostic4/calcul';
import { PILIERS4 } from '@/lib/diagnostic4/contenu';
import { PILLARS } from '@/lib/diagnostic';

const IDS = PILLARS.map((p) => p.id);
const saisie = (reponses: Saisie4['reponses'], perception: number | null = 7): Saisie4 => ({ perception, reponses });
function rempli(reponse: Reponse4 = 'oui', perception = 7): Etat4 {
  const e = etatInitial4();
  IDS.forEach((id) => { e.piliers[id] = saisie([reponse, reponse, reponse, reponse], perception); });
  return e;
}

describe('Diagnostic 4 : perception, déclarations et données manquantes', () => {
  it('ne présélectionne aucune réponse, y compris la perception', () => {
    const e = etatInitial4();
    IDS.forEach((id) => expect(e.piliers[id]).toEqual(saisie([null, null, null, null], null)));
    expect(analyser4(e)).toMatchObject({ complet: false, nbReponses: 0, nbAttendu: 25, moyenne: null, verdicts: [], leviers: [], ecarts: [] });
  });

  it('ne considère pas les cinq perceptions seules comme un questionnaire rempli', () => {
    const e = etatInitial4();
    IDS.forEach((id) => { e.piliers[id].perception = 10; });
    expect(analyser4(e)).toMatchObject({ complet: false, nbReponses: 5, nbComplets: 0, moyenne: null, notes: [], priorite: null });
  });

  it('calcule Non=0, En partie=0,5, Oui=1, ramenés sur 10', () => {
    expect(note4(saisie(['non', 'non', 'non', 'non']))).toBe(0);
    expect(note4(saisie(['partiel', 'partiel', 'partiel', 'partiel']))).toBe(5);
    expect(note4(saisie(['oui', 'oui', 'oui', 'oui']))).toBe(10);
    expect(note4(saisie(['oui', 'partiel', 'non', 'oui']))).toBe(6.3);
    expect(note4(saisie(['oui', 'oui', 'oui', 'non']))).toBe(7.5);
  });

  it('exclut Non applicable du dénominateur et ne fabrique pas un score sans pratique applicable', () => {
    expect(note4(saisie(['oui', 'non', 'na', 'na']))).toBe(5);
    expect(note4(saisie(['oui', 'partiel', 'na', 'na']))).toBe(7.5);
    expect(note4(saisie(['non', 'na', 'na', 'na']))).toBe(0);
    expect(note4(saisie(['oui', 'na', 'na', 'na']))).toBe(10);
    expect(note4(saisie(['na', 'na', 'na', 'na']))).toBeNull();
  });

  it.each([null, 'inconnu'] as const)('ne transforme pas %s en zéro ni en exclusion favorable', (r) => {
    expect(note4(saisie(['oui', 'oui', 'oui', r]))).toBeNull();
    expect(note4(saisie(['non', 'non', 'non', r]))).toBeNull();
  });

  it('une perception absente ne change pas le score de pratiques mais laisse le parcours incomplet', () => {
    const e = rempli();
    e.piliers.okr.perception = null;
    expect(note4(e.piliers.okr)).toBe(10);
    expect(analyser4(e)).toMatchObject({ complet: false, nbReponses: 24, moyenne: null, profil: null, verdicts: [] });
  });

  it('accepte explicitement zéro comme perception et Non comme réponse complète', () => {
    const a = analyser4(rempli('non', 0));
    expect(a).toMatchObject({ complet: true, nbReponses: 25, moyenne: 0, niveauGlobal: 'f' });
    expect(a.priorite?.justification).toContain('partagent le score de pratiques le plus bas');
    expect(a.verdicts.every((v) => v.constats.every((c) => c.reponse === 'non'))).toBe(true);
  });

  it('produit une restitution pour Je ne sais pas, sans score, profil ou priorité inventés', () => {
    const e = rempli();
    e.piliers.okr.reponses[3] = 'inconnu';
    const a = analyser4(e);
    expect(a).toMatchObject({ complet: true, nbReponses: 25, moyenne: null, niveauGlobal: null, profil: null, priorite: null });
    expect(a.notes.map((n) => n.id)).not.toContain('okr');
    expect(a.ecarts.map((n) => n.id)).not.toContain('okr');
    const okr = a.verdicts.find((v) => v.id === 'okr')!;
    expect(okr).toMatchObject({ note: null, niveau: null });
    expect(okr.constats[3].reponse).toBe('inconnu');
    expect(okr.aVerifier[0].action).toContain('Clarifiez cette réponse');
    expect(a.leviers[0]).toMatchObject({ id: 'okr', index: 3, reponse: 'inconnu' });
    expect(a.leviers[0].action).not.toBe(PILIERS4.okr.criteres[3].action);
  });

  it('ne recommande pas une pratique déclarée non applicable, même si toutes le sont', () => {
    const a = analyser4(rempli('na'));
    expect(a).toMatchObject({ complet: true, moyenne: null, profil: null, priorite: null, notes: [], ecarts: [], leviers: [] });
    a.verdicts.forEach((v) => {
      expect(v.nbApplicables).toBe(0);
      expect(v.aVerifier).toEqual([]);
      expect(v.constats).toHaveLength(4);
    });
  });

  it('préserve la recommandation 1 : trois Oui OKR ne prouvent pas un suivi régulier', () => {
    const e = rempli();
    e.piliers.okr.reponses[3] = 'non';
    const a = analyser4(e);
    const okr = a.verdicts.find((v) => v.id === 'okr')!;
    expect(okr.note).toBe(7.5);
    expect(okr.constats[3]).toMatchObject({ reponse: 'non', texte: PILIERS4.okr.criteres[3].texte });
    expect(okr.aVerifier).toEqual([expect.objectContaining({ index: 3, verification: PILIERS4.okr.criteres[3].verification })]);
    expect(a.leviers).toEqual([expect.objectContaining({ id: 'okr', index: 3, action: PILIERS4.okr.criteres[3].action })]);
    expect(JSON.stringify(a)).not.toMatch(/Ce qui est décidé se fait|priorités sont claires et suivies|freine tout le reste/);
  });

  it('maintient le classement, le profil et les actions si seule la perception change', () => {
    const e = rempli('partiel', 0);
    e.piliers.team.reponses = ['non', 'non', 'non', 'non'];
    const avant = analyser4(e);
    IDS.forEach((id) => { e.piliers[id].perception = 10; });
    const apres = analyser4(e);
    expect(apres.moyenne).toBe(avant.moyenne);
    expect(apres.niveauGlobal).toBe(avant.niveauGlobal);
    expect(apres.profil).toEqual(avant.profil);
    expect(apres.priorite?.id).toBe(avant.priorite?.id);
    expect(apres.priorite?.justification).toBe(avant.priorite?.justification);
    expect(apres.leviers).toEqual(avant.leviers);
    expect(apres.ecarts).not.toEqual(avant.ecarts);
  });

  it('retire Team de la saisie attendue, du score et de la restitution en mode solo', () => {
    const e = rempli();
    e.piliers.team = saisie([null, null, null, null], null);
    expect(analyser4(e).complet).toBe(false);
    e.seul = true;
    const a = analyser4(e);
    expect(a).toMatchObject({ complet: true, nbReponses: 20, nbAttendu: 20, moyenne: 10 });
    expect(a.verdicts.map((v) => v.id)).not.toContain('team');
    expect(a.notes.map((v) => v.id)).not.toContain('team');
    e.seul = false;
    expect(analyser4(e).complet).toBe(false);
  });

  it('chaque pratique dispose d’une vérification, d’une action et d’un exemple de preuve', () => {
    IDS.forEach((id) => PILIERS4[id].criteres.forEach((c) => {
      expect(c.verification).toBeTruthy(); expect(c.action).toBeTruthy(); expect(c.preuveAExaminer).toBeTruthy();
    }));
  });

  it('les 625 combinaisons de réponses conservent un score indépendant de la perception', () => {
    for (let masque = 0; masque < 625; masque++) {
      const reponses = [0, 1, 2, 3].map((i) => REPONSES4[Math.floor(masque / 5 ** i) % 5].valeur) as Saisie4['reponses'];
      const reference = note4(saisie(reponses, null));
      for (const perception of [0, 5, 10]) expect(note4(saisie(reponses, perception))).toBe(reference);
      if (reference !== null) { expect(reference).toBeGreaterThanOrEqual(0); expect(reference).toBeLessThanOrEqual(10); }
    }
  });
});
