export type ComponentId =
  | 'ventilation'
  | 'pp-fiber'
  | 'patch-copper'
  | 'kvm'
  | 'brush-guide'
  | 'cable-management';

export type CopperOptionId = 'mixed-norma1' | 'cat6a-orange' | 'cat6-gray';
export type FiberOptionId = 'os2-sc-apc' | 'os2-lc-apc' | 'cpa-om4';
export type CableTypeId = 'sc-apc' | 'lc-apc' | 'cpa' | 'copper-cat6a';

export type CameraPresetId =
  | 'hero'
  | 'front'
  | 'rear'
  | 'ventilation'
  | 'fiber'
  | 'kvm'
  | 'base';

export interface RackComponentSpec {
  id: ComponentId;
  hotspotNumber: number;
  shortLabel: string;
  title: string;
  ref: string;
  uRange: string;
  uStart: number;
  uEnd: number;
  desc: string;
  installTip: string;
  specs: Record<string, string>;
  cameraPreset: {
    position: [number, number, number];
    target: [number, number, number];
  };
  /** Anchor offset inside rack local coordinates (meters) */
  hotspotLocalPos: [number, number, number];
}

export interface CopperOption {
  id: CopperOptionId;
  title: string;
  badgeText: string;
  desc: string;
  primaryHex: number;
  secondaryHex: number;
  swatchHex: string;
}

export interface FiberOption {
  id: FiberOptionId;
  title: string;
  badgeText: string;
  desc: string;
  adapterHex: number;
  pigtailHex: number;
  trunkHex: number;
  isCpa: boolean;
  swatchHex: string;
}

export interface CableCatalogItem {
  id: CableTypeId;
  name: string;
  shortName: string;
  ref: string;
  category: string;
  badgeColor: string;
  summary: string;
  rackApplication: string;
  specs: Record<string, string>;
  linkedFiberOption?: FiberOptionId;
  linkedCopperOption?: CopperOptionId;
  linkedComponent: ComponentId;
}

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

/** Real-world dimensions of Barpa Bastidor Norma 1 42U in meters */
export const RACK_DIMS = {
  width: 0.8,
  height: 2.05,
  depth: 0.8,
  castorHeight: 0.075,
  baseThickness: 0.055,
  topThickness: 0.05,
  uHeight: 0.04445, // 1U = 44.45 mm
  totalU: 42,
  railWidth: 0.4826, // 19 inches
} as const;

/**
 * Converts a 1-indexed rack unit (1U at bottom .. 42U at top) into Y center in meters.
 * Base rests flush on Y = 0.
 */
export function rackUnitToY(uCenter: number): number {
  const clamped = Math.max(1, Math.min(RACK_DIMS.totalU, uCenter));
  const internalBottomY = RACK_DIMS.castorHeight + RACK_DIMS.baseThickness + 0.03;
  return internalBottomY + (clamped - 0.5) * RACK_DIMS.uHeight;
}

/**
 * Returns the vertical height in meters for a span of rack units.
 */
export function rackUnitsHeight(uCount: number): number {
  return Math.max(1, uCount) * RACK_DIMS.uHeight;
}

