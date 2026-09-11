import { dateCourte } from './formule';
import type { BilanAdmin } from './types';

/*
 * Export des contacts au format CSV lu par Excel en français : séparateur
 * point-virgule, virgule décimale, BOM pour les accents.
 */

const cellule = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function contactsEnCsv(contacts: BilanAdmin[]): string {
  const lignes = [
    ['Email', 'Bilan', 'Date', 'Note sur 10', 'Recontact accepté', 'Compte créé depuis'],
    ...contacts.map((b) => [
      b.email ?? '',
      b.type === 'produit' ? 'Potentiel Produit' : 'Bilan de maturité',
      dateCourte(b.creeLe),
      b.note == null ? '' : String(Math.round(b.note * 10) / 10).replace('.', ','),
      b.accepteRecontact ? 'Oui' : 'Non',
      b.compteExiste ? 'Oui' : 'Non',
    ]),
  ];
  return '﻿' + lignes.map((l) => l.map(cellule).join(';')).join('\r\n');
}
