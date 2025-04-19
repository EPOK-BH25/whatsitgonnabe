import Link from "next/link";
import { Icons } from "@/components/icons";

export default function Home() {
  return (
    <div className="container relative flex h-screen w-screen flex-col items-center justify-center md:grid lg:max-w-none">
      <Link
        href="/sign-up"
        className="absolute right-4 top-4 md:right-8 md:top-8 flex items-center"
      >
        Sign Up <Icons.arrowRight className="h-4 w-4" />
      </Link>


      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.shield className="mx-auto h-6 w-6" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back.
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your phone number and password to authenticate.
          </p>
        </div>
        {/* Commented out to avoid the need to setup Server Actions at this moment */}
        {/* <Login /> */}
        <p className="px-8 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href="/sign-up"
            className="hover:text-foreground underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
        
        <Link href="/reviews" className="absolute right-4 top-4 md:right-8 md:top-10 flex items-center">
        Leave a Review <Icons.arrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
