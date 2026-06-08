import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import {
  MessageSquare,
  Map,
  Calendar,
  Users,
  Star,
  Compass,
  Camera,
  Plane,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatStarter } from "@/components/home/chat-starter";
import { FEATURED_DESTINATIONS } from "@/lib/inspire/templates";
import { getUnsplashPhoto } from "@/lib/unsplash/photos";

export default async function HomePage() {
  const { userId } = await auth();

  const previewDestinations = FEATURED_DESTINATIONS.slice(0, 4);
  const previewPhotos = await Promise.all(
    previewDestinations.map((d) => getUnsplashPhoto(d.unsplashQuery)),
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="glass sticky top-0 z-50 flex items-center justify-between border-b border-neutral-200/50 px-6 py-4 md:px-12">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900">
          <Plane className="h-5 w-5 text-orange-500" />
          AITravel
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-neutral-600 md:flex">
          <Link href="#how-it-works" className="hover:text-neutral-900 transition-colors">
            How it works
          </Link>
          <Link href="/inspire" className="hover:text-neutral-900 transition-colors">
            Inspiration
          </Link>
          {userId && (
            <Link href="/trips" className="hover:text-neutral-900 transition-colors">
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
              <Button className="bg-orange-500 text-white hover:bg-orange-600" asChild>
                <Link href="/sign-up">Get started free</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="bg-hero relative overflow-hidden px-6 pb-24 pt-20 text-center md:pt-32">
          {/* Floating destination photo cards (desktop) */}
          <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
            <div className="absolute -left-6 top-16 h-48 w-36 rotate-[-8deg] overflow-hidden rounded-2xl shadow-xl opacity-70">
              {previewPhotos[0] && (
                <Image src={previewPhotos[0].url} alt={previewDestinations[0].name} fill className="object-cover" />
              )}
              {!previewPhotos[0] && <div className="h-full w-full bg-linear-to-br from-orange-300 to-rose-400" />}
            </div>
            <div className="absolute left-10 bottom-8 h-36 w-28 rotate-[5deg] overflow-hidden rounded-2xl shadow-xl opacity-60">
              {previewPhotos[1] && (
                <Image src={previewPhotos[1].url} alt={previewDestinations[1].name} fill className="object-cover" />
              )}
              {!previewPhotos[1] && <div className="h-full w-full bg-linear-to-br from-teal-300 to-cyan-400" />}
            </div>
            <div className="absolute -right-4 top-12 h-44 w-32 rotate-[7deg] overflow-hidden rounded-2xl shadow-xl opacity-70">
              {previewPhotos[2] && (
                <Image src={previewPhotos[2].url} alt={previewDestinations[2].name} fill className="object-cover" />
              )}
              {!previewPhotos[2] && <div className="h-full w-full bg-linear-to-br from-violet-300 to-purple-400" />}
            </div>
            <div className="absolute right-16 bottom-6 h-32 w-24 rotate-[-5deg] overflow-hidden rounded-2xl shadow-xl opacity-60">
              {previewPhotos[3] && (
                <Image src={previewPhotos[3].url} alt={previewDestinations[3].name} fill className="object-cover" />
              )}
              {!previewPhotos[3] && <div className="h-full w-full bg-linear-to-br from-amber-300 to-orange-400" />}
            </div>
          </div>

          <div className="relative mx-auto max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-xs font-semibold text-orange-700 mb-6">
              <Plane className="h-3 w-3" />
              AI-powered travel planning
            </div>

            <h1 className="max-w-3xl mx-auto text-5xl font-bold tracking-tight text-neutral-900 md:text-7xl md:leading-[1.05]">
              Travel{" "}
              <span className="text-gradient-warm">better.</span>
            </h1>

            <p className="mt-6 mx-auto max-w-xl text-lg leading-relaxed text-neutral-500 md:text-xl">
              AITravel brings the world to you and empowers you to experience it your way. Chat, plan, explore.
            </p>

            <div className="mt-12 w-full">
              <ChatStarter signedIn={!!userId} showPopularDestinations />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                Personalized itineraries
              </span>
              <span className="flex items-center gap-1.5">
                <Map className="h-4 w-4 text-teal-500" />
                Interactive maps
              </span>
              <span className="flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-violet-500" />
                Real photos & reviews
              </span>
            </div>
          </div>
        </section>

        {/* ── Get Inspired ──────────────────────────────────────── */}
        <section className="bg-white px-6 py-20 md:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-orange-500">
                  Get inspired
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                  Where will you go next?
                </h2>
              </div>
              <Link
                href="/inspire"
                className="hidden items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 sm:flex"
              >
                See all destinations <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {previewDestinations.map((dest, i) => (
                <Link
                  key={dest.id}
                  href={`/inspire`}
                  className="card-photo group block"
                >
                  <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-neutral-100">
                    {previewPhotos[i] ? (
                      <Image
                        src={previewPhotos[i]!.url}
                        alt={dest.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-linear-to-br ${
                          ["from-orange-400 to-rose-500", "from-teal-400 to-cyan-500", "from-violet-400 to-purple-500", "from-amber-400 to-orange-500"][i % 4]
                        }`}
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-bold text-white">{dest.name}</h3>
                      <p className="text-sm text-white/80">{dest.country}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {dest.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium capitalize text-white backdrop-blur-sm"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/inspire">
                <Button variant="outline">See all destinations</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Feature Highlights ────────────────────────────────── */}
        <section className="bg-surface px-6 py-20 md:px-12" style={{ backgroundColor: "var(--surface)" }}>
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-orange-500">
              Everything you need
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
              Your ultimate travel companion
            </h2>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={Camera}
                iconColor="text-orange-500"
                iconBg="bg-orange-50"
                title="Photos, maps + reviews"
                description="Don't just read about a place — experience it. Vibrant photos, interactive maps, and real traveler reviews for every stop."
              />
              <FeatureCard
                icon={Compass}
                iconColor="text-teal-600"
                iconBg="bg-teal-50"
                title="Tailored recommendations"
                description="From hidden gems to bucket-list landmarks, your AI travel planner personalizes every suggestion to your style and budget."
              />
              <FeatureCard
                icon={Users}
                iconColor="text-violet-600"
                iconBg="bg-violet-50"
                title="Plan together"
                description="Share your trip, collaborate in real time, and build an itinerary that works for everyone — no endless group texts required."
              />
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────── */}
        <section id="how-it-works" className="bg-white px-6 py-20 md:px-12">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-orange-500">
              How it works
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
              Plan your next adventure in minutes
            </h2>
            <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Step
                number="01"
                icon={MessageSquare}
                title="Start chatting"
                description="Ask for suggestions for any destination or a full itinerary. Be as specific as you like about the experiences you love."
              />
              <Step
                number="02"
                icon={Calendar}
                title="Get your plan"
                description="Receive actionable day-by-day itineraries with real photos, reviews, maps, and booking links — instantly."
              />
              <Step
                number="03"
                icon={Map}
                title="Explore on the map"
                description="See every stop plotted geographically. Tap any pin to explore details, photos, and get directions."
              />
              <Step
                number="04"
                icon={Users}
                title="Customize freely"
                description="Edit, reorder, and refine your plan as you chat. Your trip evolves with you — every detail, your way."
              />
            </div>
          </div>
        </section>

        {/* ── Dark CTA ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-neutral-900 px-8 py-20 text-center text-white md:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute left-1/4 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-orange-500 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-48 w-48 translate-x-1/2 rounded-full bg-teal-500 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Your next adventure{" "}
              <span className="text-gradient-warm">starts here.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-neutral-400">
              Join thousands of travellers who plan smarter with AITravel. Free to start, no credit card required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-orange-500 px-8 text-white hover:bg-orange-600"
                asChild
              >
                <Link href={userId ? "/trips/new" : "/sign-up"}>
                  {userId ? "Plan a new trip" : "Get started free"}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-neutral-600 bg-transparent text-white hover:bg-neutral-800 hover:text-white"
                asChild
              >
                <Link href="/inspire">Browse inspiration</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-10 text-center text-sm text-neutral-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-neutral-700">
            <Plane className="h-4 w-4 text-orange-500" />
            AITravel
          </Link>
          <div className="flex gap-6 text-xs">
            <Link href="/inspire" className="hover:text-neutral-700">Inspiration</Link>
            <Link href="/explore" className="hover:text-neutral-700">Explore</Link>
            <Link href={userId ? "/trips" : "/sign-up"} className="hover:text-neutral-700">
              {userId ? "My trips" : "Sign up"}
            </Link>
          </div>
          <p>© {new Date().getFullYear()} AITravel. Plan smarter. Travel better.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}

function Step({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl font-black text-neutral-100">{number}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
          <Icon className="h-5 w-5 text-orange-500" />
        </div>
      </div>
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}
