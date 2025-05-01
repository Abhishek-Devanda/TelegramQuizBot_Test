import { Telegraf, Context } from 'telegraf';
import type { Update } from 'telegraf/types';

import { newQuiz, showQuizzes,  } from '../controllers/quiz.controller.ts';


export function registerQuizCommands(bot:Telegraf<Context<Update>>) {

    bot.command('quizzes', showQuizzes)
    bot.command('newquiz', newQuiz)

}
