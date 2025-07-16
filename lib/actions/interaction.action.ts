"use server";

import Interaction, { IInteractionDoc } from "@/database/interaction.model";
import action from "../handlers/actions";
import { CreateInteractionSchema } from "../validations";
import handleError from "../handlers/error";
import mongoose, { Mongoose } from "mongoose";
import {
  CreateInteractionParams,
  UpdateRepudationParams,
} from "@/types/action";
import { User } from "@/database";

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

      await session.commitTransaction();
      return { success: true, data: JSON.parse(JSON.stringify(interaction)) };
    };
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
