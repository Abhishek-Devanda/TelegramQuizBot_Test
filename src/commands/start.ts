import { Markup, Context } from 'telegraf';
import { registerOrUpdateUser } from '../controllers/user.controller';
import { startReady } from '../controllers/quiz/startQuiz.controller';

export const startCommand = async (ctx: Context) => {
  try {
    const telegramUser = ctx.from;
    const chatType = ctx.chat?.type;
    if (!telegramUser) {
      await ctx.reply('Sorry, I could not identify you.');
      return
    }

    const user = await registerOrUpdateUser(telegramUser);
    if (!user) {
      await ctx.reply('Sorry, failed to register or update your information.');
      return
    }

    const quizId = (ctx as any).startPayload;
    if (quizId && quizId != '') {
      await startReady(ctx);
      return
    }

    if (chatType === 'private' && !quizId) {
      await ctx.reply(
        `Welcome, ${user.firstName ?? 'there'}! This bot will help you create a quiz with a series of multiple choice questions`,
        Markup.inlineKeyboard([
          [Markup.button.callback('Create New Quiz', 'NEW_QUIZ')],
          [Markup.button.callback('My Quizzes', 'SHOW_QUIZZES')],
          // Add other initial buttons if needed, each in its own array for vertical layout
        ])
      );
      return
    }

  } catch (error) {
    console.error('Error processing /start command:', error);
    await ctx.reply('An error occurred while processing your request. Please try again later.');
    return
  }
}