import { PILLARS } from './pillars';
import type { DiagnosticState } from './types';

/*
 * Relit, côté serveur, les réponses du Diagnostic envoyées par le navigateur.
 * La route d'envoi du bilan est publique : on ne garde que les champs attendus,
 * bornés, et c'est le serveur qui recalcule l'analyse avec `buildAnalysis`.
 * Rien de ce qui part par email n'est donc écrit par l'expéditeur.
 */
export function etatDiagnosticDuCorps(valeur: unknown): DiagnosticState | null {
  if (!valeur || typeof valeur !== 'object') return null;
  const brut = valeur as Record<string, unknown>;
  const etat = {} as DiagnosticState;

  for (const p of PILLARS) {
    const saisie = brut[p.id];
    if (!saisie || typeof saisie !== 'object') return null;
    const { slider, checks, touched } = saisie as Record<string, unknown>;
    if (typeof slider !== 'number' || !Number.isFinite(slider)) return null;
    if (!Array.isArray(checks) || checks.length !== 3) return null;
    etat[p.id] = {
      slider: Math.max(0, Math.min(10, slider)),
      checks: [checks[0] === true, checks[1] === true, checks[2] === true],
      touched: touched === true,
    };
  }
  return etat;
}