export const RACK_COMPONENTS: Record<ComponentId, RackComponentSpec> = {
  ventilation: {
    id: 'ventilation',
    hotspotNumber: 6,
    shortLabel: 'Unidade Ventilação',
    title: 'Unidade de Ventilação de Teto 4 Ventoinhas com Termóstato',
    ref: 'BARPA-FAN-4U',
    uRange: 'Topo · Teto (42U)',
    uStart: 42,
    uEnd: 42,
    desc: 'Módulo ativo de extração térmica integrado no teto do Bastidor Norma 1, equipado com 4 ventoinhas axiais de alto fluxo, grelhas de proteção metálicas e termóstato regulável.',
    installTip:
      'Regule o termóstato para 32 °C em bastidores com switches PoE++ e garanta pelo menos 15 cm livres acima do teto para exaustão contínua de ar quente.',
    specs: {
      Ventoinhas: '4 × 120 mm axiais com rolamento duplo',
      'Caudal de Ar': '420 m³/h (total conjunto)',
      Controlo: 'Termóstato analógico 0–60 °C + Interruptor',
      Ruído: '38 dBA · Alimentação 230V AC 50/60Hz',
    },
    cameraPreset: {
      position: [-0.86, 2.72, 1.08],
      target: [0.0, 1.98, -0.02],
    },
    hotspotLocalPos: [0.0, RACK_DIMS.height + 0.015, 0.24],
  },
  'pp-fiber': {
    id: 'pp-fiber',
    hotspotNumber: 1,
    shortLabel: 'Painel Óptico',
    title: 'Painel Óptico Deslizante 1U 24 portas SC-APC / LC-APC',
    ref: 'BARPA-FIBER-1U24',
    uRange: '39U – 41U',
    uStart: 39,
    uEnd: 41,
    desc: 'Painel de terminação de fibra óptica com gaveta telescópica extraível e organizador de pigtails integrado. Compatível com acopladores SC-APC, LC-APC Duplex e troncos CPA pré-conectorizados.',
    installTip:
      'Mantenha raio de curvatura mínimo > 30 mm nos pigtails e utilize os 4 anéis guia frontais para conduzir as fibras até à calha vertical.',
    specs: {
      Capacidade: 'Até 48 fibras (LC-APC Duplex) / 24 (SC-APC)',
      Fixação: '19" Frontal · Profundidade ajustável',
      Acessórios: 'Cassete de fusão, prensa-cabos e pigtails incluídos',
      Norma: 'ISO/IEC 11801 · EN 50173',
    },
    cameraPreset: {
      position: [-0.72, 1.94, 1.38],
      target: [-0.04, 1.86, 0.2],
    },
    hotspotLocalPos: [-0.08, rackUnitToY(40.2), 0.36],
  },
  'patch-copper': {
    id: 'patch-copper',
    hotspotNumber: 2,
    shortLabel: 'Patch Panels Cat.6A',
    title: 'Patch Panel Cat.6A Blindado 24 Portas 1U',
    ref: 'BARPA-COPPER-24C6A',
    uRange: '31U – 36U',
    uStart: 31,
    uEnd: 36,
    desc: 'Conjunto de painéis de alta densidade equipados com conectores Keystone blindados Toolless. Compatível com frequências até 500 MHz e aplicações PoE++ (IEEE 802.3bt).',
    installTip:
      'Encaminhe os patch cords pelos pentes horizontais 1U diretamente para a calha vertical lateral direita para preservar a visibilidade da consola KVM.',
    specs: {
      Categoria: 'Cat.6A Classe EA (10Gbps)',
      Blindagem: 'STP 360° em liga de zinco',
      'Gestão Traseira': 'Barra de fixação e alívio de tração integrada',
      Cablagem: 'T568A / T568B',
    },
    cameraPreset: {
      position: [-0.78, 1.62, 1.48],
      target: [0.0, 1.54, 0.24],
    },
    hotspotLocalPos: [-0.06, rackUnitToY(34.5), 0.37],
  },
  kvm: {
    id: 'kvm',
    hotspotNumber: 3,
    shortLabel: 'Consola KVM 1U',
    title: 'Consola KVM 1U com Monitor LCD 17" e Teclado',
    ref: 'BARPA-KVM-1U17',
    uRange: '22U – 27U',
    uStart: 22,
    uEnd: 27,
    desc: 'Consola rebatível para gestão centralizada de servidores locais. Mecanismo de fecho suave, calha telescópica dupla de abertura independente e teclado com touchpad integrado.',
    installTip:
      'Fixe as calhas telescópicas nos 4 perfis verticais 19" com porcas gaiola M6 antes de encaixar o chassi da consola. Verifique folga frontal para abertura.',
    specs: {
      Ecrã: '17" TFT LED 1280×1024 antirreflexo',
      Portas: 'VGA / HDMI / USB console',
      Altura: '1U padrão 19 polegadas (rebatida)',
      Consumo: 'Baixo consumo energético (< 25W)',
    },
    cameraPreset: {
      position: [-0.82, 1.32, 1.58],
      target: [-0.02, 1.16, 0.36],
    },
    hotspotLocalPos: [-0.02, rackUnitToY(24.5), 0.56],
  },
  'brush-guide': {
    id: 'brush-guide',
    hotspotNumber: 4,
    shortLabel: 'Guia com Escova 1U',
    title: 'Painel Guia de Cabos com Escova 1U',
    ref: 'BARPA-BRUSH-1U',
    uRange: '13U – 15U',
    uStart: 13,
    uEnd: 15,
    desc: 'Permite a passagem ordenada de patch cords e chicotes entre a zona frontal e traseira, mantendo a eficiência térmica e evitando a recirculação de ar quente no bastidor.',
    installTip:
      'Instale imediatamente abaixo do switch de acesso para criar uma transição limpa para os cabos de distribuição sem obstruir as ventoinhas laterais.',
    specs: {
      Material: 'Aço laminado a frio e cerdas de nylon alta densidade',
      Isolamento: 'Barreira térmica contra recirculação de ar quente',
      Dimensão: '1U × 19 polegadas',
      Acabamento: 'Pintura eletrostática RAL 9005',
    },
    cameraPreset: {
      position: [-0.76, 0.86, 1.44],
      target: [0.0, 0.72, 0.24],
    },
    hotspotLocalPos: [-0.04, rackUnitToY(14), 0.37],
  },
  'cable-management': {
    id: 'cable-management',
    hotspotNumber: 5,
    shortLabel: 'Reserva Base',
    title: 'Carretel / Suporte de Reserva de Cabos da Base',
    ref: 'BARPA-CABLE-SPOOL',
    uRange: 'Base (1U – 4U)',
    uStart: 1,
    uEnd: 4,
    desc: 'Módulo de fixação na base do bastidor Norma 1 para enrolamento controlado do excesso de cabos estruturados de cobre, pigtails e troncos CPA sem esmagamento.',
    installTip:
      'Enrole os cabos de reserva em espiral contínua no fundo do bastidor respeitando o raio mínimo de 50 mm antes de subir pela calha vertical traseira.',
    specs: {
      'Raio Curvatura': 'R > 50 mm garantido',
      Posicionamento: 'Base ou teto do bastidor Norma 1',
      Capacidade: 'Até 15 m de cabo multifibra e cobre estruturado',
      Fixação: 'Platina perfurada na base com abraçadeiras de velcro',
    },
    cameraPreset: {
      position: [-0.88, 0.68, 1.45],
      target: [0.0, 0.22, 0.04],
    },
    hotspotLocalPos: [0.0, 0.24, 0.26],
  },
};

