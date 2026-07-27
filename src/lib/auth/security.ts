// Servico de Seguranca e Auditoria (SEC-01 a SEC-08)
// Gate: SEC-01 (SQLi), SEC-02 (XSS), SEC-03 (CSRF), SEC-04/05 (IDOR), SEC-07 (Brute Force)

import { getSupabaseBrowserClient } from "../supabase/client";

export interface AuditEvent {
  userId: string;
  empresaId: string;
  acao: string;
  recursoId?: string;
  detalhes?: unknown;
  timestamp?: string;
  severidade: "low" | "medium" | "high" | "critical";
  ipOrigem?: string;
}

const auditLogs: AuditEvent[] = [];

/**
 * Registra um evento de auditoria no sistema (Persistencia em Supabase + Fallback em memoria)
 */
export async function logAuditEvent(event: Omit<AuditEvent, "timestamp">) {
  const supabase = getSupabaseBrowserClient();

  const fullEvent = {
    usuario_id: event.userId,
    empresa_id: event.empresaId,
    acao: event.acao,
    severidade: event.severidade,
    detalhes: event.detalhes,
    created_at: new Date().toISOString(),
  };

  // Log em memoria para testes/rastreabilidade rapida
  auditLogs.push({
    ...event,
    timestamp: fullEvent.created_at,
  });

  try {
    const { error } = await supabase.from("logs_auditoria").insert([fullEvent]);

    if (error) {
      console.error("[AUDIT_ERROR] Falha ao persistir log no Supabase:", error);
    }
  } catch (err) {
    console.error("[AUDIT_ERROR] Erro inesperado ao salvar auditoria:", err);
  }

  if (import.meta.env.DEV) {
    console.log(`[AUDIT] ${event.severidade.toUpperCase()} - ${event.acao}`);
  }
  return fullEvent;
}

/**
 * Valida inputs contra padroes comuns de SQL Injection e XSS
 * Gate: SEC-01, SEC-02
 */
export function validateInput(input: string): { isValid: boolean; reason?: string } {
  // Padroes de XSS comuns
  const xssPatterns = [
    /<script.*?>.*?<\/script>/im,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /<iframe.*?>/im,
    /<svg.*?>/im,
  ];

  // Padroes de SQL Injection comuns
  const sqliPatterns = [
    /(%27)|(')|(--)|(%23)/i,
    /((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))/i,
    /\w*((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))/i,
    /(exec(\s|\+)+(s|x)p\w+)/i,
    /\b(UNION|SELECT|DELETE|DROP|UPDATE|INSERT|INTO|FROM|WHERE)\b/i,
    /(\sOR\s|\sAND\s)[^\n]*[=><]/i,
  ];

  // Checa XSS primeiro
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, reason: "Padrao suspeito de XSS detectado" };
    }
  }

  // Checa SQLi
  for (const pattern of sqliPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, reason: "Padrao suspeito de SQL Injection detectado" };
    }
  }

  return { isValid: true };
}

/**
 * Simula verificacao de Brute Force no Login
 * Gate: SEC-07 (10 tentativas em 1 minuto)
 */
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

export function recordLoginAttempt(userId: string): { allowed: boolean } {
  const now = Date.now();
  const attempt = loginAttempts.get(userId) || { count: 0, firstAttempt: now };

  // Reset se passou 1 minuto
  if (now - attempt.firstAttempt > 60000) {
    attempt.count = 1;
    attempt.firstAttempt = now;
  } else {
    attempt.count++;
  }

  loginAttempts.set(userId, attempt);

  if (attempt.count > 10) {
    return { allowed: false };
  }

  return { allowed: true };
}

