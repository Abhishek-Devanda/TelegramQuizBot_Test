import type { Context } from "telegraf";
import PollAnswer from "../models/PollAnswer";
import Question from "../models/Question";

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

async function getQuizIdAndQuestionIdByPollId(pollId: string) {
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