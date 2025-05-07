import { Context as TelegrafContext } from "telegraf";

export interface QuizState {
  quizId: string;
  current: number;
  answers: Array<{
    questionId: string;
    selected: number;
    isCorrect: boolean;
    time: number;
  }>;
  startedAt: number;
  total: number;
  questionIds: string[];
  lastPollId?: string;
}

export interface SessionData {
  quizState?: QuizState;
}

// Extend Telegraf Context
export interface MyContext extends TelegrafContext {
  session: SessionData;
}