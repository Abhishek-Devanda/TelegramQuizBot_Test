import type { Context, Telegraf } from "telegraf";
import type { Update } from "telegraf/types";
import { showQuizzes } from "../controllers/quiz/showQuizzes.controller";
import { newQuiz } from "../controllers/quiz/newQuiz.controller";
import { cancelDeleteQuiz, confirmDeleteQuiz, deleteQuiz } from "../controllers/quiz/deleteQuiz.controller";
import { startReady, startQuiz } from "../controllers/quiz/startQuiz.controller";

export const registerQuizActions = (bot: Telegraf<Context<Update>>) => {

    bot.action(/SHOW_QUIZZES/, showQuizzes);
    bot.action(/NEW_QUIZ/, newQuiz);
    
    bot.action(/START_(.+)/, startReady);
    bot.action(/Ready_(.+)/, startQuiz);
    
    bot.action(/DELETE_QUIZ_(.+)/, deleteQuiz);
    bot.action(/CONFIRM_DELETE_(.+)/, confirmDeleteQuiz);
    bot.action(/CANCEL_DELETE_(.+)/, cancelDeleteQuiz);
}