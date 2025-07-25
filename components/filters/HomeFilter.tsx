"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/url";

const filters = [
  { name: "Newest", value: "newest" },
  { name: "Popular", value: "popular" },
  { name: "Unanswered", value: "unanswered" },
  { name: "Recommended", value: "recommended" },
];

const HomeFilter = () => {
  const searchParams = useSearchParams();
  const filterParams = searchParams.get("filter");
  const [active, setActive] = useState(filterParams || "");
  const router = useRouter();

  const handleTypeClicked = (filter: string) => {
    let newUrl  = "";
    if (filter===active) {
        setActive("");
        newUrl = removeKeysFromQuery({
          params: searchParams.toString(),
          keysToRemove: ["filter"],
        });
        router.push(newUrl, { scroll: false });
    } else {
        setActive(filter);
        newUrl = formUrlQuery({
            params: searchParams.toString(),
            key: "filter",
            value: filter.toLowerCase(),
        });
        router.push(newUrl, { scroll: false });
    }
  };

  return (
    <div className="mt-10 hidden flex-wrap gap-3 sm:flex">
      {filters.map((filter) => (
        <Button
          key={filter.name}
          className={cn(
            `body-medium rounded-lg px-6 py-3 capitalize shadow-none`,
            active === filter.value
              ? "bg-primary-100 text-primary-500 hover:bg-primary-100 dark:bg-dark-400 dark:text-primary-500 dark:hover:bg-dark-400"
              : "bg-ligth-800 text-light-500 hover:bg-light-800 dark:bg-dark-300 dark:text-light-500 dark:hover:bg-dark-300"
          )}
          onClick={() => handleTypeClicked(filter.value)}
        >
          {filter.name}
        </Button>
      ))}
    </div>
  );
};
export default HomeFilter;
