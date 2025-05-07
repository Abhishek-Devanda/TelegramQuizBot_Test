import mongoose, { Schema, Types, Document } from "mongoose";
import { nanoid } from "nanoid";

export interface IQuestion extends Document {
    _id: Types.ObjectId;
    questionId: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
}

const QuestionSchema: Schema = new Schema({
    questionId: {
        type: String,
        required: true,
        unique: true,
        default: () => nanoid(8),
        index: true,
    },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
});


export default mongoose.model<IQuestion>('Question', QuestionSchema);