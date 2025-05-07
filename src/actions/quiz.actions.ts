import type { Context, Telegraf } from "telegraf";
import type { Update } from "telegraf/types";
import { viewQuizzes } from "../controllers/quiz/viewQuizzes.controller";
import { newQuiz } from "../controllers/quiz/newQuiz.controller";
import { cancelDeleteQuiz, confirmDeleteQuiz, deleteQuiz } from "../controllers/quiz/deleteQuiz.controller";
import { showQuizIntro , beginQuizSession } from "../controllers/quiz/startQuiz.controller";

export const registerQuizActions = (bot: Telegraf<Context<Update>>) => {

    bot.action(/SHOW_QUIZZES/, viewQuizzes);
    bot.action(/NEW_QUIZ/, newQuiz);
    
    bot.action(/SHOW_QUIZ_INTRO_(.+)/, showQuizIntro );
    bot.action(/BEGIN_QUIZ_SESSION_(.+)/, beginQuizSession);
    
    bot.action(/DELETE_QUIZ_(.+)/, deleteQuiz);
    bot.action(/CONFIRM_DELETE_(.+)/, confirmDeleteQuiz);
    bot.action(/CANCEL_DELETE_(.+)/, cancelDeleteQuiz);
}