import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for Question subdocument
export interface IQuestion extends Document {
  text: string;
  options: string[];
  correctOptionIndex: number;
}

// Schema for Question subdocument
const QuestionSchema: Schema = new Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }], // Array of possible answers
  correctOptionIndex: { type: Number, required: true }, // Index of the correct answer in the options array
});

// Interface for Quiz document
export interface IQuiz extends Document {
  _id: Types.ObjectId;
  name: string;
  createdBy: Types.ObjectId;
  questions: IQuestion[];
  delaySeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for Quiz document
const QuizSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questions: [QuestionSchema], // Embed questions within the quiz document
    delaySeconds: { type: Number, default: 15 }, // Default delay
  },
  { timestamps: true }
);

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema); // Export Question model if needed separately
export default mongoose.model<IQuiz>('Quiz', QuizSchema);
