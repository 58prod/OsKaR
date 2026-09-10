import React from 'react';

/*
 * Pictogrammes de `fit-atelier.html`, tracés repris de la maquette
 * (24×24, trait 1.8, extrémités arrondies) : les équivalents lucide diffèrent
 * légèrement, et la maquette fait référence.
 */

const Trace: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = 'w-4 h-4', children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export const IconeOffre: React.FC<{ className?: string }> = ({ className }) => (
  <Trace className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </Trace>
);

export const IconeDifferenciation: React.FC<{ className?: string }> = ({ className }) => (
  <Trace className={className}>
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </Trace>
);

export const IconeConcurrence: React.FC<{ className?: string }> = ({ className }) => (
  <Trace className={className}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </Trace>
);

export const IconeSignaux: React.FC<{ className?: string }> = ({ className }) => (
  <Trace className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </Trace>
);

export const IconeDiagnostic: React.FC<{ className?: string }> = ({ className }) => (
  <Trace className={className}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </Trace>
);
