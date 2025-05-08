import { model, models, Schema, Types } from "mongoose";

export interface IQuestionSchema {
  title: string;
  content: string;
  tags: Types.ObjectId[];
  views: number;
  answers: number;
  upvotes: number;
  downvotes: number;
  author: Types.ObjectId;
}

const QuestionSchema = new Schema<IQuestionSchema>(
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
  models?.Question || model<IQuestionSchema>("Question", QuestionSchema);

export default Question;
