import { Telegraf, Context } from 'telegraf';
import type { Update } from 'telegraf/types';
import { viewQuizzes } from '../controllers/quiz/viewQuizzes.controller';
import { newQuiz } from '../controllers/quiz/newQuiz.controller';
import { viewQuiz } from '../controllers/quiz/viewQuiz.controller';

export function registerQuizCommands(bot: Telegraf<Context<Update>>) {

    bot.command('newquiz', newQuiz)
    bot.command('quizzes', viewQuizzes)
    bot.command(/viewQuiz_(.+)/, viewQuiz)
    bot.command(/ViewQuestion_(.+)/, (ctx) => {
        ctx.reply("This command is not implemented yet.")
    })

}
