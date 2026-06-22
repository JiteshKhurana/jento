import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-10 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
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

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </nav>

        <p className="text-center sm:text-right">
          © {new Date().getFullYear()} Jento. Less planning. More exploring.
        </p>
      </div>
    </footer>
  );
}
