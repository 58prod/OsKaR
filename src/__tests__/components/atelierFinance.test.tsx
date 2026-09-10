import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarreEtapesAtelier } from '@/components/atelier/BarreEtapesAtelier';
import { ConseilsFinance } from '@/components/finance/ConseilsFinance';
import { EtapeDecisions, EtapeRevenus } from '@/components/finance/EtapesFinance';
import { exemplesPour } from '@/lib/exemples';
import { ATELIER_FINANCE_VIDE, ETAPES_FINANCE, LIBELLES_ETAPES_FINANCE } from '@/lib/finance/types';

/*
 * Atelier Finance, d'après `finance-atelier.html` : une barre de cinq étapes
 * (synthèse comprise), la colonne « Conseils Coach » à chaque étape, et des
 * exemples qui parlent le métier de la personne.
 */
describe('Atelier Finance', () => {
  const generiques = exemplesPour(undefined);
  const artisan = exemplesPour('Plombier');

  it('reprend les cinq onglets de la maquette, dans l’ordre', () => {
    render(
      <BarreEtapesAtelier
        pilier="finance"
        nom="Finance"
        etapes={ETAPES_FINANCE}
        libelles={LIBELLES_ETAPES_FINANCE}
        etape="revenus"
        onChange={() => {}}
      />
    );
    const onglets = screen.getAllByRole('button').map((b) => b.textContent?.trim());
    expect(onglets).toEqual(['Revenus', 'Coûts & Marge', 'Rentabilité', 'Décisions', 'Synthèse']);
  });

  it('affiche les conseils du coach à chacune des cinq étapes, numérotés', () => {
    ETAPES_FINANCE.forEach((etape, i) => {
      const { unmount } = render(<ConseilsFinance etape={etape} />);
      expect(screen.getByText('Conseils Coach')).toBeInTheDocument();
      expect(screen.getByText(`Étape ${i + 1} · ${LIBELLES_ETAPES_FINANCE[etape]}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('reprend les repères chiffrés de la maquette', () => {
    render(<ConseilsFinance etape="couts" />);
    expect(screen.getByText('SaaS / Digital')).toBeInTheDocument();
    expect(screen.getByText('70-85%')).toBeInTheDocument();
  });

  it('adapte les exemples des revenus au métier', () => {
    render(<EtapeRevenus atelier={ATELIER_FINANCE_VIDE} modifier={() => {}} exemples={artisan} />);
    const sources = screen.getAllByLabelText('Source ou offre');
    expect(sources[0]).toHaveAttribute('placeholder', `ex : ${artisan.finance.revenus[0]}`);
  });

  it('garde les exemples de la maquette sans métier choisi', () => {
    render(<EtapeDecisions atelier={ATELIER_FINANCE_VIDE} modifier={() => {}} exemples={generiques} />);
    expect(screen.getByLabelText('Décision / Action prioritaire', { selector: '#decision-1' })).toHaveAttribute(
      'placeholder',
      'ex : Renégocier le contrat de sous-traitance principal'
    );
  });
});
