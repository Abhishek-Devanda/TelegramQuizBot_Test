import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import type { Message } from 'telegraf/types';
import mongoose from 'mongoose';

import axios from 'axios';
import User from '../models/User';
import Quiz from '../models/Quiz';
import Question from '../models/Question';
import { parseQuizFromExcel, getExcelTemplateInstructions } from '../utils/excelParser';

// Function to register the document handler
export function registerFileHandler(bot: Telegraf<Context>) {

    // Command to explain the format
    bot.command('uploadformat', (ctx) => {
        ctx.reply(getExcelTemplateInstructions());
    });
    bot.command('uploadQuiz', (ctx) => {
        ctx.reply(getExcelTemplateInstructions());
    });


    // Listen for document uploads
    bot.on(message('document'), async (ctx) => {
        const document = ctx.message?.document;
        const telegramUserId = ctx.from?.id;

        if (!document) return;
        if (!telegramUserId) {
            return ctx.reply("Could not identify user. Please /start the bot first.");
        }

        // Check MIME type for Excel files
        const mimeType = document.mime_type;
        const isExcel = mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
            || mimeType === 'application/vnd.ms-excel'; // .xls

        if (!isExcel) {
            return ctx.reply('Please upload a valid Excel file (.xlsx). Use /uploadformat to see the required structure.');
        }

        // Optional: Check file size
        if (document.file_size && document.file_size > 5 * 1024 * 1024) { // 5MB limit
            return ctx.reply('File is too large. Please keep it under 5MB.');
        }

        let session;
        let processingMessage: Message.TextMessage | null = null;
        try {
            // Get file file
            const fileLink = await ctx.telegram.getFileLink(document.file_id);
            const response = await axios({
                method: 'get',
                url: fileLink.href,
                responseType: 'arraybuffer' 
            });
            const fileBuffer = Buffer.from(response.data);
            processingMessage = await ctx.reply('⏳ Processing your Excel file...');

            // Parse the Excel file
            const { questions: parsedQuestionsData, errors } = await parseQuizFromExcel(fileBuffer);

            if (errors.length > 0) {
                const errorMsg = `Found errors in your Excel file:\n- ${errors.join('\n- ')}\nPlease fix them and upload again. Use /uploadformat for help.`;
                // Truncate if too long
                return ctx.reply(errorMsg.length > 4000 ? errorMsg.substring(0, 4000) + '...' : errorMsg);
            }

            if (parsedQuestionsData.length === 0) {
                return ctx.reply('No valid questions found in the file. Please check the format and content.');
            }

            // Find the user in DB
            const user = await User.findOne({ telegramUserId });
            if (!user) {
                return ctx.reply('Could not find your user record. Please /start the bot again.');
            }

            // --- Save Questions Separately ---
            session = await mongoose.startSession();
            session.startTransaction();

            // Save all parsed questions to the Question collection
            const savedQuestions = await Question.insertMany(parsedQuestionsData, { session });
            const questionIds = savedQuestions.map(q => q._id); // Get the ObjectIds

            const quizName = document.file_name?.replace(/\.(xlsx|xls)$/i, '') || `Quiz from ${document.file_name}`;

            const newQuiz = new Quiz({
                name: quizName,
                createdBy: user._id,
                questions: questionIds,
                // delaySeconds: default value from model
            });
            await newQuiz.save({ session });

            // If everything succeeded, commit the transaction
            await session.commitTransaction();
            // --- End Transaction ---

            ctx.reply(`✅ Successfully created quiz "${quizName}" with ${parsedQuestionsData.length} questions from your file!`);

        } catch (error: any) {
            // If any error occurred, abort the transaction
            if (session) {
                await session.abortTransaction();
            }
            console.error('Error processing uploaded Excel file:', error);
            let userMessage = 'An unexpected error occurred while processing your file.';
            if (axios.isAxiosError(error)) {
                userMessage = 'Failed to download the file from Telegram.';
            } else if (error.message.includes('read-excel-file')) {
                userMessage = 'There was an issue reading the Excel file structure. Please ensure it is a valid .xlsx file.';
            } else if (error instanceof mongoose.Error) {
                userMessage = 'There was an issue saving the quiz or questions to the database.';
            }
            ctx.reply(`${userMessage} Please try again later.`);
        } finally {
            // End the session
            if (session) {
                await session.endSession();
            }
            if (processingMessage) {
                try {
                    await ctx.deleteMessage(processingMessage.message_id);
                } catch (deleteError) {
                    console.error("Failed to delete 'Processing...' message:", deleteError);
                }
            }
        }
    });
}