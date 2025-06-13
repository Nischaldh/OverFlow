"use client";
import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/url";

interface Props {
  route: string;
  imgsrc: string;
  placeholder: string;
  otherClasses?: string;
  iconPosition?: "left" | "right";
}

const LocalSearch = ({
  route,
  imgsrc,
  placeholder,
  otherClasses,
  iconPosition='left',
}: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        const newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: "query",
          value: searchQuery,
        });
        router.push(newUrl, { scroll: false });
      } else {
        if (pathname === route) {
          const newUrl = removeKeysFromQuery({
            params: searchParams.toString(),
            keysToRemove: ["query"],
          });
          router.push(newUrl, { scroll: false });
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, router, route, searchParams]);
  return (
    <div
      className={`background-light800_darkgradient flex min-h-[56px] grow items-center gap-4 rounded-[10px] px-4 ${otherClasses}`}
    >
      {iconPosition === "left" && (
        <Image
          src={imgsrc}
          alt="Search Bar"
          height={24}
          width={24}
          className="cursor-pointer"
        />
      )}
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        className="paragraph-regular no-focus placeholder text-dark400_light700 shadow-none outline-none border-none"
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {iconPosition === "right" && (
        <Image
          src={imgsrc}
          alt="Search Bar"
          height={15}
          width={15}
          className="cursor-pointer"
        />
      )}
    </div>
  );
};

export default LocalSearch;
