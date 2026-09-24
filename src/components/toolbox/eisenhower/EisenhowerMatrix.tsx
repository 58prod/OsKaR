import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, CalendarDays, Layers, UserRound } from 'lucide-react';
import {
  EISENHOWER_ACCENT, QUADRANTS, TICKET_POS_MAX, dateFr, getQuadrant, quadrantAt,
  type EisenhowerState, type EisenhowerTicket, type GroupeTickets, type QuadrantKey,
} from './eisenhowerLogic';

interface EisenhowerMatrixProps {
  state: EisenhowerState;
  groupes: GroupeTickets[];
  myId: string;
  showInstructions: boolean;
  highlightMine: boolean;
  /** Ticket en attente d'un groupe d'accueil (« Regrouper avec… »), ou null. */
  regroupant: string | null;
  texteDe: (t: EisenhowerTicket) => string;
  onMove: (id: string, q: QuadrantKey, pos: { x: number; y: number }) => void;
  onMerge: (id: string, into: string) => void;
  onOpen: (id: string) => void;
  onCancelMerge: () => void;
}

interface Drag {
  id: string;
  pointerId: number;
  /** Écart entre le pointeur et le coin du ticket, en fraction de la matrice. */
  dx: number;
  dy: number;
  x: number;
  y: number;
  moved: boolean;
  /** Ticket (tête de groupe) survolé : le lâcher dessus regroupe. */
  cible: string | null;
}

