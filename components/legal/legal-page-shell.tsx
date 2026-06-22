import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";

interface LegalPageShellProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: LegalPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logoblack.svg"
              alt=""
              width={18}
              height={32}
              className="h-8 w-[18px] dark:hidden"
            />
            <Image
              src="/logowhite.svg"
              alt=""
              width={18}
              height={32}
              className="hidden h-8 w-[18px] dark:block"
            />
            <span className="font-jento text-[28px] leading-none text-black dark:text-white">
              JENTO
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <header className="mb-10 border-b border-border pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </header>

          <div className="space-y-6 text-base leading-7 text-foreground [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:underline [&_a]:underline-offset-4">
            {children}
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
