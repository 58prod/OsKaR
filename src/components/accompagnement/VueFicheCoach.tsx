import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Carte, PILULE, TON_PILIER } from '@/components/admin/elements';
import { PILIERS_COACH, type PilierCoach } from '@/lib/coachs/candidature';
import {
  LONGUEURS_FICHE,
  ficheDuProfil,
  ficheModifiee,
  problemeFiche,
  siteCliquable,
  type FicheCoach,
} from '@/lib/accompagnement/fiche';
import type { ProfilCoach } from '@/lib/accompagnement/types';
import { Avatar, BOUTON_PRINCIPAL, CHAMP, LIBELLE, NOTE, ReglagesCoach } from './elements';

/*
 * « Ma fiche coach » : à gauche, la structure (nom, SIRET, site, zone) et la
 * fiche d'annuaire (piliers, approche) ; à droite, l'aperçu de la fiche telle
 * que l'annuaire la montrera, les réglages et le lien vers les paramètres du
 * compte (nom, mot de passe). Libellés repris du formulaire de candidature.
 */

interface Props {
  profil: ProfilCoach;
  nom: string;
  onEnregistrer: (f: FicheCoach) => Promise<boolean>;
  onReglages: (r: { disponible?: boolean; resumeQuotidien?: boolean }) => Promise<boolean>;
}

type ChampTexte = Exclude<keyof FicheCoach, 'piliers'>;

