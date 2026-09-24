import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  Target as TargetIcon,
  LineChart,
  CheckSquare,
  Users,
  Clock,
  TrendingUp,
  PlayCircle,
  Zap,
  BarChart3,
  MessageSquare,
  Check,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/AppShell';
import { ouvrirConnexion } from '@/store/useConnexion';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAppStore } from '@/store/useAppStore';
import { COULEURS_PILIERS, type PilierId } from '@/constants/piliers';

// Chargé à la demande : la bibliothèque de graphiques (~90 ko) ne ralentit
// plus le premier affichage de l'accueil.
const RadarExemple = dynamic(() => import('@/components/accueil/RadarExemple'), { ssr: false });

/** Le parcours en 5 piliers, illustré dans l'appel final de la page. */
const PARCOURS: { id: PilierId; nom: string; verbe: string; icon: LucideIcon }[] = [
  { id: 'vision', nom: 'OSKAR Vision', verbe: 'Clarifier le cap', icon: Eye },
  { id: 'fit', nom: 'OSKAR Market Fit', verbe: 'Valider le marché', icon: LineChart },
  { id: 'finance', nom: 'OSKAR Finance', verbe: 'Piloter les chiffres', icon: TargetIcon },
  { id: 'okr', nom: 'OSKAR OKR', verbe: 'Exécuter les priorités', icon: CheckSquare },
  { id: 'team', nom: 'OSKAR Team', verbe: 'Souder l’équipe', icon: Users },
];

