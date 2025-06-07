"use server";

import Question from "@/database/question.model";
import action from "../handlers/actions";
import handleError from "../handlers/error";
import {
  AskQuestionSchema,
  EditQuestionSchema,
  GetQuestionSchema,
} from "../validations";
import mongoose from "mongoose";
import Tag, { ITagDoc } from "@/database/tag.model";
import TagQuestion, { ITagQuestion } from "@/database/tag-question.model";
import { NotFoundError, UnauthorizedError } from "../http-errors";

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
): Promise<ActionResponse<Question>> {
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
      (tag) => !question.tags.includes(tag.toLowerCase())
    );
    const tagsToRemove = question.tags.filter(
      (tag: ITagDoc) => !tags.includes(tag.name.toLowerCase())
    );

    const newTagDocuments = [];
    if (tagsToAdd.length > 0) {
      for (const tag of tags) {
        const existingTag = await Tag.findOneAndUpdate(
          {
            name: { $regex: new RegExp(`^${tag}$`, "i") },
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
        (tagId: mongoose.Types.ObjectId) => !tagsToRemove.includes(tagId)
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
  const { questionId } = validationResult.params;
  try {
    const question = await Question.findById(questionId).populate("tags");
    if (!question) {
      throw new NotFoundError("Question not found");
    }
    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    return { ...(handleError(error) as ErrorResponse), data: undefined };
  }
}

