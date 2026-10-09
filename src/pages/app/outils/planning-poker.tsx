import React, { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useConfirmerDepart } from '@/hooks/useConfirmerDepart';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { PokerToolbar } from '@/components/toolbox/poker/PokerToolbar';
import { PokerBoard } from '@/components/toolbox/poker/PokerBoard';
import { PokerResults } from '@/components/toolbox/poker/PokerResults';
import { PokerReactions } from '@/components/toolbox/poker/PokerReactions';
import { PokerDessin } from '@/components/toolbox/poker/PokerDessin';
import { usePokerSession } from '@/components/toolbox/poker/usePokerSession';

const PlanningPokerPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('planning-poker');

  const { state, participants, isFacilitator, toggleFacilitator, remainingSec, results, myId, actions } =
    usePokerSession(code, identity);

  // Quitter (bouton, retour arrière, onglet fermé) retire la personne et son
  // vote : voir `leaveOp` dans usePokerSession.
  const router = useRouter();
  const autoriserDepart = useConfirmerDepart(
    !!identity,
    'Quitter le Planning Poker ? Vous n’apparaîtrez plus parmi les participants et votre vote sera retiré.',
  );
  const quitter = useCallback(() => {
    autoriserDepart();
    void router.push('/app/outils');
  }, [autoriserDepart, router]);

  return (
    <ToolPageShell
      title="Planning Poker"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
      onLeave={quitter}
      leaveLabel="Vous n’apparaîtrez plus parmi les participants et votre vote sera retiré. Vous pourrez revenir avec le lien d’invitation."
    >
      <PokerToolbar
        story={state.story}
        chrono={state.chrono}
        remainingSec={remainingSec}
        isFacilitator={isFacilitator}
        revealed={state.revealed}
        voteCount={Object.keys(state.votes).length}
        totalCount={participants.length}
        suiteKey={state.suiteKey}
        onStoryChange={actions.setStory}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onSuiteChange={actions.setSuite}
        onApplyCustom={actions.applyCustom}
        onReveal={actions.reveal}
        onReset={actions.reset}
      />

      <div className="flex flex-1 overflow-hidden">
        <div id="poker-board-area" className="flex flex-1 overflow-hidden">
          <PokerBoard state={state} participants={participants} myId={myId} onVote={actions.vote} />
        </div>

        <aside
          className="relative flex w-[320px] shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-line bg-surface p-5"
          aria-label="Résultats et réactions"
        >
          <PokerResults results={results} revealed={state.revealed} />
          <PokerReactions onReact={actions.react} />
          <PokerDessin onSend={actions.reactDrawing} />
        </aside>
      </div>
    </ToolPageShell>
  );
};

export default PlanningPokerPage;
