import type { Context } from "telegraf";
import User from "../../models/User";
import Quiz from "../../models/Quiz";

export const viewQuizzes = async (ctx: Context) => {
    try {
        const telegramUserId = ctx.from?.id;
        if (!telegramUserId) {
            await ctx.reply("Could not identify user. Please /start the bot first.");
            return;
        }

        const user = await User.findOne({ telegramUserId });
        if (!user) {
            await ctx.reply('Could not find your user record. Please /start the bot again.');
            return
        }
        
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const quizzes = await Quiz.find({ createdBy: user._id }).sort({ createdAt: -1 });
        if (quizzes.length === 0) {
            await ctx.reply("You haven't created any quizzes yet. Create a\n /newquiz to get started!");
            return
        }


        let message = "Here are your Quizzes:\n\n";
        let counter = 1;
        for (const quiz of quizzes) {
            message += `${counter}. ${quiz.name}\n📝 ${quiz.questions.length} questions, ⌛ ${quiz.delaySeconds}s delay\n/viewQuiz_${quiz.quizId}\n\n`;
            counter++;
        }
        await ctx.reply(message);
        return

    } catch (error) {
        console.error('Error fetching quizzes:', error);
        await ctx.reply('An error occurred while fetching your quizzes.');
        return;
    }
};