import type { Context, Telegraf } from "telegraf";
import type { Update } from "telegraf/types";
import { cancelDeleteQuiz, confirmDeleteQuiz, deleteQuiz, newQuiz, showQuizzes } from "../controllers/quiz.controller";

export const registerQuizActions = (bot: Telegraf<Context<Update>>) => {
    
    bot.action(/SHOW_QUIZZES/, showQuizzes);
    bot.action(/NEW_QUIZ/, newQuiz);

    bot.action(/DELETE_QUIZ_(.+)/, deleteQuiz);
    bot.action(/CONFIRM_DELETE_(.+)/, confirmDeleteQuiz);
    bot.action(/CANCEL_DELETE_(.+)/, cancelDeleteQuiz);
}