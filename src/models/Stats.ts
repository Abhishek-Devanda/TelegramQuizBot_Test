import mongoose, { Schema, Document, Types } from "mongoose";

export interface IQuizStats extends Document {
    quizId: string;
    userId: Types.ObjectId;
    total: number;
    correct: number;
    wrong: number;
    missed: number;
}

const QuizStatsSchema = new Schema<IQuizStats>({
    quizId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    total: { type: Number, required: true },
    correct: { type: Number, required: true },
    wrong: { type: Number, required: true },
    missed: { type: Number, required: true },
});

QuizStatsSchema.index({ quizId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IQuizStats>("QuizStats", QuizStatsSchema);