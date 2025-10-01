import Link from "next/link";
import React from "react";
import Image from "next/image";
import Theme from "./Theme";
import MobileNavigation from "./MobileNavigation";
import { auth } from "@/auth";
import UserAvatar from "@/components/UserAvatar";
import ROUTES from "@/constants/routes";
import GlobalSearch from "@/components/search/GlobalSearch";

const Navbar = async() => {
  const session = await auth();
  return (
    <nav className="flex-between background-light900_dark200 fixed z-50 w-full p-6 dark:shadow-none sm:px-12 gap-5">
      <Link href={ROUTES.HOME} className="flex items-center gap-1">
        <Image
          src="/images/site-logo.svg"
          alt="DevFlow Logo"
          width={23}
          height={23}
        />
        <p className="h2-bold font-space-grotesk text-dark-100 dark:text-light-900 max-sm:hidden">
          Over<span className="text-primary-500">Flow</span>
        </p>
      </Link>
      <GlobalSearch />
      <div className="flex-between gap-5">
        <Theme />
        {session?.user?.id&&(
          <UserAvatar id={session.user.id} name={session.user.name!} imageUrl={session.user?.image}/>
        )}
        <MobileNavigation />
      </div>
    </nav>
  );
};

export default Navbar;
