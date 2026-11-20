import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import {
  calculateRackSummary,
  ComponentId,
  CopperOptionId,
  FiberOptionId,
  RACK_COMPONENTS,
  SupportFormInput,
  validateSupportForm,
} from '../data/rackData';

interface SupportTicketRecord {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  copperLabel: string;
  fiberLabel: string;
  installedSummary: string;
}

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
  installedComponents: ComponentId[];
  copperOption: CopperOptionId;
  fiberOption: FiberOptionId;
  prefillMessage?: string;
}

const TICKETS_STORAGE_KEY = 'barpa_support_tickets_v1';

export const SupportModal: React.FC<SupportModalProps> = ({
  open,
  onClose,
  installedComponents,
  copperOption,
  fiberOption,
  prefillMessage,
}) => {
  const [form, setForm] = useState<SupportFormInput>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SupportFormInput, string>>>({});
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [savedTicketsCount, setSavedTicketsCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (!raw) return 0;
      const arr = JSON.parse(raw) as unknown[];
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (open && prefillMessage && prefillMessage.trim().length > 0) {
      setForm((prev) =>
        prev.message.trim().length === 0 ? { ...prev, message: prefillMessage.trim() } : prev,
      );
    }
  }, [open, prefillMessage]);

  if (!open) return null;

  const summary = calculateRackSummary(copperOption, fiberOption, installedComponents);
  const installedSummary =
    installedComponents.length > 0
      ? installedComponents.map((id) => RACK_COMPONENTS[id]?.ref ?? id).join(', ')
      : 'Bastidor vazio (sem acessórios)';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSupportForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    const ticketId = `BRP-${String(Math.floor(10000 + Math.random() * 89999))}`;
    try {
      const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as SupportTicketRecord[]) : [];
      const next: SupportTicketRecord[] = [
        ...(Array.isArray(existing) ? existing : []),
        {
          id: ticketId,
          createdAt: new Date().toISOString(),
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          copperLabel: summary.copperLabel,
          fiberLabel: summary.fiberLabel,
          installedSummary,
        },
      ].slice(-20);
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(next));
      setSavedTicketsCount(next.length);
    } catch {
      // Ignore storage write failures
    }
    setSubmittedTicket(ticketId);
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setErrors({});
    setForm({ name: '', email: '', phone: '', message: '' });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetAndClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-[#2d323e] bg-[#191c22] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono-tech text-xs font-medium text-[#f26522]">
              Norma 1 42U · Engenharia de Instalação
              {savedTicketsCount > 0 ? ` · ${savedTicketsCount} pedido(s) registado(s)` : ''}
            </div>
            <h2 id="support-modal-title" className="mt-1 text-lg font-bold text-white">
              Solicitar Apoio Técnico barpa
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Fechar pedido de apoio técnico"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#9ca3af] transition-colors hover:bg-[#252a35] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submittedTicket ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>Pedido Registado com Sucesso</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#d1d5db]">
                O pedido <span className="font-mono-tech font-semibold text-white">{submittedTicket}</span>{' '}
                foi encaminhado para a equipa de engenharia barpa juntamente com a configuração
                atual do bastidor ({summary.installedCount}/{summary.totalProducts} módulos ·{' '}
                {summary.occupiedU}U · {summary.copperLabel} · {summary.fiberLabel}).
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="rounded-md bg-[#f26522] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d85213]"
              >
                Voltar ao Visualizador 3D
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3.5">
            <p className="text-xs leading-relaxed text-[#9ca3af]">
              A equipa técnica apoia na certificação, fixação de calhas e organização de cabos em
              obra. A configuração 3D atual é anexada automaticamente ao pedido.
            </p>

            <div>
              <label htmlFor="support-name" className="block text-xs font-medium text-[#d1d5db]">
                Nome Completo
              </label>
              <input
                id="support-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Miguel Almeida"
                className="mt-1 w-full rounded-md border border-[#2d323e] bg-[#21252e] px-3 py-2 text-xs text-white placeholder-[#6b7280] focus:border-[#f26522] focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-[11px] text-rose-400">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="support-email" className="block text-xs font-medium text-[#d1d5db]">
                  Email Profissional
                </label>
                <input
                  id="support-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nome@empresa.pt"
                  className="mt-1 w-full rounded-md border border-[#2d323e] bg-[#21252e] px-3 py-2 text-xs text-white placeholder-[#6b7280] focus:border-[#f26522] focus:outline-none"
                />
                {errors.email && <p className="mt-1 text-[11px] text-rose-400">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="support-phone" className="block text-xs font-medium text-[#d1d5db]">
                  Telefone / WhatsApp
                </label>
                <input
                  id="support-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+351 910 000 000"
                  className="mt-1 w-full rounded-md border border-[#2d323e] bg-[#21252e] px-3 py-2 text-xs text-white placeholder-[#6b7280] focus:border-[#f26522] focus:outline-none"
                />
                {errors.phone && <p className="mt-1 text-[11px] text-rose-400">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="support-message" className="block text-xs font-medium text-[#d1d5db]">
                Dúvida de Montagem ou Componente
              </label>
              <textarea
                id="support-message"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Descreva a dúvida de instalação, certificação ou acessório em falta..."
                className="mt-1 w-full resize-none rounded-md border border-[#2d323e] bg-[#21252e] px-3 py-2 text-xs text-white placeholder-[#6b7280] focus:border-[#f26522] focus:outline-none"
              />
              {errors.message && (
                <p className="mt-1 text-[11px] text-rose-400">{errors.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="rounded-md border border-[#2d323e] px-3.5 py-2 text-xs font-medium text-[#cbd5e1] hover:bg-[#252a35]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#f26522] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d85213]"
              >
                Enviar Pedido para Engenharia
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