const HomePage: React.FC = () => {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();
  const openAuth = (tab: 'login' | 'register' = 'register') => ouvrirConnexion(tab);
  const topbarActions = !authReady ? null : isAuthenticated ? (
    <>
      <button
        onClick={() => router.push('/app/okr/dashboard')}
        className="px-5 py-2.5 bg-teal text-navy-dark text-sm font-bold rounded-lg shadow-sm hover:bg-teal-dark hover:-translate-y-0.5 transition-all"
      >
        Accéder à mon espace →
      </button>
      <UserMenu />
    </>
  ) : (
    <>
      <button onClick={() => openAuth('login')} className="px-4 py-2 text-sm font-semibold text-navy hover:text-navy-light transition-colors">
        Connexion
      </button>
      <button
        onClick={() => openAuth('register')}
        className="px-5 py-2.5 bg-teal text-navy-dark text-sm font-bold rounded-lg shadow-sm hover:bg-teal-dark hover:-translate-y-0.5 transition-all"
      >
        Commencer gratuitement →
      </button>
    </>
  );

  return (
    <AppShell
      title="Accueil"
      topbarTitle="Bienvenue sur OSKAR"
      topbarSubtitle="Votre vision. Vos objectifs. Vos actions."
      topbarActions={topbarActions}
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-navy-dark rounded-[24px] mb-12 p-10 lg:p-16 text-white shadow-card">
        <div className="relative z-10 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-[11px] font-bold tracking-[2px] uppercase text-teal mb-4">
              La méthode des organisations performantes
            </span>
            <h1 className="text-27.5 lg:text-32 font-extrabold mb-6">
              La productivité, c'est créer <span className="text-teal">plus de valeur durable.</span>
            </h1>
            <p className="text-16.5 text-white/70 mb-8">
              Oskar est un cadre de management structuré en 5 piliers pour aligner votre vision, valider votre marché, piloter vos finances, exécuter vos objectifs et renforcer vos équipes.
            </p>
            <button
              onClick={() => router.push('/diagnostic')}
              className="px-8 py-4 bg-teal text-navy-dark font-bold rounded-xl shadow-lg hover:bg-teal-dark hover:-translate-y-1 transition-all flex items-center gap-2"
            >
              Démarrer le bilan gratuit <ArrowRight className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
        <div className="hidden lg:flex absolute right-12 bottom-12 flex-col gap-4">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-[120px]">
            <div className="text-3xl font-black text-teal">5</div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Piliers intégrés</div>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-[120px]">
            <div className="text-3xl font-black text-teal">10'</div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Pour le bilan</div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal/10 rounded-full blur-[100px]" />
      </section>

      {/* Steps Section */}
      <section className="mb-20">
        <h2 className="text-xl font-bold text-navy mb-10 text-center uppercase tracking-wider">Comment ça marche ?</h2>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {[
            { n: 1, t: 'Faites votre bilan', d: 'Répondez aux questions pour diagnostiquer vos points forts et vos zones de progression sur les 5 piliers.' },
            { n: 2, t: 'Accédez aux modules', d: 'Suivez les parcours guidés de chaque pilier : Vision, Market Fit, Finance, OKR, Team. Rituels courts.' },
            { n: 3, t: 'Pilotez & progressez', d: 'Mesurez vos avancées, ajustez vos priorités et transformez durablement la performance.' },
          ].map((step, idx) => (
            <div key={step.n} className="bg-white p-8 rounded-2xl border border-line shadow-card relative">
              <div className="w-10 h-10 bg-navy text-white rounded-lg flex items-center justify-center font-bold mb-4">{step.n}</div>
              <h4 className="font-bold text-navy mb-2">{step.t}</h4>
              <p className="text-sm text-muted leading-relaxed">{step.d}</p>
              {idx < 2 && <ArrowRight className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 text-teal h-6 w-6 z-10" />}
            </div>
          ))}
        </div>
      </section>

      {/* Bilan Section */}
      <section className="mb-20">
        <h2 className="text-xl font-bold text-navy uppercase tracking-wider mb-8">Bilan & diagnostic Oskar</h2>
        <div className="bg-white rounded-3xl border border-line shadow-card overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-line bg-gradient-to-br from-[#f0f2ff] to-[#e8f8f5]">
              <span className="inline-block px-3 py-1 bg-white/50 rounded-full text-[11px] font-bold text-navy-light mb-4 tracking-wide">
                Outil gratuit · Confidentiel
              </span>
              <h3 className="text-25.5 font-extrabold text-navy mb-4">
                Mesurez l'efficacité de votre organisation sur les 5 piliers Oskar.
              </h3>
              <p className="text-15.5 text-muted mb-8 leading-[1.75] max-w-md">
                Un diagnostic structuré pour identifier vos forces et vos zones d'amélioration — sans inscription requise.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-2.5 text-navy font-semibold text-[13px]">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-teal">
                    <Clock className="h-4 w-4" />
                  </div>
                  ~10 minutes
                </div>
                <div className="flex items-center gap-2.5 text-navy font-semibold text-[13px]">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-teal">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  5 piliers · 20 pratiques
                </div>
              </div>
              <button
                onClick={() => router.push('/diagnostic')}
                className="w-full lg:w-auto px-8 py-4 bg-teal text-navy-dark font-bold rounded-xl shadow-lg hover:bg-teal-dark hover:-translate-y-1 transition-all"
              >
                Démarrer le bilan gratuit →
              </button>
            </div>
            <div className="p-8 lg:p-12 flex flex-col items-center justify-center min-h-[400px]">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted mb-6">Exemple de résultats</span>
              <div className="w-full h-64 lg:h-72">
                <RadarExemple />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Grid Section */}
      <section className="mb-20">
        <h2 className="text-xl font-bold text-navy uppercase tracking-wider mb-8">Les 5 piliers Oskar</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { id: '01', name: 'OSKAR Vision', desc: 'Clarifiez votre cap à 1 an, vos valeurs et vos objectifs.', icon: Eye, status: 'Disponible', href: '/vision' },
            { id: '02', name: 'OSKAR Market Fit', desc: 'Vérifiez que votre offre répond à un vrai besoin marché.', icon: LineChart, status: 'Disponible', href: '/fit' },
            { id: '03', name: 'OSKAR Finance', desc: 'Pilotez vos indicateurs financiers clés.', icon: TargetIcon, status: 'Disponible', href: '/finance' },
            { id: '04', name: 'OSKAR OKR', desc: 'Alignez stratégie et exécution.', icon: CheckSquare, status: 'Disponible', href: '/okr' },
            { id: '05', name: 'OSKAR Team', desc: 'Renforcez la cohésion de votre organisation.', icon: Users, status: 'Bientôt', href: '/team' },
          ].map((pillar) => (
            <div
              key={pillar.id}
              onClick={() => pillar.href && router.push(pillar.href)}
              className="group bg-white p-6 rounded-2xl border border-line shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all text-center relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-3 right-4 text-[10px] font-bold text-muted/30">{pillar.id}</div>
              <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <pillar.icon className="h-6 w-6 text-navy" />
              </div>
              <h4 className="font-bold text-navy text-[13.5px] mb-1">{pillar.name}</h4>
              <p className="text-[11.5px] text-muted leading-relaxed mb-4">{pillar.desc}</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${pillar.status === 'Disponible' ? 'bg-teal/10 text-teal-dark font-extrabold' : 'bg-surface text-muted/60'}`}
              >
                {pillar.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mb-20">
        <h2 className="text-xl font-bold text-navy mb-10 text-center uppercase tracking-wider">Oskar est fait pour vous si…</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { t: 'Vous lancez votre projet', d: 'Posez des fondations solides avant de scaler.', i: PlayCircle },
            { t: 'Vous pilotez sans visibilité', d: 'Reprenez le contrôle avec des indicateurs actionnables.', i: BarChart3 },
            { t: 'Votre équipe n\'est pas alignée', d: 'Créez un langage commun et des rituels partagés.', i: MessageSquare },
            { t: 'Vos objectifs restent théoriques', d: 'Transformez vos ambitions en résultats mesurables.', i: Zap },
            { t: 'Vous accompagnez des équipes', d: 'Coach, consultant : structurez votre démarche.', i: Users },
            { t: 'Vous voulez aller plus vite', d: 'Des rituels courts et efficaces, pas de réunions interminables.', i: TrendingUp },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-line"
            >
              <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                <item.i className="h-5 w-5 text-teal-dark" />
              </div>
              <div>
                <h4 className="font-bold text-navy text-sm mb-1">{item.t}</h4>
                <p className="text-xs text-muted leading-relaxed">{item.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Appel final : carte claire, halos et parcours aux couleurs des piliers */}
      {/* Même dégradé lavande → vert d'eau que la carte du Bilan, plus haut. */}
      <section
        className="relative mb-12 overflow-hidden rounded-[28px] border border-line shadow-card"
        style={{ background: 'linear-gradient(135deg, #f0f2ff 0%, #ffffff 55%, #e8f8f5 100%)' }}
      >
        {/* Anneaux concentriques discrets derrière le parcours */}
        <svg aria-hidden className="pointer-events-none absolute right-[-120px] top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 lg:block" viewBox="0 0 640 640" fill="none">
          {[120, 190, 260, 318].map((r) => (
            <circle key={r} cx="320" cy="320" r={r} stroke="rgba(30,45,125,0.07)" strokeWidth="1" />
          ))}
        </svg>

        <div className="relative grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[1.15fr_1fr] lg:p-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-light px-3 py-1 text-[11px] font-bold uppercase tracking-[1.5px] text-teal-dark">
              <Sparkles className="h-3.5 w-3.5" /> Par où commencer
            </span>
            <h2 className="mt-5 text-27.5 font-extrabold text-navy lg:text-34.5">
              Prêt à{' '}
              <span className="bg-gradient-to-r from-vision via-okr to-team bg-clip-text text-transparent">transformer</span>{' '}
              votre organisation&nbsp;?
            </h2>
            <p className="mt-4 max-w-md text-15.5 leading-[1.75] text-muted">
              Démarrez par le bilan gratuit — 10 minutes pour savoir où concentrer votre énergie et identifier vos priorités.
            </p>
            <button
              onClick={() => router.push('/diagnostic')}
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-8 py-4 font-bold text-white shadow-lg shadow-navy/20 transition-all hover:-translate-y-0.5 hover:bg-navy-light"
            >
              Démarrer le bilan gratuit
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {['Gratuit', '10 minutes', 'Sans inscription', 'Confidentiel'].map((repere) => (
                <li key={repere} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy">
                  <Check className="h-4 w-4 text-teal-dark" /> {repere}
                </li>
              ))}
            </ul>
          </div>

          <ol className="relative mx-auto w-full max-w-sm" aria-label="Le parcours Oskar en 5 piliers">
            {/* Le fil du parcours, qui passe derrière les pastilles */}
            <span aria-hidden className="absolute bottom-7 left-[28px] top-7 w-0.5 rounded-full bg-gradient-to-b from-vision via-okr to-team opacity-40" />
            {PARCOURS.map((etape, i) => {
              const couleur = COULEURS_PILIERS[etape.id];
              return (
                <motion.li
                  key={etape.id}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="relative mb-3 flex items-center gap-3 rounded-2xl border border-line bg-white/90 p-2.5 pr-4 shadow-card backdrop-blur-sm last:mb-0"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: couleur.light, color: couleur.dark }}
                  >
                    <etape.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-navy">{etape.nom}</span>
                    <span className="block text-[11.5px] text-muted">{etape.verbe}</span>
                  </span>
                  <span className="ml-auto text-[10px] font-bold" style={{ color: couleur.DEFAULT }}>
                    0{i + 1}
                  </span>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>
    </AppShell>
  );
};

export default HomePage;
