'use client';
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  GripVertical,
  Play,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import type { BoardTask } from '@/lib/board';
import type { TaskStatus } from '@/lib/task-state';
import { chicagoDate } from '@/lib/dates';
export function TaskCard({
  task,
  date,
  busy,
  move,
  focus,
  details,
  drag,
}: {
  task: BoardTask;
  date: string;
  busy: boolean;
  move: (id: string, status: TaskStatus) => void;
  focus: (id: string) => void;
  details: (id: string) => void;
  drag: (id: string | null) => void;
}) {
  const due = chicagoDate(new Date(task.due));
  const dueLabel =
    due === date
      ? 'Due today'
      : due < date
        ? 'Overdue'
        : `Due ${new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric' }).format(new Date(task.due))}`;
  return (
    <article
      className={`task-card ${task.status}`}
      aria-label={task.title}
      draggable={!busy}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        drag(task.id);
      }}
      onDragEnd={() => drag(null)}
    >
      <div className="task-card-heading">
        {task.status === 'done' && (
          <Check size={19} className="completed-check" />
        )}
        <button className="task-title" onClick={() => details(task.id)}>
          {task.title}
        </button>
        <GripVertical
          size={16}
          className="drag-handle"
          aria-label="Drag to move task"
        />
      </div>
      <p className="task-context">
        {task.domain === 'academic' ? (
          <BookOpen size={16} />
        ) : (
          <BriefcaseBusiness size={16} />
        )}
        <span>{task.label}</span>
        {task.priority && (
          <span className="priority-label">
            <Target size={12} />
            Priority
          </span>
        )}
      </p>
      <div className="task-meta">
        <span>
          <Clock3 size={15} />
          {task.durationMinutes} min
        </span>
        <span
          className={task.status !== 'done' && due <= date ? 'due-urgent' : ''}
        >
          <CalendarDays size={15} />
          {task.status === 'done' ? 'Completed' : dueLabel}
        </span>
      </div>
      <div className="task-actions">
        <select
          aria-label="Task status"
          value={task.status}
          disabled={busy}
          onChange={(e) => move(task.id, e.target.value as TaskStatus)}
        >
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        {task.status === 'todo' ? (
          <button
            disabled={busy}
            className="task-action"
            onClick={() => move(task.id, 'in_progress')}
          >
            <Play size={13} />
            Start task
          </button>
        ) : task.status === 'in_progress' ? (
          <button
            disabled={busy}
            className="task-action done-action"
            onClick={() => move(task.id, 'done')}
          >
            <Check size={15} />
            Mark done
          </button>
        ) : (
          <button
            disabled={busy}
            className="task-action"
            onClick={() => move(task.id, 'todo')}
          >
            Reopen
            <ArrowUpRight size={13} />
          </button>
        )}
      </div>
      {task.status === 'in_progress' && (
        <button
          className="card-focus-button"
          disabled={busy}
          onClick={() => focus(task.id)}
        >
          <Target size={14} />
          Focus on this task
        </button>
      )}
    </article>
  );
}
