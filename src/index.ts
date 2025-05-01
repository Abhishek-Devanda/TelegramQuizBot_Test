import { Telegraf } from 'telegraf';
import { session as mongoSession } from 'telegraf-session-mongodb';
import mongoose from 'mongoose';

import connectDB from './utils/dbConnection';

import { startCommand } from './commands/start';
import { registerQuizCommands } from './commands/quizzes';
import { registerQuizActions } from './actions/quiz_actions';
import { helpCommand } from './commands/help';
import { registerFileHandler } from './commands/uploadQuiz';

const bot = new Telegraf(process.env.BOT_TOKEN as string);

const db = await connectDB();
if (!db) {
  console.error('MongoDB database instance is not available after connection.');
  process.exit(1);
}

// Setup session store AFTER connection is established and db is verified
const sessionMiddleware = mongoSession(db, {
  collectionName: 'telegraf-sessions'
});

// Middleware
bot.use(sessionMiddleware); // Use MongoDB session store

bot.start(startCommand)
bot.help(helpCommand);

// Register commands

registerQuizCommands(bot);
registerFileHandler(bot);
// registerDocumentHandler(bot);


// Register Actions
registerQuizActions(bot);

// Launch bot
bot.launch();
console.log('Bot started...');


// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  mongoose.connection.close().then(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  mongoose.connection.close().then(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
