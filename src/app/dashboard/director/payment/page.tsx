"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Check, CreditCard, Sparkles, Receipt, Calendar,
  ArrowRight, ArrowLeft, Shield, Building2, Copy,
  CheckCircle2, Clock, Lock, Zap, Crown, Star
} from "lucide-react";

type Sub = {
  id: string;
  plan: "FREE_TRIAL" | "MONTHLY" | "ANNUAL" | "SUSPENDED";
  startDate: string;
  endDate: string;
} | null;

type Payment = {
  id: string;
  amount: number;
  plan: string;
  status: string;
  method: string | null;
  createdAt: string;
};

type Step = "plan" | "method" | "details" | "success";

const STEP_LABELS = {
  plan: "Plan",
  method: "Method",
  details: "Details",
  success: "Done"
};

export default function DirectorPaymentPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [sub, setSub] = useState<Sub>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<"MONTHLY" | "ANNUAL" | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"visa" | "virement" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const load = () => {
    setLoading(true);
    api<{ subscription: Sub; payments: Payment[] }>("/api/subscription")
      .then((d) => { setSub(d.subscription); setPayments(d.payments); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const trialDaysLeft =
    sub?.plan === "FREE_TRIAL"
      ? Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (86400000)))
      : null;

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + " / " + digits.slice(2);
    return digits;
  };

  const choosePlan = (plan: "MONTHLY" | "ANNUAL") => {
    if (sub?.plan === plan) {
      success(t("payment.alreadyOnPlan"));
      return;
    }
    setSelectedPlan(plan);
    setStep("method");
  };

  const chooseMethod = (method: "visa" | "virement") => {
    setSelectedMethod(method);
    setStep("details");
  };

  const copyIban = () => {
    navigator.clipboard.writeText("FR76 3000 4028 3700 0100 0431 853");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitPayment = async () => {
    if (!selectedPlan || !selectedMethod) return;
    if (selectedMethod === "visa") {
      if (!cardName.trim() || cardNumber.replace(/\s/g, "").length < 16 || cardExpiry.length < 7 || cardCvv.length < 3) {
        error(t("director.payment.fillAllFields"));
        return;
      }
    }
    setProcessing(true);
    try {
      await api("/api/subscription", {
        method: "POST",
        json: {
          plan: selectedPlan,
          method: selectedMethod,
          cardName: cardName.trim(),
          cardNumber: cardNumber.replace(/\s/g, ""),
          cardExpiry,
          cardCvv,
        },
      });
      setStep("success");
      success(selectedMethod === "visa" ? t("payment.success") : t("payment.successTransfer"));
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("director.payment.failed"));
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setStep("plan");
    setSelectedPlan(null);
    setSelectedMethod(null);
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
  };

  const planAmount = selectedPlan === "MONTHLY" ? "$50" : "$500";
  const planLabel = selectedPlan === "MONTHLY" ? t("pricing.monthly") : t("pricing.annual");
  const currentStepIndex = (["plan", "method", "details", "success"] as Step[]).indexOf(step);

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col gap-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-brand-orange/10 to-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-orange">
            <Sparkles className="h-3 w-3" /> Subscription
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-ink dark:text-white">
            {t("dashboard.payment")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("payment.manageSub")}</p>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/5">
              <div className="flex items-center">
                {(["plan", "method", "details", "success"] as Step[]).map((s, i) => {
                  const active = step === s;
                  const done = currentStepIndex > i;
                  return (
                    <div key={s} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                            done
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                              : active
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-110"
                              : "bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-white/40"
                          }`}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-emerald-600 dark:text-emerald-400" : done ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                          {STEP_LABELS[s]}
                        </span>
                      </div>
                      {i < 3 && (
                        <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                          <div className={`h-full transition-all duration-500 ${done ? "w-full bg-gradient-to-r from-emerald-400 to-emerald-600" : "w-0"}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 1: Choose Plan */}
            {step === "plan" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="font-display text-xl font-bold text-brand-ink dark:text-white">Choose your plan</h2>
                  <p className="mt-1 text-sm text-gray-500">Cancel anytime • No hidden fees</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <PlanCard
                    title={t("pricing.monthly")}
                    price="$50"
                    period={t("pricing.perMonth")}
                    features={[t("feat.list.1"), t("feat.list.2"), t("feat.list.3"), t("feat.list.5")]}
                    highlight={sub?.plan === "MONTHLY"}
                    onChoose={() => choosePlan("MONTHLY")}
                    accent="from-emerald-500 via-green-500 to-teal-600"
                    icon={Zap}
                    iconBg="from-emerald-400 to-green-600"
                    shadowColor="shadow-emerald-500/30"
                  />
                  <PlanCard
                    title={t("pricing.annual")}
                    price="$500"
                    period={t("pricing.perYear")}
                    features={[t("feat.list.1"), t("pricing.save"), t("feat.list.5"), t("analytics.title")]}
                    highlight={sub?.plan === "ANNUAL"}
                    popular
                    onChoose={() => choosePlan("ANNUAL")}
                    accent="from-emerald-500 via-green-500 to-teal-600"
                    icon={Crown}
                    iconBg="from-emerald-400 to-green-600"
                    shadowColor="shadow-emerald-500/30"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Choose Payment Method */}
            {step === "method" && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="font-display text-xl font-bold text-brand-ink dark:text-white">{t("payment.chooseMethod")}</h2>
                  <p className="mt-1 text-sm text-gray-500">{t("payment.selectMethod", { plan: planLabel })}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => chooseMethod("visa")}
                    className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-400/50"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-400/0 transition-all duration-500 group-hover:from-blue-500/5 group-hover:to-cyan-400/5" />
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-400/20 blur-2xl transition-all duration-500 group-hover:scale-150" />
                    <div className="relative">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/40">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-brand-ink dark:text-white">Visa / CB</h3>
                      <p className="mt-1 text-sm text-gray-500">{t("payment.payInstantly")}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                          <Shield className="h-3 w-3" />
                          {t("payment.secure")}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => chooseMethod("virement")}
                    className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/50"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-400/0 transition-all duration-500 group-hover:from-emerald-500/5 group-hover:to-teal-400/5" />
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-400/20 blur-2xl transition-all duration-500 group-hover:scale-150" />
                    <div className="relative">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/40">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-brand-ink dark:text-white">{t("payment.bankTransfer")}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t("payment.bankTransferDesc")}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                          <Clock className="h-3 w-3" />
                          {t("payment.processingTime")}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-emerald-500" />
                      </div>
                    </div>
                  </button>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => setStep("plan")} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/5 dark:hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> {t("payment.backToPlans")}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Visa Details */}
            {step === "details" && selectedMethod === "visa" && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="font-display text-xl font-bold text-brand-ink dark:text-white">{t("payment.cardDetails")}</h2>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-orange/10 px-3 py-1 text-sm font-semibold text-brand-orange">
                    {planLabel} <span className="opacity-50">•</span> {planAmount}
                  </div>
                </div>

                <div className="mx-auto grid max-w-2xl gap-5 lg:grid-cols-5">
                  {/* Card preview */}
                  <div className="lg:col-span-2">
                    <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f3460] p-5 text-white shadow-2xl shadow-indigo-900/40">
                      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-orange/30 blur-3xl" />
                      <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />
                      <div className="relative flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="font-display text-base font-extrabold tracking-wide">Safha</div>
                          <CreditCard className="h-6 w-6 opacity-80" />
                        </div>
                        <div className="space-y-3">
                          <div className="font-mono text-lg tracking-widest">
                            {cardNumber || "•••• •••• •••• ••••"}
                          </div>
                          <div className="flex items-end justify-between text-[10px] uppercase tracking-wider">
                            <div>
                              <div className="opacity-60">{t("payment.cardholderName")}</div>
                              <div className="mt-0.5 font-semibold tracking-wide">{cardName || "YOUR NAME"}</div>
                            </div>
                            <div>
                              <div className="opacity-60">EXP</div>
                              <div className="mt-0.5 font-mono font-semibold tracking-wide">{cardExpiry || "MM / YY"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 px-1 text-xs text-gray-500">
                      <Shield className="h-3.5 w-3.5 text-emerald-500" />
                      256-bit SSL encrypted
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/5 lg:col-span-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("payment.cardholderName")}</label>
                      <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-brand-ink outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-4 focus:ring-brand-orange/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("payment.cardNumber")}</label>
                      <input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} placeholder="4242 4242 4242 4242" maxLength={19}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-brand-ink outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-4 focus:ring-brand-orange/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("payment.expiry")}</label>
                        <input value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM / YY" maxLength={7}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-brand-ink outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-4 focus:ring-brand-orange/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("payment.cvv")}</label>
                        <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" maxLength={4} type="password"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-brand-ink outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-4 focus:ring-brand-orange/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10" />
                      </div>
                    </div>
                    <button onClick={submitPayment} disabled={processing}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50 disabled:translate-y-0">
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      {processing ? <Spinner className="h-4 w-4 border-white" /> : <><Lock className="h-4 w-4" /> {t("payment.pay", { amount: planAmount })}</>}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => setStep("method")} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/5 dark:hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> {t("payment.backToMethods")}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Virement Details */}
            {step === "details" && selectedMethod === "virement" && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="font-display text-xl font-bold text-brand-ink dark:text-white">{t("payment.bankTransfer")}</h2>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {planLabel} <span className="opacity-50">•</span> {planAmount}
                  </div>
                </div>
                <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white shadow-lg shadow-emerald-500/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t("payment.transferTo")}</div>
                      <div className="font-display text-lg font-extrabold">Safha SARL</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <InfoRow label="IBAN" value="FR76 3000 4028 3700 0100 0431 853" onCopy={copyIban} copied={copied} />
                    <InfoRow label="BIC" value="BNPAFRPPXXX" />
                    <InfoRow label={t("payment.bank")} value="BNP Paribas" />
                    <InfoRow label={t("payment.amount")} value={planAmount} highlight />
                    <InfoRow label={t("payment.reference")} value={`EDUWAVE-${Date.now().toString(36).toUpperCase()}`} />
                  </div>
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                    <span className="text-base">⚠️</span>
                    <span className="flex-1">{t("payment.transferNote")}</span>
                  </div>
                  <button onClick={submitPayment} disabled={processing}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50 disabled:translate-y-0">
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    {processing ? <Spinner className="h-4 w-4 border-white" /> : <><CheckCircle2 className="h-4 w-4" /> {t("payment.confirmOrder")}</>}
                  </button>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => setStep("method")} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/5 dark:hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> {t("payment.backToMethods")}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success */}
            {step === "success" && (
              <div className="mx-auto max-w-md">
                <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 text-center shadow-xl dark:border-emerald-500/20 dark:from-emerald-500/10 dark:via-white/5 dark:to-teal-500/10">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/30 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-teal-400/30 blur-3xl" />
                  <div className="relative">
                    <div className="relative mx-auto mb-5 h-24 w-24">
                      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/40">
                        <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h2 className="font-display text-2xl font-extrabold text-brand-ink dark:text-white">
                      {selectedMethod === "visa" ? t("payment.success") : t("payment.successTransfer")}
                    </h2>
                    <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600 dark:text-white/70">
                      {selectedMethod === "visa"
                        ? t("payment.successMsg", { plan: planLabel })
                        : t("payment.successTransferMsg")}
                    </p>
                    <button
                      onClick={reset}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40"
                    >
                      <Sparkles className="h-4 w-4" />
                      {t("payment.done")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History */}
            {step === "plan" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-base font-bold text-brand-ink dark:text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                      <Receipt className="h-4 w-4" />
                    </span>
                    {t("payment.history")}
                  </h2>
                  {payments.length > 0 && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-white/70">
                      {payments.length}
                    </span>
                  )}
                </div>
                {payments.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
                      <Receipt className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">{t("payment.noPayments")}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-white/5">
                    {payments.map((p) => {
                      const isCompleted = p.status === "COMPLETED";
                      return (
                        <li key={p.id} className="flex items-center justify-between py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-2 -mx-2">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isCompleted ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"}`}>
                              {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="font-bold text-brand-ink dark:text-white">{p.plan} • <span className="text-emerald-600 dark:text-emerald-400">${p.amount}</span></div>
                              <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()} • {p.method || t("director.payment.card")}</div>
                            </div>
                          </div>
                          <span className={`badge ${isCompleted ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"}`}>
                            {p.status}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function PlanCard({ title, price, period, features, highlight, popular, onChoose, accent, icon: Icon, iconBg, shadowColor }: {
  title: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
  popular?: boolean;
  onChoose: () => void;
  accent: string;
  icon: typeof Zap;
  iconBg: string;
  shadowColor: string;
}) {
  const { t } = useLanguage();
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border-2 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-white/5 ${
        highlight
          ? "border-brand-orange shadow-xl shadow-brand-orange/20"
          : popular
          ? `border-transparent shadow-xl ${shadowColor}`
          : "border-gray-100 hover:border-gray-200 dark:border-white/5 dark:hover:border-white/10"
      }`}
    >
      {/* Decorative gradient blob */}
      <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20`} />

      <div className="relative">
        <h3 className="font-display text-lg font-bold text-brand-ink dark:text-white">{title}</h3>

        <div className="mt-3 flex items-baseline gap-1">
          <span className={`font-display text-5xl font-extrabold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
            {price}
          </span>
          <span className="text-sm font-medium text-gray-500">/ {period}</span>
        </div>

        <div className="my-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-white/10" />

        <ul className="space-y-2.5 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-brand-ink/80 dark:text-white/80">
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${iconBg}`}>
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={onChoose}
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
            highlight
              ? "border-2 border-dashed border-emerald-400/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : `bg-gradient-to-r ${accent} text-white shadow-lg ${shadowColor} hover:-translate-y-0.5 hover:shadow-xl`
          }`}
        >
          {highlight ? (
            <><Check className="h-4 w-4" /> {t("payment.currentPlan")}</>
          ) : (
            <>{t("pricing.choose")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
          )}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, onCopy, copied, highlight }: {
  label: string; value: string; onCopy?: () => void; copied?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
      highlight
        ? "border-brand-orange/30 bg-gradient-to-r from-brand-orange/10 to-amber-500/10"
        : "border-gray-100 bg-gray-50/70 dark:border-white/5 dark:bg-white/5"
    }`}>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
        <div className={`mt-0.5 font-mono text-sm font-semibold ${highlight ? "text-brand-orange" : "text-brand-ink dark:text-white"}`}>{value}</div>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white hover:text-brand-orange hover:shadow-sm dark:hover:bg-white/10">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
