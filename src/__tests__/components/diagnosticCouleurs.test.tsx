import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PillarCard } from '@/components/diagnostic/PillarCard';
import { PILLARS, type PillarInput } from '@/lib/diagnostic';
import { COULEURS_PILIERS, type PilierId } from '@/constants/piliers';

/*
 * Diagnostic : chaque bloc reprend le code couleur de son pilier dans le
 * menu (bordure, intitulé, curseur, cases, bouton « Ouvrir »).
 */

/** Couleur au format « rgb(…) », qu'elle soit écrite en hexadécimal ou déjà en rgb. */
function rgb(couleur: string): string {
  if (!couleur.startsWith('#')) return couleur;
  const n = parseInt(couleur.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

const evalue: PillarInput = { slider: 6, checks: [true, false, false], touched: true };

describe('Diagnostic — blocs aux couleurs des piliers', () => {
  PILLARS.forEach((pillar) => {
    const couleur = COULEURS_PILIERS[pillar.id as PilierId];
    const attendue = rgb(couleur.DEFAULT);

    it(`${pillar.module} : bordure, intitulé, curseur, cases et bouton`, () => {
      const onOpen = jest.fn();
      const { container } = render(
        <PillarCard pillar={pillar} input={evalue} onSliderChange={jest.fn()} onToggleCheck={jest.fn()} onOpenModule={onOpen} />,
      );
      const bloc = container.querySelector('article') as HTMLElement;
      expect(bloc.style.borderTop).toBe(`3px solid ${attendue}`);
      expect(rgb((screen.getByText(pillar.module, { selector: 'div' }) as HTMLElement).style.color)).toBe(rgb(couleur.dark));
      expect(rgb((screen.getByRole('slider') as HTMLElement).style.accentColor)).toBe(attendue);
      screen.getAllByRole('checkbox').forEach((c) => expect(rgb((c as HTMLElement).style.accentColor)).toBe(attendue));
      const bouton = screen.getByRole('button', { name: new RegExp(`Ouvrir ${pillar.module}`) });
      expect(rgb(bouton.style.background)).toBe(attendue);
      fireEvent.click(bouton);
      expect(onOpen).toHaveBeenCalledWith(pillar);
    });
  });
});
