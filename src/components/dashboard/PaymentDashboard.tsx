"use client";

import { useEffect, useState, useTransition } from "react";
import { ShieldAlert, ShieldCheck, Wallet, Landmark, Loader2, Lock, Clock, ArrowDownToLine } from "lucide-react";
import { getPaymentStatus, startKycVerification, requestWithdrawal, type PaymentStatus } from "@/app/actions/payments";

/**
 * Dashboard de pagos transaccional.
 * - No verificado → CTA "Iniciar Verificación" (placeholder KYC).
 * - Verificado + monetización habilitada → saldo + retiro (vía Lemon Squeezy /
 *   solicitud procesada por el equipo, ya que LS es Merchant of Record y no
 *   expone un "withdraw" directo por creador).
 */
export function PaymentDashboard() {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);

  async function refresh() {
    setStatus(await getPaymentStatus());
  }
  useEffect(() => { refresh(); }, []);

  function handleKyc() {
    setMsg(null);
    startTransition(async () => {
      const res = await startKycVerification();
      if (res.ok && res.url) {
        window.location.href = res.url; // redirige al flujo hospedado de Didit
        return;
      }
      setMsg({ text: res.error ?? "No se pudo iniciar la verificación.", ok: false });
    });
  }

  function handleWithdraw() {
    setMsg(null);
    const cents = Math.round(parseFloat(amount) * 100);
    startTransition(async () => {
      const res = await requestWithdrawal(cents, payoutMethod);
      setMsg({ text: res.ok ? "Retiro solicitado. Lo procesamos en las próximas 48-72hs." : (res.error ?? "Error"), ok: res.ok });
      if (res.ok) { setShowWithdraw(false); setAmount(""); setPayoutMethod(""); refresh(); }
    });
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur-md p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
      </div>
    );
  }

  // ── Estado: NO verificado (KYC pendiente) ──────────────────────────────────
  if (!status.isVerified) {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-[#0B0F19]/60 backdrop-blur-md p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="h-4 w-4 text-amber-300" />
          <p className="text-[10px] font-mono text-amber-400/70 uppercase tracking-[0.3em]">
            {"// verificación de identidad requerida"}
          </p>
        </div>
        <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4 text-white/30" /> Pagos bloqueados
        </h3>
        <p className="text-sm text-white/45 leading-relaxed mb-5 max-w-lg">
          Por seguridad y cumplimiento (KYC), necesitás verificar tu identidad antes de habilitar
          la monetización y poder retirar fondos. Este proceso protege tanto tu cuenta como a la plataforma.
        </p>

        {status.pendingKyc ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] text-amber-300 text-xs font-mono">
            <Clock className="h-4 w-4" /> Verificación en revisión — te contactaremos por email.
          </div>
        ) : (
          <button
            onClick={handleKyc}
            disabled={pending}
            className="shine-btn flex items-center gap-2 px-6 py-3 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-100 font-mono text-sm font-bold shadow-[0_0_18px_rgba(251,191,36,0.25)] hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Iniciar Verificación
          </button>
        )}

        {msg && (
          <p className={`text-xs font-mono mt-3 ${msg.ok ? "text-cyan-400/80" : "text-red-400/80"}`}>{msg.text}</p>
        )}
      </div>
    );
  }

  // ── Estado: verificado ──────────────────────────────────────────────────────
  const availableUsd = (status.availableBalanceCents / 100).toFixed(2);
  const withdrawnUsd = (status.withdrawnBalanceCents / 100).toFixed(2);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0B0F19]/60 backdrop-blur-md p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-4 w-4 text-emerald-300" />
        <p className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-[0.3em]">
          {"// cuenta verificada · pagos habilitados"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-white/8 bg-black/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-3.5 w-3.5 text-cyan-400/70" />
            <span className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Disponible</span>
          </div>
          <p className="text-2xl font-black text-white tabular-nums">${availableUsd}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-black/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="h-3.5 w-3.5 text-white/30" />
            <span className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Retirado histórico</span>
          </div>
          <p className="text-2xl font-black text-white/70 tabular-nums">${withdrawnUsd}</p>
        </div>
      </div>

      {!showWithdraw ? (
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={status.availableBalanceCents === 0}
          className="shine-btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-emerald-100 font-mono text-sm font-bold hover:shadow-[0_0_18px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <ArrowDownToLine className="h-4 w-4" /> Retirar fondos
        </button>
      ) : (
        <div className="space-y-3 max-w-sm">
          <input
            type="number"
            step="0.01"
            min="0"
            max={availableUsd}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Monto (máx $${availableUsd})`}
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <input
            type="text"
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value)}
            placeholder="Método de pago (PayPal, CBU/alias, etc.)"
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={handleWithdraw}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-100 font-mono text-sm font-bold hover:bg-emerald-500/25 transition-all disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar retiro"}
            </button>
            <button
              onClick={() => setShowWithdraw(false)}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm font-mono hover:text-white/70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={`text-xs font-mono mt-3 ${msg.ok ? "text-cyan-400/80" : "text-red-400/80"}`}>{msg.text}</p>
      )}

      <p className="text-[10px] font-mono text-white/20 mt-4">
        {"// procesado vía Lemon Squeezy · los retiros se acreditan en 48-72hs hábiles"}
      </p>
    </div>
  );
}
