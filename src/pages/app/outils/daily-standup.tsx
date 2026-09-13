import React from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { DailyToolbar } from '@/components/toolbox/daily/DailyToolbar';
import { DailySidebar } from '@/components/toolbox/daily/DailySidebar';
import { DailyStage } from '@/components/toolbox/daily/DailyStage';
import { useDailySession } from '@/components/toolbox/daily/useDailySession';

const DailyStandupPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('daily-standup');

  const {
    state, participants, people, isFacilitator, toggleFacilitator, remainingSec, totalSec, currentId, nextId, myId, actions,
  } = useDailySession(code, identity);

  const currentName = currentId ? people.get(currentId)?.name ?? '' : '';
  const nextName = nextId ? people.get(nextId)?.name ?? '' : '';

  return (
    <ToolPageShell
      title="Daily standup"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <DailyToolbar
        state={state}
        totalSec={totalSec}
        participantsCount={participants.length}
        isFacilitator={isFacilitator}
        onDurationChange={actions.setDuration}
        onRandomOrderChange={actions.setRandomOrder}
        onStop={actions.stop}
      />

      <div className="flex flex-1 overflow-hidden">
        <DailySidebar state={state} participants={participants} people={people} myId={myId} />
        <DailyStage
          state={state}
          currentName={currentName}
          nextName={nextName}
          isSelf={currentId === myId}
          isNextSelf={nextId === myId}
          remainingSec={remainingSec}
          totalSec={totalSec}
          isFacilitator={isFacilitator}
          canStart={participants.length > 0}
          onStart={actions.start}
          onPauseResume={actions.pauseResume}
          onNext={actions.next}
          onGo={actions.go}
          onSkip={actions.skip}
          onStop={actions.stop}
        />
      </div>
    </ToolPageShell>
  );
};

export default DailyStandupPage;
