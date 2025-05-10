import { Document, model, models, Schema, Types } from "mongoose";

export interface IQuestion {
  title: string;
  content: string;
  tags: Types.ObjectId[];
  views: number;
  answers: number;
  upvotes: number;
  downvotes: number;
  author: Types.ObjectId;
}
export interface IQuestionDoc extends IQuestion, Document {}

const QuestionSchema = new Schema<IQuestion>(
  {
    title: { String, required: true },
    content: { String, required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag", required: true }],
    views: { Number, default: 0 },
    answers: { Number, default: 0 },
    upvotes: { Number, default: 0 },
    downvotes: { Number, default: 0 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Question =
  models?.Question || model<IQuestion>("Question", QuestionSchema);

export default Question;
