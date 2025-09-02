import { Document, model, models, Schema, Types } from "mongoose";

export interface ITagScore {
  [tag: string]: number;
}

export interface IUserInteraction {
  user: Types.ObjectId;
  questions: Types.ObjectId[];
  tags: ITagScore;
}
export interface IUserInteractionDoc extends IUserInteraction, Document{}
const UserInteractionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    questions: [
      { type: Schema.Types.ObjectId, ref: "Question", required: true },
    ],
    tags: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

const UserInteraction =
  models?.UserInteraction ||
  model<IUserInteraction>("UserInteraction", UserInteractionSchema);
export default UserInteraction;