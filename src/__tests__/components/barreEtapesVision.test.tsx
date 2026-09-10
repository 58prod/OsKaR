import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarreEtapes } from '@/components/vision/BarreEtapes';

/*
 * La barre d'étapes de `vision-atelier.html` : sept onglets, libellés en
 * majuscules, la synthèse finale n'y figure pas.
 */
describe('Barre d’étapes de l’atelier Vision', () => {
  it('reprend les sept onglets de la maquette, dans l’ordre', () => {
    render(<BarreEtapes etape="sens" onChange={() => {}} />);
    const onglets = screen.getAllByRole('button').map((b) => b.textContent?.trim());
    expect(onglets).toEqual([
      'Sens',
      'Cibles & acteurs',
      'Réalité',
      'Projection',
      'Valeurs',
      'Synthèse',
      'Objectifs',
    ]);
  });

  it('n’affiche pas le récapitulatif : on y arrive par le bouton Suivant', () => {
    render(<BarreEtapes etape="sens" onChange={() => {}} />);
    expect(screen.queryByText('Récapitulatif')).toBeNull();
  });

  it('marque l’étape courante', () => {
    render(<BarreEtapes etape="valeurs" onChange={() => {}} />);
    const actif = screen.getByRole('button', { current: 'step' });
    expect(actif).toHaveTextContent('Valeurs');
  });
});
