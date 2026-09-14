import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { OkrShell } from '@/components/layout/OkrShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { ActionStatus, Priority, type Action } from '@/types';
import { formatRelativeDate } from '@/utils';
import { AlarmClock, CheckCircle2, Flame } from 'lucide-react';
import { showNudge, scheduleNudge, cancelScheduledNudge } from '@/services/nudges';
import { addDays, isToday, isPast, differenceInCalendarDays } from 'date-fns';
import { useActions, useUpdateAction } from '@/hooks/useActions';

function priorityWeight(p: Priority): number {
  return p === Priority.CRITICAL ? 4 : p === Priority.HIGH ? 3 : p === Priority.MEDIUM ? 2 : 1;
}

const priorityLabels: Record<Priority, string> = {
  [Priority.CRITICAL]: 'Critique',
  [Priority.HIGH]: 'Haute',
  [Priority.MEDIUM]: 'Moyenne',
  [Priority.LOW]: 'Basse',
};

const statusLabels: Record<ActionStatus, string> = {
  [ActionStatus.TODO]: 'À faire',
  [ActionStatus.IN_PROGRESS]: 'En cours',
  [ActionStatus.DONE]: 'Terminé',
};

function getDeadlineInfo(deadline?: Date) {
  if (!deadline) return { label: 'Sans échéance', score: 0, isOverdue: false };
  const d = new Date(deadline);
  if (isPast(d) && !isToday(d)) {
    const days = differenceInCalendarDays(new Date(), d);
    return { label: `En retard de ${days} j`, score: 3, isOverdue: true };
  }
  if (isToday(d)) return { label: `Échéance aujourd'hui`, score: 2, isOverdue: false };
  const days = differenceInCalendarDays(d, new Date());
  const score = days <= 3 ? 2 : days <= 7 ? 1 : 0;
  return { label: `Échéance ${formatRelativeDate(deadline)}`, score, isOverdue: false };
}


function isFocused(a: Action) {
  return Array.isArray(a.labels) && a.labels.includes('focus');
}

function extractPrevStatus(a: Action): ActionStatus | null {
  const prev = a.labels?.find(l => l.startsWith('prev_status:'));
  if (!prev) return null;
  const val = prev.split(':')[1] as ActionStatus;
  if (val === ActionStatus.TODO || val === ActionStatus.IN_PROGRESS || val === ActionStatus.DONE) return val;
  return null;
}


