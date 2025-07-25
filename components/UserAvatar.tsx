import Image from "next/image";
import ROUTES from "@/constants/routes";
import Link from "next/link";
import React from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  name: string;
  imageUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

const UserAvatar = ({
  id,
  name,
  imageUrl,
  className = "h-9 w-9",
  fallbackClassName,
}: Props) => {
  const initals = name
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <Link href={ROUTES.PROFILE(id)}>
      <Avatar className={cn("relative", className)}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            quality={100}
          />
        ) : (
          <AvatarFallback
            className={cn(
              "primary-gradient font-space-grotesk font-bold tracking-wider text-white",
              fallbackClassName
            )}
          >
            {initals}
          </AvatarFallback>
        )}
      </Avatar>
    </Link>
  );
};

export default UserAvatar;
