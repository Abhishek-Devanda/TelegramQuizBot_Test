import { Context, Markup } from "telegraf";
import Quiz, { type IQuiz } from "../../models/Quiz";
import type { Message } from "telegraf/types";
import PollAnswer from "../../models/PollAnswer";
import Question from "../../models/Question";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const startReady = async (ctx: Context) => {
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
            `\n\n🏁 Press the button below when you are ready.`;
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback("I'm ready!", `Ready_${quiz.quizId}`)],
        ]);

        await ctx.reply(quizDetails, keyboard);
        return;

    } catch (error) {
        console.error("Error starting quiz:", error);
        await ctx.reply("An error occurred while starting the quiz. Please try again later.");
        return;
    }
}

export const startQuiz = async (ctx: Context) => {
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
        const pollMsg = await ctx.replyWithPoll(
            question.text,
            question.options,
            {
                // @ts-ignore
                type: "quiz", // Poll type not supported in Telegraf yet
                correct_option_id: question.correctOptionIndex,
                is_anonymous: false,
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
    return;
}

export async function handlePollAnswer(ctx: Context) {
    try {
        const pollAnswer = ctx.pollAnswer
        if (!pollAnswer || !pollAnswer.user) return;

        const { quizId, questionId, correctOptionIndex } = await getQuizIdAndQuestionIdByPollId(pollAnswer.poll_id);
        const selectedOption = pollAnswer.option_ids[0];
        const isCorrect = selectedOption === correctOptionIndex;

        await PollAnswer.updateOne(
            {
                telegramUserId: pollAnswer.user.id,
                pollId: pollAnswer.poll_id,
                quizId,
                questionId,
            },
            {
                $set: {
                    selectedOption,
                    isCorrect,
                    answeredAt: new Date(),
                },
            }
        );
        return;

    } catch (error) {
        console.error("Error handling poll answer:", error);
        await ctx.reply("An error occurred while processing your answer. Please try again later.");
    }
}

export async function getQuizIdAndQuestionIdByPollId(pollId: string) {
    try {
        const pollAnswer = await PollAnswer.findOne({ pollId })
        if (!pollAnswer) throw new Error("Poll mapping not found");

        // Optionally, populate question to get correctOptionIndex
        const question = await Question.findOne({ questionId: pollAnswer.questionId });
        if (!question) throw new Error("Question not found");

        return {
            quizId: pollAnswer.quizId,
            questionId: pollAnswer.questionId,
            correctOptionIndex: question.correctOptionIndex,
        };
    } catch (error) {
        console.error("Error getting quiz and question by poll ID:", error);
        throw new Error("Could not retrieve quiz and question information.");
    }
}