export default function FocusPage() {
  const { user } = useAppStore();
  const { data: actions = [] } = useActions(user?.id);
  const updateActionMutation = useUpdateAction(user?.id);
  const [scheduledId, setScheduledId] = useState<number | null>(null);

  const candidates = useMemo(() => {
    const list = (actions || []).filter(a => a.status !== ActionStatus.DONE);
    const scored = list.map(a => {
      const pScore = priorityWeight(a.priority); // 1..4
      const sScore = a.status === ActionStatus.IN_PROGRESS ? 3 : 0; // continuité favorisée
      const dInfo = getDeadlineInfo(a.deadline);
      const focusBoost = a.labels?.includes('focus') ? 1 : 0;
      const score = pScore * 2 + sScore + dInfo.score + focusBoost;
      const reasons: string[] = [];
      reasons.push(`Priorité ${priorityLabels[a.priority]}`);
      reasons.push(statusLabels[a.status]);
      if (a.deadline) reasons.push(dInfo.label);
      return { action: a, score, reasons, deadlineInfo: dInfo };
    });
    return scored.sort((x, y) => y.score - x.score).slice(0, 3);
  }, [actions]);

  const commitFocus = (a: Action) => {
    // si déjà focus, ne rien faire ici
    if (isFocused(a)) return;
    const prevLabel = `prev_status:${a.status}`;
    const newLabels = [...(a.labels || [])];
    if (!newLabels.includes('focus')) newLabels.push('focus');
    if (!newLabels.some(l => l.startsWith('prev_status:'))) newLabels.push(prevLabel);
    updateActionMutation.mutate({ id: a.id, updates: { status: ActionStatus.IN_PROGRESS, labels: newLabels } });
    showNudge({ title: 'Focus activé', body: `Engagé sur: ${a.title}`, tag: 'focus-start' });
    const id = scheduleNudge(45 * 60 * 1000, { title: 'Toujours focus ?', body: `Où en es-tu: ${a.title} ?`, tag: 'focus-reminder' });
    if (id) setScheduledId(id);
  };

  const cancelFocus = (a: Action) => {
    const prev = extractPrevStatus(a);
    const cleaned = (a.labels || []).filter(l => l !== 'focus' && !l.startsWith('prev_status:'));
    updateActionMutation.mutate({
      id: a.id,
      updates: {
        status: prev ?? ActionStatus.TODO,
        labels: cleaned,
      }
    });
    if (scheduledId) {
      cancelScheduledNudge(scheduledId);
      setScheduledId(null);
    }
    showNudge({ title: 'Focus annulé', body: `Action: ${a.title}`, tag: 'focus-cancel' });
  };

  const completeAction = (a: Action) => {
    updateActionMutation.mutate({ id: a.id, updates: { status: ActionStatus.DONE, completedAt: new Date(), labels: a.labels.filter(l => l !== 'focus') } });
    showNudge({ title: 'Bravo 🎉', body: `Action terminée: ${a.title}`, tag: 'focus-done' });
  };

  const postponeToTomorrow = (a: Action) => {
    const newDeadline = a.deadline ? addDays(new Date(a.deadline), 1) : addDays(new Date(), 1);
    updateActionMutation.mutate({ id: a.id, updates: { deadline: newDeadline, labels: a.labels.filter(l => l !== 'focus') } });
  };

  return (
    <OkrShell title="Focus du jour" topbarTitle="Focus du jour" topbarSubtitle="Vos actions prioritaires aujourd'hui">
      <div>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-2">
            <AlarmClock className="h-6 w-6 text-teal-dark" aria-hidden />
            <h1 className="text-2xl font-bold text-navy">Focus du jour</h1>
          </div>
          <p className="text-sm text-gray-600 mb-6">Voici tes 3 focus recommandés pour aujourd'hui, basés sur la priorité, le statut et l'échéance.</p>

          {candidates.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-gray-600">Aucune action prioritaire trouvée. Passe par la gestion pour en créer ou ajuster les priorités.</p>
                <div className="mt-4">
                  <Link href="/app/okr/management" className="text-teal-dark hover:underline text-sm">Ouvrir la gestion des actions →</Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {candidates.map(({ action: a, reasons, deadlineInfo }) => (
                <Card key={a.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Pourquoi sélectionnée : {reasons.join(' • ')}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">{priorityLabels[a.priority]}</Badge>
                        <Badge variant="default" size="sm">{statusLabels[a.status]}</Badge>
                        {a.deadline && (
                          <span className={"text-sm " + (deadlineInfo.isOverdue ? "text-red-600" : "text-gray-500")}>{deadlineInfo.label}</span>
                        )}
                      </div>
                      <Flame className={"h-4 w-4 " + (isFocused(a) ? "text-red-600 fill-red-600" : "text-orange-500")} strokeWidth={isFocused(a) ? 0 : 2} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => (isFocused(a) ? cancelFocus(a) : commitFocus(a))} leftIcon={<Flame className="h-4 w-4" />}>{isFocused(a) ? 'Annuler le focus' : "Je m'engage"}</Button>
                      <Button variant="ghost" onClick={() => completeAction(a)} leftIcon={<CheckCircle2 className="h-4 w-4" />}>Terminer</Button>
                      <Button variant="outline" onClick={() => postponeToTomorrow(a)}>Demain</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="pt-2">
                <Link href="/management" className="text-sm text-gray-600 hover:text-gray-800 underline">Voir plus d'actions dans la Gestion →</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </OkrShell>
  );
}

