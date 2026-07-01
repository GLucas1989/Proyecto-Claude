"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PaymentStatus {
  isVerified: boolean;
  monetizationEnabled: boolean;
  availableBalanceCents: number;
  withdrawnBalanceCents: number;
  pendingKyc: boolean;
}

/** Estado de pagos del usuario autenticado (KYC + wallet). */
export async function getPaymentStatus(): Promise<PaymentStatus | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: wallet }] = await Promise.all([
    supabase.from("profiles").select("is_verified, monetization_enabled, kyc_requested_at").eq("id", user.id).single(),
    supabase.from("author_wallets").select("available_balance, withdrawn_balance").eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    isVerified: profile?.is_verified === true,
    monetizationEnabled: profile?.monetization_enabled === true,
    availableBalanceCents: Math.round(Number(wallet?.available_balance ?? 0) * 100),
    withdrawnBalanceCents: Math.round(Number(wallet?.withdrawn_balance ?? 0) * 100),
    pendingKyc: !!profile?.kyc_requested_at && profile?.is_verified !== true,
  };
}

/**
 * Inicia el flujo de verificación de identidad (KYC) vía Didit.me.
 * Crea una sesión de verificación y devuelve la URL a la que redirigir al
 * usuario. El resultado (aprobado/rechazado) llega después por webhook.
 */
export async function startKycVerification(): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Iniciá sesión." };

    const { data: profile } = await supabase
      .from("profiles").select("is_verified").eq("id", user.id).single();
    if (profile?.is_verified) return { ok: false, error: "Ya estás verificado." };

    const { createVerificationSession } = await import("@/lib/didit");
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/didit`;
    const session = await createVerificationSession(user.id, callbackUrl);

    if ("error" in session) return { ok: false, error: session.error };

    const { error } = await supabase
      .from("profiles")
      .update({
        kyc_requested_at: new Date().toISOString(),
        kyc_session_id: session.sessionId,
        kyc_status: "pending",
      })
      .eq("id", user.id);
    if (error) return { ok: false, error: "No se pudo registrar la solicitud de verificación." };

    revalidatePath("/dashboard");
    return { ok: true, url: session.verificationUrl };
  } catch {
    return { ok: false, error: "Error interno." };
  }
}

/**
 * Solicita el retiro de fondos. El propio RPC `request_withdrawal` bloquea la
 * operación si is_verified/monetization_enabled no están en true (defensa en
 * profundidad además del trigger de DB).
 */
export async function requestWithdrawal(
  amountCents: number,
  payoutMethod: string
): Promise<{ ok: boolean; requestId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Iniciá sesión." };
    if (amountCents <= 0) return { ok: false, error: "Monto inválido." };
    if (!payoutMethod.trim()) return { ok: false, error: "Indicá un método de pago (PayPal, CBU, etc.)." };

    const { data, error } = await supabase.rpc("request_withdrawal", {
      p_user_id: user.id,
      p_amount_cents: amountCents,
      p_payout_method: payoutMethod.trim(),
    });

    if (error) return { ok: false, error: error.message.includes("saldo insuficiente")
      ? "Saldo insuficiente."
      : error.message.includes("KYC")
        ? "Necesitás completar la verificación de identidad primero."
        : "No se pudo procesar el retiro." };

    revalidatePath("/dashboard");
    return { ok: true, requestId: data as string };
  } catch {
    return { ok: false, error: "Error interno." };
  }
}
