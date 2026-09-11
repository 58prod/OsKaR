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
  Shield,
  Zap,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { ouvrirConnexion } from '@/store/useConnexion';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAppStore } from '@/store/useAppStore';

const RADAR_DATA = [
  { subject: 'Vision', A: 70 },
  { subject: 'Market Fit', A: 45 },
  { subject: 'Finance', A: 55 },
  { subject: 'OKR', A: 38 },
  { subject: 'Team', A: 71 },
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
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-xl font-bold text-navy uppercase tracking-wider">Bilan & diagnostic Oskar</h2>
          <button onClick={() => router.push('/diagnostic')} className="text-sm font-bold text-teal-dark hover:underline">
            Voir un exemple →
          </button>
        </div>
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
                  5 piliers · 15 critères
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
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                    <PolarGrid stroke="#e2e4f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#1e2d7d', fontSize: 11, fontWeight: 600 }} />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#1e2d7d"
                      fill="#00d4b4"
                      fillOpacity={0.2}
                      dot={{ r: 4, fill: '#00d4b4', stroke: '#1e2d7d' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Grid Section */}
      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-xl font-bold text-navy uppercase tracking-wider">Les 5 piliers Oskar</h2>
          <button className="text-sm font-bold text-teal-dark hover:underline">Accéder aux modules →</button>
        </div>
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

      {/* Final CTA */}
      <section className="bg-navy rounded-[32px] p-10 lg:p-16 text-center text-white shadow-card mb-12">
        <Shield className="h-12 w-12 text-teal mx-auto mb-6 opacity-80" />
        <h2 className="text-3xl font-extrabold mb-4">Prêt à transformer votre organisation ?</h2>
        <p className="text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
          Démarrez par le bilan gratuit — 10 minutes pour savoir où concentrer votre énergie et identifier vos priorités.
        </p>
        <button
          onClick={() => router.push('/diagnostic')}
          className="px-10 py-5 bg-teal text-navy-dark font-black rounded-xl shadow-lg hover:bg-teal-dark hover:-translate-y-1 transition-all text-sm uppercase tracking-wider"
        >
          Démarrer le bilan gratuit →
        </button>
      </section>
    </AppShell>
  );
};

export default HomePage;
