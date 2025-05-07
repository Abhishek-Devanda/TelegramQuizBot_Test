import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPollAnswer extends Document {
  _id: Types.ObjectId;
  telegramUserId: number;
  quizId: string;         
  questionId: string; 
  pollId: string;
  selectedOption: number;
  isCorrect: boolean;
  answeredAt: Date;
}

const PollAnswerSchema = new Schema<IPollAnswer>({
  telegramUserId: { type: Number, required: true },
  pollId: { type: String, required: true, index: true },
  quizId: { type: String, required: true }, 
  questionId: { type: String, required: true },
  selectedOption: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
  answeredAt: { type: Date, default: Date.now() }
});

export default mongoose.model<IPollAnswer>("PollAnswer", PollAnswerSchema);