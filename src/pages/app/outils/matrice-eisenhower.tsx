import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { useExemples } from '@/hooks/useExemples';
import { getRetentionLabel } from '@/constants/toolbox';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { EisenhowerToolbar, type EisenhowerVue } from '@/components/toolbox/eisenhower/EisenhowerToolbar';
import { EisenhowerPrepPanel } from '@/components/toolbox/eisenhower/EisenhowerPrepPanel';
import { EisenhowerMatrix } from '@/components/toolbox/eisenhower/EisenhowerMatrix';
import { EisenhowerPlan } from '@/components/toolbox/eisenhower/EisenhowerPlan';
import { EisenhowerTicketDialog } from '@/components/toolbox/eisenhower/EisenhowerTicketDialog';
import { texteDe as texteDuTicket, type EisenhowerTicket } from '@/components/toolbox/eisenhower/eisenhowerLogic';
import { useEisenhowerSession } from '@/components/toolbox/eisenhower/useEisenhowerSession';

const MatriceEisenhowerPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('matrice-eisenhower');
  const exemples = useExemples().eisenhower;
  const [vue, setVue] = useState<EisenhowerVue>('matrice');
  const [showInstructions, setShowInstructions] = useState(true);
  const [highlightMine, setHighlightMine] = useState(false);
  /** Ticket ouvert (n'importe quel ticket de son groupe). */
  const [openId, setOpenId] = useState<string | null>(null);
  /** Ticket en attente d'un groupe d'accueil. */
  const [regroupant, setRegroupant] = useState<string | null>(null);

  const {
    state, participants, isFacilitator, toggleFacilitator, remainingSec, myId, myTickets, groupes, actions,
  } = useEisenhowerSession(code, identity);

  const me = participants.find((p) => p.id === myId);
  const texteDe = useCallback((t: EisenhowerTicket) => texteDuTicket(state, t), [state]);
  const groupeDe = (id: string | null) => (id ? groupes.find((g) => g.tete.id === id || g.membres.some((m) => m.id === id)) : undefined);
  const ouvert = groupeDe(openId);
  const ticketsCount = groupes.reduce((n, g) => n + 1 + g.membres.length, 0);
  const noms = useMemo(() => [...new Set(participants.map((p) => p.name))].sort(), [participants]);

  // Échap annule un regroupement en cours ; il s'annule aussi si le ticket disparaît.
  useEffect(() => {
    if (!regroupant) return;
    if (!groupes.some((g) => g.tete.id === regroupant || g.membres.some((m) => m.id === regroupant))) { setRegroupant(null); return; }
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setRegroupant(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [regroupant, groupes]);

  const merge = (id: string, into: string) => {
    actions.merge(id, into);
    setRegroupant(null);
  };

  const deleteTicket = (id: string) => {
    // Le ticket ouvert disparaît : la fenêtre suit le ticket qui prend sa place.
    const g = groupeDe(id);
    if (g && g.tete.id === id && openId && g === ouvert) setOpenId(g.membres[0]?.id ?? null);
    actions.deleteTicket(id);
  };

  return (
    <ToolPageShell
      title="Matrice d'Eisenhower"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
      retentionLabel={getRetentionLabel('matrice-eisenhower')}
      codeHint="Gardez le lien : vous retrouverez la matrice et son plan d'action à la prochaine réunion."
    >
      <EisenhowerToolbar
        state={state}
        remainingSec={remainingSec}
        ticketsCount={ticketsCount}
        groupesCount={groupes.length}
        participantsCount={participants.length}
        isFacilitator={isFacilitator}
        vue={vue}
        onVueChange={setVue}
        showInstructions={showInstructions}
        onToggleInstructions={() => setShowInstructions((v) => !v)}
        highlightMine={highlightMine}
        onToggleHighlightMine={() => setHighlightMine((v) => !v)}
        sujetExemple={exemples.sujet}
        onThemeChange={actions.setTheme}
        onAnonymousChange={actions.setAnonymous}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onCopy={actions.copySummary}
        onExport={actions.exportSummary}
        onReset={actions.reset}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Nouvelle séance : le texte en cours de saisie repart à zéro. */}
        <EisenhowerPrepPanel
          key={state.round}
          myName={me?.name ?? identity?.name ?? ''}
          myColor={me?.color ?? identity?.color ?? '#94a3b8'}
          myTickets={myTickets}
          placements={state.placements}
          anonymous={state.anonymous}
          exemples={exemples}
          texteDe={texteDe}
          onAddDraft={actions.addDraft}
          onPublish={actions.publish}
          onDeleteDraft={actions.deleteTicket}
        />

        {vue === 'matrice' ? (
          <EisenhowerMatrix
            state={state}
            groupes={groupes}
            myId={myId}
            showInstructions={showInstructions}
            highlightMine={highlightMine}
            regroupant={regroupant}
            texteDe={texteDe}
            onMove={actions.move}
            onMerge={merge}
            onOpen={setOpenId}
            onCancelMerge={() => setRegroupant(null)}
          />
        ) : (
          <EisenhowerPlan
            state={state}
            groupes={groupes}
            myId={myId}
            texteDe={texteDe}
            onOpen={setOpenId}
            onPorteur={actions.setPorteur}
            onEcheance={actions.setEcheance}
          />
        )}
      </div>

      {ouvert && (
        <EisenhowerTicketDialog
          groupe={ouvert}
          state={state}
          myId={myId}
          isFacilitator={isFacilitator}
          noms={noms}
          texteDe={texteDe}
          onClose={() => setOpenId(null)}
          onEditText={actions.editText}
          onPorteur={actions.setPorteur}
          onEcheance={actions.setEcheance}
          onMoveToQuadrant={actions.moveToQuadrant}
          onDetach={actions.detach}
          onStartMerge={(id) => { setVue('matrice'); setRegroupant(id); }}
          onDelete={deleteTicket}
        />
      )}
    </ToolPageShell>
  );
};

export default MatriceEisenhowerPage;
