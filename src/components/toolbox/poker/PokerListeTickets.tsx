import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ArrowUp, Check, ExternalLink, GripVertical, ListTodo, Pencil, Play, Plus, RotateCcw, SkipForward, Trash2, X,
} from 'lucide-react';
import { POKER_ACCENT } from './pokerLogic';
import { TICKET_TITRE_MAX, TICKET_URL_MAX, ticketSuivant, type PokerTicket } from './pokerTickets';

interface PokerTicketsProps {
  tickets: PokerTicket[];
  ticketCourant: string | null;
  isFacilitator: boolean;
  onAdd: (titre: string, url: string) => void;
  onEdit: (id: string, titre: string, url: string) => void;
  onMove: (id: string, sens: -1 | 1) => void;
  /** Glisser-déposer : place le ticket à `position` parmi les autres (0 = en tête). */
  onPlace: (id: string, position: number) => void;
  onDelete: (id: string) => void;
  onEstimate: (id: string) => void;
  onEstimateNext: () => void;
  onCorrectEstimation: (id: string, estimation: string | null) => void;
}

const petitBouton = 'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-30';
const champ = 'w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-navy outline-none focus:border-[var(--tool-accent)]';

/**
 * Liste des tickets à estimer : l'animateur la prépare, la modifie et la
 * priorise (glisser-déposer par la poignée, ou flèches au clavier) ; chacun la voit et peut ouvrir les liens. Un ticket
 * estimé est barré avec son estimation, et peut être réestimé.
 */
export const PokerListeTickets: React.FC<PokerTicketsProps> = ({
  tickets, ticketCourant, isFacilitator, onAdd, onEdit, onMove, onPlace, onDelete, onEstimate, onEstimateNext, onCorrectEstimation,
}) => {
  const [titre, setTitre] = useState('');
  const [url, setUrl] = useState('');
  const estimes = tickets.filter((t) => t.estimation !== null).length;
  const suivant = ticketSuivant(tickets, ticketCourant);

  // Glisser-déposer au pointeur (souris et doigt) : le ticket suit le
  // pointeur, un trait montre où il sera posé, la priorité part au lâcher.
  const liste = useRef<HTMLOListElement>(null);
  const lignes = useRef(new Map<string, HTMLLIElement>());
  const [glisse, setGlisse] = useState<{ id: string; depart: number; dy: number; cible: number } | null>(null);
  const indexDe = (id: string) => tickets.findIndex((t) => t.id === id);

  const commencerGlisse = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* rien à capturer */ }
    setGlisse({ id, depart: e.clientY, dy: 0, cible: indexDe(id) });
  };

  const suivreGlisse = (e: React.PointerEvent) => {
    if (!glisse) return;
    // Position parmi les autres tickets : avant le premier dont le milieu est sous le pointeur.
    const autres = tickets.filter((t) => t.id !== glisse.id);
    let cible = autres.length;
    for (let k = 0; k < autres.length; k++) {
      const r = lignes.current.get(autres[k].id)?.getBoundingClientRect();
      if (r && e.clientY < r.top + r.height / 2) { cible = k; break; }
    }
    // Défilement de la liste quand on approche de ses bords.
    const zone = liste.current?.getBoundingClientRect();
    if (zone && liste.current) {
      if (e.clientY < zone.top + 30) liste.current.scrollTop -= 10;
      else if (e.clientY > zone.bottom - 30) liste.current.scrollTop += 10;
    }
    setGlisse({ ...glisse, dy: e.clientY - glisse.depart, cible });
  };

  const finirGlisse = () => {
    if (glisse && glisse.cible !== indexDe(glisse.id)) onPlace(glisse.id, glisse.cible);
    setGlisse(null);
  };

  // Trait d'insertion, affiché seulement si le ticket change de place.
  const trait = <li aria-hidden className="mx-2 my-0.5 h-0.5 rounded-full" style={{ background: POKER_ACCENT }} />;
  const montrerTrait = glisse !== null && glisse.cible !== indexDe(glisse.id);

  const ajouter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    onAdd(titre, url);
    setTitre('');
    setUrl('');
  };

  return (
    <aside
      className="relative flex w-[300px] shrink-0 flex-col border-r border-line bg-white"
      aria-label="Tickets à estimer"
      style={{ '--tool-accent': POKER_ACCENT } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <ListTodo className="h-4 w-4 shrink-0" style={{ color: POKER_ACCENT }} aria-hidden />
        <h2 className="flex-1 text-xs font-bold uppercase tracking-wide text-muted">Tickets</h2>
        <span className="text-sm text-muted" aria-live="polite">
          Estimés : <strong className="text-navy">{estimes}</strong> / {tickets.length}
        </span>
      </div>

      {isFacilitator && tickets.length > 0 && (
        <div className="border-b border-line px-4 py-2">
          <button
            type="button"
            onClick={onEstimateNext}
            disabled={!suivant}
            title={suivant ? `Estimer « ${suivant.titre} »` : 'Tous les tickets sont estimés'}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: POKER_ACCENT }}
          >
            <SkipForward className="h-4 w-4" aria-hidden /> Estimer le ticket suivant
          </button>
        </div>
      )}

      <ol ref={liste} className="flex-1 overflow-y-auto p-2">
        {tickets.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-muted">
            {isFacilitator
              ? 'Préparez ici la liste des tickets à estimer, dans l’ordre de priorité.'
              : 'Aucun ticket préparé pour l’instant.'}
          </li>
        )}
        {tickets.map((t, i) => {
          // Rang du ticket parmi les autres (sans celui qu'on déplace).
          const rang = glisse ? tickets.filter((x) => x.id !== glisse.id).findIndex((x) => x.id === t.id) : -1;
          return (
            <React.Fragment key={t.id}>
              {montrerTrait && rang === glisse!.cible && trait}
              <LigneTicket
                ticket={t}
                refLigne={(el) => { if (el) lignes.current.set(t.id, el); else lignes.current.delete(t.id); }}
                glisse={glisse?.id === t.id ? glisse.dy : null}
                poignee={isFacilitator && tickets.length > 1 ? {
                  onPointerDown: (e) => commencerGlisse(t.id, e),
                  onPointerMove: suivreGlisse,
                  onPointerUp: finirGlisse,
                  onPointerCancel: () => setGlisse(null),
                } : null}
                position={i + 1}
                premier={i === 0}
                dernier={i === tickets.length - 1}
                enCours={t.id === ticketCourant}
                isFacilitator={isFacilitator}
                onEdit={onEdit}
                onMove={onMove}
                onDelete={onDelete}
                onEstimate={onEstimate}
                onCorrectEstimation={onCorrectEstimation}
              />
            </React.Fragment>
          );
        })}
        {montrerTrait && glisse!.cible === tickets.length - 1 && trait}
      </ol>

      {isFacilitator && (
        <form onSubmit={ajouter} className="flex flex-col gap-1.5 border-t border-line p-3">
          <label className="sr-only" htmlFor="poker-ticket-titre">Titre du ticket</label>
          <input
            id="poker-ticket-titre"
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            maxLength={TICKET_TITRE_MAX}
            placeholder="Titre du ticket"
            className={champ}
          />
          <div className="flex gap-1.5">
            <label className="sr-only" htmlFor="poker-ticket-url">Lien du ticket (facultatif)</label>
            <input
              id="poker-ticket-url"
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={TICKET_URL_MAX}
              placeholder="Lien (facultatif)"
              className={champ}
            />
            <button
              type="submit"
              disabled={!titre.trim()}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-navy px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden /> Ajouter
            </button>
          </div>
        </form>
      )}
    </aside>
  );
};

