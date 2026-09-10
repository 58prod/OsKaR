import React from 'react';
import { ComingSoon } from '@/components/layout/ComingSoon';

export default function AboutPage() {
  return (
    <ComingSoon
      title="À propos"
      tagline="Découvrez la méthode Oskar et l'équipe qui construit votre plateforme de productivité durable."
      features={[
        'La méthode des 5 piliers',
        'Notre approche de la productivité',
        'L\u2019équipe et nos valeurs',
        'Ressources et accompagnement',
      ]}
    />
  );
}
