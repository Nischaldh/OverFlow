import ROUTES from "@/constants/routes";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import TagCard from "../cards/TagCard";

const hotQuestions = [
  {
    _id: 1,
    title: "How to use React Hooks?",
  },
  {
    _id: 2,
    title: "What is the difference between useState and useReducer?",
  },
  {
    _id: 3,
    title: "How to manage state in React?",
  },
  {
    _id: 4,
    title: "What is the purpose of useEffect?",
  },
  {
    _id: 5,
    title: "How to handle forms in React?",
  },
];
const hotTags = [
    {
        _id: '1',
        name: "React",
        questions: 100,
    },
    {
        _id: '2',
        name: "JavaScript",
        questions: 200,
    },
    {
        _id: '3',
        name: "CSS3",
        questions: 150,
    },
    {
        _id: '4',
        name: "HTML5",
        questions: 120,
    },
    {
        _id: '5',
        name: "Node.js",
        questions: 80,
    },
]

const RightSidebar = () => {
  return (
    <section className="pt-36 custom-scrollbar background-light900_dark200 light-border sticky right-0 top-0 h-screen flex flex-col w-[350px] gap-6 overflow-y-auto border-l p-6 shadow-light-300 dark:shadow-none max-xl:hidden">
      <div>
        <h3 className="h3-bold text-dark200_light900">Top Questions</h3>
        <div className="mt-7 flex w-full flex-col gap-[30px]">
          {hotQuestions.map(({_id, title}) => (
            <Link
              href={ROUTES.QUESTIONS(_id.toString())}
              key={_id}
              className="flex cursor-pointer items-center justify-between gap-7"
            >
                <p className="body-medium text-dark500_light700">{title}</p>
                <Image 
                    src = '/icons/chevron-right.svg'
                    alt = 'chevron-right'
                    width = {20}
                    height = {20}
                    className = 'invert-colors'
                />
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-16">
        <h3 className="h3-bold text-dark200_light900">Popular Tags</h3>
        <div className="mt-7 flex flex-col gap-4">
            {hotTags.map(({_id, name, questions}) => (
                <TagCard key={_id} _id={_id} name={name} questions={questions} showCount compact/>
            ))}

        </div>
      </div>
    </section>
  );
};

export default RightSidebar;
