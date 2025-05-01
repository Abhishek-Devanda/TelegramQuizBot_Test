import { Telegraf, Context } from 'telegraf';
import axios from 'axios';
import User from '../models/User';
import Quiz from '../models/Quiz';
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
    bot.on('document', async (ctx) => {
        const document = ctx.message?.document;
        const telegramId = ctx.from?.id;

        if (!document) return;
        if (!telegramId) {
            return ctx.reply("Could not identify user. Please /start the bot first.");
        }

        // Check MIME type for Excel files
        const mimeType = document.mime_type;
        const isExcel = mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
            || mimeType === 'application/vnd.ms-excel'; // .xls (might need different parser)

        if (!isExcel) {
            return ctx.reply('Please upload a valid Excel file (.xlsx). Use /uploadformat to see the required structure.');
        }

        // Optional: Check file size
        if (document.file_size && document.file_size > 5 * 1024 * 1024) { // 5MB limit
            return ctx.reply('File is too large. Please keep it under 5MB.');
        }

        try {
            // Get file link
            const fileLink = await ctx.telegram.getFileLink(document.file_id);

            // Download the file
            const response = await axios({
                method: 'get',
                url: fileLink.href,
                responseType: 'arraybuffer' // Important for binary data
            });

            const fileBuffer = Buffer.from(response.data);

            // Parse the Excel file
            await ctx.reply('Processing your Excel file...');
            const { questions, errors } = await parseQuizFromExcel(fileBuffer);

            if (errors.length > 0) {
                // Send detailed errors back to the user
                const errorMsg = `Found errors in your Excel file:\n- ${errors.join('\n- ')}\nPlease fix them and upload again. Use /uploadformat for help.`;
                // Truncate if too long
                return ctx.reply(errorMsg.length > 4000 ? errorMsg.substring(0, 4000) + '...' : errorMsg);
            }

            if (questions.length === 0) {
                return ctx.reply('No valid questions found in the file. Please check the format and content.');
            }

            // Find the user in DB
            const user = await User.findOne({ telegramId });
            if (!user) {
                return ctx.reply('Could not find your user record. Please /start the bot again.');
            }

            // Create and save the quiz
            // Use the filename as the default quiz name, removing extension
            const quizName = document.file_name?.replace(/\.(xlsx|xls)$/i, '') || `Quiz from ${document.file_name}`;

            const newQuiz = new Quiz({
                name: quizName,
                createdBy: user._id,
                questions: questions, // Parsed questions
                // delaySeconds: default value from model
            });
            await newQuiz.save();

            ctx.reply(`Successfully created quiz "${quizName}" with ${questions.length} questions from your file!`);

        } catch (error: any) {
            console.error('Error processing uploaded Excel file:', error);
            let userMessage = 'An unexpected error occurred while processing your file.';
            if (axios.isAxiosError(error)) {
                userMessage = 'Failed to download the file from Telegram.';
            } else if (error.message.includes('read-excel-file')) {
                userMessage = 'There was an issue reading the Excel file structure. Please ensure it is a valid .xlsx file.';
            }
            ctx.reply(`${userMessage} Please try again later.`);
        }
    });
}