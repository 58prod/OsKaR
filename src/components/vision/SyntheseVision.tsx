import React from 'react';
import { useRouter } from 'next/router';
import { Target, Users, AlertCircle, Compass, Heart, ArrowRight } from 'lucide-react';
import { BTN_OUTLINE, BTN_PRIMARY } from '@/components/okr/okrFlux';
import { visionAffichee, type AtelierVision } from '@/lib/vision/types';

/*
 * Écran final : « Votre cap à 1 an ».
 * Reprend tout ce qui a été saisi, dans l'ordre de la maquette, sous une forme
 * que l'on peut relire, partager ou afficher.
 */

const Bloc: React.FC<{ titre: string; icone: React.ReactNode; children: React.ReactNode }> = ({
  titre,
  icone,
  children,
}) => (
  <section className="bg-white border border-line rounded-card shadow-card p-5 mb-4">
    <div className="flex items-center gap-2 text-13 font-bold text-navy mb-3">
      {icone}
      {titre}
    </div>
    {children}
  </section>
);

const Ligne: React.FC<{ label: string; valeur: string }> = ({ label, valeur }) =>
  valeur.trim() ? (
    <div className="flex flex-wrap gap-2 py-1.5 border-b border-line last:border-0">
      <span className="text-13 text-muted min-w-[150px]">{label}</span>
      <span className="text-14 text-ink flex-1">{valeur}</span>
    </div>
  ) : null;