const LABEL_POS: Record<string, string> = {
  tl: 'left-3 top-3', tr: 'right-3 top-3 items-end text-right', bl: 'left-3 bottom-3', br: 'right-3 bottom-3 items-end text-right',
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const aujourdhui = () => new Date().toISOString().slice(0, 10);

/**
 * La matrice partagée : urgent à gauche, important en haut. Les tickets se
 * déplacent à la souris comme au doigt ; lâché sur un autre ticket, un
 * ticket s'y regroupe. Un clic ouvre le ticket (texte, porteur, échéance).
 */
export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  state, groupes, myId, showInstructions, highlightMine, regroupant, texteDe, onMove, onMerge, onOpen, onCancelMerge,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const enAttente = regroupant ? groupes.find((g) => g.tete.id === regroupant || g.membres.some((m) => m.id === regroupant)) : null;

  const fraction = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
  };

  /** Tête de groupe sous le pointeur, autre que le ticket déplacé. */
  const cibleSous = (e: React.PointerEvent, id: string): string | null => {
    if (typeof document === 'undefined' || !document.elementsFromPoint) return null;
    for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
      const tid = (el as HTMLElement).closest?.('[data-ticket]')?.getAttribute('data-ticket');
      if (tid && tid !== id) return tid;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent, g: GroupeTickets) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button') || !ref.current) return;
    if (regroupant) return;
    const { fx, fy } = fraction(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      id: g.tete.id, pointerId: e.pointerId, dx: fx - g.placement.x, dy: fy - g.placement.y,
      x: g.placement.x, y: g.placement.y, moved: false, cible: null,
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId || !ref.current) return;
    const { fx, fy } = fraction(e);
    const x = clamp(fx - drag.dx, 0, TICKET_POS_MAX.x);
    const y = clamp(fy - drag.dy, 0, TICKET_POS_MAX.y);
    const moved = drag.moved || Math.abs(x - drag.x) > 0.004 || Math.abs(y - drag.y) > 0.004;
    setDrag({ ...drag, x, y, moved, cible: moved ? cibleSous(e, drag.id) : null });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.moved) onOpen(drag.id);
    else if (drag.cible) onMerge(drag.id, drag.cible);
    else {
      // Le quadrant est celui où se trouve le pointeur au moment du lâcher.
      const { fx, fy } = fraction(e);
      onMove(drag.id, quadrantAt(clamp(fx, 0, 1), clamp(fy, 0, 1)), { x: drag.x, y: drag.y });
    }
    setDrag(null);
  };

  const onKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (regroupant) onMerge(regroupant, id);
    else onOpen(id);
  };

  const survol = drag?.moved && !drag.cible ? quadrantAt(drag.x + drag.dx, drag.y + drag.dy) : null;
  const echu = aujourdhui();

  return (
    <div className="relative flex-1 overflow-auto bg-surface p-4">
      {enAttente && (
        // Par-dessus la matrice, sans la décaler : le clic suivant tombe là où l'on vise.
        <div className="absolute inset-x-4 top-2 z-40 mx-auto flex max-w-[1100px] flex-wrap items-center gap-2 rounded-xl border-2 bg-white px-4 py-2 text-sm text-navy shadow-lg" style={{ borderColor: EISENHOWER_ACCENT }} role="status">
          <Layers className="h-4 w-4 shrink-0" style={{ color: EISENHOWER_ACCENT }} aria-hidden />
          <span>
            Cliquez sur le ticket qui accueillera <strong>« {texteDe(enAttente.tete)} »</strong>
            {enAttente.membres.length > 0 && <> et ses {enAttente.membres.length} ticket{enAttente.membres.length > 1 ? 's' : ''} regroupé{enAttente.membres.length > 1 ? 's' : ''}</>}.
          </span>
          <button type="button" onClick={onCancelMerge} className="ml-auto rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface">
            Annuler (Échap)
          </button>
        </div>
      )}

      <div className="mx-auto grid max-w-[1100px] grid-cols-[28px_1fr] grid-rows-[28px_auto] gap-1.5">
        <span />
        <div className="grid grid-cols-2 text-xs font-bold uppercase tracking-wide text-muted">
          <span className="inline-flex items-center justify-center gap-1"><ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Urgent</span>
          <span className="text-center">Pas urgent</span>
        </div>
        <div className="grid grid-rows-2 text-xs font-bold uppercase tracking-wide text-muted">
          <span className="flex flex-col items-center justify-center gap-1">
            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
            <span className="rotate-180 [writing-mode:vertical-rl]">Important</span>
          </span>
          <span className="flex rotate-180 items-center justify-center [writing-mode:vertical-rl]">Pas important</span>
        </div>

        <div ref={ref} className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line bg-white shadow-card">
          {QUADRANTS.map((z) => (
            <div
              key={z.key}
              aria-label={`${z.rang}. ${z.verbe} — ${z.criteres}`}
              className="absolute transition-colors"
              style={{
                left: `${z.left}%`, top: `${z.top}%`, width: '50%', height: '50%',
                background: survol === z.key ? `${z.color}24` : `${z.color}0d`,
                borderRight: z.left === 0 ? '2px solid #e2e8f0' : undefined,
                borderBottom: z.top === 0 ? '2px solid #e2e8f0' : undefined,
              }}
            >
              <span className={`pointer-events-none absolute flex flex-col ${LABEL_POS[z.labelCorner]}`}>
                <span className="text-sm font-extrabold" style={{ color: z.color }}>{z.rang}. {z.verbe}</span>
                <span className="text-[11px] font-semibold text-muted">{z.criteres}</span>
                {showInstructions && (
                  <span className="mt-1 max-w-[230px] rounded-lg bg-white/80 px-2 py-1 text-[11px] font-normal leading-snug text-navy">
                    {z.desc}
                  </span>
                )}
              </span>
            </div>
          ))}

          {groupes.length === 0 && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted">
              Écrivez vos tickets dans « Mon espace », puis placez-les : ils apparaîtront ici.
            </p>
          )}

          {groupes.map((g) => {
            const z = getQuadrant(g.placement.q);
            const dragging = drag?.id === g.tete.id;
            const pos = dragging ? { x: drag.x, y: drag.y } : g.placement;
            const tous = [g.tete, ...g.membres];
            const miens = tous.some((t) => t.authorId === myId);
            const auteur = g.tete.authorId === myId ? 'Votre ticket' : state.anonymous ? 'Anonyme' : g.tete.authorName;
            const porteur = state.porteurs[g.tete.id]?.text;
            const echeance = state.echeances[g.tete.id]?.text;
            const estCible = drag?.cible === g.tete.id || (!!regroupant && enAttente !== g);
            const enRetard = !!echeance && echeance < echu && z.key !== 'abandonner';
            return (
              <div
                key={g.tete.id}
                data-ticket={g.tete.id}
                role="button"
                tabIndex={0}
                aria-label={`${texteDe(g.tete)} — ${z.verbe}${g.membres.length ? `, ${g.membres.length} ticket(s) regroupé(s)` : ''}`}
                onPointerDown={(e) => onPointerDown(e, g)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setDrag(null)}
                onClick={() => { if (regroupant && enAttente !== g) onMerge(regroupant, g.tete.id); }}
                onKeyDown={(e) => onKeyDown(e, g.tete.id)}
                className={`absolute w-[150px] select-none rounded-lg border-l-4 bg-white p-2 text-left transition-[box-shadow,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                  dragging ? 'z-30 cursor-grabbing shadow-xl' : regroupant ? 'cursor-pointer shadow-md' : 'cursor-grab shadow-md hover:shadow-lg'
                } ${highlightMine && !miens ? 'opacity-40' : ''}`}
                style={{
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  borderLeftColor: z.color,
                  touchAction: 'none',
                  // Une pile de tickets se voit comme une pile.
                  boxShadow: g.membres.length
                    ? `3px 3px 0 -1px #fff, 3px 3px 0 0 #cbd5e1${g.membres.length > 1 ? ', 6px 6px 0 -1px #fff, 6px 6px 0 0 #cbd5e1' : ''}, 0 4px 8px -2px rgb(15 23 42 / 0.15)`
                    : undefined,
                  outline: estCible ? `2px dashed ${EISENHOWER_ACCENT}` : undefined,
                  outlineOffset: 2,
                  zIndex: dragging ? 30 : undefined,
                }}
              >
                <p className="flex items-center gap-1 text-[10px] font-bold" style={{ color: state.anonymous && g.tete.authorId !== myId ? '#94a3b8' : g.tete.authorColor }}>
                  {!(state.anonymous && g.tete.authorId !== myId) && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: g.tete.authorColor }} aria-hidden />}
                  <span className="truncate">{auteur}</span>
                  {g.membres.length > 0 && (
                    <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[10px] font-bold text-white" style={{ background: EISENHOWER_ACCENT }} title="Tickets regroupés">
                      <Layers className="h-2.5 w-2.5" aria-hidden /> {tous.length}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 line-clamp-4 break-words text-xs leading-snug text-navy">{texteDe(g.tete)}</p>
                {(porteur || echeance) && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-muted">
                    {porteur && <span className="inline-flex items-center gap-0.5"><UserRound className="h-3 w-3" aria-hidden /> {porteur}</span>}
                    {echeance && (
                      <span className={`inline-flex items-center gap-0.5 ${enRetard ? 'text-danger-600' : ''}`}>
                        <CalendarDays className="h-3 w-3" aria-hidden /> {dateFr(echeance).slice(0, 5)}
                      </span>
                    )}
                  </p>
                )}
                {drag?.cible === g.tete.id && (
                  <span className="absolute -top-2.5 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: EISENHOWER_ACCENT }}>
                    Regrouper ici
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-[1100px] pl-[34px] text-xs text-muted">
        Glissez un ticket pour le déplacer : plus il est haut, plus il est important ; plus il est à gauche, plus il est urgent.
        Lâchez-le sur un autre ticket pour les regrouper. Cliquez pour lui donner un porteur et une échéance.
      </p>
    </div>
  );
};

export default EisenhowerMatrix;
