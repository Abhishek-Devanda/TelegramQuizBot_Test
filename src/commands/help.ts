import type { Context } from "telegraf";

export const helpCommand = async (ctx: Context) => {
    return ctx.reply(
        `This bot will help you create a quiz with a series of multiple choice questions. You can create, edit, and delete quizzes. You can also view your quizzes and their details.`
    );
};