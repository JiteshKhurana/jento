import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-center px-6 py-8">
        <Link href="/" className="text-xl font-semibold tracking-tight text-foreground">
          Jento
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
