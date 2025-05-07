import { Context, Markup } from "telegraf";
import Quiz from "../../models/Quiz";

export const viewQuiz = async (ctx: Context) => {
    try {
        const quizId = (ctx as any).match[1];
        if (!quizId) {
            await ctx.reply("Invalid quiz ID.");
            return;
        }
        const quiz = await Quiz.findOne({ quizId });
        if (!quiz) {
            await ctx.reply("Quiz not found.");
            return;
        }
        
        const quizDescription = quiz.description ? '\n' + quiz.description : '';
        const quizDetails = `${quiz.name}${quizDescription}\n📝 ${quiz.questions.length} questions, ⌛ ${quiz.delaySeconds}s delay\n\nExternal sharing link:\nt.me/${ctx.botInfo.username}?start=${quizId}`;

        const addToGroupUrl = `https://t.me/${ctx.botInfo?.username}?startgroup=${quiz.quizId}`;

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Start this quiz', `SHOW_QUIZ_INTRO_${quiz.quizId}`)],
            [Markup.button.url('Start quiz in group', addToGroupUrl)],
            [Markup.button.callback('Edit quiz', `EDIT_QUIZ_${quiz.quizId}`)],
            [Markup.button.callback('Quiz stats', `STATS_${quiz.quizId}`)],
            [Markup.button.callback('Delete this quiz', `DELETE_QUIZ_${quiz.quizId}`)],
        ]);

        await ctx.reply(quizDetails, keyboard);
        return

    } catch (error) {
        console.error("Error fetching quiz:", error);
        await ctx.reply("An error occurred while fetching the quiz.");
        return
    }

}