import { Telegraf, Context } from 'telegraf';
import type { Update } from 'telegraf/types';
import { showQuizzes } from '../controllers/quiz/showQuizzes.controller';
import { newQuiz } from '../controllers/quiz/newQuiz.controller';
import { viewQuiz } from '../controllers/quiz/viewQuiz.controller';

export function registerQuizCommands(bot:Telegraf<Context<Update>>) {

    bot.command('newquiz', newQuiz)
    bot.command('quizzes', showQuizzes)
    bot.command(/view_(.+)/,viewQuiz)

}
