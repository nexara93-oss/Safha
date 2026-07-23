"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WaveDivider, WaveDividerMulti } from "@/components/ui/WaveDivider";
import { Reveal } from "@/components/ui/Reveal";
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
  Instagram,
  MessageCircle,
  Mail,
  GraduationCap,
  ArrowRight,
  Zap,
  Shield,
  Globe
} from "lucide-react";

const featureKeys = [
  {
    key: "attendance",
    icon: CalendarCheck,
    color: "from-violet-500/90 to-violet-700/95",
    photo: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
    alt: "Teacher taking attendance in a classroom"
  },
  {
    key: "grades",
    icon: Award,
    color: "from-cyan-500/90 to-cyan-700/95",
    photo: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=800&q=80",
    alt: "Open book and calculator on a desk"
  },
  {
    key: "behavior",
    icon: Heart,
    color: "from-fuchsia-500/90 to-fuchsia-700/95",
    photo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    alt: "Students collaborating in a classroom"
  },
  {
    key: "messaging",
    icon: MessageSquare,
    color: "from-violet-500/90 to-cyan-500/95",
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
    color: "from-cyan-500/90 to-violet-500/95",
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
    <main className="overflow-hidden bg-[#09090b]">
      {/* HERO */}
      <section
        className="relative overflow-hidden bg-[#09090b] pt-24 sm:pt-32"
        aria-label="Hero"
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 -end-40 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute top-1/2 -start-40 h-96 w-96 rounded-full bg-cyan-600/15 blur-[120px]" />
          <div className="absolute -bottom-20 end-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px]" />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          aria-hidden
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px"
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-32 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/60 backdrop-blur">
                <Zap className="h-3.5 w-3.5 text-violet-400" />
                {t("hero.badge")}
              </span>
              <h1 className="mt-8 font-display text-[2.75rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
                {t("hero.title")}
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg">
                {t("hero.subtitle")}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/auth/register" className="btn-primary w-full text-base sm:w-auto">
                  {t("hero.cta")}
                </Link>
                <a
                  href="#features"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-white/80 backdrop-blur transition-all hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  {t("hero.secondary")}
                </a>
              </div>
              <p className="mt-5 text-xs text-white/30 sm:text-sm">{t("hero.note")}</p>
            </div>
          </Reveal>

          {/* Hero visual / mockup */}
          <Reveal delay={200}>
            <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-600/20 to-cyan-600/20 blur-2xl" aria-hidden />
              <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl shadow-2xl">
                <div className="overflow-hidden rounded-2xl bg-[#09090b] p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 pb-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ms-3 text-xs font-medium text-white/30">app.eduwave.ma</span>
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 sm:col-span-3">
                      <div className="rounded-xl bg-white/5 p-3">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }} />
                          <div className="text-xs font-bold text-white">EduWave</div>
                        </div>
                        {["Aperçu", "Enseignants", "Élèves", "Messages", "Paiement"].map((item, i) => (
                          <div
                            key={item}
                            className={`mb-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                              i === 0 ? "text-white" : "text-white/40"
                            }`}
                            style={i === 0 ? { background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))' } : undefined}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12 grid grid-cols-2 gap-3 sm:col-span-9">
                      {[
                        { label: "Enseignants", value: "12", icon: Users, color: "text-violet-400" },
                        { label: "Élèves", value: "284", icon: BookOpen, color: "text-cyan-400" },
                        { label: "Présence", value: "96%", icon: CalendarCheck, color: "text-emerald-400" },
                        { label: "Moyenne", value: "14.2", icon: TrendingUp, color: "text-amber-400" }
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ${s.color}`}>
                            <s.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs text-white/40">{s.label}</div>
                            <div className="text-base font-extrabold text-white">{s.value}</div>
                          </div>
                        </div>
                      ))}
                      <div className="col-span-2 rounded-xl border border-white/5 bg-white/5 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-xs font-bold text-white">Activité récente</div>
                          <div className="text-[10px] text-white/30">Aujourd'hui</div>
                        </div>
                        {[
                          { name: "M. Bennani", action: "a saisi 24 présences", time: "08:14" },
                          { name: "Mme Tazi", action: "a ajouté 3 notes", time: "09:02" },
                          { name: "Youssef A.", action: "a rejoint la classe 4B", time: "09:18" }
                        ].map((row) => (
                          <div
                            key={row.name + row.time}
                            className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0"
                          >
                            <div className="text-xs text-white">
                              <span className="font-semibold">{row.name}</span>{" "}
                              <span className="text-white/40">{row.action}</span>
                            </div>
                            <div className="text-[10px] text-white/20">{row.time}</div>
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
                  <div className="font-display text-2xl font-extrabold sm:text-3xl gradient-text">{s.value}</div>
                  <div className="text-xs uppercase tracking-wider text-white/40">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <WaveDividerMulti fromColor="#09090b" toColor="#09090b" />
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-[#09090b] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-400">
                {t("nav.features")}
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("features.title")}
              </h2>
              <p className="mt-4 text-base text-white/50 sm:text-lg">
                {t("features.subtitle")}
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
            {featureKeys.map((f, i) => (
              <Reveal key={f.key} delay={i * 80}>
                <div
                  className={`group relative h-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.06] ${i === 0 ? "cursor-pointer select-none" : ""}`}
                  onClick={i === 0 ? handleSecretClick : undefined}
                  role={i === 0 ? "button" : undefined}
                  title={i === 0 && secretClicks >= 5 ? `${10 - secretClicks} clicks left...` : undefined}
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={f.photo}
                      alt={f.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${f.color} mix-blend-multiply`}
                      aria-hidden
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/20 to-transparent" aria-hidden />
                    <div className="absolute bottom-3 start-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-violet-400 shadow-lg backdrop-blur">
                      <f.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white">
                      {t(`feat.${f.key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">
                      {t(`feat.${f.key}.desc`)}
                    </p>
                  </div>
                  <div className="absolute end-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="h-2 w-2 rounded-full bg-violet-400" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromColor="#09090b" toColor="#09090b" flip />

      {/* PRICING */}
      <section id="pricing" className="bg-[#09090b] py-20 sm:py-28" aria-label="Pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-400">
                {t("nav.pricing")}
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("pricing.title")}
              </h2>
              <p className="mt-4 text-base text-white/50 sm:text-lg">{t("pricing.subtitle")}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-300 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                15 {locale === "ar" ? "يوماً" : locale === "fr" ? "jours" : "days"} free
              </div>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-3">
            {/* Free trial card */}
            <Reveal delay={0}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white">
                <h3 className="text-xl font-bold text-white">Free Trial</h3>
                <p className="mt-1 text-sm text-white/50">15 days, no card</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold text-white" dir="ltr">$0</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-start gap-2 text-white/60">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      <span>{t(`feat.list.${i}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className="mt-8 block w-full rounded-xl border border-white/15 bg-white/5 py-3 text-center font-bold text-white transition-all hover:bg-white/10"
                >
                  {t("pricing.cta")}
                </Link>
              </div>
            </Reveal>

            {/* Monthly */}
            <Reveal delay={120}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white">
                <h3 className="text-xl font-bold text-white">{t("pricing.monthly")}</h3>
                <p className="mt-1 text-sm text-white/50">Pay as you go</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold text-white" dir="ltr">$20</span>
                  <span className="text-sm font-medium text-white/50">{t("pricing.perMonth")}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="flex items-start gap-2 text-white/60">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      <span>{t(`feat.list.${i}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register?plan=monthly"
                  className="mt-8 block w-full rounded-xl py-3 text-center font-bold text-white transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
                >
                  {t("pricing.choose")}
                </Link>
              </div>
            </Reveal>

            {/* Annual - the popular choice */}
            <Reveal delay={240}>
              <div className="relative h-full rounded-3xl border border-violet-500/30 bg-white/[0.03] p-8 text-white ring-1 ring-violet-500/20">
                <div className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
                  {t("pricing.mostPopular")}
                </div>
                <h3 className="text-xl font-bold text-white">{t("pricing.annual")}</h3>
                <p className="mt-1 text-sm text-white/80">
                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">
                    {t("pricing.save")}
                  </span>
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold text-white" dir="ltr">$119</span>
                  <span className="text-sm font-medium text-white/80">{t("pricing.perYear")}</span>
                </div>
                <p className="mt-1 text-xs text-white/40" dir="ltr">~$9.92/month</p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="flex items-start gap-2 text-white">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      <span>{t(`feat.list.${i}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register?plan=annual"
                  className="mt-8 block w-full rounded-xl py-3 text-center font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
                >
                  {t("pricing.choose")}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider fromColor="#09090b" toColor="#09090b" />

      {/* ABOUT / CTA */}
      <section
        id="about"
        className="bg-[#09090b] py-20 sm:py-28"
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
            <p className="mt-4 text-base text-white/50 sm:text-lg">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-white/80 backdrop-blur transition-all hover:bg-white/10 hover:text-white sm:w-auto"
              >
                {t("nav.signin")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <WaveDivider fromColor="#09090b" toColor="#09090b" />

      {/* FOOTER */}
      <footer className="bg-[#09090b] border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="font-display text-lg font-extrabold text-white">
                  EduWave
                </span>
              </div>
              <p className="mt-3 text-sm text-white/40">{t("footer.tagline")}</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{t("footer.contact")}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="https://wa.me/212600000000"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 text-white/50 transition-colors hover:text-violet-400"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/nexara152?igsh=d202N2F5dDRpZDFt"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 text-white/50 transition-colors hover:text-violet-400"
                  >
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:nexara93@gmail.com"
                    className="inline-flex items-center gap-2 text-white/50 transition-colors hover:text-violet-400"
                  >
                    <Mail className="h-4 w-4" /> nexara93@gmail.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{t("footer.legal")}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-white/50 transition-colors hover:text-violet-400"
                  >
                    {t("footer.privacy")}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/50 transition-colors hover:text-violet-400"
                  >
                    {t("footer.terms")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {t("common.language")}
              </h4>
              <div className="mt-3 sm:hidden">
                {/* LanguageSwitcher renders inside */}
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-white/30">
            {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </main>
  );
}
