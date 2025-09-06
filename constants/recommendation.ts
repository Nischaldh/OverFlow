import { Question, UserInteraction } from "@/database";
import handleError from "@/lib/handlers/error";
import { CBFResult, CFResult, PopularityResult, RecommendationParams } from "@/types/action";


function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}


export async function content_based_filtering(userId: string): Promise<CBFResult[]> {
  // Fetch user interactions
  const userInteraction = await UserInteraction.findOne({ user: userId }).lean();
  if (!userInteraction) {
    console.log("No user interaction found for user:", userId);
    return [];
  }

  const userTags =
    !Array.isArray(userInteraction) && userInteraction.tags
      ? userInteraction.tags
      : {};
  const userTagSet = new Set(Object.keys(userTags));

  // Fetch all questions with populated tags
  const questions = await Question.find()
    .populate("tags", "name") // populate tag names
    .lean();

  const results: CBFResult[] = [];

  for (const q of questions) {
    // Safely extract tag names
    const questionTags: string[] = (q.tags || []).map((tag: any) => {
      if (typeof tag === "object" && tag !== null && "name" in tag) {
        return tag.name.toString();
      }
      return tag.toString();
    });

    if (questionTags.length === 0) continue; // skip questions with no tags
    const allTags = Array.from(new Set([...questionTags, ...userTagSet]));
    const userVector = allTags.map(tag => userTags[tag] || 0);
    const questionVector = allTags.map(tag => (questionTags.includes(tag) ? 1 : 0));
    const similarity = cosineSimilarity(userVector, questionVector);
    if (similarity > 0) {
      results.push({
        questionId: (q._id as string | { toString(): string }).toString(),
        score: similarity,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  console.log("CBF Results for user", userId, ":", results);
  return results;
}

export async function collaborative_filtering(userId: string): Promise<CFResult[]> {
  // Fetch target user interactions
  const targetUser = await UserInteraction.findOne({ user: userId }).lean();
  if (!targetUser) return [];

  const targetTags =
    !Array.isArray(targetUser) && targetUser.tags
      ? targetUser.tags
      : {};
  const targetTagSet = new Set(Object.keys(targetTags));

  // Fetch other users' interactions
  const otherUsers = await UserInteraction.find({ user: { $ne: userId } }).lean();
  if (!otherUsers || otherUsers.length === 0) return [];

  const questionScores: Record<string, number> = {};

  for (const other of otherUsers) {
    const otherTags = other.tags || {};
    const allTags = Array.from(new Set([...targetTagSet, ...Object.keys(otherTags)]));

    const targetVector = allTags.map(tag => targetTags[tag] || 0);
    const otherVector = allTags.map(tag => otherTags[tag] || 0);

    const similarity = cosineSimilarity(targetVector, otherVector);
    if (similarity <= 0) continue;

    // For each question the other user interacted with, add weighted score
    for (const qId of other.questions || []) {
      // Skip if target user already interacted
      if ((targetUser as any)?.questions?.includes(qId)) continue;

      questionScores[qId.toString()] = (questionScores[qId.toString()] || 0) + similarity;
    }
  }

  // Convert to array and sort by score descending
  const results: CFResult[] = Object.entries(questionScores).map(([questionId, score]) => ({
    questionId,
    score,
  }));

  results.sort((a, b) => b.score - a.score);
  return results;
}

export async function popularity_score(userId: string): Promise<PopularityResult[]> {
  // Fetch all questions with upvotes, answers, views
  const questions = await Question.find()
    .select("upvotes answers views")
    .lean();

  if (!questions || questions.length === 0) return [];

  // Find max values
  const maxUpvotes = Math.max(...questions.map(q => q.upvotes || 0), 1);
  const maxAnswers = Math.max(...questions.map(q => q.answers || 0), 1);
  const maxViews   = Math.max(...questions.map(q => q.views || 0), 1);

  const w1 = 0.5; // weight for upvotes
  const w2 = 0.3; // weight for answers
  const w3 = 0.2; // weight for views

  // Compute normalized scores
  const results: PopularityResult[] = questions.map(q => {
    const upvoteScore = (q.upvotes || 0) / maxUpvotes;
    const answerScore = (q.answers || 0) / maxAnswers;
    const viewScore   = (q.views || 0) / maxViews;

    const score = (upvoteScore * w1) + (answerScore * w2) + (viewScore * w3);

    return {
      questionId: (q._id as string | { toString(): string }).toString(),
      score,
    };
  });

  // Sort by popularity score
  results.sort((a, b) => b.score - a.score);

  return results;
}

export async function recommendation_system(
  params: RecommendationParams
) {
  const { userId, page = 1, pageSize = 10 } = params;
  try {
    // Run all recommenders
    const [cbf, cf, pop] = await Promise.all([
      content_based_filtering(userId),
      collaborative_filtering(userId),
      popularity_score(userId),
    ]);

    // Convert results into maps
    const cbfMap = new Map(cbf.map(q => [q.questionId, q.score]));
    const cfMap = new Map(cf.map(q => [q.questionId, q.score]));
    const popMap = new Map(pop.map(q => [q.questionId, q.score]));

    // Union of all questionIds
    const allQuestionIds = new Set([
      ...cbfMap.keys(),
      ...cfMap.keys(),
      ...popMap.keys(),
    ]);

    // Weights
    const wCBF = 0.5;
    const wCF = 0.3;
    const wPop = 0.2;

    // Merge scores
    let finalScores: { questionId: string; score: number }[] = [];
    for (const qId of allQuestionIds) {
      const cbfScore = cbfMap.get(qId) || 0;
      const cfScore = cfMap.get(qId) || 0;
      const popScore = popMap.get(qId) || 0;

      const score = cbfScore * wCBF + cfScore * wCF + popScore * wPop;

      // ✅ Only push if score > 0.6
      if (score > 0.6) {
        finalScores.push({ questionId: qId, score });
      }
    }

    // Sort by final score
    finalScores.sort((a, b) => b.score - a.score);

    // Apply pagination
    const skip = (page - 1) * pageSize;
    const paginated = finalScores.slice(skip, skip + pageSize);
    const isNext = finalScores.length > skip + paginated.length;

    // Fetch full question data
    const questions = await Question.find({
      _id: { $in: paginated.map(p => p.questionId) },
    })
      .populate("tags", "name")
      .populate("author", "name image")
      .lean();

    // Map questions with scores
    const questionMap = new Map(
      questions.map(q => [(q._id as string | { toString(): string }).toString(), q])
    );

    const orderedQuestions = paginated
      .map(p => {
        const q = questionMap.get(p.questionId);
        if (q) {
          return { ...q, finalScore: p.score }; // ✅ Attach final score
        }
        return null;
      })
      .filter(Boolean);

    console.log("Final Recommended Questions:", orderedQuestions);

    return {
      success: true,
      data: {
        questions: JSON.parse(JSON.stringify(orderedQuestions)),
        isNext,
      },
    };
  } catch (error) {
    return { ...(handleError(error) as ErrorResponse), data: undefined };
  }
}