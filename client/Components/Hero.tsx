import Link from "next/link";
import FeaturedVenues from "./FeaturedVenues";

// Photos: Unsplash (free license, hotlinked with sizing params)
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1499510318569-1a3d67dc3976?auto=format&fit=crop&w=1600&q=80";
const COURT_3D_PHOTO =
  "https://images.unsplash.com/photo-1620742820748-87c09249a72a?auto=format&fit=crop&w=1200&q=80";

const Hero = () => {
  return (
    <main className="flex-1">
      {/* Fig 9 — hero */}
      <section className="page pt-4 pb-0 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-forest text-white">
          <img
            src={HERO_PHOTO}
            alt="Aerial view of a tennis court"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest/60 to-forest/20" />

          <div className="relative flex min-h-[520px] flex-col justify-between px-6 py-8 sm:min-h-[620px] sm:px-10 sm:py-10">
            <div className="flex flex-wrap gap-2">
              <span className="chip border-white/20 bg-white/10 text-white backdrop-blur">Padel</span>
              <span className="chip border-white/20 bg-white/10 text-white backdrop-blur">Futsal</span>
              <span className="chip border-white/20 bg-white/10 text-white backdrop-blur">Tennis</span>
              <span className="chip border-white/20 bg-white/10 text-white backdrop-blur">Cricket</span>
            </div>

            <div className="mt-16 max-w-3xl sm:mt-24">
              <p className="eyebrow text-lime">Karachi&apos;s court network</p>
              <h1 className="display mt-4 text-white">
                Ab Khel <span className="text-lime">Jamega</span>
              </h1>
              <p className="mt-6 max-w-xl text-base text-white/80 sm:text-lg">
                Book any court. Find a rival at your level. Walk the court in 3D before
                you show up.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard" className="btn-accent">
                  Book Your Slot Now
                </Link>
                <Link
                  href="#bookings"
                  className="btn-outline border-white/30 text-white hover:border-white hover:bg-white hover:text-ink"
                >
                  Find A Venue
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight strip */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-dark">
            <p className="eyebrow text-white/60">See it first</p>
            <p className="mt-3 font-heading text-2xl font-black uppercase leading-[0.95] tracking-tight">
              3D walkthroughs
            </p>
            <p className="mt-2 text-sm text-white/70">Orbit the court before you commit to a slot.</p>
          </div>
          <div className="card-lime">
            <p className="eyebrow text-ink/60">Play your level</p>
            <p className="mt-3 font-heading text-2xl font-black uppercase leading-[0.95] tracking-tight">
              Skill-matched rivals
            </p>
            <p className="mt-2 text-sm text-ink/70">Get paired with players who push you, not flatten you.</p>
          </div>
          <div className="card-dark">
            <p className="eyebrow text-white/60">No phone calls</p>
            <p className="mt-3 font-heading text-2xl font-black uppercase leading-[0.95] tracking-tight">
              Instant booking
            </p>
            <p className="mt-2 text-sm text-white/70">Pick a time, lock it in, show up and play.</p>
          </div>
        </div>
      </section>

      {/* Fig 10 — real time booking */}
      <section id="bookings" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">01 — Real Time Booking</p>
          <h2 className="page-title mt-2">
            Find the perfect court for your game
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            From padel and futsal to pickleball and multi-purpose courts.
          </p>

          <FeaturedVenues />
        </div>
      </section>

      {/* Fig 11 — 3D court view */}
      <section id="platforms" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-10 rounded-3xl bg-mist/60 p-6 sm:p-10 md:grid-cols-2">
            <div>
              <p className="eyebrow">03 — 3D Court View</p>
              <h2 className="page-title mt-2">
                Walk the court before you drive there.
              </h2>
              <p className="mt-4 text-muted">
                Courts in the network can be scanned in 3D. Check the surface, the lighting,
                the shade, the sightline from the bench. Pick the court that fits the
                session — not just the first free slot.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                <li className="chip">Orbit &amp; zoom</li>
                <li className="chip">Real dimensions</li>
                <li className="chip">Owner-uploaded scans</li>
              </ul>
            </div>
            <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-forest">
              <img
                src={COURT_3D_PHOTO}
                alt="Aerial view of a clay court"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <span className="absolute left-4 top-4 inline-flex items-center rounded-pill bg-lime px-3 py-1 text-xs font-semibold text-ink">
                3D scan
              </span>
              <img
                src="/images/court-3d.svg"
                alt=""
                className="absolute bottom-4 right-4 w-40 rounded-2xl bg-white/90 p-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Fig 12 — CTA */}
      <section id="live" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="card-dark px-6 py-14 text-center sm:px-10 sm:py-20">
            <p className="eyebrow text-lime">Ready when you are</p>
            <h2 className="display mt-4 text-white">
              Scene On <span className="text-lime">Karo</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/75">
              Your next big match is a click away. Discover premium venues near you and
              secure your slot instantly.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="btn-accent">
                Book Your Slot Now
              </Link>
              <Link
                href="#bookings"
                className="btn-outline border-white/30 text-white hover:border-white hover:bg-white hover:text-ink"
              >
                Find A Venue
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted">
          <span className="inline-flex items-center gap-2 font-heading text-lg font-black uppercase tracking-tight text-ink">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-lime" aria-hidden="true" />
            Court Connect
          </span>
          <span>Court Connect · All Copyrights Reserved</span>
        </div>
      </footer>
    </main>
  );
};

export default Hero;
