import {
  CANDIDATURE_VIDE,
  basculerPilier,
  problemeCandidature,
} from '@/lib/coachs/candidature';
import {
  FORMATS,
  VALIDITE_JOURS,
  appliquerFormat,
  lireDeroule,
  lireLignes,
  ouRepli,
  saisieInitiale,
} from '@/lib/coachs/proposition';

describe('candidature à l’annuaire des coachs', () => {
  const complete = { ...CANDIDATURE_VIDE, prenom: 'Sophie', nom: 'Martin', email: 'sophie@cabinet.fr' };

  it('accepte une candidature avec prénom, nom et email', () => {
    expect(problemeCandidature(complete)).toBeNull();
  });

  it('refuse un champ obligatoire vide ou un email mal formé', () => {
    expect(problemeCandidature({ ...complete, prenom: '  ' })).toMatch(/prénom/);
    expect(problemeCandidature({ ...complete, nom: '' })).toMatch(/nom/);
    expect(problemeCandidature({ ...complete, email: '' })).toMatch(/email/);
    expect(problemeCandidature({ ...complete, email: 'sophie@cabinet' })).toMatch(/valide/);
  });

  it('refuse un texte plus long que la colonne de la table', () => {
    expect(problemeCandidature({ ...complete, approche: 'x'.repeat(3001) })).toMatch(/trop long/);
  });

  it('bascule un pilier en gardant l’ordre de la maquette', () => {
    expect(basculerPilier(['okr'], 'vision')).toEqual(['vision', 'okr']);
    expect(basculerPilier(['vision', 'okr'], 'vision')).toEqual(['okr']);
  });
});

describe('générateur de proposition', () => {
  it('démarre sur le format Flash, daté du jour et valable trois semaines', () => {
    const s = saisieInitiale(new Date(2026, 8, 11));
    expect(s.format).toBe('flash');
    expect(s.date).toBe('11 septembre 2026');
    expect(VALIDITE_JOURS).toBe(21);
    expect(s.validite).toBe('2 octobre 2026');
    expect(lireLignes(s.deroule)).toHaveLength(FORMATS.flash.deroule.length);
  });

  it('recharge durée, séances, déroulé et livrables quand le format change', () => {
    const s = appliquerFormat(saisieInitiale(new Date(2026, 8, 11)), 'parcours');
    expect(s.duree).toBe('6 mois');
    expect(lireDeroule(s.deroule)[0]).toEqual({
      titre: 'Vision',
      detail: 'Le cap à un an, les valeurs, les objectifs fondateurs.',
    });
    expect(lireLignes(s.livrables)).toHaveLength(6);
  });

  it('lit le déroulé ligne à ligne, le détail étant facultatif', () => {
    expect(lireDeroule('  Cadrage | On pose le cadre \n\n Ancrage ')).toEqual([
      { titre: 'Cadrage', detail: 'On pose le cadre' },
      { titre: 'Ancrage', detail: null },
    ]);
  });

  it('remplace un champ vide par le repli de la maquette', () => {
    expect(ouRepli('  ')).toBe('—');
    expect(ouRepli('', 'À compléter')).toBe('À compléter');
    expect(ouRepli(' 4 800 € HT ')).toBe('4 800 € HT');
  });
});
