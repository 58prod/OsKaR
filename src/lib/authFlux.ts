/*
 * Parcours d'authentification : où l'on atterrit après connexion, comment on
 * mémorise la page demandée, et les messages en français pour les erreurs
 * Supabase (qui arrivent en anglais).
 */

/** Destination par défaut après connexion ou inscription : le pilier OKR. */
export const APRES_CONNEXION = '/app/okr';

/**
 * Ne garde qu'une destination interne : un chemin relatif, jamais une URL
 * externe (« //evil.com ») ni une page d'authentification (boucle).
 */
export function destinationSure(valeur: unknown): string | null {
  if (typeof valeur !== 'string') return null;
  if (!valeur.startsWith('/') || valeur.startsWith('//') || valeur.startsWith('/auth/')) return null;
  return valeur;
}

/** URL de la page de connexion, en mémorisant la page que l'utilisateur voulait voir. */
export function urlConnexion(depuis?: string, erreur?: string): string {
  const params = new URLSearchParams();
  const destination = destinationSure(depuis);
  if (destination && destination !== '/') params.set('redirect', destination);
  if (erreur) params.set('error', erreur);
  const q = params.toString();
  return q ? `/auth/login?${q}` : '/auth/login';
}

/* ── Messages ── */

export function messageConnexion(msg: string | undefined): string {
  const m = msg ?? '';
  if (m.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect. Veuillez réessayer.';
  if (m.includes('Email not confirmed')) return "Votre email n'a pas encore été confirmé. Vérifiez votre boîte mail.";
  if (m.includes('Too many requests') || m.includes('rate limit')) return 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) return 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
  return 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
}

export function messageInscription(msg: string | undefined): string {
  const m = msg ?? '';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Cet email est déjà utilisé. Essayez de vous connecter.';
  if (m.includes('Invalid email') || m.includes('Unable to validate email')) return "L'adresse email n'est pas valide.";
  if (m.includes('Password should be at least') || m.includes('Signup requires a valid password')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('Signups not allowed')) return "Les inscriptions sont fermées pour le moment.";
  if (m.includes('rate limit') || m.includes('Too many requests')) return 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) return 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
  return "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
}

export function messageReinitialisation(msg: string | undefined): string {
  const m = msg ?? '';
  if (m.includes('For security purposes') || m.includes('rate limit')) return 'Un email vient déjà d’être envoyé. Patientez une minute avant de redemander.';
  if (m.includes('Unable to validate email') || m.includes('Invalid email')) return "L'adresse email n'est pas valide.";
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) return 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
  return "Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer.";
}

export function messageNouveauMotDePasse(msg: string | undefined): string {
  const m = msg ?? '';
  if (m.includes('Auth session missing') || m.includes('session_not_found')) return 'Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.';
  if (m.includes('should be different')) return 'Le nouveau mot de passe doit être différent de l’ancien.';
  if (m.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) return 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
  return 'Une erreur est survenue lors de la mise à jour du mot de passe. Veuillez réessayer.';
}

/** Domaine des comptes de démonstration : « oskar » se connecte comme « oskar@demo.oskar ». */
export const DOMAINE_DEMO = 'demo.oskar';

/**
 * Le champ de connexion accepte une adresse email ou un simple identifiant de
 * démonstration (« oskar ») : sans « @ », on complète avec le domaine de démo.
 */
export function identifiantVersEmail(saisie: string): string {
  const v = saisie.trim();
  return v.includes('@') ? v : `${v.toLowerCase()}@${DOMAINE_DEMO}`;
}

/** Une adresse email valide, ou un identifiant simple (lettres, chiffres, . _ -). */
export function identifiantValide(saisie: string): boolean {
  const v = saisie.trim();
  return v.includes('@') ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : /^[a-z0-9._-]+$/i.test(v);
}
