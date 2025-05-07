import { Markup, Context } from 'telegraf';
import User from '../../models/User';
import Quiz from '../../models/Quiz';

export const deleteQuiz = async (ctx: Context) => {
    try {
        const quizId = (ctx as any).match[1];
        if (!quizId) {
            await ctx.answerCbQuery('Invalid Quiz ID.');
            await ctx.reply('Something went wrong, invalid quiz identifier.');
            return
        }

        const telegramUserId = ctx.from?.id;
        if (!telegramUserId) {
            await ctx.answerCbQuery('Cannot identify user.');
            await ctx.reply('Could not identify you.');
            return
        }

        const user = await User.findOne({ telegramUserId });
        const quiz = await Quiz.findOne({ quizId });

        if (!quiz || !user || !quiz.createdBy.equals(user._id)) {
            await ctx.answerCbQuery('Quiz not found');
            await ctx.editMessageText('Quiz not found or you do not have permission to delete it.');
            return
        }

        await ctx.answerCbQuery();
        await ctx.editMessageText(
            `Are you sure you want to delete the quiz "${quiz.name}"? This cannot be undone.`,
            Markup.inlineKeyboard([
                Markup.button.callback('✅ Yes, Delete', `CONFIRM_DELETE_${quizId}`),
                Markup.button.callback('❌ Cancel', `CANCEL_DELETE_${quizId}`)
            ])
        );
        return;
    } catch (error) {
        console.error('Error initiating quiz deletion:', error);
        await ctx.answerCbQuery('Error processing request.');
        await ctx.reply('An error occurred.');
        return
    }
}
export const confirmDeleteQuiz = async (ctx: Context) => {
    try {
        const quizId = (ctx as any).match[1];
        if (!quizId) {
            await ctx.answerCbQuery('Invalid Quiz ID.');
            await ctx.reply('Something went wrong, invalid quiz identifier.');
            return
        }

        const telegramUserId = ctx.from?.id;
        if (!telegramUserId) {
            await ctx.answerCbQuery('Cannot identify user.');
            await ctx.reply('Could not identify you.');
            return
        }

        const user = await User.findOne({ telegramUserId });
        const quiz = await Quiz.findOne({ quizId });

        if (!quiz || !user || !quiz.createdBy.equals(user._id)) {
            await ctx.answerCbQuery('Quiz not found or you don\'t own it.');
            await ctx.editMessageText('Quiz not found or you do not have permission to delete it.');
            return
        }

        await Quiz.deleteOne({ quizId });
        await ctx.answerCbQuery('Quiz deleted.');
        await ctx.editMessageText(`Quiz "${quiz.name}" has been deleted.`);
        return

    } catch (error) {
        console.error('Error deleting quiz:', error);
        await ctx.answerCbQuery('Error deleting quiz.');
        await ctx.editMessageText('An error occurred while deleting the quiz.');
        return
    }
}
export const cancelDeleteQuiz = async (ctx: Context) => {
    try {
        const quizId = (ctx as any).match[1];
        if (!quizId) {
            await ctx.answerCbQuery('Invalid Quiz ID.');
            await ctx.editMessageText('Something went wrong, invalid quiz identifier.');
            return;
        }
        await ctx.answerCbQuery('Deletion cancelled.');

        const quiz = await Quiz.findOne({ quizId });
        if (!quiz) {
            await ctx.editMessageText('Quiz not found.');
            return
        }

        const quizDescription = quiz.description ? '\n' + quiz.description : '';
        const quizDetails = `${quiz.name}${quizDescription}\n📝 ${quiz.questions.length} questions, ⌛ ${quiz.delaySeconds}s delay\n\nExternal sharing link:\nt.me/${ctx.botInfo?.username}?start=${quizId}`; // Use ctx.botInfo if available

        const addToGroupUrl = `https://t.me/${ctx.botInfo?.username}?startgroup=${quiz.quizId}`;

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Start this quiz', `START_${quiz.quizId}`)],
            [Markup.button.url('Start quiz in group', addToGroupUrl)],
            [Markup.button.callback('Edit quiz', `EDIT_QUIZ_${quiz.quizId}`)],
            [Markup.button.callback('Quiz stats', `STATS_QUIZ_${quiz.quizId}`)],
            [Markup.button.callback('Delete this quiz', `DELETE_QUIZ_${quiz.quizId}`)],
        ]);

        await ctx.editMessageText(quizDetails, keyboard);
        return

    } catch (error) {
        console.error('Error cancelling quiz deletion:', error);
        await ctx.answerCbQuery('Error cancelling.');
        await ctx.editMessageText('An error occurred while cancelling.');
        return
    }
};
