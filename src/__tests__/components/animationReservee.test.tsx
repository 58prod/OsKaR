import React from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { ToolHeader, type FacilitatorLock } from '@/components/toolbox/ToolHeader';
import { useFacilitator } from '@/hooks/useFacilitator';

/*
 * Animation réservée au créateur d'une session (Planning Poker) : les autres
 * ne voient plus l'interrupteur « Mode animateur » et ne peuvent pas l'activer.
 */

const enTete = (lock: FacilitatorLock) => render(
  <ToolHeader
    title="Planning Poker"
    sessionCode="POKER-TEST"
    isFacilitator={lock.canChange}
    onToggleFacilitator={() => {}}
    onShare={() => {}}
    facilitatorLock={lock}
  />,
);

describe('Animation réservée — en-tête', () => {
  it('remplace l’interrupteur par « Animation réservée » chez les autres', () => {
    enTete({ exclusive: true, canChange: false, onChange: () => {} });
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.getByText('Animation réservée')).toBeInTheDocument();
    expect(screen.queryByText('Moi uniquement')).toBeNull();
  });

  it('laisse le créateur basculer entre « Moi uniquement » et « Ouvert à tous »', () => {
    const onChange = jest.fn();
    enTete({ exclusive: true, canChange: true, onChange });
    expect(screen.getByRole('switch')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Moi uniquement/ }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('garde l’interrupteur pour tous quand l’animation est ouverte', () => {
    enTete({ exclusive: false, canChange: false, onChange: () => {} });
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.queryByText('Animation réservée')).toBeNull();
  });
});

describe('Animation réservée — useFacilitator', () => {
  it('empêche un participant de prendre la main, même s’il l’avait prise avant', () => {
    const { result, rerender } = renderHook(({ seul }) => useFacilitator(false, seul), { initialProps: { seul: false } });
    act(() => result.current.toggleFacilitator());
    expect(result.current.isFacilitator).toBe(true);
    rerender({ seul: true });
    expect(result.current.isFacilitator).toBe(false);
    act(() => result.current.toggleFacilitator());
    expect(result.current.isFacilitator).toBe(false);
  });

  it('laisse l’animation au créateur', () => {
    const { result } = renderHook(() => useFacilitator(true, true));
    expect(result.current.isFacilitator).toBe(true);
  });
});