export const VueFicheCoach: React.FC<Props> = ({ profil, nom, onEnregistrer, onReglages }) => {
  const depart = useMemo(() => ficheDuProfil(profil), [profil]);
  const [fiche, setFiche] = useState<FicheCoach>(depart);
  const [occupe, setOccupe] = useState(false);
  const [tente, setTente] = useState(false);

  const probleme = problemeFiche(fiche);
  const modifiee = ficheModifiee(fiche, depart);

  const champ = (cle: ChampTexte) => ({
    id: `fiche-${cle}`,
    value: fiche[cle],
    maxLength: LONGUEURS_FICHE[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFiche((f) => ({ ...f, [cle]: e.target.value })),
  });

  const basculerPilier = (id: PilierCoach) =>
    setFiche((f) => ({
      ...f,
      piliers: f.piliers.includes(id) ? f.piliers.filter((p) => p !== id) : [...f.piliers, id],
    }));

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTente(true);
    if (probleme || !modifiee) return;
    setOccupe(true);
    const ok = await onEnregistrer(fiche);
    setOccupe(false);
    if (ok) setTente(false);
  };

  const sousTitre = [fiche.structure.trim(), fiche.zone.trim()].filter(Boolean).join(' · ');

  return (
    <div className="grid gap-[22px] min-[1000px]:grid-cols-[minmax(0,1fr)_360px] items-start">
      <form onSubmit={enregistrer} noValidate className="min-w-0">
        <Carte titre="Votre structure">
          <div className="grid gap-x-4 gap-y-3.5 min-[640px]:grid-cols-2">
            <div>
              <label className={LIBELLE} htmlFor="fiche-structure">
                Structure
              </label>
              <input type="text" placeholder="Cabinet, indépendant…" className={CHAMP} {...champ('structure')} />
            </div>
            <div>
              <label className={LIBELLE} htmlFor="fiche-siret">
                SIRET <span className="font-normal text-muted">(facultatif)</span>
              </label>
              <input type="text" inputMode="numeric" placeholder="14 chiffres" className={CHAMP} {...champ('siret')} />
            </div>
            <div>
              <label className={LIBELLE} htmlFor="fiche-site">
                Site web ou LinkedIn
              </label>
              <input type="url" placeholder="https://" className={CHAMP} {...champ('site')} />
            </div>
            <div>
              <label className={LIBELLE} htmlFor="fiche-zone">
                Ville / zone d&rsquo;intervention
              </label>
              <input type="text" placeholder="Lyon · AURA · Distanciel" className={CHAMP} {...champ('zone')} />
            </div>
          </div>
        </Carte>

        <Carte titre="Votre fiche dans l’annuaire">
          <fieldset className="mb-5">
            <legend className={LIBELLE}>Piliers sur lesquels vous accompagnez</legend>
            <div className="flex flex-wrap gap-2 mt-1">
              {PILIERS_COACH.map((p) => {
                const actif = fiche.piliers.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => basculerPilier(p.id)}
                    className={`text-14 font-semibold leading-[normal] px-3.5 py-2 rounded-[22px] border-[1.5px] transition-colors ${
                      actif ? `${TON_PILIER[p.id]} border-transparent` : 'bg-white border-line text-muted hover:border-navy hover:text-navy'
                    }`}
                  >
                    {p.libelle}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className={LIBELLE} htmlFor="fiche-approche">
            Votre approche en quelques lignes
          </label>
          <textarea
            rows={7}
            placeholder="Vos secteurs, vos formats d’intervention, un exemple d’accompagnement récent…"
            className={`${CHAMP} leading-[1.6] resize-y`}
            {...champ('approche')}
          />
          <div className="flex justify-between gap-3 mt-1.5">
            <p className={NOTE}>Ce texte apparaîtra sur votre fiche dans l&rsquo;annuaire.</p>
            <span className="text-12.5 text-muted whitespace-nowrap">
              {fiche.approche.length} / {LONGUEURS_FICHE.approche}
            </span>
          </div>
        </Carte>

        <div className="flex items-center gap-3 flex-wrap">
          <button type="submit" className={BOUTON_PRINCIPAL} disabled={occupe || !modifiee}>
            {occupe && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Enregistrer
          </button>
          {tente && probleme ? (
            <p role="alert" className="text-14 font-semibold text-coral-dark">
              {probleme}
            </p>
          ) : modifiee ? (
            <p className="text-14 text-muted">Modifications non enregistrées.</p>
          ) : null}
        </div>
      </form>

      <aside className="min-w-0 grid gap-3.5">
        <Carte titre="Aperçu de votre fiche" compacte>
          <div className="flex gap-3 items-start">
            <Avatar nom={nom} />
            <div className="min-w-0">
              <div className="text-16 font-extrabold text-navy leading-[1.3] break-words">{nom}</div>
              <div className="text-13.5 text-muted">{sousTitre || 'Structure et zone à renseigner'}</div>
            </div>
          </div>
          {fiche.piliers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {PILIERS_COACH.filter((p) => fiche.piliers.includes(p.id)).map((p) => (
                <span key={p.id} className={`${PILULE} ${TON_PILIER[p.id]}`}>
                  {p.libelle}
                </span>
              ))}
            </div>
          )}
          <p className="text-13.5 leading-[1.6] text-ink mt-3 whitespace-pre-wrap line-clamp-6">
            {fiche.approche.trim() || <span className="text-muted">Votre approche apparaîtra ici.</span>}
          </p>
          {fiche.site.trim() && !/\s/.test(fiche.site.trim()) && (
            <a
              href={siteCliquable(fiche.site)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2.5 text-13.5 font-semibold text-navy hover:text-teal-dark break-all"
            >
              {fiche.site.trim().replace(/^https?:\/\//i, '')}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </a>
          )}
          <div className="mt-3">
            <span className={`${PILULE} ${profil.disponible ? 'bg-fit-light text-fit-dark' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
              {profil.disponible ? 'Prend de nouveaux accompagnements' : 'Complet pour le moment'}
            </span>
          </div>
          <p className={`${NOTE} mt-3.5 pt-3 border-t border-line`}>
            L&rsquo;annuaire ouvrira avec les premiers coachs référencés : votre fiche y apparaîtra ainsi.
          </p>
        </Carte>

        <ReglagesCoach profil={profil} onReglages={onReglages} titre="Disponibilité et résumé" />

        <Carte titre="Votre compte" compacte>
          <p className="text-14 leading-[1.6] text-ink mb-3">
            Votre nom, votre adresse et votre mot de passe se gèrent dans les paramètres du compte.
          </p>
          <Link href="/settings" className="text-14.5 font-bold text-navy hover:text-teal-dark">
            Paramètres du compte →
          </Link>
        </Carte>
      </aside>
    </div>
  );
};

export default VueFicheCoach;
