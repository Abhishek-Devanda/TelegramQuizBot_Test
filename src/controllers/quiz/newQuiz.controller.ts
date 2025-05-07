import type { Context } from "telegraf";
import User from "../../models/User";

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
        await ctx.reply('Please use the /uploadQuiz to create a quiz from file.');
        return

    }
    catch (error) {
        console.error('Error creating quiz:', error);
        await ctx.reply('An error occurred quiz not created.');
        return;
    }

}
