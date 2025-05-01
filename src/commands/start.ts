import { Telegraf, Markup, Context } from 'telegraf';
import User from '../models/User'; // Import the User model


export const startCommand = async (ctx: Context) => {
  const telegramUser = ctx.from;
  if (!telegramUser) {
    console.error('Could not get user info from context');
    return ctx.reply('Sorry, I could not identify you.');
  }

  const firstName = telegramUser.first_name;
  const lastName = telegramUser.last_name;
  const username = telegramUser.username;
  const telegramId = telegramUser.id;

  try {
    let user = await User.findOne({ telegramId: telegramId });

    if (!user) {
      // User does not exist, create a new one
      user = new User({
        telegramId,
        firstName,
        lastName,
        username,
      });
      await user.save();
      console.log(`New user registered: ${firstName} (ID: ${telegramId})`);
    } else {
      // User exists, update if necessary (optional)
      let updated = false;
      if (user.firstName !== firstName) { user.firstName = firstName; updated = true; }
      if (user.lastName !== lastName) { user.lastName = lastName; updated = true; }
      if (user.username !== username) { user.username = username; updated = true; }
      if (updated) {
        await user.save();
        console.log(`User details updated: ${firstName} (ID: ${telegramId})`);
      }
    }

    ctx.reply(
      `Welcome, ${firstName}! This bot will help you create a quiz with a series of multiple choice questions`,
      Markup.inlineKeyboard([
      [Markup.button.callback('Create New Quiz', 'NEW_QUIZ')],
      [Markup.button.callback('My Quizzes', 'SHOW_QUIZZES')],
      // Add other initial buttons if needed, each in its own array for vertical layout
      ])
    );

  } catch (error) {
    console.error('Error processing /start command:', error);
    ctx.reply('An error occurred while processing your request. Please try again later.');
  }
}