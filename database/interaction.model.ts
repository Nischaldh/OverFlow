import { Document, model, models, Schema, Types } from "mongoose";

export const InteractionActionEnums = [
  "view",
  "upvote",
  "downvote",
  "bookmark",
  "unbookmark",
  "post",
  "edit",
  "delete",
  "search",
] as const;
export interface IInteraction {
  user: Types.ObjectId;
  action: string;
  actionId: Types.ObjectId;
  actionType: "question" | "answer";
}

export interface IInteractionDoc extends IInteraction, Document {}

const InteractionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: InteractionActionEnums, required: true },
    actionId: { type: Schema.Types.ObjectId, required: true },
    actionType: { type: String, enum: ["question", "answer"], required: true },
  },
  { timestamps: true }
);

const Interaction =
  models?.Interaction || model("Interaction", InteractionSchema);

export default Interaction;
