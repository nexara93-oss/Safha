"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WaveDivider, WaveDividerMulti } from "@/components/ui/WaveDivider";
import { Reveal } from "@/components/ui/Reveal";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { BrandLogo } from "@/components/ui/BrandLogo";

import {
  CheckCircle2,
  Users,
  Award,
  MessageSquare,
  FileUp,
  Languages,
  CalendarCheck,
  TrendingUp,
  BookOpen,
  Heart,
  Sparkles,
  Camera,
  MessageCircle,
  Mail
} from "lucide-react";

// Real photos from Unsplash (free, no API key required for static URLs).
// Each photo is paired with a brand gradient that matches the feature.
const featureKeys = [
  {
    key: "attendance",
    icon: CalendarCheck,
    color: "from-blue-500/90 to-blue-700/95",
    photo: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
    alt: "Teacher taking attendance in a classroom"
  },
  {
    key: "grades",
    icon: Award,
    color: "from-indigo-500/90 to-indigo-700/95",
    photo: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=800&q=80",
    alt: "Open book and calculator on a desk"
  },
  {
    key: "behavior",
    icon: Heart,
    color: "from-pink-500/90 to-pink-700/95",
    photo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    alt: "Students collaborating in a classroom"
  },
  {
    key: "messaging",
    icon: MessageSquare,
    color: "from-amber-500/90 to-amber-700/95",
    photo: "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?auto=format&fit=crop&w=800&q=80",
    alt: "Smartphone with chat messages"
  },
  {
    key: "import",
    icon: FileUp,
    color: "from-emerald-500/90 to-emerald-700/95",
    photo: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80",
    alt: "Stack of documents and PDF files"
  },
  {
    key: "multilang",
    icon: Languages,
    color: "from-brand-orange/90 to-blue-700/95",
    photo: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80",
    alt: "Globe with multilingual text"
  }
];

const stats = [
  { value: "2 400+", label: "schools" },
  { value: "180k+", label: "students" },
  { value: "98%", label: "satisfaction" },
  { value: "<2 min", label: "setup" }
];

