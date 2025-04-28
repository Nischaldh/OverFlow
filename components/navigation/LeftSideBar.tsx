import React from "react";
import NavLinks from "./navbar/NavLinks";
import Link from "next/link";
import { Button } from "../ui/button";
import ROUTES from "@/constants/routes";
import Image from "next/image";
import { auth, signOut } from "@/auth";

const LeftSideBar = async () => {
  const session = await auth();
  return (
    <section className="custom-scrollbar background-light900_dark200 light-border sticky left-0 top-0 h-screen flex flex-col justify-between overflow-y-auto border-r p-6 pt-36 shadow-light-300 dark:shadow-none max-sm:hidden lg:w-[266px]">
      <div className="flex flex-1 flex-col gap-6">
        <NavLinks />
      </div>
      {!session ? (
        <div className="flex flex-col gap-3">
          <Button
            className="small-medium btn-secondary min-h-[41px] w-full rounded-lg px-4 py-3 shadow-none"
            asChild
          >
            <Link href={ROUTES.SIGN_IN}>
              <Image
                src={"/icons/account.svg"}
                alt="Account"
                width={20}
                height={20}
                className="invert-colors lg:hidden"
              />
              <span className="primary-text-gradient max-lg:hidden">
                Sign In
              </span>
            </Link>
          </Button>
          <Button
            className="small-medium light-border-2 btn-tertiary text-dark400_ligth900 min-h-[41px] w-full rounded-lg border px-4 py-3 shadow-none"
            asChild
          >
            <Link href={ROUTES.SIGN_UP}>
              <Image
                src={"/icons/sign-up.svg"}
                alt="Sign Up"
                width={20}
                height={20}
                className="invert-colors lg:hidden"
              />
              <span className="primary-text-gradient max-lg:hidden">
                Sign Up
              </span>
            </Link>
          </Button>
        </div>
      ) : (
        <form
          className="flex items-center justify-start bg-transparent gap-4 p-4 "
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            className="base-medium text-left bg-transparent border-0 p-0 text-dark-400 dark:text-light-900 shadow-none hover:bg-transparent"
          >
            <Image
              src="/icons/logout.svg"
              alt="Logout"
              width={20}
              height={20}
              className={"invert-colors"}
            />
            <p className="base-medium max-lg:hidden ml-2.5">Logout</p>
          </Button>
        </form>
      )}
    </section>
  );
};

export default LeftSideBar;
