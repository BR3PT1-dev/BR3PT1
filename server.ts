import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

interface ChatHistoryEntry {
  role: 'user' | 'model';
  text: string;
}

interface RackAssistantContext {
  installedRefs?: string[];
  occupiedU?: number;
  freeU?: number;
  copperLabel?: string;
  fiberLabel?: string;
  activeCable?: string;
}

const VALID_COMPONENT_IDS = new Set([
  'ventilation',
  'pp-fiber',
  'patch-copper',
  'kvm',
  'accessory-drawer',
  'core-switch',
  'brush-guide',
  'pdu-bar',
  'cable-management',
]);

const SYSTEM_INSTRUCTION = `És o Assistente Técnico Oficial do "Suporte barpa IA", especialista em bastidores de telecomunicações barpa (Bastidor Norma 1 · 42U, dimensões 2050 × 800 × 800 mm, perfis 19") e cablagem estruturada em fibra óptica e cobre.

Responde sempre em Português Europeu (PT-PT), de forma clara, técnica, prática e objetiva, adequada tanto ao cliente final como ao técnico instalador em obra.

Catálogo de módulos do Bastidor Norma 1 42U:
- ventilation (REF: BARPA-FAN-4U): Unidade de Ventilação de Teto 4 Ventoinhas com Termóstato, Teto (42U), 4 × parafusos M5 × 12 mm, termóstato recomendado a 32 °C com switches PoE++.
- pp-fiber (REF: BARPA-FIBER-1U24): Painel Óptico Deslizante 1U 24 portas SC-APC / LC-APC, posição 39U–41U, 4 × porcas gaiola M6, raio mínimo de curvatura > 30 mm.
- patch-copper (REF: BARPA-COPPER-24C6A): Conjunto 3× Patch Panels Cat.6A 24 Portas + 3× Pentes Guia 1U, posição 31U–36U (painéis em 36U, 34U, 32U; guias em 35U, 33U, 31U), 24 × porcas gaiola M6.
- kvm (REF: BARPA-KVM-1U17): Consola KVM 1U LCD 17" com teclado, posição 22U–27U, 8 × porcas gaiola M6 nos 4 perfis dianteiros e traseiros.
- accessory-drawer (REF: BARPA-DRAWER-2U): Gaveta Metálica 2U com fechadura, posição 18U–19U, 4 × porcas gaiola M6.
- core-switch (REF: BARPA-SW-24POE): Switch Gerido 24 Portas 10G / PoE++ (740W) com 4× SFP+, posição 16U.
- brush-guide (REF: BARPA-BRUSH-1U): Painel Guia com Escova 1U, posição 14U, barreira térmica abaixo do switch.
- pdu-bar (REF: BARPA-PDU-8SCH): Régua PDU 1U 19" 8 tomadas Schuko 16A, posição 11U, ligação à terra obrigatória.
- cable-management (REF: BARPA-CABLE-SPOOL): Carretel / Reserva Base de Cabos, Base (1U–4U), raio mínimo de curvatura R ≥ 50 mm.

Cabos barpa em 3D:
- SC-APC (REF: BARPA-FO-SCAPC-OS2): Monomodo OS2 9/125 µm G.657.A2, polimento angular 8° verde, perda inserção ≤ 0.25 dB, perda retorno ≥ 60 dB.
- LC-APC Duplex (REF: BARPA-FO-LCAPC-DUP): Alta densidade até 48 fibras por 1U, férula 1.25 mm, polaridade A-B.
- CPA's (REF: BARPA-CPA-12LC-ARM): Tronco multi-fibra armado pré-conectorizado 12F/24F Plug & Play (sem fusão), botas de ramificação seladas.
- Cabo de Cobre Cat.6A S/FTP (REF: BARPA-CC-C6A-SFTP): Classe EA 500 MHz 10GBASE-T, condutor 26 AWG cobre puro, compatível com PoE++ até 90W.

Regras de resposta:
1. Mantém a resposta concisa (3 a 6 frases ou lista curta numerada, sem markdown pesado excessivo).
2. Se a pergunta se referir a um módulo específico do bastidor, preenche "suggestedComponentId" com o respetivo ID exato; caso contrário usa "".
3. Se o utilizador relatar peça em falta, avaria física, necessidade de certificação em obra, projeto à medida ou pedir explicitamente contacto humano, define "suggestHumanSupport" como true e aconselha acionar o Apoio Técnico humano.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'barpa-smart-install' });
  });

  app.post('/api/barpa-assistant', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      res.status(503).json({
        error:
          'A chave Gemini API não está configurada no servidor. Pode acionar diretamente o Apoio Técnico humano barpa abaixo.',
      });
      return;
    }

    const body = (req.body ?? {}) as {
      message?: unknown;
      history?: unknown;
      rackContext?: RackAssistantContext;
    };

    const userMessage = typeof body.message === 'string' ? body.message.trim() : '';
    if (!userMessage) {
      res.status(400).json({ error: 'Escreva a sua dúvida antes de enviar.' });
      return;
    }

    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const safeHistory: ChatHistoryEntry[] = rawHistory
      .filter(
        (item): item is ChatHistoryEntry =>
          Boolean(item) &&
          (item.role === 'user' || item.role === 'model') &&
          typeof item.text === 'string' &&
          item.text.trim().length > 0,
      )
      .slice(-8);

    const ctx = body.rackContext ?? {};
    const installedList =
      Array.isArray(ctx.installedRefs) && ctx.installedRefs.length > 0
        ? ctx.installedRefs.join(', ')
        : 'Nenhum módulo instalado ainda (bastidor vazio)';

    const contextSummary = [
      `Estado atual do bastidor 3D do utilizador:`,
      `- Módulos instalados: ${installedList}`,
      `- Ocupação: ${typeof ctx.occupiedU === 'number' ? ctx.occupiedU : 0}U ocupados / ${typeof ctx.freeU === 'number' ? ctx.freeU : 42}U livres`,
      ctx.copperLabel ? `- Cablagem cobre selecionada: ${ctx.copperLabel}` : '',
      ctx.fiberLabel ? `- Fibra selecionada: ${ctx.fiberLabel}` : '',
      ctx.activeCable ? `- Cabo em inspeção 3D: ${ctx.activeCable}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const contents = [
      ...safeHistory.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: `${contextSummary}\n\nPergunta do utilizador:\n${userMessage}` }],
      },
    ];

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          timeout: 18000,
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('GEMINI_UPSTREAM_TIMEOUT')), 19000);
      });

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: 'Resposta técnica clara e prática em Português Europeu (PT-PT).',
                },
                suggestedComponentId: {
                  type: Type.STRING,
                  description:
                    'ID exato do módulo relevante (ventilation, pp-fiber, patch-copper, kvm, accessory-drawer, core-switch, brush-guide, pdu-bar, cable-management) ou string vazia.',
                },
                suggestHumanSupport: {
                  type: Type.BOOLEAN,
                  description:
                    'true se exigir intervenção em obra, garantia, peça em falta, certificação ou apoio humano direto.',
                },
              },
              required: ['reply', 'suggestedComponentId', 'suggestHumanSupport'],
            },
          },
        }),
        timeoutPromise,
      ]);

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'O assistente barpa IA não devolveu resposta. Tente novamente ou acione o Apoio Técnico humano.',
        });
        return;
      }

      let parsed: {
        reply?: string;
        suggestedComponentId?: string;
        suggestHumanSupport?: boolean;
      };
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {
          reply: rawText,
          suggestedComponentId: '',
          suggestHumanSupport: false,
        };
      }

      const suggestedId =
        typeof parsed.suggestedComponentId === 'string' &&
        VALID_COMPONENT_IDS.has(parsed.suggestedComponentId)
          ? parsed.suggestedComponentId
          : null;

      res.json({
        reply: typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : rawText,
        suggestedComponentId: suggestedId,
        suggestHumanSupport: Boolean(parsed.suggestHumanSupport),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Erro na rota /api/barpa-assistant:', message);
      const isTimeout = message.includes('GEMINI_UPSTREAM_TIMEOUT') || /timeout|aborted/i.test(message);
      res.status(isTimeout ? 504 : 502).json({
        error: isTimeout
          ? 'O pedido ao Suporte barpa IA excedeu o tempo limite. Tente novamente ou acione o Apoio Técnico humano.'
          : 'Não foi possível obter resposta do Suporte barpa IA neste momento. Pode tentar novamente ou acionar o Apoio Técnico humano.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`barpa Smart Install server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
