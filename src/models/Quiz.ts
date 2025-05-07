import mongoose, { Document, Schema, Types } from 'mongoose';
import type { IQuestion } from './Question';
import { customAlphabet } from 'nanoid';

const ALPHANUMERIC_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateQuizId = customAlphabet(ALPHANUMERIC_ALPHABET, 10); // Adjust length as needed

// Interface for Quiz document
export interface IQuiz extends Document {
  _id: Types.ObjectId;
  quizId: string;
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  questions: IQuestion[];
  delaySeconds: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for Quiz document
const QuizSchema: Schema = new Schema(
  {
    quizId: {
      type: String,
      required: true,
      unique: true,
      default: () => generateQuizId(),
      index: true, 
    },
    name: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questions: { type: [Schema.Types.ObjectId], ref: 'Question', required: true },
    delaySeconds: { type: Number, default: 15 }, // Default delay
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