export const COMPONENT_LIST: RackComponentSpec[] = [
  RACK_COMPONENTS.ventilation,
  RACK_COMPONENTS['pp-fiber'],
  RACK_COMPONENTS['patch-copper'],
  RACK_COMPONENTS.kvm,
  RACK_COMPONENTS['brush-guide'],
  RACK_COMPONENTS['cable-management'],
];

export const COPPER_OPTIONS: CopperOption[] = [
  {
    id: 'mixed-norma1',
    title: 'Padrão Norma 1 (Misto)',
    badgeText: 'Laranja + Cinza',
    desc: 'Configuração de referência: Cat.6A Laranja no bloco superior e Cat.6 Cinza nos painéis de acesso.',
    primaryHex: 0xf26522,
    secondaryHex: 0x9ca3af,
    swatchHex: '#f26522',
  },
  {
    id: 'cat6a-orange',
    title: 'Cat.6A S/FTP LSOH',
    badgeText: 'Laranja 2m',
    desc: 'Blindagem individual S/FTP 10Gbps com identificação visual uniforme em Laranja Barpa.',
    primaryHex: 0xf26522,
    secondaryHex: 0xf26522,
    swatchHex: '#f26522',
  },
  {
    id: 'cat6-gray',
    title: 'Cat.6 U/UTP LSOH',
    badgeText: 'Cinza 1.5m',
    desc: 'Cablagem horizontal flexível de alta densidade com revestimento LSOH cinza neutro.',
    primaryHex: 0x94a3b8,
    secondaryHex: 0x64748b,
    swatchHex: '#94a3b8',
  },
];

export const FIBER_OPTIONS: FiberOption[] = [
  {
    id: 'os2-sc-apc',
    title: 'Patch Cord / Pigtail SC-APC',
    badgeText: 'OS2 Verde',
    desc: 'Monomodo OS2 9/125 µm com polimento angular 8° SC-APC verde e baixa perda de retorno.',
    adapterHex: 0x16a34a,
    pigtailHex: 0xfacc15,
    trunkHex: 0x6366a8,
    isCpa: false,
    swatchHex: '#16a34a',
  },
  {
    id: 'os2-lc-apc',
    title: 'Duplex LC-APC Monomodo',
    badgeText: 'LC-APC Verde',
    desc: 'Duplex compacto LC-APC verde com clipe de retenção para alta densidade até 48 fibras.',
    adapterHex: 0x15803d,
    pigtailHex: 0xfde047,
    trunkHex: 0x6366a8,
    isCpa: false,
    swatchHex: '#22c55e',
  },
  {
    id: 'cpa-om4',
    title: 'CPA Pré-Conectorizado',
    badgeText: '12F/24F Magenta',
    desc: 'Tronco armado preto com botas de ramificação e chicotes LC magenta pré-testados em fábrica.',
    adapterHex: 0xdb2777,
    pigtailHex: 0xec4899,
    trunkHex: 0x181a1f,
    isCpa: true,
    swatchHex: '#ec4899',
  },
];

