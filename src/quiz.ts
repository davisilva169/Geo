import type { Answer, Session } from "./types";
import { byId, scoreAnswer, shuffle } from "./domain";

// The recorded answer is the source of truth. A missing UI checkpoint must never
// trap an already answered question after reload or a concurrent clock update.
export function quizFeedback(s: Session): Answer | undefined {
  return s.runtime.feedback || s.events[s.cursor];
}
export function recordQuizAnswer(
  s: Session,
  cursor: number,
  answer: Answer,
  elapsed: number,
): Session {
  if (s.cursor !== cursor || quizFeedback(s) || s.status !== "playing")
    return s;
  const events = [...s.events, answer];
  let combo = 0;
  for (let i = events.length - 1; i >= 0 && events[i].correct; i--) combo++;
  return {
    ...s,
    events,
    elapsed: Math.max(s.elapsed, elapsed),
    score:
      s.score +
      (answer.correct
        ? scoreAnswer(
            byId[answer.countryId].difficulty,
            answer.ms,
            combo,
            s.mode === "radar" && s.config.radarEvent === "hunt",
          )
        : 0),
    bestCombo: Math.max(s.bestCombo, combo),
    runtime: { ...s.runtime, feedback: answer },
  };
}
export function advanceQuiz(
  s: Session,
  cursor: number,
  remaining: number,
): Session {
  if (s.cursor !== cursor || !quizFeedback(s)) return s;
  const infinite = s.mode === "radar" && s.config.count === 0;
  if (s.cursor + 1 >= s.questionIds.length && !infinite)
    return { ...s, status: "completed" };
  const questionIds =
    s.cursor + 1 >= s.questionIds.length
      ? [...s.questionIds, ...shuffle(s.questionIds.slice(0, 196))]
      : s.questionIds;
  return {
    ...s,
    cursor: s.cursor + 1,
    questionIds,
    runtime: { radarRemaining: remaining, memoryRevealed: false },
  };
}