export const SyntheseVision: React.FC<{ atelier: AtelierVision }> = ({ atelier }) => {
  const router = useRouter();
  const vision = visionAffichee(atelier);
  const valeurs = atelier.valeurs.filter((v) => v.nom.trim());
  const objectifs = atelier.objectifs.filter((o) => o.intitule.trim());
  const projection = atelier.projection;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[24px] leading-[1.25] font-extrabold text-navy">Votre cap à 1 an</h1>
        <p className="text-14.5 text-muted mt-1.5 max-w-2xl leading-[1.6]">
          À partager avec votre équipe, à afficher dans votre bureau, à utiliser comme boussole.
        </p>
      </header>

      {vision ? (
        <div className="relative overflow-hidden rounded-[18px] px-8 py-7 mb-4 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
          <div
            className="absolute -right-10 -top-10 w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.16)_0%,transparent_70%)]"
            aria-hidden
          />
          <div className="relative">
            <div className="text-11.5 font-bold tracking-[1.6px] uppercase text-vision mb-2">Votre vision</div>
            <p className="text-white text-[18px] leading-[1.6]">{vision}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-card shadow-card p-6 mb-4">
          <p className="text-14.5 text-muted">
            Votre vision apparaîtra ici une fois l’étape « Le sens » remplie.
          </p>
        </div>
      )}

      {(atelier.pourquoi || atelier.comment || atelier.quoi) && (
        <Bloc titre="Les fondations" icone={<Compass className="h-3.5 w-3.5 text-vision-dark" aria-hidden />}>
          <Ligne label="Pourquoi nous existons" valeur={atelier.pourquoi} />
          <Ligne label="Comment nous agissons" valeur={atelier.comment} />
          <Ligne label="Ce que nous faisons" valeur={atelier.quoi} />
        </Bloc>
      )}

      {atelier.probleme.trim() && (
        <Bloc titre="Le problème que nous résolvons" icone={<AlertCircle className="h-3.5 w-3.5 text-vision-dark" aria-hidden />}>
          <p className="text-14 text-ink leading-[1.6]">{atelier.probleme}</p>
        </Bloc>
      )}

      {(atelier.cibles.length > 0 || atelier.acteurs.length > 0) && (
        <Bloc titre="Cibles et acteurs" icone={<Users className="h-3.5 w-3.5 text-vision-dark" aria-hidden />}>
          {atelier.cibles.filter((c) => c.nom.trim()).length > 0 && (
            <>
              <div className="text-12.5 font-bold text-muted uppercase tracking-wider mb-1.5">Cibles</div>
              <ul className="mb-3">
                {atelier.cibles
                  .filter((c) => c.nom.trim())
                  .map((c) => (
                    <li key={c.id} className="text-14 text-ink py-1">
                      {c.nom}
                      {c.type && <span className="text-13 text-muted"> · {c.type}</span>}
                      {c.priorite && <span className="text-13 text-vision-dark font-bold"> · {c.priorite}</span>}
                    </li>
                  ))}
              </ul>
            </>
          )}
          {atelier.acteurs.filter((a) => a.nom.trim()).length > 0 && (
            <>
              <div className="text-12.5 font-bold text-muted uppercase tracking-wider mb-1.5">Acteurs</div>
              <ul>
                {atelier.acteurs
                  .filter((a) => a.nom.trim())
                  .map((a) => (
                    <li key={a.id} className="text-14 text-ink py-1">
                      {a.nom}
                      {a.role && <span className="text-13 text-muted"> · {a.role}</span>}
                      {a.pouvoir && <span className="text-13 text-muted"> · pouvoir {a.pouvoir.toLowerCase()}</span>}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </Bloc>
      )}

      {Object.values(projection).some((v) => v.trim()) && (
        <Bloc titre="Dans 12 mois" icone={<Target className="h-3.5 w-3.5 text-vision-dark" aria-hidden />}>
          <Ligne label="Chiffre d’affaires" valeur={projection.ca} />
          <Ligne label="Clients" valeur={projection.clients} />
          <Ligne label="Offre" valeur={projection.offre} />
          <Ligne label="Organisation" valeur={projection.organisation} />
          <Ligne label="Rythme de travail" valeur={projection.rythme} />
          <Ligne label="Énergie et santé" valeur={projection.energie} />
          <Ligne label="Vie personnelle" valeur={projection.viePerso} />
          <Ligne label="Limites" valeur={projection.limites} />
        </Bloc>
      )}

      {valeurs.length > 0 && (
        <Bloc titre="Nos valeurs" icone={<Heart className="h-3.5 w-3.5 text-vision-dark" aria-hidden />}>
          <ul className="space-y-2">
            {valeurs.map((v, i) => (
              <li key={i}>
                <div className="text-14 font-semibold text-navy">{v.nom}</div>
                {v.traduction.trim() && <div className="text-13.5 text-muted">{v.traduction}</div>}
              </li>
            ))}
          </ul>
        </Bloc>
      )}

      {objectifs.length > 0 && (
        <Bloc titre="Nos objectifs" icone={<Target className="h-3.5 w-3.5 text-vision-dark" aria-hidden />}>
          <ul className="space-y-3">
            {objectifs.map((o, i) => (
              <li key={i} className="rounded-lg bg-surface p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-14 font-semibold text-navy">{o.intitule}</span>
                  <span className="text-11 font-bold px-2 py-0.5 rounded-full bg-vision-light text-vision-dark shrink-0">
                    {o.type === 'Business' ? 'Entreprise' : 'Personnel'}
                  </span>
                </div>
                {o.pourquoi.trim() && <p className="text-13 text-muted leading-[1.5]">{o.pourquoi}</p>}
                {o.mesure.trim() && (
                  <p className="text-13 text-ink mt-1">
                    <span className="text-muted">Mesure : </span>
                    {o.mesure}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Bloc>
      )}

      {/* Le pont vers le pilier OKR : ces objectifs deviennent ceux de l'année. */}
      <div className="bg-white border border-line rounded-card shadow-card p-5">
        <h2 className="text-15.5 font-bold text-navy mb-1.5">Et maintenant ?</h2>
        <p className="text-14 text-muted mb-4 leading-[1.6]">
          Votre vision fixe le cap. Le pilier OKR la transforme en objectifs suivis trimestre après
          trimestre.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={() => router.push('/app/okr')} className={BTN_PRIMARY}>
            Passer à mes OKR
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => window.print()} className={BTN_OUTLINE}>
            Imprimer ma synthèse
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyntheseVision;
