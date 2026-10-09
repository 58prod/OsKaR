import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { JoinSessionModal } from '@/components/toolbox/JoinSessionModal';

/*
 * Fenêtre d'entrée dans un outil (prénom) : on peut la fermer ou annuler,
 * ce qui ramène à la boîte à outils sans entrer dans la session.
 */

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push, replace: jest.fn(), query: {}, pathname: '/app/outils/planning-poker' }) }));

const fenetre = () => render(
  <JoinSessionModal toolTitle="Planning Poker" sessionCode="POKER-TEST" isCreating={false} onJoin={jest.fn()} />,
);

beforeEach(() => push.mockClear());

describe('Fenêtre d’entrée dans un outil', () => {
  it('« Annuler » ramène à la boîte à outils', () => {
    fenetre();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(push).toHaveBeenCalledWith('/app/outils');
  });

  it('la croix ramène à la boîte à outils', () => {
    fenetre();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer et revenir à la boîte à outils' }));
    expect(push).toHaveBeenCalledWith('/app/outils');
  });

  it('la touche Échap aussi', () => {
    fenetre();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(push).toHaveBeenCalledWith('/app/outils');
  });
});
