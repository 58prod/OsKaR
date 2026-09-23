import { analyser4c, etat4cDuCorps, etatInitial4c, note4c, noteProvisoire4c, textePratique, type Etat4c, type Reponse4c } from '@/lib/diagnostic4c/calcul';
import { DOMINO4C, PILIERS4C, VERDICTS4C } from '@/lib/diagnostic4c/contenu';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

const IDS = PILLARS.map((p) => p.id);
function remplir(e: Etat4c, id: PillarId, r: Reponse4c[], perception = 7) {
  e.piliers[id] = { perception, reponses: r as Etat4c['piliers'][PillarId]['reponses'] };
}
const tout = (r: Reponse4c): Reponse4c[] => [r, r, r, r];

describe('Diagnostic 4c — calcul', () => {
  it('Oui 1, En partie 0,5, Non et Je ne sais pas 0 ; score provisoire au fil des réponses', () => {
    expect(note4c({ perception: 5, reponses: ['oui', 'partiel', 'non', 'inconnu'] })).toBe(3.8);
    expect(note4c({ perception: 5, reponses: ['oui', null, null, null] })).toBeNull();
    expect(noteProvisoire4c({ perception: 5, reponses: ['oui', 'non', null, null] })).toBe(5);
  });

  it('rien avant d’avoir dit seul ou avec une équipe, ni avant la fin', () => {
    const e = etatInitial4c();
    IDS.forEach((id) => remplir(e, id, tout('oui')));
    expect(analyser4c(e).complet).toBe(false);
    e.seul = false;
    expect(analyser4c(e).complet).toBe(true);
  });

  it('un pilier fragile : profil, priorité avec verdict net, domino, angle mort, actions reliées à Oskar', () => {
    const e = etatInitial4c();
    e.seul = false;
    ['vision', 'fit', 'finance', 'okr'].forEach((id) => remplir(e, id as PillarId, tout('oui'), 9));
    remplir(e, 'team', ['non', 'inconnu', 'partiel', 'non'], 8);
    const a = analyser4c(e);
    expect(a.niveauGlobal).toBe('c');
    expect(a.profil?.id).toBe('batisseur');
    expect(a.priorite?.titre).toBe(VERDICTS4C.team.f.titre);
    expect(a.domino?.fort.id).toBe('vision');
    expect(a.ecarts[0]).toMatchObject({ id: 'team', sens: 'angle-mort' });
    // Ce qui manque d'abord, puis le reste ; deux actions au plus par pilier.
    expect(a.actions.map((x) => x.reponse)).toEqual(['non', 'non']);
    expect(a.actions.every((x) => x.outil.href.startsWith('/app/'))).toBe(true);
  });

  it('seul : Team sort du calcul, et les pratiques qui parlent d’équipe s’adaptent', () => {
    const e = etatInitial4c();
    e.seul = true;
    ['vision', 'fit', 'finance', 'okr'].forEach((id) => remplir(e, id as PillarId, tout('oui'), 9));
    const a = analyser4c(e);
    expect(a.complet).toBe(true);
    expect(a.notes).toHaveLength(4);
    expect(a.profil?.id).toBe('horloger');
    expect(textePratique('okr', 2, true)).toBe(PILIERS4C.okr.criteres[2].texteSeul);
    expect(textePratique('okr', 2, false)).toBe(PILIERS4C.okr.criteres[2].texte);
  });

  it('les textes sont complets', () => {
    IDS.forEach((id) => {
      PILIERS4C[id].criteres.forEach((c) => expect(c.texte && c.action && c.verification && c.preuveAExaminer && c.outil.href).toBeTruthy());
      (['f', 'c', 's'] as const).forEach((n) => expect(VERDICTS4C[id][n].titre).toBeTruthy());
      IDS.filter((b) => b !== id).forEach((b) => expect(DOMINO4C[id][b]).toBeTruthy());
    });
  });

  it('relit côté serveur un état bien formé, refuse le reste', () => {
    const e = etatInitial4c();
    e.seul = false;
    expect(etat4cDuCorps(JSON.parse(JSON.stringify(e)))).toEqual(e);
    expect(etat4cDuCorps({ ...e, seul: null })).toBeNull();
    const faux = JSON.parse(JSON.stringify(e));
    faux.piliers.vision.reponses[0] = '<b>oui</b>';
    expect(etat4cDuCorps(faux)).toBeNull();
    faux.piliers.vision = { perception: 11, reponses: [null, null, null, null] };
    expect(etat4cDuCorps(faux)).toBeNull();
  });
});
