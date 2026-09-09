import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sun, Users, ArrowRight, Crosshair, Settings, Heart, Lightbulb, type LucideIcon } from 'lucide-react';
import { useCreateAmbition, useUpdateAmbition } from '@/hooks/useAmbitions';
import { useToast } from '@/hooks/useToast';
import { AmbitionCategory, type Ambition } from '@/types';
import { ANNEE, BTN_PRIMARY, MAX_OBJECTIFS, ORDINAUX, formatNombre, nombreDepuisSaisie } from './okrFlux';

/*
 * Étape 1 — « Vos 3 objectifs pour l'année » (vue-annee de okr.html).
 *
 * Chaque objectif annuel est une Ambition ; la « cible chiffrée » de la maquette
 * (valeur + unité) va dans ses colonnes target_value / unit, déjà présentes en base.
 * Pas de bouton « Enregistrer » sur la maquette : on sauvegarde en quittant un champ,
 * et le bouton de fin d'étape attend les sauvegardes en cours avant de passer à la suite.
 *
 * Valeurs relevées :
 *   bannière   dégradé navy, rayon 18px, padding 36/40 ; eyebrow 11.5/700 teal ;
 *              titre 24/800 blanc ; sous-titre 14.5 blanc 60 %, 480px max
 *   carte      blanche, bord 1.5px, rayon 12px, padding 22/20/18 ; remplie : bord OKR + liseré haut 3px
 *   numéro     11/800 majuscules gris + pastille 22px OKR clair
 *   intitulé   textarea 15/600 navy, 56px min
 *   cible      18/800 navy centré ; unité 13.5/500 gris ; fonds #fafbff
 *   chips      12.5/500, bord 1.5px, rayon 999px, fond #fafbff
 */

interface Saisie {
  title: string;
  target: string;
  unit: string;
}

const VIDE: Saisie = { title: '', target: '', unit: '' };

const PLACEHOLDERS = [
  'Ex : Devenir leader sur mon marché régional…',
  'Ex : Créer une équipe autonome et performante…',
  'Ex : Lancer un nouveau produit rentable…',
];

interface Inspiration {
  slot: number;
  icone: LucideIcon;
  libelle: string;
  title: string;
  target: string;
  unit: string;
}

const INSPIRATIONS: Inspiration[] = [
  { slot: 0, icone: Sun, libelle: 'Doubler le CA', title: "Doubler mon chiffre d'affaires", target: '2', unit: 'M€ de CA' },
  { slot: 1, icone: Users, libelle: "Structurer l'équipe", title: "Recruter et structurer l'équipe", target: '5', unit: 'collaborateurs' },
  { slot: 2, icone: ArrowRight, libelle: 'Lancer un produit', title: 'Lancer un nouveau produit sur le marché', target: '3', unit: 'nouveaux clients' },
  { slot: 0, icone: Crosshair, libelle: 'Devenir la référence', title: 'Devenir la référence locale de mon secteur', target: '50', unit: '% de notoriété' },
  { slot: 1, icone: Settings, libelle: 'Automatiser', title: 'Automatiser la production pour gagner du temps', target: '10', unit: 'h/semaine gagnées' },
  { slot: 2, icone: Heart, libelle: 'Fidéliser les clients', title: 'Fidéliser 90% de mes clients actuels', target: '90', unit: '% de rétention' },
];

function depuisAmbition(a: Ambition | undefined): Saisie {
  if (!a) return VIDE;
  return {
    title: a.title,
    target: a.target === null || a.target === undefined ? '' : formatNombre(a.target),
    unit: a.unit ?? '',
  };
}

interface EtapeObjectifsProps {
  userId: string;
  /** Ambitions de l'année, triées, trois au plus. */
  ambitions: Ambition[];
  libelleSuivant: string;
  onSuivant: () => void;
}

