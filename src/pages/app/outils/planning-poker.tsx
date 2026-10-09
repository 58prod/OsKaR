import React, { useCallback, useState } from 'react';
import { Lock, Users } from 'lucide-react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { PokerToolbar } from '@/components/toolbox/poker/PokerToolbar';
import { PokerBoard } from '@/components/toolbox/poker/PokerBoard';
import { PokerResults } from '@/components/toolbox/poker/PokerResults';
import { PokerReactions } from '@/components/toolbox/poker/PokerReactions';
import { PokerDessin } from '@/components/toolbox/poker/PokerDessin';
import { PokerListeTickets } from '@/components/toolbox/poker/PokerListeTickets';
import { DEPART_AVEC_VOTE } from '@/components/toolbox/shared/departs';
import { usePokerSession } from '@/components/toolbox/poker/usePokerSession';

const PlanningPokerPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('planning-poker');

  const { state, participants, isHost, isFacilitator, toggleFacilitator, remainingSec, results, myId, myEmoji, voirReactions, actions } =
    usePokerSession(code, identity);

  // Choix fait à la création : envoyé dès l'entrée (mis en attente jusqu'à
  // la connexion, comme tout geste fait avant).
  const [animateurSeul, setAnimateurSeul] = useState(false);
  const rejoindre = useCallback((name: string) => {
    handleJoin(name);
    if (isCreating && animateurSeul) actions.setAnimateurSeul(true);
  }, [handleJoin, isCreating, animateurSeul, actions]);

  return (
    <ToolPageShell
      title="Planning Poker"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={rejoindre}
      creationOption={<ChoixAnimation value={animateurSeul} onChange={setAnimateurSeul} />}
      facilitatorLock={{ exclusive: state.animateurSeul, canChange: isHost, onChange: actions.setAnimateurSeul }}
      onShare={handleShare}
      leaveLabel={DEPART_AVEC_VOTE}
    >
      <PokerToolbar
        story={state.story}
        storyUrl={state.storyUrl}
        chrono={state.chrono}
        remainingSec={remainingSec}
        isFacilitator={isFacilitator}
        revealed={state.revealed}
        voteCount={Object.keys(state.votes).length}
        ticketsEstimes={state.tickets.filter((t) => t.estimation !== null).length}
        ticketsTotal={state.tickets.length}
        suiteKey={state.suiteKey}
        onStoryChange={actions.setStory}
        onStoryUrlChange={actions.setStoryUrl}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onSuiteChange={actions.setSuite}
        onApplyCustom={actions.applyCustom}
        onReveal={actions.reveal}
        onReset={actions.reset}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Liste des tickets : toujours pour l'animateur, pour les autres dès qu'elle existe. */}
        {(isFacilitator || state.tickets.length > 0) && (
          <PokerListeTickets
            tickets={state.tickets}
            ticketCourant={state.ticketCourant}
            isFacilitator={isFacilitator}
            onAdd={actions.ajouterTicket}
            onEdit={actions.modifierTicket}
            onMove={actions.deplacerTicket}
            onDelete={actions.supprimerTicket}
            onEstimate={actions.estimerTicket}
            onEstimateNext={actions.estimerSuivant}
            onCorrectEstimation={actions.corrigerEstimation}
          />
        )}
        <div id="poker-board-area" className="flex flex-1 overflow-hidden">
          <PokerBoard
            state={state}
            participants={participants}
            myId={myId}
            myEmoji={myEmoji}
            onVote={actions.vote}
            onChooseEmoji={actions.chooseEmoji}
          />
        </div>

        <aside
          className="relative flex w-[320px] shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-line bg-surface p-5"
          aria-label="Résultats et réactions"
        >
          <PokerResults results={results} revealed={state.revealed} />
          <PokerReactions
            onReact={actions.react}
            voirReactions={voirReactions}
            onToggleVoirReactions={actions.toggleVoirReactions}
          />
          <PokerDessin onSend={actions.reactDrawing} />
        </aside>
      </div>
    </ToolPageShell>
  );
};

/** À la création : garder l'animation pour soi, ou laisser chacun la prendre. */
const ChoixAnimation: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => {
  const options = [
    { seul: false, Icon: Users, titre: 'Tout le monde', detail: 'Chacun peut activer le mode animateur.' },
    { seul: true, Icon: Lock, titre: 'Moi uniquement', detail: 'Personne d’autre ne peut révéler, réinitialiser ni changer le ticket.' },
  ];
  return (
    <fieldset className="mt-4">
      <legend className="block text-sm font-semibold text-navy">Qui peut animer ?</legend>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {options.map(({ seul, Icon, titre, detail }) => (
          <label
            key={titre}
            className={[
              'flex cursor-pointer flex-col gap-1 rounded-lg border-[1.5px] p-3 text-left transition-colors focus-within:ring-2 focus-within:ring-teal',
              value === seul ? 'border-teal bg-teal/5' : 'border-line hover:bg-surface',
            ].join(' ')}
          >
            <input
              type="radio"
              name="poker-animation"
              checked={value === seul}
              onChange={() => onChange(seul)}
              className="sr-only"
            />
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-navy">
              <Icon className="h-4 w-4" aria-hidden /> {titre}
            </span>
            <span className="text-xs leading-snug text-muted">{detail}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export default PlanningPokerPage;
