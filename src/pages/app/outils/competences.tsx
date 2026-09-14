import React from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { SkillsToolbar } from '@/components/toolbox/skills/SkillsToolbar';
import { SkillsConfigPanel } from '@/components/toolbox/skills/SkillsConfigPanel';
import { SkillsScoringPanel } from '@/components/toolbox/skills/SkillsScoringPanel';
import { SkillsResultsPanel } from '@/components/toolbox/skills/SkillsResultsPanel';
import { useSkillsSession } from '@/components/toolbox/skills/useSkillsSession';
import { isComplete, peopleOf } from '@/components/toolbox/skills/skillsLogic';

const CompetencesPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('competences');

  const {
    state, isFacilitator, toggleFacilitator, remainingSec, me, actions,
  } = useSkillsSession(code, identity);

  const people = peopleOf(state);
  const completeCount = people.filter((p) => isComplete(p, state.skills)).length;

  return (
    <ToolPageShell
      title="Compétences de l'équipe"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <SkillsToolbar
        chrono={state.chrono}
        remainingSec={remainingSec}
        peopleCount={people.length}
        completeCount={completeCount}
        skillCount={state.skills.length}
        isFacilitator={isFacilitator}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onExport={actions.exportSummary}
        onReset={actions.reset}
      />

      <div className="flex flex-1 overflow-hidden">
        <SkillsConfigPanel
          skills={state.skills}
          isFacilitator={isFacilitator}
          onAdd={actions.addSkill}
          onRename={actions.renameSkill}
          onDelete={actions.deleteSkill}
        />

        <SkillsScoringPanel
          me={me}
          skills={state.skills}
          onSetScore={actions.setScore}
        />

        <SkillsResultsPanel state={state} />
      </div>
    </ToolPageShell>
  );
};

export default CompetencesPage;