export const EtapeObjectifs: React.FC<EtapeObjectifsProps> = ({ userId, ambitions, libelleSuivant, onSuivant }) => {
  const toast = useToast();
  const creer = useCreateAmbition();
  const modifier = useUpdateAmbition();

  const [saisies, setSaisies] = useState<Saisie[]>(() =>
    Array.from({ length: MAX_OBJECTIFS }, (_, i) => depuisAmbition(ambitions[i]))
  );
  const saisiesRef = useRef(saisies);
  saisiesRef.current = saisies;

  /** Champs modifiés depuis la dernière sauvegarde, par position. */
  const modifieRef = useRef<boolean[]>(Array(MAX_OBJECTIFS).fill(false));
  /** Identifiants créés dans cette session, tant que la liste n'a pas été rechargée. */
  const idsCreesRef = useRef<(string | undefined)[]>(Array(MAX_OBJECTIFS).fill(undefined));
  /** Sauvegarde en cours par position, pour ne jamais créer deux fois le même objectif. */
  const enCoursRef = useRef<(Promise<void> | null)[]>(Array(MAX_OBJECTIFS).fill(null));
  const [enTransition, setEnTransition] = useState(false);

  // Les ambitions arrivent en différé (React Query) : on remplit les cartes non touchées.
  useEffect(() => {
    setSaisies((prev) => prev.map((s, i) => (modifieRef.current[i] ? s : depuisAmbition(ambitions[i]))));
  }, [ambitions]);

  const changer = (i: number, patch: Partial<Saisie>) => {
    modifieRef.current[i] = true;
    setSaisies((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const sauver = useCallback(
    (i: number): Promise<void> => {
      const precedent = enCoursRef.current[i];
      const travail = (async () => {
        if (precedent) await precedent.catch(() => undefined);
        if (!modifieRef.current[i]) return;

        const s = saisiesRef.current[i];
        const title = s.title.trim();
        if (!title) return; // pas d'objectif sans intitulé
        const target = nombreDepuisSaisie(s.target);
        const unit = s.unit.trim() || null;

        const existante = ambitions[i];
        const id = existante?.id ?? idsCreesRef.current[i];
        modifieRef.current[i] = false;
        try {
          if (id) {
            const inchangee =
              existante &&
              existante.title === title &&
              (existante.target ?? null) === target &&
              (existante.unit ?? null) === unit;
            if (!inchangee) {
              await modifier.mutateAsync({ id, updates: { title, target, unit }, userId });
            }
          } else {
            const creee = await creer.mutateAsync({
              ambition: { title, target, unit, year: ANNEE, category: AmbitionCategory.GROWTH, orderIndex: i },
              userId,
            });
            idsCreesRef.current[i] = creee.id;
          }
        } catch (err) {
          modifieRef.current[i] = true;
          console.error('Sauvegarde de l’objectif annuel impossible :', err);
          toast.error("L'objectif n'a pas pu être enregistré. Réessayez.");
        }
      })();
      enCoursRef.current[i] = travail;
      return travail;
    },
    [ambitions, creer, modifier, toast, userId]
  );

  const suivant = async () => {
    setEnTransition(true);
    try {
      await Promise.all(Array.from({ length: MAX_OBJECTIFS }, (_, i) => sauver(i)));
    } finally {
      setEnTransition(false);
    }
    onSuivant();
  };

  const remplir = (insp: Inspiration) => {
    changer(insp.slot, { title: insp.title, target: insp.target, unit: insp.unit });
    // La valeur vient d'être posée dans l'état : on sauvegarde au prochain tick.
    setTimeout(() => sauver(insp.slot), 0);
  };

  const nbRemplis = useMemo(() => saisies.filter((s) => s.title.trim()).length, [saisies]);

  return (
    <div>
      {/* Bannière */}
      <div className="relative overflow-hidden rounded-[18px] px-10 py-9 mb-7 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
        <div
          className="absolute -right-10 -top-10 w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(0,212,180,0.13)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative">
          <div className="text-11.5 font-bold tracking-[1.6px] uppercase text-teal mb-2">
            Étape 1 · Objectifs stratégiques {ANNEE}
          </div>
          <h1 className="text-[24px] leading-[1.25] font-extrabold text-white mb-2">Vos 3 objectifs pour l&rsquo;année</h1>
          <p className="text-14.5 leading-[1.6] text-white/60 max-w-[480px]">
            Dans 12 mois, qu&rsquo;est-ce qui aura <strong className="text-teal font-bold">vraiment changé</strong> dans votre
            entreprise&nbsp;? Soyez ambitieux et concis.
          </p>
        </div>
      </div>

      {/* Inspiration */}
      <div className="bg-white border border-line rounded-card px-[22px] py-5 mb-6 shadow-card">
        <div className="flex items-center gap-[7px] text-13 font-bold text-navy mb-3">
          <Lightbulb className="w-[15px] h-[15px] text-okr" aria-hidden />
          Besoin d&rsquo;inspiration&nbsp;? Cliquez pour remplir un champ
        </div>
        <div className="flex flex-wrap gap-2">
          {INSPIRATIONS.map((insp) => (
            <button
              key={insp.libelle}
              type="button"
              onClick={() => remplir(insp)}
              className="inline-flex items-center gap-1.5 px-[13px] py-[7px] rounded-full border-[1.5px] border-line bg-[#fafbff] text-12.5 font-medium text-muted hover:border-okr hover:text-okr-dark hover:bg-okr-light transition-all select-none"
            >
              <insp.icone className="w-[13px] h-[13px] shrink-0" aria-hidden />
              {insp.libelle}
            </button>
          ))}
        </div>
      </div>

      {/* Les trois cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {saisies.map((s, i) => {
          const rempli = s.title.trim().length > 0;
          return (
            <div
              key={i}
              className={`relative bg-white border-[1.5px] rounded-card px-5 pt-[22px] pb-[18px] shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${
                rempli ? 'border-okr border-t-[3px]' : 'border-line'
              }`}
            >
              <div className="flex items-center gap-[7px] text-11 font-extrabold tracking-[1.4px] uppercase text-muted mb-3">
                <span className="w-[22px] h-[22px] rounded-md bg-okr-light text-okr-dark flex items-center justify-center text-12 font-extrabold">
                  {i + 1}
                </span>
                {ORDINAUX[i]} objectif
              </div>
              <textarea
                value={s.title}
                onChange={(e) => changer(i, { title: e.target.value })}
                onBlur={() => sauver(i)}
                placeholder={PLACEHOLDERS[i]}
                rows={2}
                aria-label={`${ORDINAUX[i]} objectif`}
                className="w-full border-none outline-none bg-transparent resize-none text-15 font-semibold text-navy leading-[1.45] min-h-[56px] mb-3.5 placeholder:text-[#bcc3d8] placeholder:font-normal"
              />
              <div className="text-11.5 font-bold text-muted uppercase tracking-[0.8px] mb-1.5">Cible chiffrée</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={s.target}
                  onChange={(e) => changer(i, { target: e.target.value })}
                  onBlur={() => sauver(i)}
                  placeholder={['Ex : 500', 'Ex : 200', 'Ex : 3'][i]}
                  aria-label="Valeur cible"
                  className="w-full border-[1.5px] border-line rounded-lg px-3 py-2.5 text-[18px] font-extrabold text-navy text-center outline-none bg-[#fafbff] transition-colors focus:border-okr focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] placeholder:text-[#c4cae8] placeholder:font-normal placeholder:text-14"
                />
                <input
                  type="text"
                  value={s.unit}
                  onChange={(e) => changer(i, { unit: e.target.value })}
                  onBlur={() => sauver(i)}
                  placeholder="unité"
                  aria-label="Unité de la cible"
                  className="w-full border-[1.5px] border-line rounded-lg px-3 py-2.5 text-13.5 font-medium text-muted outline-none bg-[#fafbff] transition-colors focus:border-okr focus:bg-white placeholder:text-[#c4cae8]"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-4">
        {nbRemplis === 0 && (
          <span className="text-13 text-muted">Remplissez au moins un objectif pour préparer votre trimestre.</span>
        )}
        <button type="button" onClick={suivant} disabled={enTransition} className={BTN_PRIMARY}>
          {enTransition ? 'Enregistrement…' : `${libelleSuivant} →`}
        </button>
      </div>
    </div>
  );
};

export default EtapeObjectifs;
