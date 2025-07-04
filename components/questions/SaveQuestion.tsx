"use client";

import { toggleSaveQuestion } from "@/lib/actions/collection.action";
import { Description } from "@radix-ui/react-toast";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { use, useState } from "react";
import {  toast } from "sonner";

const SaveQuestion = ({
  questionId,
  hasSavedQuestionPromise,
}: {
  questionId: string;
  hasSavedQuestionPromise: Promise<ActionResponse<{ saved: boolean }>>;
}) => {
  const session = useSession();
  const userId = session?.data?.user?.id;
  const [isLoading, setIsLoading] = useState(false);
  const { data } = use(hasSavedQuestionPromise);
  const { saved: hasSaved } = data || {};
  const handleSave = async () => {
    if (isLoading) return;
    if (!userId)
      return toast.error("You need to be logged in to save a question.");
    setIsLoading(true);
    try {
      const { success, data, error } = await toggleSaveQuestion({ questionId });
      if (!success) throw new Error(error?.message || "An error occured");
      if (data?.saved) {
        toast.success(`Question saved Successfully`);
      } else {
        toast.success(`Question unsaved Successfully.`);
      }
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Image
      src={hasSaved ? "/icons/star-filled.svg" : "/icons/star-red.svg"}
      width={18}
      height={18}
      alt="save"
      className={`cursor-pointer ${isLoading && "opacity-50"}`}
      aria-label="Save Question"
      onClick={handleSave}
    />
  );
};

export default SaveQuestion;
