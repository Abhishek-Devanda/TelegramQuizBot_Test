import { Markup, type Context } from "telegraf";
import User from "../../models/User";
import { getExcelTemplateInstructions } from "../../utils/excelParser";

export const newQuiz = async (ctx: Context) => {
    try {
        const telegramUserId = ctx.from?.id;
        if (!telegramUserId) {
            await ctx.reply("Could not identify user. Please /start the bot first.");
            return;
        }

        const user = await User.findOne({ telegramUserId });
        if (!user) {
            await ctx.reply('Could not find your user record. Please /start the bot again.');
            return;
        }
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Create quiz from file', 'CREATE_QUIZ_FROM_FILE')],
            [Markup.button.callback('Create quiz from scratch', 'CREATE_QUIZ_FROM_SCRATCH')],
            [Markup.button.callback('⬅️ Back', 'BACK_TO_MAIN_MENU')]
        ]);
        const text = 'How would you like to create a quiz?';

        if (ctx.callbackQuery) {
            await ctx.editMessageText(text, keyboard);
            await ctx.answerCbQuery();
        } else {
            await ctx.reply(text, keyboard);
        }
        return;

    }
    catch (error) {
        console.error('Error creating quiz:', error);
        await ctx.reply('An error occurred quiz not created.');
        return;
    }

}

export const createQuizFromFile = async (ctx: Context) => {
    try {
        await ctx.answerCbQuery();
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Back', 'BACK_TO_NEW_QUIZ_MENU')]
        ]);
        await ctx.editMessageText(getExcelTemplateInstructions(), keyboard);
        return;
    } catch (error) {
        console.error('Error creating quiz from file:', error);
        await ctx.reply('An error occurred while creating the quiz from file.');
        return;
    }
}
export const createQuizFromScratch = async (ctx: Context) => {
    try {
        // Handle quiz creation from scratch logic here
        await ctx.answerCbQuery();
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Back', 'BACK_TO_NEW_QUIZ_MENU')]
        ]);
        await ctx.editMessageText('This feature is under development. Please check back later.', keyboard);
        return;
    } catch (error) {
        console.error('Error creating quiz from scratch:', error);
        await ctx.reply('An error occurred while creating the quiz from scratch.');
        return;
    }
}
