import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarreEtapesAtelier } from '@/components/atelier/BarreEtapesAtelier';
import { ConseilsFit } from '@/components/fit/ConseilsFit';
import { EtapeOffre } from '@/components/fit/EtapesFit';
import { exemplesPour } from '@/lib/exemples';
import { ATELIER_FIT_VIDE, ETAPES_FIT, LIBELLES_ETAPES_FIT } from '@/lib/fit/types';

/*
 * Atelier Fit, d'après `fit-atelier.html` : une barre de cinq étapes
 * (diagnostic compris), une colonne de conseils à chaque étape, et des
 * exemples qui parlent le métier de la personne.
 */
describe('Atelier Fit', () => {
  const generiques = exemplesPour(undefined);
  const artisan = exemplesPour('Plombier');

  it('reprend les cinq onglets de la maquette, dans l’ordre', () => {
    render(<BarreEtapesAtelier pilier="fit" nom="Fit" etapes={ETAPES_FIT} libelles={LIBELLES_ETAPES_FIT} etape="offre" onChange={() => {}} />);
    const onglets = screen.getAllByRole('button').map((b) => b.textContent?.trim());
    expect(onglets).toEqual(['Offre', 'Différenciation', 'Concurrence', 'Signaux', 'Diagnostic']);
  });

  it('marque l’étape courante', () => {
    render(<BarreEtapesAtelier pilier="fit" nom="Fit" etapes={ETAPES_FIT} libelles={LIBELLES_ETAPES_FIT} etape="signaux" onChange={() => {}} />);
    expect(screen.getByRole('button', { current: 'step' })).toHaveTextContent('Signaux');
  });

  it('affiche un conseil à chacune des cinq étapes', () => {
    ETAPES_FIT.forEach((etape) => {
      const { unmount } = render(<ConseilsFit etape={etape} exemples={generiques} />);
      expect(screen.getByText('Conseils pour cette étape')).toBeInTheDocument();
      expect(screen.getByText('Exemple')).toBeInTheDocument();
      unmount();
    });
  });

  it('adapte l’exemple du conseil au métier', () => {
    const { container } = render(<ConseilsFit etape="offre" exemples={artisan} />);
    expect(container.textContent).toContain(artisan.fit.offre.pitch);
    expect(container.textContent).not.toContain('dirigeants de PME');
  });

  it('adapte les exemples des champs au métier', () => {
    render(<EtapeOffre atelier={ATELIER_FIT_VIDE} modifier={() => {}} exemples={artisan} />);
    expect(screen.getByLabelText('Nom / intitulé de l’offre')).toHaveAttribute(
      'placeholder',
      `Ex : ${artisan.fit.offre.nom}`
    );
  });

  it('garde les exemples de la maquette sans métier choisi', () => {
    render(<EtapeOffre atelier={ATELIER_FIT_VIDE} modifier={() => {}} exemples={generiques} />);
    expect(screen.getByLabelText('Nom / intitulé de l’offre')).toHaveAttribute(
      'placeholder',
      'Ex : Accompagnement stratégique dirigeant'
    );
  });
});
