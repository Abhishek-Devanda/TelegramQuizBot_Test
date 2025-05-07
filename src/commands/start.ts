import { Markup, Context } from 'telegraf';
import { registerOrUpdateUser } from '../controllers/user.controller';
import { showQuizIntro } from '../controllers/quiz/startQuiz.controller';

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
      await showQuizIntro(ctx);
      return
    }

    const welcomeText = `Welcome, ${user.firstName ?? 'there'}! This bot will help you create a quiz with a series of multiple choice questions`;
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Create New Quiz', 'NEW_QUIZ')],
      [Markup.button.callback('My Quizzes', 'SHOW_QUIZZES')],
    ]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(welcomeText, keyboard);
      await ctx.answerCbQuery();
    } else if (chatType === 'private' && !quizId) {
      await ctx.reply(welcomeText, keyboard);
    }

    return

  } catch (error) {
    console.error('Error processing /start command:', error);
    await ctx.reply('An error occurred while processing your request. Please try again later.');
    return
  }
}