export function LandingPage() {
  const { t, locale } = useLanguage();
  const [secretClicks, setSecretClicks] = useState(0);

  const handleSecretClick = () => {
    const next = secretClicks + 1;
    setSecretClicks(next);
    if (next >= 10) {
      window.location.href = "/admin/login.html";
    }
  };

  return (
    <main className="overflow-hidden">
      {/* HERO */}
      <section
        className="relative overflow-hidden bg-black pt-24 sm:pt-32"
        aria-label="Hero"
      >
        {/* Decorative grid + gradient */}
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute -top-40 -end-40 h-96 w-96 rounded-full bg-brand-orange/40 blur-3xl" />
          <div className="absolute -bottom-40 -start-40 h-96 w-96 rounded-full bg-brand-tan/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-32 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
                {t("hero.badge")}
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                {t("hero.title")}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base text-white/70 sm:text-lg">
                {t("hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/auth/register" className="btn-primary w-full text-base sm:w-auto">
                  {t("hero.cta")}
                </Link>
                <a
                  href="#features"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/10 sm:w-auto"
                >
                  {t("hero.secondary")}
                </a>
              </div>
              <p className="mt-4 text-xs text-white/50 sm:text-sm">{t("hero.note")}</p>
            </div>
          </Reveal>

          {/* Hero visual / mockup */}
          <Reveal delay={200}>
            <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-brand-orange/30 to-brand-tan/30 blur-2xl" aria-hidden />
              <div className="relative rounded-3xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl shadow-2xl">
                <div className="overflow-hidden rounded-2xl bg-white p-3 dark:bg-brand-navy sm:p-4">
                  <div className="flex items-center gap-1.5 pb-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ms-3 text-xs font-medium text-gray-500">app.safha.ma</span>
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 sm:col-span-3">
                      <div className="rounded-xl bg-brand-cream p-3 dark:bg-white/5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-brand-orange" />
                          <div className="text-xs font-bold text-brand-ink dark:text-brand-paper">Safha</div>
                        </div>
                        {["Aperçu", "Enseignants", "Élèves", "Messages", "Paiement"].map((item, i) => (
                          <div
                            key={item}
                            className={`mb-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                              i === 0 ? "bg-brand-orange text-white" : "text-brand-ink/70 dark:text-brand-paper/70"
                            }`}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12 grid grid-cols-2 gap-3 sm:col-span-9">
                      {[
                        { label: "Enseignants", value: "12", icon: Users, color: "bg-blue-100 text-brand-orange" },
                        { label: "Élèves", value: "284", icon: BookOpen, color: "bg-indigo-100 text-indigo-600" },
                        { label: "Présence", value: "96%", icon: CalendarCheck, color: "bg-emerald-100 text-emerald-600" },
                        { label: "Moyenne", value: "14.2", icon: TrendingUp, color: "bg-amber-100 text-amber-600" }
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-white/5 dark:bg-white/5"
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                            <s.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-white/60">{s.label}</div>
                            <div className="text-base font-extrabold text-brand-ink dark:text-brand-paper">{s.value}</div>
                          </div>
                        </div>
                      ))}
                      <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-3 dark:border-white/5 dark:bg-white/5">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-xs font-bold text-brand-ink dark:text-brand-paper">Activité récente</div>
                          <div className="text-[10px] text-gray-500">Aujourd'hui</div>
                        </div>
                        {[
                          { name: "M. Bennani", action: "a saisi 24 présences", time: "08:14" },
                          { name: "Mme Tazi", action: "a ajouté 3 notes", time: "09:02" },
                          { name: "Youssef A.", action: "a rejoint la classe 4B", time: "09:18" }
                        ].map((row) => (
                          <div
                            key={row.name + row.time}
                            className="flex items-center justify-between border-b border-gray-50 py-1.5 last:border-0 dark:border-white/5"
                          >
                            <div className="text-xs text-brand-ink dark:text-brand-paper">
                              <span className="font-semibold">{row.name}</span>{" "}
                              <span className="text-gray-500 dark:text-white/60">{row.action}</span>
                            </div>
                            <div className="text-[10px] text-gray-400">{row.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Stats strip */}
          <Reveal delay={300}>
            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:mt-16 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center sm:text-start">
                  <div className="font-display text-2xl font-extrabold text-white sm:text-3xl">{s.value}</div>
                  <div className="text-xs uppercase tracking-wider text-white/60">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <WaveDividerMulti fromColor="#0A0A0A" toColor="#FAFAFA" />
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-brand-cream py-20 sm:py-28 dark:bg-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-orange">
                {t("nav.features")}
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl md:text-5xl dark:text-white">
                {t("features.title")}
              </h2>
              <p className="mt-4 text-base text-brand-ink/70 sm:text-lg dark:text-white/70">
                {t("features.subtitle")}
              </p>
            </div>
          </Reveal>

            <div className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
              {featureKeys.map((f, i) => (
                <Reveal key={f.key} delay={i * 80}>
                  <div
                    className={`group relative h-full overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/5 dark:bg-white/5 ${i === 0 ? "cursor-pointer select-none" : ""}`}
                    onClick={i === 0 ? handleSecretClick : undefined}
                    role={i === 0 ? "button" : undefined}
                    title={i === 0 && secretClicks >= 5 ? `${10 - secretClicks} clicks left...` : undefined}
                  >
                    {/* Photo with gradient overlay */}
                    <div className="relative h-44 w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.photo}
                        alt={f.alt}
                        loading="lazy"
                        className="aspect-video h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${f.color} mix-blend-multiply`}
                        aria-hidden
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" aria-hidden />
                      <div className="absolute bottom-3 start-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-brand-orange shadow-lg backdrop-blur dark:bg-white/90">
                        <f.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-brand-ink dark:text-brand-paper">
                        {t(`feat.${f.key}.title`)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-brand-ink/70 dark:text-brand-paper/70">
                        {t(`feat.${f.key}.desc`)}
                      </p>
                    </div>
                    <div className="absolute end-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="h-2 w-2 rounded-full bg-brand-orange" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromColor="#FAFAFA" toColor="#2A4DFF" flip />

      {/* PRICING */}
      <section id="pricing" className="bg-brand-orange py-20 sm:py-28" aria-label="Pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
                {t("nav.pricing")}
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("pricing.title")}
              </h2>
              <p className="mt-4 text-base text-white/90 sm:text-lg">{t("pricing.subtitle")}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-orange shadow-lg">
                <Sparkles className="h-4 w-4" />
                15 {locale === "ar" ? "يوماً" : locale === "fr" ? "jours" : "days"} free
              </div>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-3">
            {/* Free trial card */}
            <Reveal delay={0}>
              <div className="h-full rounded-3xl border-2 border-white/30 bg-white p-8 text-[#1F2738] shadow-2xl dark:bg-white/95">
                <h3 className="text-xl font-bold text-[#1F2738]">Free Trial</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-500">15 days, no card</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold text-[#1F2738]" dir="ltr">$0</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
                      <span>{t(`feat.list.${i}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className="mt-8 block w-full rounded-xl border-2 border-brand-orange bg-white py-3 text-center font-bold text-brand-orange transition-all hover:bg-brand-orange hover:text-white"
                >
                  {t("pricing.cta")}
                </Link>
              </div>
            </Reveal>

            {/* Monthly */}
            <Reveal delay={120}>
              <div className="h-full rounded-3xl bg-white p-8 text-[#1F2738] shadow-2xl ring-4 ring-white/30 dark:bg-white/95">
                <h3 className="text-xl font-bold text-[#1F2738]">{t("pricing.monthly")}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-500">Pay as you go</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold text-[#1F2738]" dir="ltr">$50</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-500">{t("pricing.perMonth")}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
                      <span>{t(`feat.list.${i}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register?plan=monthly"
                  className="mt-8 block w-full rounded-xl bg-brand-orange py-3 text-center font-bold text-white shadow-lg shadow-brand-orange/30 transition-transform hover:scale-[1.02]"
                >
                  {t("pricing.choose")}
                </Link>
              </div>
            </Reveal>

            {/* Annual - the popular choice */}
            <Reveal delay={240}>
              <div className="relative h-full rounded-3xl bg-brand-navy p-8 text-white shadow-2xl ring-2 ring-brand-orange/40">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-orange shadow-lg">
                  {t("pricing.mostPopular")}
                </div>
                <h3 className="text-xl font-bold text-white">{t("pricing.annual")}</h3>
                <p className="mt-1 text-sm text-white/80">
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white">
                    {t("pricing.save")}
                  </span>
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold text-white" dir="ltr">$500</span>
                  <span className="text-sm font-medium text-white/80">{t("pricing.perYear")}</span>
                </div>
                <p className="mt-1 text-xs text-white/70" dir="ltr">~$41.67/month</p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="flex items-start gap-2 text-white">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
                      <span>{t(`feat.list.${i}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register?plan=annual"
                  className="mt-8 block w-full rounded-xl bg-brand-orange py-3 text-center font-bold text-white shadow-lg shadow-brand-orange/30 transition-transform hover:scale-[1.02]"
                >
                  {t("pricing.choose")}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider fromColor="#2A4DFF" toColor="#0A0A0A" />

      {/* ABOUT / CTA */}
      <section
        id="about"
        className="bg-black py-20 sm:py-28"
        aria-label="About"
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              {locale === "fr"
                ? "Prêt à moderniser votre école ?"
                : locale === "ar"
                ? "جاهز لتحديث مدرستك؟"
                : "Ready to modernize your school?"}
            </h2>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              {locale === "fr"
                ? "Rejoignez les centaines d'écoles privées qui ont déjà fait le saut."
                : locale === "ar"
                ? "انضم إلى مئات المدارس الخاصة التي قفزت بالفعل."
                : "Join hundreds of private schools that have already made the switch."}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth/register" className="btn-primary w-full text-base sm:w-auto">
                {t("hero.cta")}
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/10 sm:w-auto"
              >
                {t("nav.signin")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <WaveDivider fromColor="#0A0A0A" toColor="#FAFAFA" />

      {/* FOOTER */}
      <footer className="bg-brand-cream py-12 dark:bg-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <BrandLogo className="h-11 w-11" />
                <span className="font-display text-lg font-extrabold text-brand-ink dark:text-brand-paper">
                  Safha
                </span>
              </div>
              <p className="mt-3 text-sm text-brand-ink/70 dark:text-white/60">{t("footer.tagline")}</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-ink dark:text-brand-paper">{t("footer.contact")}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="https://wa.me/212600000000"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 text-brand-ink/70 transition-colors hover:text-brand-orange dark:text-white/70"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/nexara152?igsh=d202N2F5dDRpZDFt"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 text-brand-ink/70 transition-colors hover:text-brand-orange dark:text-white/70"
                  >
                    <Camera className="h-4 w-4" /> Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:nexara93@gmail.com"
                    className="inline-flex items-center gap-2 text-brand-ink/70 transition-colors hover:text-brand-orange dark:text-white/70"
                  >
                    <Mail className="h-4 w-4" /> nexara93@gmail.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-ink dark:text-brand-paper">{t("footer.legal")}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-brand-ink/70 transition-colors hover:text-brand-orange dark:text-white/70"
                  >
                    {t("footer.privacy")}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-brand-ink/70 transition-colors hover:text-brand-orange dark:text-white/70"
                  >
                    {t("footer.terms")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-ink dark:text-brand-paper">
                {t("common.language")}
              </h4>
              <div className="mt-3 sm:hidden">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-brand-ink/60 dark:border-white/10 dark:text-white/50">
            {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </main>
  );
}