export const CABLE_CATALOG: CableCatalogItem[] = [
  {
    id: 'sc-apc',
    name: 'Cabo Óptico SC-APC Simplex OS2',
    shortName: 'SC-APC',
    ref: 'BARPA-FO-SCAPC-OS2',
    category: 'Fibra Óptica Monomodo',
    badgeColor: '#22c55e',
    summary:
      'Patch cord simplex OS2 9/125 µm com revestimento amarelo LSOH, conector verde SC de polimento angular 8° (APC) e bota flexível ranurada anti-dobragem.',
    rackApplication:
      'Terminação em Painel Óptico 1U (39U–41U) para ligações FTTH, OLT e backbones monomodo de longa distância.',
    specs: {
      Fibra: 'Monomodo OS2 9/125 µm (G.657.A2)',
      Conector: 'SC-APC Verde (Polimento Angular 8°)',
      'Perda Inserção': '≤ 0.25 dB (típica 0.15 dB)',
      'Perda Retorno': '≥ 60 dB',
      'Raio Curvatura': 'Mínimo 15 mm (estático) / 30 mm (instalação)',
      Revestimento: 'LSOH Amarelo 2.0 mm / 3.0 mm · IEC 60332-1',
    },
    linkedFiberOption: 'os2-sc-apc',
    linkedComponent: 'pp-fiber',
  },
  {
    id: 'lc-apc',
    name: 'Cabo Óptico LC-APC Duplex OS2',
    shortName: 'LC-APC',
    ref: 'BARPA-FO-LCAPC-DUP',
    category: 'Fibra Óptica Alta Densidade',
    badgeColor: '#16a34a',
    summary:
      'Cabo zipcord duplex amarelo OS2 equipado com dois conectores verdes LC-APC de fator de forma reduzido, clipe duplex e bota de alívio de tensão verde.',
    rackApplication:
      'Interligação de transceptores SFP/SFP+ e painéis de alta densidade até 48 fibras por 1U no Bastidor Norma 1.',
    specs: {
      Fibra: 'Monomodo OS2 Duplex 9/125 µm',
      Conector: 'LC-APC Duplex Verde (1.25 mm férula cerâmica)',
      'Perda Inserção': '≤ 0.25 dB',
      'Perda Retorno': '≥ 60 dB',
      'Raio Curvatura': 'Mínimo 30 mm nos anéis guia',
      Revestimento: 'Zipcord LSOH Amarelo · Polaridade A-B',
    },
    linkedFiberOption: 'os2-lc-apc',
    linkedComponent: 'pp-fiber',
  },
  {
    id: 'cpa',
    name: 'CPA · Cabo Pré-Conectorizado Armado Multi-Fibra',
    shortName: "CPA's",
    ref: 'BARPA-CPA-12LC-ARM',
    category: 'Tronco Multi-Fibra Plug & Play',
    badgeColor: '#ec4899',
    summary:
      'Tronco pré-conectorizado de fábrica com bainha exterior preta armada de alta resistência, botas de ramificação seladas e 12/24 chicotes LC magenta prontos a ligar sem fusão.',
    rackApplication:
      'Interligação direta entre bastidores ou pisos com reserva enrolada na base (1U–4U) e subida protegida pela calha lateral até ao painel 40U.',
    specs: {
      Configuração: '12 ou 24 fibras (OM4 / OS2)',
      Conectores: 'LC / LC-APC pré-conectorizados em fábrica',
      Proteção: 'Bainha armada anti-esmagamento + anti-roedor',
      Ramificação: 'Fan-out de 900 µm / 2.0 mm com botas seladas',
      'Raio Curvatura': 'R ≥ 50 mm na reserva da base',
      Vantagem: 'Instalação Plug & Play sem máquina de fusão',
    },
    linkedFiberOption: 'cpa-om4',
    linkedComponent: 'cable-management',
  },
  {
    id: 'copper-cat6a',
    name: 'Cabo de Cobre Cat.6A S/FTP RJ45 LSOH',
    shortName: 'Cabo de Cobre',
    ref: 'BARPA-CC-C6A-SFTP',
    category: 'Cablagem Estruturada Cobre 10G',
    badgeColor: '#f26522',
    summary:
      'Patch cord Cat.6A blindado S/FTP em Laranja Barpa com ficha RJ45 transparente de contactos banhados a ouro e bota moldada anti-enredamento (snagless).',
    rackApplication:
      'Ligação frontal entre Patch Panels Cat.6A (31U–36U) e Switches PoE++ (16U), encaminhado pelos guias horizontais e calha vertical direita.',
    specs: {
      Categoria: 'Cat.6A Classe EA · 500 MHz · 10GBASE-T',
      Condutor: 'Cobre multifilar 26 AWG (100% cobre puro)',
      Blindagem: 'S/FTP (folha por par + malha entrançada global)',
      PoE: 'Compatível com PoE++ IEEE 802.3bt (até 90W)',
      Ficha: 'RJ45 8P8C transparente · Ouro 50 µin',
      Revestimento: 'LSOH Laranja Barpa · EN 50575 Euroclasse',
    },
    linkedCopperOption: 'cat6a-orange',
    linkedComponent: 'patch-copper',
  },
];

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'hero',
    label: 'Perspetiva 3/4',
    position: [-2.22, 1.5, 3.68],
    target: [0.16, 0.92, 0.0],
  },
  {
    id: 'front',
    label: 'Frontal',
    position: [0.0, 1.08, 3.96],
    target: [0.0, 0.92, 0.0],
  },
  {
    id: 'rear',
    label: 'Traseira',
    position: [2.12, 1.42, -3.28],
    target: [0.0, 0.92, 0.0],
  },
  {
    id: 'ventilation',
    label: 'Topo · Ventilação',
    position: [-0.86, 2.72, 1.08],
    target: [0.0, 1.98, -0.02],
  },
  {
    id: 'fiber',
    label: 'Painel Fibra',
    position: [-0.72, 1.94, 1.38],
    target: [-0.04, 1.86, 0.2],
  },
  {
    id: 'kvm',
    label: 'Consola KVM',
    position: [-0.82, 1.32, 1.58],
    target: [-0.02, 1.16, 0.36],
  },
  {
    id: 'base',
    label: 'Base · Reserva',
    position: [-0.88, 0.68, 1.45],
    target: [0.0, 0.22, 0.04],
  },
];

