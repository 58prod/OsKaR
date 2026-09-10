import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Building2, LogOut, User as UserIcon, Target, CheckCircle2, ArrowRight } from 'lucide-react';
import Head from 'next/head';
import { CompanyProfileForm } from '@/components/ui/CompanyProfileForm';
import { ChoixSecteur } from '@/components/ui/ChoixSecteur';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppShell } from '@/components/layout/AppShell';
import { AmbitionForm, AmbitionFormData } from '@/components/forms/AmbitionForm';
import { useCreateAmbition } from '@/hooks/useAmbitions';
import { useAppStore } from '@/store/useAppStore';
import { urlConnexion } from '@/lib/authFlux';
import { AuthService } from '@/services/auth';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { Status } from '@/types';
import type { CompanyProfile } from '@/types';

type OnboardingStep = 'secteur' | 'profile' | 'welcome' | 'ambition';

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, authReady, profileReady, updateCompanyProfile, setUser, logout } = useAppStore();
  const createAmbition = useCreateAmbition();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<OnboardingStep>('secteur');
  const [secteur, setSecteur] = useState('');
  const initialised = useRef(false);

  // Module ciblé par l'onboarding (seul OKR est actif pour l'instant)
  const moduleId = typeof router.query.module === 'string' ? router.query.module : 'okr';

  // Résolution auth/profil + détermination de l'étape de départ
  useEffect(() => {
    if (!authReady) return;

    if (!isAuthenticated) {
      router.replace(urlConnexion(router.asPath));
      return;
    }

    if (!profileReady || !user) return;

    // Profil entreprise rempli ET onboarding du module déjà fait -> espace
    if (user.companyProfile && user.settings?.onboarding?.[moduleId]) {
      router.push('/app/okr');
      return;
    }

    // Détermine l'étape initiale une seule fois (sans repositionner ensuite)
    if (!initialised.current) {
      initialised.current = true;
      const secteurConnu = user.companyProfile?.industry;
      if (secteurConnu) setSecteur(secteurConnu);
      setStep(secteurConnu ? 'welcome' : 'secteur');
    }
  }, [authReady, isAuthenticated, profileReady, user, router, moduleId]);

  if (!authReady || (isAuthenticated && (!user || !profileReady))) {
    return (
      <>
        <Head><title>Bienvenue dans Oskar</title></Head>
        <div className="min-h-screen bg-surface flex items-center justify-center px-4 font-sans">
          <div className="text-center" role="status">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4"></div>
            <p className="text-muted">Préparation de votre espace...</p>
          </div>
        </div>
      </>
    );
  }

  /**
   * Enregistre le domaine d'activité seul. Le reste du profil d'entreprise
   * n'est plus exigé pour entrer : il se complète plus tard, dans son écran.
   */
  const handleSecteurSubmit = async () => {
    if (!secteur) return;
    setIsSaving(true);
    setError(null);
    const profil = { ...(user?.companyProfile ?? {}), industry: secteur } as CompanyProfile;
    try {
      if (isSupabaseConfigured() && user?.id) {
        const updated = await AuthService.updateCompanyProfile(user.id, profil);
        setUser(AuthService.profileToUser(updated));
      } else {
        updateCompanyProfile(profil);
      }
      setStep('welcome');
    } catch (err: any) {
      setError(`Erreur : ${err?.message ?? 'le secteur n’a pas pu être enregistré.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompanyProfileSubmit = async (companyProfile: CompanyProfile) => {
    setIsSaving(true);
    setError(null);

    try {
      // Sauvegarder dans Supabase si configuré
      if (isSupabaseConfigured() && user?.id) {
        console.log('💾 Sauvegarde du profil d\'entreprise dans Supabase...');
        console.log('📊 Données à sauvegarder:', companyProfile);
        console.log('👤 User ID:', user.id);

        const updatedProfile = await AuthService.updateCompanyProfile(user.id, companyProfile);

        console.log('✅ Profil mis à jour:', updatedProfile);

        // Mettre à jour l'utilisateur avec le profil complet
        const updatedUser = AuthService.profileToUser(updatedProfile);
        setUser(updatedUser);

        console.log('✅ Profil d\'entreprise sauvegardé dans Supabase');
      } else {
        // Fallback localStorage si Supabase non configuré
        console.log('💾 Sauvegarde du profil d\'entreprise dans localStorage...');
        console.log('⚠️ User ID:', user?.id);
        console.log('⚠️ Supabase configuré:', isSupabaseConfigured());
        updateCompanyProfile(companyProfile);
      }

      // Profil enregistré : on poursuit l'onboarding du module (pas de redirection directe)
      setStep('welcome');
    } catch (err: any) {
      console.error('❌ Erreur lors de la sauvegarde du profil:', err);
      console.error('❌ Message d\'erreur:', err.message);
      console.error('❌ Détails:', err);
      setError(`Erreur: ${err.message || 'Une erreur est survenue lors de la sauvegarde.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Marque l'onboarding du module comme terminé en base (settings) puis rejoint l'espace
  const completeOnboarding = async () => {
    if (!user) {
      router.push('/app/okr');
      return;
    }
    const newSettings = {
      ...(user.settings ?? {}),
      onboarding: { ...(user.settings?.onboarding ?? {}), [moduleId]: true },
    };
    try {
      if (isSupabaseConfigured() && user.id) {
        await AuthService.updateProfile(user.id, { settings: newSettings });
      }
    } catch (err: any) {
      console.error('❌ Erreur enregistrement onboarding:', err?.message ?? err);
    }
    setUser({ ...user, settings: newSettings });
    router.push('/app/okr');
  };

  const handleAmbitionSubmit = async (data: AmbitionFormData) => {
    setIsSaving(true);
    setError(null);
    try {
      if (isSupabaseConfigured() && user?.id) {
        await createAmbition.mutateAsync({
          ambition: { ...data, status: Status.ACTIVE },
          userId: user.id,
        });
      }
      await completeOnboarding();
    } catch (err: any) {
      console.error('❌ Erreur création de la première ambition:', err);
      setError(`Erreur: ${err.message || 'Impossible de créer votre première ambition.'}`);
      setIsSaving(false);
    }
  };

  const handleSkipAmbition = async () => {
    setIsSaving(true);
    await completeOnboarding();
  };

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured()) await AuthService.signOut();
    } finally {
      logout();
      router.push('/');
    }
  };

  const topbarActions = (
    <>
      <span className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-semibold text-navy">
        <span className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center">
          <UserIcon className="h-4 w-4" aria-hidden />
        </span>
        <span className="max-w-[140px] truncate">{user?.name ?? 'Mon compte'}</span>
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Déconnexion
      </button>
    </>
  );

  const footerItem = {
    href: '/auth/login',
    label: 'Déconnexion',
    icon: LogOut,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      handleLogout();
    },
  };

  const stepOrder: OnboardingStep[] = ['secteur', 'welcome', 'ambition'];
  const stepMeta = [
    { id: 'secteur', label: 'Votre activité' },
    { id: 'welcome', label: 'Bienvenue OKR' },
    { id: 'ambition', label: 'Première ambition' },
  ];
  const currentIndex = stepOrder.indexOf(step);

  return (
    <AppShell
      title="Bienvenue sur OSKAR"
      description="Quelques étapes pour préparer votre espace OKR."
      topbarTitle="Bienvenue sur OSKAR"
      topbarSubtitle="Configuration de votre espace"
      topbarActions={topbarActions}
      sections={[]}
      footerItem={footerItem}
    >
      {/* Indicateur d'étapes */}
      <ol className="flex flex-wrap items-center gap-3 mb-8" aria-label="Progression de l'onboarding">
        {stepMeta.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={s.id} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done ? 'bg-teal text-navy' : active ? 'bg-navy text-white' : 'bg-line text-muted'
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <span className={`text-sm font-medium ${active ? 'text-navy' : 'text-muted'}`}>{s.label}</span>
              {i < stepMeta.length - 1 && <span className="hidden sm:block w-8 h-px bg-line" aria-hidden />}
            </li>
          );
        })}
      </ol>

      {/* Étape 1 : le domaine d'activité, seul et rapide. Tout le reste attend. */}
      {step === 'secteur' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-navy rounded-2xl p-3.5 shrink-0">
              <Building2 className="h-8 w-8 text-teal" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-navy">Quel est votre domaine d&rsquo;activité&nbsp;?</h1>
              <p className="text-muted mt-1">
                Une seule question, pour adapter les conseils à votre métier.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-card border border-line shadow-card p-6">
            <label htmlFor="onboarding-secteur" className="block text-sm font-semibold text-ink mb-2">
              Votre secteur
            </label>
            <ChoixSecteur id="onboarding-secteur" value={secteur} onChange={setSecteur} />

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                type="button"
                onClick={handleSecteurSubmit}
                disabled={!secteur || isSaving}
                className="inline-flex items-center gap-2 px-5 py-3 bg-teal text-navy-dark text-sm font-bold rounded-lg hover:bg-teal-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Enregistrement…' : 'Continuer →'}
              </button>
              <button
                type="button"
                onClick={() => setStep('welcome')}
                disabled={isSaving}
                className="text-sm font-medium text-muted underline hover:text-navy transition-colors disabled:opacity-50"
              >
                Plus tard
              </button>
            </div>
            <p className="text-xs text-muted mt-4">
              Vous pourrez le changer à tout moment dans votre profil d&rsquo;entreprise.
            </p>
          </div>
        </motion.div>
      )}

      {/* Profil d'entreprise complet — facultatif, atteignable depuis son écran */}
      {step === 'profile' && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-4">
              <div className="bg-navy rounded-2xl p-3.5 shrink-0">
                <Building2 className="h-8 w-8 text-teal" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-navy">Configurons votre espace</h1>
                <p className="text-muted mt-1 max-w-2xl">
                  Ce profil d'entreprise est utilisé par les{' '}
                  <strong className="text-navy">5 piliers</strong> d'Oskar pour personnaliser vos
                  recommandations. Il est facultatif et se complète quand vous voulez.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CompanyProfileForm
              onSubmit={handleCompanyProfileSubmit}
              isLoading={isSaving}
              error={error}
            />
          </motion.div>
        </>
      )}

      {/* Étape 2 : bienvenue dans le module OKR */}
      {step === 'welcome' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-teal/10 rounded-2xl p-3.5 shrink-0">
              <Target className="h-8 w-8 text-teal-dark" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-navy">Bienvenue dans le module OKR</h1>
              <p className="text-muted mt-1">
                Définissez vos ambitions annuelles, déclinez-les en objectifs trimestriels et suivez
                vos résultats clés.
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="py-6 space-y-3">
              <p className="text-navy font-semibold">Comment ça marche :</p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-dark mt-0.5 shrink-0" aria-hidden />
                  Une <strong className="text-navy">ambition</strong> définit votre cap pour l'année.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-dark mt-0.5 shrink-0" aria-hidden />
                  Des <strong className="text-navy">objectifs</strong> trimestriels la rendent concrète.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-dark mt-0.5 shrink-0" aria-hidden />
                  Des <strong className="text-navy">résultats clés</strong> mesurent votre progression.
                </li>
              </ul>
            </CardContent>
          </Card>
          <div className="mt-6">
            <Button
              variant="primary"
              className="bg-navy text-white hover:bg-navy/90 focus-visible:ring-teal"
              onClick={() => setStep('ambition')}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Créer ma première ambition
            </Button>
          </div>
        </motion.div>
      )}

      {/* Étape 3 : première ambition (persistée en base) */}
      {step === 'ambition' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-navy mb-2">Votre première ambition</h1>
          <p className="text-muted mb-4">
            Donnez un cap à votre année. Vous pourrez la modifier ou en ajouter d'autres à tout moment.
          </p>
          {error && (
            <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>
          )}
          <button
            type="button"
            onClick={handleSkipAmbition}
            disabled={isSaving}
            className="text-sm font-medium text-muted underline hover:text-navy transition-colors disabled:opacity-50"
          >
            Passer cette étape pour l'instant
          </button>
          <AmbitionForm onSubmit={handleAmbitionSubmit} onCancel={handleSkipAmbition} />
        </motion.div>
      )}
    </AppShell>
  );
};

export default OnboardingPage;
