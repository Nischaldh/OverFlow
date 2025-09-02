"use server";

import Interaction, { IInteractionDoc } from "@/database/interaction.model";
import action from "../handlers/actions";
import { CreateInteractionSchema, updateUserInteractionSchema } from "../validations";
import handleError from "../handlers/error";
import mongoose, { Mongoose, Types } from "mongoose";
import {
  CreateInteractionParams,
  UpdateRepudationParams,
  UpdateUserInteractionParams,
} from "@/types/action";
import { Answer, Question, User, UserInteraction } from "@/database";
import { RECOMMENDATION_ACTIONS } from "../utils";
import { Interaction_Weights } from "@/constants";

export async function createInteraction(
  params: CreateInteractionParams
): Promise<ActionResponse<IInteractionDoc>> {
  const validationResult = await action({
    params,
    schema: CreateInteractionSchema,
    authorize: true,
  });
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }
  const {
    action: actionType,
    actionTarget,
    actionId,
    authorId,
  } = validationResult.params!;
  const userId = validationResult.session?.user?.id;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let interactionExists = await Interaction.findOne({
      user: userId,
      actionId,
      action: actionType,
      actionType: actionTarget,
    }).session(session);
    if (interactionExists) {
      interactionExists.action = actionType;
      await interactionExists.save({ session });
      await updateRepudation({
        interaction: interactionExists,
        session,
        performerId: userId!,
        authorId,
      });
      await session.commitTransaction();
      return {
        success: true,
        data: JSON.parse(JSON.stringify(interactionExists)),
      };
    } else {
      const [interaction] = await Interaction.create(
        [
          {
            user: userId,
            action: actionType,
            actionId,
            actionType: actionTarget,
          },
        ],
        { session }
      );

      await updateRepudation({
        interaction,
        session,
        performerId: userId!,
        authorId,
      });
  if (["view", "upvote", "downvote", "bookmark", "unbookmark", "post", "answer"].includes(actionType)) {
  let tags: string[] = [];
  let answer: { question?: Types.ObjectId } | null = null;

  if (actionTarget === "question") {
    // Fetch question tags
    const question = await Question.findById(actionId)
      .select("tags")
      .lean<{ tags: Types.ObjectId[] }>(); // Explicit type

    tags = question?.tags.map(tag => tag.toString()) || [];

  } else if (actionTarget === "answer") {
    // Fetch the answer and then its question tags
    answer = await Answer.findById(actionId)
      .select("question")
      .lean<{ question: Types.ObjectId }>(); // Explicit type

    if (answer?.question) {
      const question = await Question.findById(answer.question)
        .select("tags")
        .lean<{ tags: Types.ObjectId[] }>(); // Explicit type

      tags = question?.tags.map(tag => tag.toString()) || [];
    }
  }

  // Call updateUserInteraction with proper params
  if (!userId) throw new Error("userId is required for updateUserInteraction");
  await updateUserInteraction({
    userId: userId,
    questionId: actionTarget === "question" ? actionId : (answer?.question?.toString() || ""),
    tags,
    action: actionType,
    session,
  });
}

      await session.commitTransaction();
      return { success: true, data: JSON.parse(JSON.stringify(interaction)) };
    }
  } catch (error) {
    session.abortTransaction();
    return {
      ...(handleError(error) as ErrorResponse),
      data: undefined,
    };
  } finally {
    session.endSession();
  }
}

async function updateRepudation(params: UpdateRepudationParams) {
  const { interaction, session, performerId, authorId } = params;
  const { action, actionType } = interaction;
  let performerPoints = 0;
  let authorPoints = 0;
  switch (action) {
    case "upvote":
      performerPoints = 2;
      authorPoints = 10;
      break;
    case "downvote":
      performerPoints = -1;
      authorPoints = -2;
      break;
    case "post":
      authorPoints = actionType === "question" ? 5 : 10;
      break;
    case "delete":
      authorPoints = actionType === "question" ? -5 : -10;
      break;
  }
  if (performerId === authorId) {
    await User.findByIdAndUpdate(
      performerId,
      { $inc: { reputation: authorPoints } },
      { session }
    );

    return;
  }

  await User.bulkWrite(
    [
      {
        updateOne: {
          filter: { _id: performerId },
          update: { $inc: { reputation: performerPoints } },
        },
      },
      {
        updateOne: {
          filter: { _id: authorId },
          update: { $inc: { reputation: authorPoints } },
        },
      },
    ],
    { session }
  );
}

export async function updateUserInteraction(
  params: UpdateUserInteractionParams
) {
  const { userId, questionId, tags, action: actionType, session } = params;
  const validationResult = await action({
    params,
    schema : updateUserInteractionSchema,
    authorize: false,
  })
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }

  if (!RECOMMENDATION_ACTIONS.has(actionType)) return;
   if (!Object.prototype.hasOwnProperty.call(Interaction_Weights, actionType)) return;
   const weight = Interaction_Weights[actionType as keyof typeof Interaction_Weights];
   if (weight === undefined) return;


  
  let userInteraction = await UserInteraction.findOne({ user: userId });

  if (!userInteraction) {
    userInteraction = new UserInteraction({
      user: userId,
      questions: [],
      tags: {},
    });
  }

  
  if (!userInteraction.questions.includes(questionId)) {
    userInteraction.questions.push(questionId);
  }

 
 for (const tag of tags || []) {
    if (!tag) continue;
    const current = userInteraction.tags.get(tag) || 0;
    userInteraction.tags.set(tag, current + weight);
  }

  await userInteraction.save({ session });
}