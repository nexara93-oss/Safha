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
  CheckCircle2, Clock, Lock
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
        error("Please fill in all card fields");
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
      error(e instanceof Error ? e.message : "Payment failed");
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

  const planAmount = selectedPlan === "MONTHLY" ? "$20" : "$119";
  const planLabel = selectedPlan === "MONTHLY" ? t("pricing.monthly") : t("pricing.annual");

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
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
            {/* Current plan card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-xl dark:from-slate-800 dark:via-slate-700 dark:to-slate-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-blue-600 shadow-lg shadow-brand-orange/20">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-white/50">{t("payment.currentPlan")}</div>
                    <div className="mt-1 font-display text-2xl font-extrabold">
                      {sub?.plan === "FREE_TRIAL" ? "Free Trial" : sub?.plan === "MONTHLY" ? t("pricing.monthly") : sub?.plan === "ANNUAL" ? t("pricing.annual") : "—"}
                    </div>
                    {sub && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-white/50">
                        <Calendar className="h-3 w-3" />
                        {new Date(sub.startDate).toLocaleDateString()} → {new Date(sub.endDate).toLocaleDateString()}
                        {trialDaysLeft !== null && (
                          <span className="ms-2 rounded-full bg-brand-orange/30 px-2 py-0.5 text-[10px] font-bold text-brand-orange">
                            {trialDaysLeft} {t("trial.daysLeft").includes("jour") ? "jour(s)" : t("trial.daysLeft").includes("يوم") ? "يوم متبقي" : "day(s) left"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center justify-center gap-2">
              {(["plan", "method", "details", "success"] as Step[]).map((s, i) => {
                const active = step === s;
                const done = (["plan", "method", "details", "success"] as Step[]).indexOf(step) > i;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      done ? "bg-emerald-500 text-white" : active ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/30" : "bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-white/40"
                    }`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    {i < 3 && <div className={`h-0.5 w-8 rounded-full transition-all ${done ? "bg-emerald-500" : "bg-gray-200 dark:bg-white/10"}`} />}
                  </div>
                );
              })}
            </div>

            {/* STEP 1: Choose Plan */}
            {step === "plan" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <PlanCard
                  title={t("pricing.monthly")} price="$20" period={t("pricing.perMonth")}
                  features={[t("feat.list.1"), t("feat.list.2"), t("feat.list.3"), t("feat.list.5")]}
                  highlight={sub?.plan === "MONTHLY"}
                  onChoose={() => choosePlan("MONTHLY")}
                  color="from-blue-500 to-cyan-400"
                />
                <PlanCard
                  title={t("pricing.annual")} price="$119" period={t("pricing.perYear")}
                  features={[t("feat.list.1"), t("pricing.save"), t("feat.list.5"), t("analytics.title")]}
                  highlight={sub?.plan === "ANNUAL"}
                  onChoose={() => choosePlan("ANNUAL")}
                  color="from-purple-500 to-pink-400"
                />
              </div>
            )}

            {/* STEP 2: Choose Payment Method */}
            {step === "method" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-brand-ink dark:text-white">{t("payment.chooseMethod")}</h2>
                  <p className="text-sm text-gray-500">{t("payment.selectMethod", { plan: planLabel })}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button onClick={() => chooseMethod("visa")} className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-400/50">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-400/10 transition-all group-hover:scale-150" />
                    <div className="relative z-10">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-brand-ink dark:text-white">Visa / CB</h3>
                      <p className="mt-1 text-sm text-gray-500">{t("payment.payInstantly")}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <Shield className="h-3.5 w-3.5" />
                        {t("payment.secure")}
                      </div>
                    </div>
                  </button>

                  <button onClick={() => chooseMethod("virement")} className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/50">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-400/10 transition-all group-hover:scale-150" />
                    <div className="relative z-10">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-brand-ink dark:text-white">{t("payment.bankTransfer")}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t("payment.bankTransferDesc")}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <Clock className="h-3.5 w-3.5" />
                        {t("payment.processingTime")}
                      </div>
                    </div>
                  </button>
                </div>
                <button onClick={() => setStep("plan")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-ink dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> {t("payment.backToPlans")}
                </button>
              </div>
            )}

            {/* STEP 3: Visa Details */}
            {step === "details" && selectedMethod === "visa" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-brand-ink dark:text-white">{t("payment.cardDetails")}</h2>
                  <p className="text-sm text-gray-500">{planLabel} • {planAmount}</p>
                </div>
                <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-white/10 bg-white p-6 shadow-xl dark:bg-white/5">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-white">{t("payment.cardholderName")}</label>
                    <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-white">{t("payment.cardNumber")}</label>
                    <div className="relative">
                      <input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} placeholder="4242 4242 4242 4242" maxLength={19}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pe-12 text-sm text-brand-ink outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      <CreditCard className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-white">{t("payment.expiry")}</label>
                      <input value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM / YY" maxLength={7}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-white">{t("payment.cvv")}</label>
                      <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" maxLength={4} type="password"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-400">
                    <Lock className="h-3 w-3" /> {t("payment.cardSecure")}
                  </div>
                  <button onClick={submitPayment} disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50">
                    {processing ? <Spinner className="h-4 w-4 border-white" /> : <><Lock className="h-4 w-4" /> {t("payment.pay", { amount: planAmount })}</>}
                  </button>
                </div>
                <button onClick={() => setStep("method")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-ink dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> {t("payment.backToMethods")}
                </button>
              </div>
            )}

            {/* STEP 3: Virement Details */}
            {step === "details" && selectedMethod === "virement" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-brand-ink dark:text-white">{t("payment.bankTransfer")}</h2>
                  <p className="text-sm text-gray-500">{planLabel} • {planAmount}</p>
                </div>
                <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-white/10 bg-white p-6 shadow-xl dark:bg-white/5">
                  <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-emerald-500/10 dark:to-teal-500/10">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{t("payment.transferTo")}</div>
                    <div className="font-display text-lg font-extrabold text-emerald-900 dark:text-emerald-300">EduWave SARL</div>
                  </div>
                  <div className="space-y-3">
                    <InfoRow label="IBAN" value="FR76 3000 4028 3700 0100 0431 853" onCopy={copyIban} copied={copied} />
                    <InfoRow label="BIC" value="BNPAFRPPXXX" />
                    <InfoRow label={t("payment.bank")} value="BNP Paribas" />
                    <InfoRow label={t("payment.amount")} value={planAmount} highlight />
                    <InfoRow label={t("payment.reference")} value={`EDUWAVE-${Date.now().toString(36).toUpperCase()}`} />
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    ⚠️ {t("payment.transferNote")}
                  </div>
                  <button onClick={submitPayment} disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50">
                    {processing ? <Spinner className="h-4 w-4 border-white" /> : <><CheckCircle2 className="h-4 w-4" /> {t("payment.confirmOrder")}</>}
                  </button>
                </div>
                <button onClick={() => setStep("method")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-ink dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> {t("payment.backToMethods")}
                </button>
              </div>
            )}

            {/* STEP 4: Success */}
            {step === "success" && (
              <div className="space-y-4">
                <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white p-8 text-center shadow-xl dark:bg-white/5">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-xl shadow-emerald-500/30">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-brand-ink dark:text-white">
                    {selectedMethod === "visa" ? t("payment.success") : t("payment.successTransfer")}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    {selectedMethod === "visa"
                      ? t("payment.successMsg", { plan: planLabel })
                      : t("payment.successTransferMsg")}
                  </p>
                  <button onClick={reset} className="mt-6 rounded-xl bg-brand-orange px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-orange/25 transition-all hover:shadow-xl hover:shadow-brand-orange/30">
                    {t("payment.done")}
                  </button>
                </div>
              </div>
            )}

            {/* Payment History */}
            {step === "plan" && (
              <div className="card">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
                  <Receipt className="h-4 w-4" /> {t("payment.history")}
                </h2>
                {payments.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">{t("payment.noPayments")}</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-white/5">
                    {payments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                        <div>
                          <div className="font-semibold text-brand-ink dark:text-brand-paper">{p.plan} • ${p.amount}</div>
                          <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()} • {p.method || "card"}</div>
                        </div>
                        <span className={`badge ${p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"}`}>
                          {p.status}
                        </span>
                      </li>
                    ))}
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

