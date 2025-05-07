import { Context, Markup } from "telegraf";
import type { Message } from "telegraf/types";
import Quiz, { type IQuiz } from "../../models/Quiz";
import PollAnswer from "../../models/PollAnswer";
import User from "../../models/User";
import Stats from "../../models/Stats";
import { getOrdinal } from "../../utils/getOrdinal";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const showQuizIntro = async (ctx: Context) => {
    try {
        let quizId = (ctx as any).startPayload ?? (ctx as any).match?.[1];
        if (!quizId) {
            await ctx.reply("No quiz ID provided. Please provide a valid quiz ID to start the quiz.");
            return;
        }

        const quiz = await Quiz.findOne({ quizId });
        if (!quiz) {
            await ctx.reply("Quiz not found. Please check the quiz ID and try again.");
            return;
        }
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const quizDescription = quiz.description ? '\n\n' + quiz.description : '';
        const quizDetails =
            `🎲 Get ready for the quiz '${quiz.name}'`
            +
            `${quizDescription}`
            +
            `\n\n📝 ${quiz.questions.length} questions`
            +
            `\n⌛ ${quiz.delaySeconds} seconds per question`
            +
            `\n📰 Votes are visible to `+ (ctx.chat?.type != 'private' ? "group members and the quiz owner": `the quiz owner`)
            +
            `\n\n🏁 Press the button below when you are ready.`;
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback("I'm ready!", `BEGIN_QUIZ_SESSION_${quiz.quizId}`)],
        ]);

        await ctx.reply(quizDetails, keyboard);
        return;

    } catch (error) {
        console.error("Error starting quiz:", error);
        await ctx.reply("An error occurred while starting the quiz. Please try again later.");
        return;
    }
}

export const beginQuizSession = async (ctx: Context) => {
    try {
        let quizId = (ctx as any).match?.[1];
        if (!quizId) {
            await ctx.answerCbQuery("No quiz ID found.", { show_alert: true });
            await ctx.editMessageText("Error: Could not determine the quiz.");
            return;
        }
        await ctx.answerCbQuery("Get ready!");
        const quiz = await Quiz.findOne({ quizId }).populate("questions");
        if (!quiz) {
            await ctx.editMessageText("Error: Quiz not found.");
            return;
        }
        if (ctx.callbackQuery?.message) {
            await ctx.editMessageReplyMarkup(undefined);
        }

        let countdownMessage: Message.TextMessage | null = await ctx.reply("3️⃣ ...");
        const chatId = ctx.chat?.id;
        const messageId = countdownMessage.message_id;
        if (!chatId || !messageId) {
            throw new Error("Could not get chat ID or message ID for countdown message.");
        }
        await delay(1000);
        await ctx.telegram.editMessageText(chatId, messageId, undefined, "2️⃣ READY?");
        await delay(1000);
        await ctx.telegram.editMessageText(chatId, messageId, undefined, "1️⃣ SET...");
        await delay(1000);
        await ctx.telegram.editMessageText(chatId, messageId, undefined, "🚀 GO!");
        await delay(500);
        await ctx.deleteMessage(messageId);
        await delay(200);

        await sendQuizQuestions(ctx, quiz);
        return;

    } catch (error) {
        console.error("Error starting quiz now:", error);
        await ctx.reply("An error occurred while starting the quiz. Please try again later.");
        return;
    }
}

async function sendQuizQuestions(ctx: Context, quiz: IQuiz) {
    for (const question of quiz.questions) {
        const pollMsg = await ctx.replyWithQuiz(
            question.text,
            question.options,
            {
                correct_option_id: question.correctOptionIndex,
                is_anonymous: ctx.chat?.type === "private" ? true : false,
                open_period: quiz.delaySeconds,
            }
        );
        const alreadyAnswered = await PollAnswer.findOne({ quizId: quiz.quizId, questionId: question.questionId, telegramUserId: ctx.from?.id });
        if (alreadyAnswered) {
            await PollAnswer.updateOne(
                { telegramUserId: ctx.from?.id, quizId: quiz.quizId, questionId: question.questionId },
                { $set: { pollId: pollMsg.poll.id } }
            );
        }
        if (!alreadyAnswered) {
            await PollAnswer.create({
                telegramUserId: ctx.from?.id,
                pollId: pollMsg.poll.id,
                quizId: quiz.quizId,
                questionId: question.questionId,
                selectedOption: -1, // -1 indicates not answered yet
                isCorrect: false,
                answeredAt: null,
            });
        }
        await delay(quiz.delaySeconds * 1000);
    }
    await ctx.reply("Quiz completed! Thank you for participating.");
    // await quizStats(ctx, quiz);
    return;
}

async function quizStats(ctx: Context, quiz: IQuiz) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) {
        await ctx.reply("Could not identify user for stats.");
        return;
    }
    const user = await User.findOne({ telegramUserId });
    if (!user) {
        await ctx.reply("Could not find user for stats.");
        return;
    }

    // Get all answers for this user and quiz
    const answers = await PollAnswer.find({ quizId: quiz.quizId, telegramUserId });
    const total = quiz.questions.length;
    let correct = 0, wrong = 0, missed = 0;
    for (const ans of answers) {
        if (ans.selectedOption === -1 || ans.answeredAt === null) missed++;
        else if (ans.isCorrect) correct++;
        else wrong++;
    }

    let stats = await Stats.findOne({ quizId: quiz.quizId, userId: user._id });
    if (!stats) {
        stats = new Stats({
            quizId: quiz.quizId,
            userId: user._id,
            telegramUserId,
            correct,
            wrong,
            missed,
            total,
        });
        await stats.save();
    }

    // Get leaderboard for this quiz
    const allStats = await Stats.find({ quizId: quiz.quizId }).sort({ correct: -1 });
    const rank = allStats.findIndex(s => s.userId.equals(user._id)) + 1;
    const totalPlayers = allStats.length;
    await ctx.reply(
        `🏁 The quiz '${quiz.name}' has finished!\n\n` +
        `You answered ${total} questions:\n\n` +
        `✅ Correct – ${correct}\n` +
        `❌ Wrong – ${wrong}\n` +
        `⌛️ Missed – ${missed}\n\n` +
        `🥇${rank}${getOrdinal(rank)} place out of ${totalPlayers}.\n\n` +
        `You can take this quiz again but it will not change your place on the leaderboard.`
    );
    return;
}