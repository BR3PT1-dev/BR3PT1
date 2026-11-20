import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Crosshair,
  Send,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import {
  CableTypeId,
  calculateRackSummary,
  ComponentId,
  CopperOptionId,
  FiberOptionId,
  RACK_COMPONENTS,
} from '../data/rackData';
import { BarpaLogo3D } from './BarpaLogo3D';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestedComponentId?: ComponentId | null;
  suggestHumanSupport?: boolean;
  isError?: boolean;
}

interface BarpaAiSupportPanelProps {
  open: boolean;
  onClose: () => void;
  installedComponents: ComponentId[];
  copperOption: CopperOptionId;
  fiberOption: FiberOptionId;
  activeCableSpecimen: CableTypeId;
  onFocusComponent: (id: ComponentId) => void;
  onEscalateToHuman: (prefill?: string) => void;
}

const QUICK_PROMPTS = [
  'Qual a ordem recomendada de montagem no bastidor?',
  'Como fixar o Painel Óptico 1U e manter o raio da fibra?',
  'Diferença prática entre SC-APC, LC-APC e CPA?',
  'Que hardware preciso para montar a Consola KVM?',
];

export const BarpaAiSupportPanel: React.FC<BarpaAiSupportPanelProps> = ({
  open,
  onClose,
  installedComponents,
  copperOption,
  fiberOption,
  activeCableSpecimen,
  onFocusComponent,
  onEscalateToHuman,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Olá! Sou o assistente Suporte barpa IA. Posso ajudar em tempo real na montagem do Bastidor Norma 1 42U, posições U, porcas gaiola M6, cablagem SC-APC, LC-APC, CPA ou Cat.6A. Se precisar de intervenção em obra, pode acionar diretamente o Apoio Técnico humano.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  if (!open) return null;

  const summary = calculateRackSummary(copperOption, fiberOption, installedComponents);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome' && !m.isError)
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('/api/barpa-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          rackContext: {
            installedRefs: installedComponents.map(
              (id) => `${RACK_COMPONENTS[id]?.ref ?? id} (${RACK_COMPONENTS[id]?.uRange ?? ''})`,
            ),
            occupiedU: summary.occupiedU,
            freeU: summary.freeU,
            copperLabel: summary.copperLabel,
            fiberLabel: summary.fiberLabel,
            activeCable: activeCableSpecimen,
          },
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        suggestedComponentId?: ComponentId | null;
        suggestHumanSupport?: boolean;
        error?: string;
      };

      if (!response.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            text:
              data.error ??
              'Não foi possível contactar o Suporte barpa IA. Pode tentar novamente ou acionar o Apoio Técnico humano.',
            suggestHumanSupport: true,
            isError: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.reply ?? '',
          suggestedComponentId: data.suggestedComponentId ?? null,
          suggestHumanSupport: Boolean(data.suggestHumanSupport),
        },
      ]);
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: isTimeout
            ? 'O serviço Suporte barpa IA demorou demasiado tempo a responder. Pode tentar novamente ou acionar diretamente o Apoio Técnico humano.'
            : 'Erro de ligação ao servidor do Suporte barpa IA. Verifique a ligação ou acione o Apoio Técnico humano.',
          suggestHumanSupport: true,
          isError: true,
        },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const buildEscalationPrefill = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    return lastUser
      ? `Encaminhado do Suporte barpa IA: "${lastUser.text}"`
      : 'Solicito apoio técnico humano para montagem do Bastidor Norma 1 42U.';
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="barpa-ai-title"
      data-testid="barpa-ai-panel"
      className="fixed bottom-4 right-4 z-50 flex h-[min(600px,calc(100vh-5rem))] w-[calc(100vw-2rem)] sm:w-[410px] flex-col overflow-hidden rounded-2xl border border-[#2d323e] bg-[#16191f] shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
    >
      {/* Header with animated 3D orange 'b' */}
      <div className="flex items-center justify-between gap-3 border-b border-[#262b36] bg-[#12151a] px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-xl border border-[#f26522]/35 bg-[#191d24]">
              <BarpaLogo3D thinking={loading} size={64} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#f26522]" aria-hidden="true" />
                <h2 id="barpa-ai-title" className="text-sm font-bold text-white truncate">
                  Suporte barpa IA
                </h2>
              </div>
              <p className="mt-0.5 text-[11px] text-[#9aa3b5]">
                Assistente técnico 3D · Norma 1 42U
              </p>
              <p className="font-mono-tech mt-0.5 text-[10px] text-[#f26522]">
                {summary.installedCount}/{summary.totalProducts} módulos · {summary.occupiedU}U
                ocupados
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Suporte barpa IA"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#9ca3af] transition-colors hover:bg-[#252a35] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Questions Bar */}
        <div className="border-b border-[#262b36] bg-[#181b22] px-4 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8b93a5]">
            Perguntas frequentes
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => void sendMessage(q)}
                className="rounded-md border border-[#2d323e] bg-[#21252e] px-2.5 py-1 text-left text-[11px] font-medium text-[#d1d5db] transition-colors hover:border-[#f26522] hover:text-white disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Feed */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const suggestedSpec =
              msg.suggestedComponentId && RACK_COMPONENTS[msg.suggestedComponentId]
                ? RACK_COMPONENTS[msg.suggestedComponentId]
                : null;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#f26522] text-white'
                      : msg.isError
                        ? 'border border-rose-500/40 bg-rose-500/10 text-rose-200'
                        : 'border border-[#2d323e] bg-[#1e222b] text-[#e6e8ec]'
                  }`}
                >
                  {msg.isError && (
                    <div className="mb-1 flex items-center gap-1.5 font-semibold text-rose-300">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Ligação ao Suporte IA</span>
                    </div>
                  )}
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {!isUser && (suggestedSpec || msg.suggestHumanSupport) && (
                    <div className="mt-2.5 flex flex-wrap gap-2 border-t border-[#2d323e] pt-2">
                      {suggestedSpec && (
                        <button
                          type="button"
                          onClick={() => onFocusComponent(suggestedSpec.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#3a4152] bg-[#16191f] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:border-[#f26522]"
                        >
                          <Crosshair className="h-3 w-3 text-[#f26522]" />
                          <span>Focar {suggestedSpec.shortLabel} ({suggestedSpec.uRange})</span>
                        </button>
                      )}
                      {msg.suggestHumanSupport && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEscalateToHuman(buildEscalationPrefill());
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-[#f26522] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#d85213]"
                        >
                          <Wrench className="h-3 w-3" />
                          <span>Acionar Apoio Técnico</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start">
              <div className="rounded-xl border border-[#2d323e] bg-[#1e222b] px-3.5 py-2.5 text-xs text-[#9ca3af]">
                A analisar especificação técnica barpa...
              </div>
            </div>
          )}
          <div ref={feedEndRef} />
        </div>

        {/* Input Composer + Direct Human Escalation Footer */}
        <div className="border-t border-[#262b36] bg-[#12151a] p-3.5 space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre montagem, cabos ou unidades U..."
              aria-label="Escrever dúvida para Suporte barpa IA"
              className="flex-1 rounded-lg border border-[#2d323e] bg-[#1e222b] px-3 py-2 text-xs text-white placeholder-[#6b7280] focus:border-[#f26522] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar pergunta ao Suporte barpa IA"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#f26522] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#d85213] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between gap-2 text-[11px] text-[#9aa3b5]">
            <span>Precisa de equipa técnica em obra?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEscalateToHuman(buildEscalationPrefill());
              }}
              className="inline-flex items-center gap-1 font-semibold text-[#f26522] hover:underline"
            >
              <Wrench className="h-3 w-3" />
              <span>Acionar Apoio Técnico</span>
            </button>
          </div>
        </div>
    </div>
  );
};
