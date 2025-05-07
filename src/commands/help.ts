import type { Context } from "telegraf";

export const helpCommand = async (ctx: Context) => {
    return ctx.reply(
        `This bot will help you create a quiz with a series of multiple choice questions. You can create, edit, and delete quizzes. You can also view your quizzes and their details.\nUse the following commands to interact with the bot:\n`+
        `/start - Start the bot\n`+
        `/quizzes - View your quizzes\n`+
        `/create - Create a new quiz\n`+
        `/help - Show this help message\n`
    );
};