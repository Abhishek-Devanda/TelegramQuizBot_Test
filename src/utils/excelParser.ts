import readXlsxFile, { type Schema } from 'read-excel-file/node';
import { type IQuestion } from '../models/Quiz'; // Assuming IQuestion is exported from Quiz model

// Define the expected schema for the Excel file
// Columns: Question, Option A, Option B, Option C, Option D, ..., Correct Option Letter (e.g., A, B, C)
const excelSchema: Schema<ParsedRow> = {
    'Question': { prop: 'text', type: String, required: true },
    'Option A': { prop: 'optionA', type: String, required: true },
    'Option B': { prop: 'optionB', type: String, required: true },
    'Option C': { prop: 'optionC', type: String },
    'Option D': { prop: 'optionD', type: String },
    // Add more options if needed (e.g., Option E, Option F)
    'Correct Option Letter': { prop: 'correctLetter', type: String, required: true }
};

interface ParsedRow {
    text: string;
    optionA: string;
    optionB: string;
    optionC?: string;
    optionD?: string;
    correctLetter: string;
}

interface ParsedQuiz {
    questions: Partial<IQuestion>[];
    errors: string[];
}

export async function parseQuizFromExcel(fileBuffer: Buffer): Promise<ParsedQuiz> {
    const result: ParsedQuiz = { questions: [], errors: [] };

    try {
        const { rows, errors: parseErrors } = await readXlsxFile<ParsedRow>(fileBuffer, { schema: excelSchema });

        if (parseErrors.length > 0) {
            parseErrors.forEach(err => result.errors.push(`Row ${err.row}: Column "${err.column}" - ${err.error}`));
            // Optionally decide if *any* error should halt processing
            // return result;
        }

        if (rows.length === 0) {
            result.errors.push("The Excel file seems empty or doesn't match the required format.");
            return result;
        }

        rows.forEach((row, index) => {
            const options: string[] = [row.optionA, row.optionB];
            if (row.optionC) options.push(row.optionC);
            if (row.optionD) options.push(row.optionD);
            // Add more options if schema supports them

            const correctLetterUpper = row.correctLetter.toUpperCase();
            let correctOptionIndex = -1;

            // Determine index based on letter (A=0, B=1, C=2, ...)
            if (correctLetterUpper === 'A') correctOptionIndex = 0;
            else if (correctLetterUpper === 'B') correctOptionIndex = 1;
            else if (correctLetterUpper === 'C' && options.length > 2) correctOptionIndex = 2;
            else if (correctLetterUpper === 'D' && options.length > 3) correctOptionIndex = 3;
            // Add more letters if needed

            if (correctOptionIndex === -1 || correctOptionIndex >= options.length) {
                result.errors.push(`Row ${index + 2}: Invalid or out-of-bounds Correct Option Letter "${row.correctLetter}".`);
                return; // Skip this question
            }

            if (!row.text) {
                 result.errors.push(`Row ${index + 2}: Question text is missing.`);
                 return; // Skip this question
            }

            result.questions.push({
                text: row.text,
                options: options,
                correctOptionIndex: correctOptionIndex,
            });
        });

    } catch (error: any) {
        console.error("Error parsing Excel file:", error);
        result.errors.push(`Failed to process the Excel file. Ensure it's a valid .xlsx file and matches the format. Error: ${error.message}`);
    }

    return result;
}

export function getExcelTemplateInstructions(): string {
    return `Please upload an Excel (.xlsx) file with the following columns in the first sheet:
1.  **Question**: The text of the question.
2.  **Option A**: Text for the first choice.
3.  **Option B**: Text for the second choice.
4.  **Option C**: (Optional) Text for the third choice.
5.  **Option D**: (Optional) Text for the fourth choice.
6.  **Correct Option Letter**: The letter (A, B, C, or D) corresponding to the correct answer.

The first row should contain these exact headers. Each subsequent row represents one question.`;
}