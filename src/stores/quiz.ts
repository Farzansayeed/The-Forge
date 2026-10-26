import { create } from 'zustand';
import { loadData, saveData } from '../lib/storage';
import { isCorrect, quizXp } from '../engines/quiz';
import { scheduleFailure, scheduleSuccess } from '../engines/spacedReview';
import { todayKey } from '../lib/schema';
import type { QuizItem } from '../data/quizzes/types';

/**
 * quiz store — one attempt's answers, committed on finish.
 * XP: pass 25 (+15 first-try). Missed items → spaced review (SM-2-lite).
 */

interface QuizStore {
  /** itemId -> user answer (shape per format) */
  answers: Record<string, unknown>;
  /** itemId -> graded result after commit */
  results: Record<string, boolean>;
  setAnswer: (itemId: string, answer: unknown) => void;
  clearAnswers: () => void;
  grade: (items: readonly QuizItem[]) => Record<string, boolean>;
  /** Commit an attempt: persists results/xp/review. Returns earned xp. */
  commit: (opts: { setId: string; items: readonly QuizItem[]; passed: boolean }) => { xp: number; missed: QuizItem[] };
}

function patch(fn: (d: ReturnType<typeof loadData>) => void): void {
  const d = loadData();
  fn(d);
  saveData(d);
}

export const useQuiz = create<QuizStore>((set, get) => ({
  answers: {},
  results: {},

  setAnswer: (itemId, answer) => set((s) => ({ answers: { ...s.answers, [itemId]: answer } })),
  clearAnswers: () => set({ answers: {}, results: {} }),

  grade: (items) => {
    const { answers } = get();
    const out: Record<string, boolean> = {};
    for (const it of items) out[it.id] = isCorrect(it, answers[it.id]);
    return out;
  },

  commit: ({ setId, items, passed }) => {
    const results = get().grade(items);
    set({ results });

    const missed = items.filter((it) => !results[it.id]);
    const today = todayKey();
    let earned = 0;

    patch((d) => {
      // quiz result ledger
      const prev = d.quizResults[setId];
      const bestPct = items.length === 0 ? 0 : Math.round(((items.length - missed.length) / items.length) * 100);
      d.quizResults[setId] = {
        best: Math.max(prev?.best ?? 0, bestPct),
        attempts: (prev?.attempts ?? 0) + 1,
        lastAt: new Date().toISOString(),
      };
      // XP
      earned = quizXp(prev?.attempts ?? 0, passed);
      d.xp += earned;
      // spaced review: failures enqueue, passes advance existing cards
      for (const it of items) {
        if (results[it.id]) {
          const card = d.review[it.id];
          if (card) d.review[it.id] = scheduleSuccess(card, today);
        } else {
          d.review[it.id] = scheduleFailure(d.review[it.id], it.id, today);
        }
      }
    });

    return { xp: earned, missed };
  },
}));
