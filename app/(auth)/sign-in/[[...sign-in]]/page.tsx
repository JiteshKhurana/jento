import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex items-center justify-center px-6 py-8">
        <Link href="/" className="text-xl font-semibold tracking-tight text-neutral-900">
          AITravel
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
