"use server";

import  { IAnswerDoc } from "@/database/answer.model";
import action from "../handlers/actions";
import {
  AnswerServerSchema,
  DeleteAnswerSchema,
  GetAnswersSchema,
} from "../validations";
import handleError from "../handlers/error";
import mongoose from "mongoose";
import { Question, Vote , Answer} from "@/database";
import {
  NotFoundError,
  UnauthorizedError, 
} from "../http-errors";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";

export async function createAnswer(
  params: CreateAnswerParams
): Promise<ActionResponse<IAnswerDoc>> {
  const validationResult = await action({
    params,
    schema: AnswerServerSchema,
    authorize: true,
  });
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }
  const { content, questionId } = validationResult.params!;
  const userId = validationResult?.session?.user?.id;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const question = await Question.findById(questionId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }
    const [newAnswer] = await Answer.create(
      [
        {
          author: userId,
          question: questionId,
          content,
        },
      ],
      { session }
    );
    if (!newAnswer) {
      throw new Error("Failed to create answer");
    }
    question.answers += 1;
    await question.save({ session });
    await session.commitTransaction();
    revalidatePath(ROUTES.QUESTIONS(questionId));
    return { success: true, data: JSON.parse(JSON.stringify(newAnswer)) };
  } catch (error) {
    await session.abortTransaction();
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  } finally {
    session.endSession();
  }
}

export async function getAnswers(params: GetAnswersParams): Promise<
  ActionResponse<{
    answers: Answer[];
    isNext: boolean;
    totalAnswer: number;
  }>
> {
  const validationResult = await action({
    params,
    schema: GetAnswersSchema,
  });
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }
  const { questionId, page = 1, pageSize = 10, filter } = params;
  const skip = (Number(page) - 1) * pageSize;
  const limit = pageSize;
  let sortCriteria = {};
  switch (filter) {
    case "latest":
      sortCriteria = { createdAt: -1 };
      break;
    case "oldest":
      sortCriteria = { createdAt: 1 };
      break;
    case "popular":
      sortCriteria = { upvotes: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }
  try {
    const totalAnswer = await Answer.countDocuments({ question: questionId });
    const answers = await Answer.find({ question: questionId })
      .populate("author", "_id name image")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);
    const isNext = totalAnswer > skip + answers.length;
    return {
      success: true,
      data: {
        answers: JSON.parse(JSON.stringify(answers)),
        isNext,
        totalAnswer,
      },
    };
  } catch (error) {
    return {
      ...(handleError(error) as ErrorResponse),
      data: undefined,
    };
  }
}

export async function deleteAnswer(
  params: DeleteAnswerParams
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: DeleteAnswerSchema,
    authorize: true,
  });
  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }
  const { answerId } = validationResult.params!;
  const { user } = validationResult.session!;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const answer = await Answer.findById(answerId).session(session);
    if (!answer) {
      throw new NotFoundError("Answer doesnot exist.");
    }
    if (answer.author.toString() !== user?.id) {
      throw new UnauthorizedError(
        "You are not authorized to delete the answer."
      );
    }
    await Question.findByIdAndUpdate(
      answerId,
      { $inc: { answers: -1 } },
      { new: true }
    );
    await Vote.deleteMany({ actionId: answerId, actionType: "answer" });
    await Answer.findByIdAndDelete(answerId).session(session);
    revalidatePath(`/profile/${user?.id}`);
    session.commitTransaction();
    session.endSession();
    return { success: true };
  } catch (error) {
    session.abortTransaction();
    session.endSession();
    return handleError(error) as ErrorResponse;
  }
}