interface Poignee {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
}

interface LigneTicketProps {
  ticket: PokerTicket;
  refLigne: (el: HTMLLIElement | null) => void;
  /** Décalage vertical (px) quand ce ticket est en train d'être glissé, sinon null. */
  glisse: number | null;
  /** Poignée de glisser-déposer (animateur), ou null. */
  poignee: Poignee | null;
  position: number;
  premier: boolean;
  dernier: boolean;
  enCours: boolean;
  isFacilitator: boolean;
  onEdit: PokerTicketsProps['onEdit'];
  onMove: PokerTicketsProps['onMove'];
  onDelete: PokerTicketsProps['onDelete'];
  onEstimate: PokerTicketsProps['onEstimate'];
  onCorrectEstimation: PokerTicketsProps['onCorrectEstimation'];
}

const LigneTicket: React.FC<LigneTicketProps> = ({
  ticket: t, refLigne, glisse, poignee, position, premier, dernier, enCours, isFacilitator, onEdit, onMove, onDelete, onEstimate, onCorrectEstimation,
}) => {
  const [edition, setEdition] = useState(false);
  const [titre, setTitre] = useState(t.titre);
  const [url, setUrl] = useState(t.url);
  const [estimation, setEstimation] = useState(t.estimation ?? '');
  const [confirmeSuppr, setConfirmeSuppr] = useState(false);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const estime = t.estimation !== null;

  useEffect(() => () => { if (minuterie.current) clearTimeout(minuterie.current); }, []);

  const ouvrirEdition = () => {
    setTitre(t.titre);
    setUrl(t.url);
    setEstimation(t.estimation ?? '');
    setEdition(true);
  };

  const enregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    if (titre.trim() !== t.titre || url.trim() !== t.url) onEdit(t.id, titre, url);
    const nouvelle = estimation.trim();
    if (estime && nouvelle && nouvelle !== t.estimation) onCorrectEstimation(t.id, nouvelle);
    setEdition(false);
  };

  // Suppression en deux temps : le premier clic demande confirmation.
  const supprimer = () => {
    if (confirmeSuppr) {
      onDelete(t.id);
      return;
    }
    setConfirmeSuppr(true);
    minuterie.current = setTimeout(() => setConfirmeSuppr(false), 3000);
  };

  if (edition) {
    return (
      <li className="mb-1 rounded-lg border border-line bg-surface p-2">
        <form onSubmit={enregistrer} className="flex flex-col gap-1.5" onKeyDown={(e) => { if (e.key === 'Escape') setEdition(false); }}>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            maxLength={TICKET_TITRE_MAX}
            aria-label="Titre du ticket"
            className={champ}
            autoFocus
          />
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={TICKET_URL_MAX}
            aria-label="Lien du ticket"
            placeholder="Lien (facultatif)"
            className={champ}
          />
          {estime && (
            <label className="flex items-center gap-2 text-xs font-semibold text-muted">
              Estimation
              <input
                type="text"
                value={estimation}
                onChange={(e) => setEstimation(e.target.value)}
                maxLength={20}
                className={`${champ} w-20`}
              />
            </label>
          )}
          <div className="flex justify-end gap-1">
            <button type="button" onClick={() => setEdition(false)} className={petitBouton} title="Annuler">
              <X className="h-4 w-4" aria-hidden /><span className="sr-only">Annuler</span>
            </button>
            <button type="submit" disabled={!titre.trim()} className={petitBouton} title="Enregistrer">
              <Check className="h-4 w-4" aria-hidden /><span className="sr-only">Enregistrer</span>
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      ref={refLigne}
      className={[
        'group mb-1 flex items-start gap-2 rounded-lg border-[1.5px] px-2 py-2',
        glisse !== null ? 'relative z-10 bg-white opacity-90 shadow-card-hover' : 'transition-colors',
        enCours ? 'bg-white' : glisse !== null ? 'border-line' : 'border-transparent hover:bg-surface',
      ].join(' ')}
      style={{
        ...(enCours ? { borderColor: POKER_ACCENT } : {}),
        ...(glisse !== null ? { transform: `translateY(${glisse}px)` } : {}),
      }}
      aria-current={enCours ? 'step' : undefined}
    >
      {poignee ? (
        <span
          {...poignee}
          role="presentation"
          title="Glisser pour changer la priorité"
          className={`-ml-1 mt-0.5 flex shrink-0 touch-none items-center text-muted hover:text-navy ${glisse !== null ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
          <span className="w-4 text-right text-xs font-bold">{position}</span>
        </span>
      ) : (
        <span className="mt-0.5 w-5 shrink-0 text-right text-xs font-bold text-muted">{position}</span>
      )}

      <div className="min-w-0 flex-1">
        {/* Le trait d'un ticket estimé se pose sur le titre lui-même (il ne traverse pas une boîte flex). */}
        <div className={`flex items-start gap-1 text-sm font-semibold ${estime ? 'text-muted' : 'text-navy'}`}>
          {t.url ? (
            <>
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Ouvrir le ticket dans un nouvel onglet : ${t.url}`}
                className={`min-w-0 break-words underline-offset-2 hover:underline ${estime ? 'line-through' : ''}`}
              >
                {t.titre}
              </a>
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Ouvrir le ticket dans un nouvel onglet : ${t.url}`}
                className="mt-0.5 shrink-0 text-muted transition-colors hover:text-navy"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">Ouvrir « {t.titre} » dans un nouvel onglet</span>
              </a>
            </>
          ) : (
            <span className={`min-w-0 break-words ${estime ? 'line-through' : ''}`}>{t.titre}</span>
          )}
        </div>
        {(enCours || estime) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {enCours && <span className="font-bold" style={{ color: POKER_ACCENT }}>En cours</span>}
            {estime && (
              <span className="rounded bg-success-50 px-1.5 py-0.5 font-bold text-success-700">
                Estimé : {t.estimation}
              </span>
            )}
          </div>
        )}
      </div>

      {isFacilitator && (
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <div className="flex">
            {!enCours && (
              <button
                type="button"
                onClick={() => onEstimate(t.id)}
                className={petitBouton}
                title={estime ? 'Réestimer ce ticket' : 'Estimer ce ticket maintenant'}
                style={{ color: POKER_ACCENT }}
              >
                {estime ? <RotateCcw className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                <span className="sr-only">{estime ? 'Réestimer' : 'Estimer'} « {t.titre} »</span>
              </button>
            )}
            <button type="button" onClick={ouvrirEdition} className={petitBouton} title="Modifier">
              <Pencil className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">Modifier « {t.titre} »</span>
            </button>
            <button
              type="button"
              onClick={supprimer}
              className={`${petitBouton} ${confirmeSuppr ? '!text-danger-600 bg-danger-50' : ''}`}
              title={confirmeSuppr ? 'Cliquer à nouveau pour supprimer' : 'Supprimer'}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">{confirmeSuppr ? 'Confirmer la suppression de' : 'Supprimer'} « {t.titre} »</span>
            </button>
          </div>
          <div className="flex">
            <button type="button" onClick={() => onMove(t.id, -1)} disabled={premier} className={petitBouton} title="Monter (plus prioritaire)">
              <ArrowUp className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">Monter « {t.titre} »</span>
            </button>
            <button type="button" onClick={() => onMove(t.id, 1)} disabled={dernier} className={petitBouton} title="Descendre (moins prioritaire)">
              <ArrowDown className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">Descendre « {t.titre} »</span>
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

export default PokerListeTickets;
