import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { AuthService } from '@/services/auth';
import { APRES_CONNEXION, messageConnexion, messageInscription } from '@/lib/authFlux';

export type AuthModalTab = 'login' | 'register';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: AuthModalTab;
  /** Redirection après login/register réussi (défaut : le pilier OKR) */
  redirectTo?: string;
}

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});
type LoginForm = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  company: z.string().min(1, 'Organisation requise'),
  password: z.string().min(6, 'Au moins 6 caractères'),
});
type RegisterForm = z.infer<typeof registerSchema>;

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, initialTab = 'register', redirectTo = APRES_CONNEXION }) => {
  const router = useRouter();
  const [tab, setTab] = useState<AuthModalTab>(initialTab);
  const [error, setError] = useState<string | null>(null);
  /** Message non bloquant (ex. confirmation d'email à faire). */
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setError(null);
      setInfo(null);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const handleLogin = useCallback(async (data: LoginForm) => {
    setLoading(true); setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (authError) {
      setError(messageConnexion(authError.message));
      setLoading(false); return;
    }
    onClose();
    router.push(redirectTo);
  }, [onClose, redirectTo, router]);

  const handleRegister = useCallback(async (data: RegisterForm) => {
    setLoading(true); setError(null);
    try {
      const result = await AuthService.signUp({ email: data.email, password: data.password, name: `${data.firstName} ${data.lastName}`.trim(), company: data.company });
      if (!result.session) {
        // Confirmation par email exigée : on reste sur la modale avec la consigne.
        setInfo('Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.');
        setTab('login');
        return;
      }
      onClose();
      router.push(redirectTo);
    } catch (err: any) {
      setError(messageInscription(err?.message));
    } finally {
      setLoading(false);
    }
  }, [onClose, redirectTo, router]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(15,20,60,0.55)] backdrop-blur-[4px] animate-fade-in"
    >
      <div className="bg-white rounded-2xl w-[420px] max-w-[95vw] shadow-auth-modal overflow-hidden animate-slide-up">
        <div className="relative bg-gradient-to-br from-navy-dark to-navy px-7 pt-7 pb-5 text-center">
          <Image src="/images/oskar/logo-oskar.png" alt="OsKaR" width={120} height={28} className="h-7 w-auto mx-auto mb-3.5 brightness-0 invert" />
          <h2 id="auth-modal-title" className="text-xl font-extrabold text-white mb-1">
            {tab === 'login' ? 'Bon retour !' : 'Rejoignez OsKaR'}
          </h2>
          <p className="text-[13px] text-white/60">
            {tab === 'login' ? 'Connectez-vous à votre espace OsKaR' : 'Créez votre compte gratuit pour accéder à la plateforme'}
          </p>
          <button ref={closeBtnRef} type="button" onClick={onClose} aria-label="Fermer" className="absolute top-3.5 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div role="tablist" aria-label="Authentification" className="flex border-b border-line">
          {(['register', 'login'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`flex-1 py-3 text-[13.5px] font-semibold transition-colors ${tab === t ? 'text-navy border-b-2 border-teal' : 'text-muted border-b-2 border-transparent hover:text-navy'}`}>
              {t === 'register' ? 'Inscription' : 'Connexion'}
            </button>
          ))}
        </div>

        <div className="p-7">
          {error && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden /> <span>{error}</span>
            </div>
          )}
          {info && (
            <div role="status" className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              {info}
            </div>
          )}
          {tab === 'login' ? (
            <LoginPanel form={loginForm} onSubmit={handleLogin} loading={loading} onSwitch={() => setTab('register')} />
          ) : (
            <RegisterPanel form={registerForm} onSubmit={handleRegister} loading={loading} onSwitch={() => setTab('login')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

/* ───────────── Sous-composants formulaires ───────────── */

const inputCls =
  'w-full px-3.5 py-2.5 border border-line rounded-lg text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20';
const labelCls = 'block text-[12.5px] font-semibold text-navy mb-1.5';
const errorCls = 'mt-1 text-xs text-red-600';
const submitCls =
  'w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-teal text-navy-dark text-sm font-semibold hover:bg-teal-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

interface LoginPanelProps {
  form: ReturnType<typeof useForm<LoginForm>>;
  onSubmit: (data: LoginForm) => void;
  loading: boolean;
  onSwitch: () => void;
}

const LoginPanel: React.FC<LoginPanelProps> = ({ form, onSubmit, loading, onSwitch }) => {
  const { register, handleSubmit, formState: { errors } } = form;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="auth-login-email" className={labelCls}>Email</label>
        <input id="auth-login-email" type="email" autoComplete="email" placeholder="vous@entreprise.fr" className={inputCls} {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'auth-login-email-err' : undefined} />
        {errors.email && <p id="auth-login-email-err" className={errorCls}>{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="auth-login-pwd" className={labelCls}>Mot de passe</label>
        <input id="auth-login-pwd" type="password" autoComplete="current-password" placeholder="••••••••" className={inputCls} {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'auth-login-pwd-err' : undefined} />
        {errors.password && <p id="auth-login-pwd-err" className={errorCls}>{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={loading} className={submitCls}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {loading ? 'Connexion…' : 'Se connecter →'}
      </button>
      <p className="text-center text-[11.5px] text-muted">
        Pas encore de compte ?{' '}
        <button type="button" onClick={onSwitch} className="text-teal-dark font-semibold hover:underline">Inscrivez-vous gratuitement</button>
      </p>
    </form>
  );
};

interface RegisterPanelProps {
  form: ReturnType<typeof useForm<RegisterForm>>;
  onSubmit: (data: RegisterForm) => void;
  loading: boolean;
  onSwitch: () => void;
}

const RegisterPanel: React.FC<RegisterPanelProps> = ({ form, onSubmit, loading, onSwitch }) => {
  const { register, handleSubmit, formState: { errors } } = form;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="auth-reg-first" className={labelCls}>Prénom</label>
          <input id="auth-reg-first" autoComplete="given-name" placeholder="Sophie" className={inputCls} {...register('firstName')} aria-invalid={!!errors.firstName} />
          {errors.firstName && <p className={errorCls}>{errors.firstName.message}</p>}
        </div>
        <div>
          <label htmlFor="auth-reg-last" className={labelCls}>Nom</label>
          <input id="auth-reg-last" autoComplete="family-name" placeholder="Martin" className={inputCls} {...register('lastName')} aria-invalid={!!errors.lastName} />
          {errors.lastName && <p className={errorCls}>{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="auth-reg-email" className={labelCls}>Email professionnel</label>
        <input id="auth-reg-email" type="email" autoComplete="email" placeholder="sophie@entreprise.fr" className={inputCls} {...register('email')} aria-invalid={!!errors.email} />
        {errors.email && <p className={errorCls}>{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="auth-reg-company" className={labelCls}>Organisation</label>
        <input id="auth-reg-company" autoComplete="organization" placeholder="Ma Startup / PME / Cabinet…" className={inputCls} {...register('company')} aria-invalid={!!errors.company} />
        {errors.company && <p className={errorCls}>{errors.company.message}</p>}
      </div>
      <div>
        <label htmlFor="auth-reg-pwd" className={labelCls}>Mot de passe</label>
        <input id="auth-reg-pwd" type="password" autoComplete="new-password" placeholder="6 caractères min." className={inputCls} {...register('password')} aria-invalid={!!errors.password} />
        {errors.password && <p className={errorCls}>{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={loading} className={submitCls}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {loading ? 'Création…' : 'Créer mon compte →'}
      </button>
      <p className="text-center text-[11.5px] text-muted">
        Déjà inscrit ?{' '}
        <button type="button" onClick={onSwitch} className="text-teal-dark font-semibold hover:underline">Connectez-vous</button>
      </p>
    </form>
  );
};
