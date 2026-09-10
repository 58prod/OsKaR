import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConseilsPanel } from '@/components/vision/ConseilsPanel';
import { exemplesPour } from '@/lib/exemples';
import { ETAPES_VISION } from '@/lib/vision/types';

/*
 * La colonne « Conseils pour cette étape » est le bloc de droite de la maquette
 * `vision-atelier.html`. Deux choses comptent : qu'elle existe à chaque étape,
 * et que son encart d'exemple parle le métier de la personne.
 */
describe('Colonne de conseils de l’atelier Vision', () => {
  const generiques = exemplesPour(undefined);

  it('affiche un conseil pour chacune des huit étapes', () => {
    ETAPES_VISION.forEach((etape) => {
      const { unmount } = render(<ConseilsPanel etape={etape} exemples={generiques} />);
      expect(screen.getByLabelText('Conseils pour cette étape')).toBeInTheDocument();
      expect(screen.getByText('Conseils pour cette étape')).toBeInTheDocument();
      expect(screen.getByText('Exemple')).toBeInTheDocument();
      unmount();
    });
  });

  it('reprend les conseils de méthode de la maquette', () => {
    render(<ConseilsPanel etape="valeurs" exemples={generiques} />);
    expect(screen.getByText(/Trois valeurs au maximum/)).toBeInTheDocument();
    expect(screen.getByText(/règle observable/)).toBeInTheDocument();
  });

  it('adapte l’exemple au métier : un plombier lit son propre vocabulaire', () => {
    const artisan = exemplesPour('Plombier');
    const { container } = render(<ConseilsPanel etape="sens" exemples={artisan} />);
    expect(container.textContent).toContain('chantier');
    expect(container.textContent).not.toContain('méthode structurée en 5 piliers');
  });

  it('retombe sur l’exemple générique sans métier choisi', () => {
    const { container } = render(<ConseilsPanel etape="sens" exemples={generiques} />);
    expect(container.textContent).toContain('cap clair');
  });
});
