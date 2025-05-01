import { Markup, Context } from 'telegraf';
import User from '../models/User';
import Quiz from '../models/Quiz';
import mongoose from 'mongoose';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2';

export const showQuizzes = async (ctx: Context) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
        return ctx.reply("Could not identify user. Please /start the bot first.");
    }

    try {
        const user = await User.findOne({ telegramId });
        if (!user) {
            return ctx.reply('Could not find your user record. Please /start the bot again.');
        }

        const quizzes = await Quiz.find({ createdBy: user._id }).sort({ createdAt: -1 });

        if (quizzes.length === 0) {
            return ctx.reply("You haven't created any quizzes yet. Create a /newquiz to get started!");
        }

        await ctx.reply("Here are your quizzes:");
        for (const quiz of quizzes) {
            const escapedQuizName = escapeMarkdownV2(quiz.name);
            const message = `📝 *${escapedQuizName}*\n\\(${quiz.questions.length} questions, ${quiz.delaySeconds}s delay\\)`; const keyboard = Markup.inlineKeyboard([
                Markup.button.callback('▶️ Start', `START_QUIZ_${quiz._id}`),
                Markup.button.callback('⚙️ Edit', `EDIT_${quiz._id}`),
                Markup.button.callback('🗑️ Delete', `DELETE_QUIZ_${quiz._id}`),
            ]);
            await ctx.replyWithMarkdownV2(message, keyboard);
        }

    } catch (error) {
        console.error('Error fetching quizzes:', error);
        await ctx.reply('An error occurred while fetching your quizzes.');
    }
};

export const newQuiz = async (ctx: Context) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
        return ctx.reply("Could not identify user. Please /start the bot first.");
    }

    try {
        const user = await User.findOne({ telegramId });
        if (!user) {
            return ctx.reply('Could not find your user record. Please /start the bot again.');
        }
        return ctx.reply('Please use the /uploadQuiz to create a quiz from file.');

    }
    catch (error) {
        console.error('Error creating quiz:', error);
        return ctx.reply('An error occurred quiz not created.');
    }

}

// <---Actions for quiz management--->

// Quiz delete actions
export const deleteQuiz = async (ctx: Context) => {
    const quizId = (ctx as any).match[1];
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        await ctx.answerCbQuery('Invalid Quiz ID.');
        return ctx.reply('Something went wrong, invalid quiz identifier.');
    }

    const telegramId = ctx.from?.id;
    if (!telegramId) {
        await ctx.answerCbQuery('Cannot identify user.');
        return ctx.reply('Could not identify you.');
    }

    try {
        const user = await User.findOne({ telegramId });
        const quiz = await Quiz.findById(quizId);

        if (!quiz || !user || !quiz.createdBy.equals(user._id)) {
            await ctx.answerCbQuery('Quiz not found');
            return ctx.editMessageText('Quiz not found or you do not have permission to delete it.');
        }

        await ctx.answerCbQuery();
        await ctx.editMessageText(
            `Are you sure you want to delete the quiz "${quiz.name}"? This cannot be undone.`,
            Markup.inlineKeyboard([
                Markup.button.callback('✅ Yes, Delete', `CONFIRM_DELETE_${quizId}`),
                Markup.button.callback('❌ Cancel', `CANCEL_DELETE_${quizId}`)
            ])
        );
    } catch (error) {
        console.error('Error initiating quiz deletion:', error);
        await ctx.answerCbQuery('Error processing request.');
        await ctx.reply('An error occurred.');
    }
}
export const confirmDeleteQuiz = async (ctx: Context) => {
    const quizId = (ctx as any).match[1];
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        await ctx.answerCbQuery('Invalid Quiz ID.');
        return ctx.reply('Something went wrong, invalid quiz identifier.');
    }

    const telegramId = ctx.from?.id;
    if (!telegramId) {
        await ctx.answerCbQuery('Cannot identify user.');
        return ctx.reply('Could not identify you.');
    }

    try {
        const user = await User.findOne({ telegramId });
        const quiz = await Quiz.findById(quizId);

        if (!quiz || !user || !quiz.createdBy.equals(user._id)) {
            await ctx.answerCbQuery('Quiz not found or you don\'t own it.');
            return ctx.editMessageText('Quiz not found or you do not have permission to delete it.');
        }

        await Quiz.deleteOne({ _id: quizId });
        await ctx.answerCbQuery('Quiz deleted.');
        await ctx.editMessageText(`Quiz "${quiz.name}" has been deleted.`);

    } catch (error) {
        console.error('Error deleting quiz:', error);
        await ctx.answerCbQuery('Error deleting quiz.');
        await ctx.editMessageText('An error occurred while deleting the quiz.');
    }
}
export const cancelDeleteQuiz = async (ctx: Context) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('Quiz deletion cancelled.');
    // Optionally, you could re-display the /myquizzes list here
}
