"use client";
import { createVote } from "@/lib/actions/vote.action";
import { formatNumber } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, { use, useState } from "react";
import { toast } from "sonner";

interface Params {
  targetId: string;
  targetType: "question" | "answer";
  upvotes: number;
  downvotes: number;
  hasVotedPromise: Promise<ActionResponse<HasVotedResponse>>;
}
const Votes = ({
  targetId,
  targetType,
  upvotes,
  downvotes,
  hasVotedPromise,
}: Params) => {
  const session = useSession();
  const userId = session.data?.user?.id;
  const { success, data } = use(hasVotedPromise);
  const [isLoading, setIsLoading] = useState(false);
  const { hasUpvoted, hasDownvoted } = data || {};

  const handleVotes = async (voteType: "upvote" | "downvote") => {
    if (!userId) return toast.error("Please Login to Vote");
    setIsLoading(true);
    try {
      const result = await createVote({ targetId, targetType, voteType });
      console.log(result);
      if(!result.success){
        return toast.error(result.error?.message)
      }
      const successMessage =
        voteType === "upvote"
          ? `Upvote ${!hasUpvoted ? "added" : "removed"} successfully`
          : `Downvote ${!hasDownvoted ? "added" : "removed"} successfully`;
      toast.success("Your vote has been recorded");
    } catch (error) {
      toast.error("An error occurred while voting.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex-center gap-2.5">
      <div className="flex-center gap-1.5">
        <Image
          src={success && hasUpvoted ? "/icons/upvoted.svg" : "/icons/upvote.svg"}
          width={18}
          height={18}
          alt="upvote"
          className={`cursor-pointer ${isLoading && "opacity-50"}`}
          arai-label="Upvote"
          onClick={() => !isLoading && handleVotes("upvote")}
        />
        <div className="flex-center background-light700_dark400 min-w-5 rounded-sm p-1">
          <p className="subtle-medium text-dark400_ligth900">
            {formatNumber(upvotes)}
          </p>
        </div>
      </div>
      <div className="flex-center gap-1.5">
        <Image
          src={success && hasDownvoted ? "/icons/downvoted.svg" : "/icons/downvote.svg"}
          width={18}
          height={18}
          alt="upvote"
          className={`cursor-pointer ${isLoading && "opacity-50"}`}
          arai-label="Downvote"
          onClick={() => !isLoading && handleVotes("downvote")}
        />
        <div className="flex-center background-light700_dark400 min-w-5 rounded-sm p-1">
          <p className="subtle-medium text-dark400_ligth900">
            {formatNumber(downvotes)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Votes;
