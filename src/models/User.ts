import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    username: { type: String },
  },
  { timestamps: true } // Adds createdAt and updatedAt timestamps
);

export default mongoose.model<IUser>('User', UserSchema);
