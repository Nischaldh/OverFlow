"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAnswer } from "@/lib/actions/answer.action";
import { deleteQuestion } from "@/lib/actions/question.action";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
interface Props {
  type: string;
  itemId: string;
}

const EditDeleteAction = ({ type, itemId }: Props) => {
  const router = useRouter();
  const handleEdit = async () => {
    router.push(`/questions/${itemId}/edit`);
  };
  const handleDelete = async () => {
    if (type === "Question") {
      //Deleting question
      await deleteQuestion({ questionId: itemId });
      toast.success("Question Deleted", {
        description: "Your question has been deleted.",
      });
    } else if (type === "Answer") {
      //Delete Answers
      await deleteAnswer({ answerId: itemId });
      toast.success("Answer Deleted", {
        description: "Your answer has been deleted.",
      });
    }
  };
  return (
    <div
      className={`flex items-center justify-end gap-3 max-sm:w-full ${
        type === "Answer" && "gap-0 justify-center"
      }`}
    >
      {type === "Question" && (
        <Image
          src="/icons/edit.svg"
          alt="edit"
          width={14}
          height={14}
          className="cursor-pointer object-contain"
          onClick={handleEdit}
        />
      )}
      <AlertDialog>
        <AlertDialogTrigger className="cursor-pointer">
          <Image
            src="/icons/trash.svg"
            alt="Delete"
            width={14}
            height={14}
            className="cursor-pointer"
          />
        </AlertDialogTrigger>
        <AlertDialogContent className="background-ligth800_dark300">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your{" "}
              {type === "Question" ? "question" : "answer"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="!border-primary-100 !bg-primary-500 !text-light-800"
              onClick={handleDelete}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditDeleteAction;