export interface SupportFormInput {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface SupportValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof SupportFormInput, string>>;
}

export function validateSupportForm(input: SupportFormInput): SupportValidationResult {
  const errors: Partial<Record<keyof SupportFormInput, string>> = {};

  if (input.name.trim().length < 2) {
    errors.name = 'Indique o seu nome completo.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(input.email.trim())) {
    errors.email = 'Introduza um email profissional válido.';
  }

  const digits = input.phone.replace(/\D/g, '');
  if (digits.length < 7) {
    errors.phone = 'Indique um número de telefone ou WhatsApp válido.';
  }

  if (input.message.trim().length < 8) {
    errors.message = 'Descreva a dúvida de montagem com pelo menos 8 caracteres.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface RackConfigSummary {
  copperLabel: string;
  fiberLabel: string;
  occupiedU: number;
  freeU: number;
  dimensionsLabel: string;
}

export function calculateRackSummary(
  copperId: CopperOptionId,
  fiberId: FiberOptionId,
): RackConfigSummary {
  const copper = COPPER_OPTIONS.find((c) => c.id === copperId) ?? COPPER_OPTIONS[0];
  const fiber = FIBER_OPTIONS.find((f) => f.id === fiberId) ?? FIBER_OPTIONS[0];
  // Active installed footprint: Ventilation (1U) + Fiber (3U) + Copper/Guides (6U) + KVM (2U) + Drawer/Switch/Brush (5U) + Base Reserve (4U) = 21U
  const occupiedU = 21;
  return {
    copperLabel: `${copper.title} · ${copper.badgeText}`,
    fiberLabel: `${fiber.title} · ${fiber.badgeText}`,
    occupiedU,
    freeU: RACK_DIMS.totalU - occupiedU,
    dimensionsLabel: '2050 × 800 × 800 mm · 42U',
  };
}
