import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { MessageSquare, Map, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatStarter } from "@/components/home/chat-starter";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-mesh">
      <header className="glass sticky top-0 z-50 flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="text-xl font-semibold tracking-tight text-neutral-900">
          AITravel
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-neutral-600 md:flex">
          <Link href="#how-it-works" className="hover:text-neutral-900">
            How it works
          </Link>
          {userId && (
            <Link href="/trips" className="hover:text-neutral-900">
              My trips
            </Link>
          )}
        </nav>
        <div className="flex gap-2">
          {userId ? (
            <Button asChild>
              <Link href="/trips">My trips</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-24 pt-20 text-center md:pt-32">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-neutral-900 md:text-7xl md:leading-[1.05]">
          Travel
          <br />
          <span className="text-neutral-400">better.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-500 md:text-xl">
          AITravel brings the world to you and empowers you to experience it your way.
        </p>

        <div className="mt-12 w-full">
          <ChatStarter signedIn={!!userId} />
        </div>

        <section id="how-it-works" className="mt-32 w-full text-left">
          <h2 className="text-center text-sm font-medium uppercase tracking-widest text-neutral-400">
            How it works
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <Step
              icon={MessageSquare}
              title="Start chatting"
              description="Ask for suggestions for any destination or an entire itinerary. Be as specific as you like."
            />
            <Step
              icon={Calendar}
              title="Get personalized plans"
              description="Receive actionable day-by-day itineraries with photos, reviews, and maps."
            />
            <Step
              icon={Map}
              title="Explore on the map"
              description="See every stop plotted geographically. Tap to explore details and booking links."
            />
            <Step
              icon={Users}
              title="Customize freely"
              description="Edit, reorder, and refine your plan as you chat — your trip evolves with you."
            />
          </div>
        </section>

        <section className="mt-32 w-full rounded-3xl bg-neutral-900 px-8 py-16 text-center text-white md:px-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need for your next adventure
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-neutral-400">
            Photos, maps, reviews, and booking links — all in one conversational interface.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="mt-8 border-neutral-600 bg-transparent text-white hover:bg-neutral-800 hover:text-white"
            asChild
          >
            <Link href={userId ? "/trips/new" : "/sign-up"}>
              {userId ? "Plan a trip" : "Get started free"}
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-10 text-center text-sm text-neutral-400">
        <p>© {new Date().getFullYear()} AITravel. Plan smarter. Travel better.</p>
      </footer>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
        <Icon className="h-5 w-5 text-neutral-700" />
      </div>
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}
