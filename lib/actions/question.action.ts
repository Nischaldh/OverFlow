"use server";

import Question, { IQuestionDoc } from "@/database/question.model";
import action from "../handlers/actions";
import handleError from "../handlers/error";
import {
  AskQuestionSchema,
  DeleteQuestionSchema,
  EditQuestionSchema,
  GetQuestionSchema,
  IncrementViewsSchema,
  PaginatedSearchParamsSchema,
} from "../validations";
import mongoose, { Types, FilterQuery } from "mongoose";
import Tag, { ITagDoc } from "@/database/tag.model";
import TagQuestion, { ITagQuestion } from "@/database/tag-question.model";
import { NotFoundError, UnauthorizedError } from "../http-errors";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";
import dbConnect from "../mongoose";
import { Answer, Vote, Collection, Interaction } from "@/database";
import {
  CreateQuestionParams,
  DeleteQuestionParams,
  EditQuestionParams,
  GetQuestionParams,
  IncrementViewsParams,
} from "@/types/action";
import { createInteraction } from "./interaction.action";
import { after } from "next/server";
import { auth } from "@/auth";
import { recommendation_system } from "@/constants/recommendation";

export async function createQuestion(
  params: CreateQuestionParams
): Promise<ActionResponse<Question>> {
  const validationResult = await action({
    params,
    schema: AskQuestionSchema,
    authorize: true,
  });
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }
  if (!validationResult.params) {
    return {
      ...(handleError(new Error("Invalid parameters")) as ErrorResponse),
      data: undefined,
    };
  }
  const { title, content, tags } = validationResult.params;
  const userId = validationResult?.session?.user?.id;
  if (!userId) {
    return {
      ...(handleError(
        new Error("User ID not found in session")
      ) as ErrorResponse),
      data: undefined,
    };
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [question] = await Question.create(
      [{ title, content, author: userId }],
      { session }
    );
    if (!question) {
      throw new Error("Failed to create question");
    }
    const tagIds: mongoose.Types.ObjectId[] = [];
    const tagQuestionDocuments: ITagQuestion[] = [];
    for (const tag of tags) {
      const existingTag = await Tag.findOneAndUpdate(
        {
          name: { $regex: new RegExp(`^${tag}$`, "i") },
        },
        { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
        { upsert: true, new: true, session }
      );
      tagIds.push(existingTag._id);
      tagQuestionDocuments.push({
        question: question._id,
        tag: existingTag._id,
      });
    }
    await TagQuestion.insertMany(tagQuestionDocuments, { session });
    await Question.findByIdAndUpdate(
      question._id,
      { $push: { tags: { $each: tagIds } } },
      { session }
    );
    after(async () => {
      await createInteraction({
        action: "post",
        actionId: question._id.toString(),
        actionTarget: "question",
        authorId: userId as string,
      });
    });
    await session.commitTransaction();
    return {
      success: true,
      data: JSON.parse(JSON.stringify(question)),
      status: 201,
    };
  } catch (error) {
    await session.abortTransaction();
    return { ...(handleError(error) as ErrorResponse), data: undefined };
  } finally {
    session.endSession();
  }
}

export async function editQuestion(
  params: EditQuestionParams
): Promise<ActionResponse<IQuestionDoc>> {
  const validationResult = await action({
    params,
    schema: EditQuestionSchema,
    authorize: true,
  });
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }
  if (!validationResult.params) {
    return {
      ...(handleError(new Error("Invalid parameters")) as ErrorResponse),
      data: undefined,
    };
  }
  const { title, content, tags, questionId } = validationResult.params;
  const userId = validationResult?.session?.user?.id;
  if (!userId) {
    return {
      ...(handleError(
        new Error("User ID not found in session")
      ) as ErrorResponse),
      data: undefined,
    };
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const question = await Question.findById(questionId).populate("tags");

    if (!question) {
      throw new NotFoundError("Question not found");
    }
    if (question.author.toString() !== userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    if (question.title !== title || question.content !== content) {
      question.title = title;
      question.content = content;
      await question.save({ session });
    }
    const tagsToAdd = tags.filter(
      (tag) =>
        !question.tags.some((t: ITagDoc) =>
          t.name.toLowerCase().includes(tag.toLowerCase())
        )
    );
    const tagsToRemove = question.tags.filter(
      (tag: ITagDoc) =>
        !tags.some((t) => t.toLowerCase() === tag.name.toLowerCase())
    );

    const newTagDocuments = [];
    if (tagsToAdd.length > 0) {
      for (const tag of tags) {
        const existingTag = await Tag.findOneAndUpdate(
          {
            name: { $regex: `^${tag}$`, $options: "i" },
          },
          { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
          { upsert: true, new: true, session }
        );
        if (existingTag) {
          newTagDocuments.push({
            question: questionId,
            tag: existingTag._id,
          });
          question.tags.push(existingTag._id);
        }
      }
    }
    if (tagsToRemove.length > 0) {
      const tagIdsToRemove = tagsToRemove.map((tag: ITagDoc) => tag._id);
      await Tag.updateMany(
        { _id: { $in: tagIdsToRemove } },
        { $inc: { questions: -1 } },
        { session }
      );
      await TagQuestion.deleteMany(
        { tag: { $in: tagIdsToRemove }, question: questionId },
        { session }
      );
      question.tags = question.tags.filter(
        (tagId: mongoose.Types.ObjectId) =>
          !tagIdsToRemove.some((id: mongoose.Types.ObjectId) =>
            id.equals(tagId._id)
          )
      );
    }
    if (newTagDocuments.length > 0) {
      await TagQuestion.insertMany(newTagDocuments, { session });
    }
    await question.save({ session });
    await session.commitTransaction();
    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    await session.abortTransaction();
    return { ...(handleError(error) as ErrorResponse), data: undefined };
  } finally {
    session.endSession();
  }
}

export async function getQuestion(
  params: GetQuestionParams
): Promise<ActionResponse<Question>> {
  const validationResult = await action({
    params,
    schema: GetQuestionSchema,
    authorize: false,
  });
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }
  if (!validationResult.params) {
    return {
      ...(handleError(new Error("Invalid parameters")) as ErrorResponse),
      data: undefined,
    };
  }
  const { questionId } = validationResult.params;
  try {
    const question = await Question.findById(questionId)
      .populate("tags")
      .populate("author", "_id name image");
    if (!question) {
      throw new NotFoundError("Question not found");
    }
    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    return { ...(handleError(error) as ErrorResponse), data: undefined };
  }
}

