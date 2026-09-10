import {
  ATELIER_FIT_VIDE,
  detailsFit,
  fusionnerFit,
  recapFit,
  scoreFit,
  statutFit,
  type AtelierFit,
} from '@/lib/fit/types';

/*
 * Le diagnostic de l'atelier Fit reprend le barème de `fit-atelier.html`
 * (`computeFitScore`, `getFitStatut`, `buildDiagnostic`) : ces tests figent
 * les seuils pour qu'un écart avec la maquette se voie.
 */

const atelier = (patch: Partial<AtelierFit>): AtelierFit => ({ ...ATELIER_FIT_VIDE, ...patch });

describe('Diagnostic de l’atelier Fit', () => {
  it('donne 0 à un atelier vide, soit « FIT à construire »', () => {
    expect(scoreFit(ATELIER_FIT_VIDE)).toBe(0);
    expect(statutFit(0).libelle).toBe('❌ FIT à construire');
  });

  it('atteint 17 quand toutes les réponses sont les meilleures', () => {
    const plein = atelier({
      lisibilite: 'oui',
      offrePitch: 'Une phrase de plus de vingt caractères',
      diffClients: 'oui',
      diffDurable: 'oui',
      sigBouche: 'oui',
      sigDemande: 'forte',
      sigRetention: '80% renouvellent',
    });
    expect(scoreFit(plein)).toBe(17);
    expect(statutFit(scoreFit(plein)).libelle).toBe('✅ FIT Confirmé');
  });

  it('applique les seuils 13, 8 et 4 de la maquette', () => {
    expect(statutFit(13).libelle).toBe('✅ FIT Confirmé');
    expect(statutFit(12).libelle).toBe('🧪 FIT en construction');
    expect(statutFit(8).libelle).toBe('🧪 FIT en construction');
    expect(statutFit(7).libelle).toBe('🔍 FIT en exploration');
    expect(statutFit(4).libelle).toBe('🔍 FIT en exploration');
    expect(statutFit(3).libelle).toBe('❌ FIT à construire');
  });

  it('ne compte le pitch qu’au-delà de 20 caractères, la rétention au-delà de 3', () => {
    expect(scoreFit(atelier({ offrePitch: 'Trop court' }))).toBe(0);
    expect(scoreFit(atelier({ sigRetention: '80%' }))).toBe(0);
    expect(scoreFit(atelier({ sigRetention: '80 %' }))).toBe(2);
  });

  it('formule les quatre cases du récapitulatif comme la maquette', () => {
    const a = atelier({
      lisibilite: 'parfois',
      diffClients: 'parfois',
      diffDurable: 'moyen',
      sigDemande: 'stable',
      concurrents: [
        { id: 'a', nom: 'Cabinet X', type: 'Direct', bien: '', avantage: '' },
        { id: 'b', nom: '', type: '', bien: '', avantage: '' },
      ],
    });
    expect(recapFit(a)).toEqual({
      offre: '⚠️ À préciser',
      differenciation: '⚠️ À renforcer',
      concurrence: '✅ Cartographié (1)',
      signaux: '⚠️ Partiels',
    });
    expect(recapFit(ATELIER_FIT_VIDE).concurrence).toBe('⚠️ À compléter');
  });

  it('reprend le pitch, sinon ce que permet l’offre, dans le détail', () => {
    expect(detailsFit(atelier({ offreValeur: 'Gagner du temps' })).offre).toBe('Gagner du temps');
    expect(detailsFit(atelier({ offreValeur: 'x', offrePitch: 'Le pitch' })).offre).toBe('Le pitch');
    expect(detailsFit(ATELIER_FIT_VIDE).signaux).toBe('—');
  });

  it('relit un atelier enregistré sans perdre de champ', () => {
    const relu = fusionnerFit({ offreNom: 'Mon offre' });
    expect(relu.offreNom).toBe('Mon offre');
    expect(relu.concurrents).toHaveLength(3);
    expect(relu.sigDemande).toBe('');
  });
});
