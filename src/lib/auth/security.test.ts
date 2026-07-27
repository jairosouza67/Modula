import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateInput, recordLoginAttempt, logAuditEvent } from './security';
import * as supabaseClient from '../supabase/client';

// Mock do cliente Supabase para evitar erros de tabela inexistente nos testes unitários
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }))
  }))
}));

describe('Serviço de Segurança (SEC-01, SEC-02, SEC-07, SEC-08)', () => {
  
  describe('Validação de Input (SEC-01, SEC-02)', () => {
    it('deve rejeitar inputs com padrões de SQL Injection', () => {
      const inputs = [
        "admin' --",
        "1 OR 1=1",
        "'; DROP TABLE usuarios; --",
        "EXEC sp_who"
      ];
      
      inputs.forEach(input => {
        const result = validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('SQL Injection');
      });
    });

    it('deve rejeitar inputs com padrões de XSS', () => {
      const inputs = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert(1)>",
        "javascript:void(0)",
        "<iframe src='http://malicious.com'></iframe>"
      ];
      
      inputs.forEach(input => {
        const result = validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('XSS');
      });
    });

    it('deve aceitar inputs legítimos', () => {
      const inputs = [
        "Vidraçaria Silva",
        "Rua das Flores, 123",
        "pedido@vidros.com.br",
        "Orçamento para 10 janelas de vidro temperado 8mm"
      ];
      
      inputs.forEach(input => {
        const result = validateInput(input);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Prevenção de Brute Force (SEC-07)', () => {
    it('deve bloquear após 11 tentativas em menos de 1 minuto', () => {
      const userId = 'user-test-brute-force';
      
      // 10 tentativas permitidas
      for (let i = 0; i < 10; i++) {
        expect(recordLoginAttempt(userId).allowed).toBe(true);
      }
      
      // A 11ª deve ser bloqueada
      expect(recordLoginAttempt(userId).allowed).toBe(false);
    });
  });
});