export async function getQuestions(
  params: PaginatedSearchParams
): Promise<ActionResponse<{ questions: Question[]; isNext: boolean }>> {
  const validationResult = await action({
    params,
    schema: PaginatedSearchParamsSchema,
  });
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }
  const { page = 1, pageSize = 10, query, filter } = params;
  const skip = (Number(page) - 1) * pageSize;
  const limit = Number(pageSize);
  const filterQuery: FilterQuery<typeof Question> = {};
  if (filter === "recommended") {
    // fetch the logged-in user from session
    const session = await auth(); // returns { user?: { id: string } }
    const userId = session?.user?.id;

    if (!userId) {
      // user not logged in, cannot recommend
      return {
        success: true,
        data: { questions: [], isNext: false },
      };
    }

    try {
      const result = await recommendation_system({ userId, page, pageSize });
      return result;
    } catch (error) {
      return { ...(handleError(error) as ErrorResponse), data: undefined };
    }
  }
  if (query) {
    filterQuery.$or = [
      { title: { $regex: new RegExp(query, "i") } },
      { content: { $regex: new RegExp(query, "i") } },
    ];
  }
  let sortCriteria = {};
  switch (filter) {
    case "newest":
      sortCriteria = { createdAt: -1 };
      break;
    case "unanswered":
      filterQuery.answers = 0;
      sortCriteria = { createdAt: -1 };
      break;
    case "popular":
      sortCriteria = { upvotes: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }
  try {
    const totalQuestions = await Question.countDocuments(filterQuery);
    const questions = await Question.find(filterQuery)
      .populate("tags", "name")
      .populate("author", "name image")
      .lean()
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);
    const isNext = totalQuestions > skip + questions.length;
    return {
      success: true,
      data: { questions: JSON.parse(JSON.stringify(questions)), isNext },
    };
  } catch (error) {
    return { ...(handleError(error) as ErrorResponse), data: undefined };
  }
}

export async function increamentViews(
  params: IncrementViewsParams
): Promise<ActionResponse<{ views: number }>> {
  const validationResult = await action({
    params,
    schema: IncrementViewsSchema,
  });
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }
  const { questionId } = validationResult.params!;
  try {
    const question = await Question.findById(questionId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }
    question.views += 1;
    await question.save();

    return { success: true, data: { views: question.views } };
  } catch (error) {
    return { ...(handleError(error) as ErrorResponse), data: undefined };
  }
}

export async function getHotQuesions(): Promise<ActionResponse<Question[]>> {
  try {
    await dbConnect();
    const questions = await Question.find()
      .sort({ views: -1, upvotes: -1 })
      .limit(5);
    return {
      success: true,
      data: JSON.parse(JSON.stringify(questions)),
    };
  } catch (error) {
    return { ...(handleError(error) as ErrorResponse), data: undefined };
  }
}

export async function deleteQuestion(
  params: DeleteQuestionParams
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: DeleteQuestionSchema,
    authorize: true,
  });
  if (validationResult instanceof Error) {
    return {
      ...(handleError(validationResult) as ErrorResponse),
      data: undefined,
    };
  }
  const { questionId } = validationResult.params!;
  const { user } = validationResult.session!;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const question = await Question.findById(questionId).session(session);
    if (!question) {
      throw new NotFoundError("Qeuestion not found.");
    }
    if (question.author._id.toString() !== user?.id) {
      throw new UnauthorizedError(
        "You are not authorized to delete this question."
      );
    }
    await Collection.deleteMany({ question: questionId }, { session });
    await TagQuestion.deleteMany({ question: questionId }, { session });
    if (question.tags.length > 0) {
      await Tag.updateMany(
        { _id: { $in: question.tags } },
        { $inc: { questions: -1 } },
        { session }
      );
    }
    await Vote.deleteMany(
      {
        actionId: questionId,
        actionType: "question",
      },
      { session }
    );
    const answers = await Answer.find({ question: questionId }).session(
      session
    );
    if (answers.length > 0) {
      await Answer.deleteMany({ question: questionId }, { session });
      await Vote.deleteMany(
        {
          actionId: { $in: answers.map((answer) => answer.id) },
          actionType: "answer",
        },
        { session }
      );
    }
    await Question.findByIdAndDelete(questionId).session(session);
    await session.commitTransaction();
    session.endSession();
    revalidatePath(`/profile/${user?.id}`);
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return { ...(handleError(error) as ErrorResponse), data: undefined };
  }
}
