import type { Context, Telegraf } from "telegraf";
import type { Update } from "telegraf/types";
import { newQuiz } from "../controllers/quiz/newQuiz.controller";
import { startCommand } from "../commands/start";

export const registerBackActions = (bot: Telegraf<Context<Update>>) => {

    bot.action('BACK_TO_NEW_QUIZ_MENU', newQuiz);
    bot.action('BACK_TO_MAIN_MENU', startCommand);}