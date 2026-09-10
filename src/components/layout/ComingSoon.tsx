import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, Bell } from 'lucide-react';
import { AppShell } from './AppShell';

interface ComingSoonProps {
  /** Nom du module/pilier (ex: "OSKAR Vision"). */
  title: string;
  /** Phrase d'accroche décrivant le futur module. */
  tagline: string;
  /** Liste optionnelle de fonctionnalités à venir. */
  features?: string[];
}

/**
 * Page générique « Bientôt disponible » affichée pour les modules
 * non encore développés, afin d'éviter les erreurs 404 depuis la navigation.
 */
export const ComingSoon: React.FC<ComingSoonProps> = ({ title, tagline, features }) => {
  const router = useRouter();

  return (
    <AppShell title={title} topbarTitle={title} topbarSubtitle="Bientôt disponible">
      <section
        aria-labelledby="coming-soon-title"
        className="max-w-3xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-navy-dark rounded-[24px] p-10 lg:p-14 text-white shadow-card text-center"
        >
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/15 text-teal text-[12px] font-bold uppercase tracking-[1.5px] mb-6">
              <Clock className="h-4 w-4" aria-hidden />
              En cours de développement
            </span>
            <h1 id="coming-soon-title" className="text-3xl lg:text-4xl font-extrabold mb-4">
              {title}
            </h1>
            <p className="text-lg text-white/80 max-w-xl mx-auto">
              {tagline}
            </p>
            <p className="mt-6 text-base font-semibold text-teal">
              Ce module arrive très prochainement.
            </p>
          </div>
        </motion.div>

        {features && features.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
            aria-label="Fonctionnalités à venir"
          >
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 bg-white p-4 rounded-xl border border-line shadow-card"
              >
                <span className="mt-0.5 w-2 h-2 rounded-full bg-teal shrink-0" aria-hidden />
                <span className="text-sm text-ink">{feature}</span>
              </li>
            ))}
          </motion.ul>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-navy-dark font-bold rounded-lg shadow-sm hover:bg-teal-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour à l'accueil
          </button>
          <button
            type="button"
            onClick={() => router.push('/diagnostic')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-line text-navy font-semibold rounded-lg hover:bg-surface transition-colors"
          >
            <Bell className="h-4 w-4" aria-hidden />
            Faire mon bilan en attendant
          </button>
        </motion.div>
      </section>
    </AppShell>
  );
};

export default ComingSoon;