function PlanCard({ title, price, period, features, highlight, badge, onChoose, color }: {
  title: string; price: string; period: string; features: string[];
  highlight?: boolean; badge?: string; onChoose: () => void; color: string;
}) {
  const { t } = useLanguage();
  return (
    <div className={`relative rounded-2xl border-2 transition-all ${
      highlight ? "border-brand-orange bg-brand-orange/5 shadow-lg" : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/5"
    }`}>
      {badge && (
        <div className="absolute -top-3 start-4 z-20 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
          <Sparkles className="h-3 w-3" /> {badge}
        </div>
      )}
      <div className="relative overflow-hidden rounded-2xl p-5 pt-6">
        <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 ${color}`} />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-brand-ink dark:text-white">{title}</h3>
            {highlight && <span className="rounded-full bg-brand-orange px-2 py-0.5 text-[10px] font-bold text-white">ACTIVE</span>}
          </div>
          <div className="mt-3 flex items-end gap-1">
            <span className="font-display text-4xl font-extrabold text-brand-ink dark:text-white">{price}</span>
            <span className="mb-1 text-sm font-medium text-gray-500">{period}</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-brand-ink/80 dark:text-white/70">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-orange" /> {f}
              </li>
            ))}
          </ul>
          <button onClick={onChoose}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-lg transition-all ${
              highlight
                ? "cursor-pointer border-2 border-dashed border-brand-orange/30 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 dark:bg-brand-orange/15 dark:hover:bg-brand-orange/25"
                : `bg-gradient-to-r ${color} text-white hover:scale-[1.02] hover:shadow-xl`
            }`}>
            {highlight ? `✓ ${t("payment.currentPlan")}` : <><span>{t("pricing.choose")}</span> <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, onCopy, copied, highlight }: {
  label: string; value: string; onCopy?: () => void; copied?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl p-3 ${highlight ? "bg-brand-orange/10 dark:bg-brand-orange/20" : "bg-gray-50 dark:bg-white/5"}`}>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
        <div className={`mt-0.5 font-mono text-sm font-semibold ${highlight ? "text-brand-orange" : "text-brand-ink dark:text-white"}`}>{value}</div>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-orange dark:hover:bg-white/10">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
