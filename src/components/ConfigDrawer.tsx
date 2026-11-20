import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Cable,
  Check,
  Crosshair,
  Layers,
  Plus,
  RotateCcw,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import {
  CABLE_CATALOG,
  CableTypeId,
  calculateRackSummary,
  COMPONENT_LIST,
  ComponentId,
  COPPER_OPTIONS,
  CopperOptionId,
  FIBER_OPTIONS,
  FiberOptionId,
  RACK_COMPONENTS,
  RACK_DIMS,
} from '../data/rackData';

type DrawerTab = 'products' | 'guide' | 'cabling';

interface ConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  installedComponents: ComponentId[];
  onToggleInstall: (id: ComponentId) => void;
  onInstallAll: () => void;
  onClearAll: () => void;
  activeGuideComponent: ComponentId;
  onSelectGuideComponent: (id: ComponentId) => void;
  copperOption: CopperOptionId;
  onSelectCopper: (id: CopperOptionId) => void;
  fiberOption: FiberOptionId;
  onSelectFiber: (id: FiberOptionId) => void;
  onInspectSlotOrComponent: (id: ComponentId) => void;
  onInspectCable: (id: CableTypeId) => void;
  onOpenSupport: (prefill?: string) => void;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  open,
  onClose,
  installedComponents,
  onToggleInstall,
  onInstallAll,
  onClearAll,
  activeGuideComponent,
  onSelectGuideComponent,
  copperOption,
  onSelectCopper,
  fiberOption,
  onSelectFiber,
  onInspectSlotOrComponent,
  onInspectCable,
  onOpenSupport,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('products');

  useEffect(() => {
    if (open && activeGuideComponent) {
      // Keep current tab unless user explicitly triggers guide view
    }
  }, [open, activeGuideComponent]);

  if (!open) return null;

  const summary = calculateRackSummary(copperOption, fiberOption, installedComponents);
  const installedSet = new Set(installedComponents);
  const guideSpec = RACK_COMPONENTS[activeGuideComponent] ?? COMPONENT_LIST[0];
  const guideInstalled = installedSet.has(guideSpec.id);

  const openGuideFor = (id: ComponentId) => {
    onSelectGuideComponent(id);
    onInspectSlotOrComponent(id);
    setActiveTab('guide');
  };

  return (
    <aside
      aria-label="Catálogo de Produtos e Guia de Instalação 3D"
      data-testid="config-drawer"
      className="z-20 flex h-full w-full shrink-0 flex-col border-l border-[#2d323e] bg-[#191c22] sm:w-[400px]"
    >
      {/* Header + Live Occupancy Summary */}
      <div className="flex items-center justify-between border-b border-[#2d323e] px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white">Produtos &amp; Montagem 3D</h2>
          <p className="font-mono-tech mt-0.5 text-[11px] text-[#9aa3b5]">
            {summary.installedCount}/{summary.totalProducts} instalados · {summary.occupiedU}U /{' '}
            {RACK_DIMS.totalU}U ocupados
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel de montagem"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#9ca3af] transition-colors hover:bg-[#252a35] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Kit Actions + Segmented Tabs */}
      <div className="space-y-2.5 border-b border-[#262b36] bg-[#16191f] px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onInstallAll}
            disabled={summary.installedCount === summary.totalProducts}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#3a4152] bg-[#22262f] px-3 py-1.5 text-[11px] font-semibold text-white whitespace-nowrap transition-colors hover:border-[#f26522] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Layers className="h-3.5 w-3.5 text-[#f26522]" />
            <span>Instalar Kit Completo</span>
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={summary.installedCount === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#2d323e] bg-[#1c2028] px-3 py-1.5 text-[11px] font-medium text-[#cbd5e1] whitespace-nowrap transition-colors hover:border-rose-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Esvaziar</span>
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Secções do painel de montagem"
          className="grid grid-cols-3 gap-1 rounded-lg bg-[#111317] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'products'}
            onClick={() => setActiveTab('products')}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'products'
                ? 'bg-[#f26522] text-white'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Produtos ({summary.totalProducts})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'guide'}
            onClick={() => setActiveTab('guide')}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'guide'
                ? 'bg-[#f26522] text-white'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Guia Técnico
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cabling'}
            onClick={() => setActiveTab('cabling')}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'cabling'
                ? 'bg-[#f26522] text-white'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Cablagem
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeTab === 'products' && (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-[#9ca3af]">
              Selecione os módulos barpa para os adicionar ao bastidor 3D. Use{' '}
              <span className="font-semibold text-[#e6e8ec]">Guia</span> para ver a posição U
              exata e os passos de montagem.
            </p>

            <div className="space-y-2.5">
              {COMPONENT_LIST.map((comp) => {
                const isInstalled = installedSet.has(comp.id);
                const isActiveGuide = activeGuideComponent === comp.id;
                return (
                  <div
                    key={comp.id}
                    onMouseEnter={() => {
                      if (!isInstalled) {
                        onSelectGuideComponent(comp.id);
                      }
                    }}
                    className={`rounded-lg border p-3 transition-colors ${
                      isInstalled
                        ? 'border-[#f26522]/65 bg-[#f26522]/8'
                        : isActiveGuide
                          ? 'border-[#4b5366] bg-[#21252e]'
                          : 'border-[#2d323e] bg-[#1e222a] hover:border-[#4b5366]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono-tech flex flex-wrap items-center gap-1.5 text-[10px] text-[#9aa3b5]">
                          <span className="font-semibold text-[#f26522]">{comp.uRange}</span>
                          <span aria-hidden="true">·</span>
                          <span>{comp.ref}</span>
                          <span aria-hidden="true">·</span>
                          <span>{comp.category}</span>
                        </div>
                        <h3 className="mt-1 text-xs font-bold leading-snug text-white">
                          {comp.shortLabel}
                        </h3>
                      </div>

                      <span className="font-mono-tech shrink-0 text-[10px] font-medium text-[#9ca3af]">
                        {isInstalled ? 'Instalado' : 'Disponível'}
                      </span>
                    </div>

                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#9ca3af]">
                      Fixação: {comp.mountingHardware}
                    </p>

                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={
                          isInstalled
                            ? `Remover ${comp.shortLabel} do bastidor`
                            : `Adicionar ${comp.shortLabel} ao bastidor`
                        }
                        onClick={() => {
                          onSelectGuideComponent(comp.id);
                          onToggleInstall(comp.id);
                        }}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                          isInstalled
                            ? 'border border-[#f26522] bg-[#f26522]/15 text-white hover:bg-rose-500/20 hover:border-rose-400'
                            : 'bg-[#f26522] text-white hover:bg-[#d85213]'
                        }`}
                      >
                        {isInstalled ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#f26522]" />
                            <span>Instalado · Remover</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Adicionar ao Bastidor</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        aria-label={`Ver guia de instalação de ${comp.shortLabel}`}
                        onClick={() => openGuideFor(comp.id)}
                        className="inline-flex items-center justify-center gap-1 rounded-md border border-[#3a4152] bg-[#22262f] px-2.5 py-1.5 text-[11px] font-semibold text-[#e6e8ec] whitespace-nowrap transition-colors hover:border-[#f26522] hover:text-white"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-[#f26522]" />
                        <span>Guia</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-4">
            {/* Compact selector strip across the 9 products */}
            <div>
              <label
                htmlFor="guide-product-select"
                className="block text-[11px] font-semibold text-[#9ca3af]"
              >
                Selecionar Produto de Referência
              </label>
              <select
                id="guide-product-select"
                value={guideSpec.id}
                onChange={(e) => {
                  const id = e.target.value as ComponentId;
                  onSelectGuideComponent(id);
                  onInspectSlotOrComponent(id);
                }}
                className="mt-1.5 w-full rounded-md border border-[#2d323e] bg-[#21252e] px-3 py-2 text-xs font-medium text-white focus:border-[#f26522] focus:outline-none"
              >
                {COMPONENT_LIST.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.uRange} · {comp.shortLabel} ({comp.ref})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Product Installation Reference Card */}
            <div className="space-y-3 rounded-lg border border-[#2d323e] bg-[#14171d] p-4">
              <div>
                <div className="font-mono-tech text-[11px] font-semibold text-[#f26522]">
                  REF: {guideSpec.ref} · Posição {guideSpec.uRange}
                </div>
                <h3 className="mt-1 text-sm font-bold leading-snug text-white">
                  {guideSpec.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#cbd5e1]">
                  {guideSpec.desc}
                </p>
              </div>

              <div className="space-y-1.5 border-y border-[#262b36] py-3 text-[11px]">
                <div>
                  <span className="font-semibold text-[#9ca3af]">Material de Fixação: </span>
                  <span className="text-[#e6e8ec]">{guideSpec.mountingHardware}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#9ca3af]">Ferramentas: </span>
                  <span className="text-[#e6e8ec]">{guideSpec.tools}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-white">
                  Sequência de Instalação Passo a Passo
                </div>
                <ol className="mt-2 space-y-2 text-xs leading-relaxed text-[#d1d5db]">
                  {guideSpec.installSteps.map((step, index) => (
                    <li key={index} className="flex gap-2.5">
                      <span className="font-mono-tech shrink-0 font-bold text-[#f26522]">
                        0{index + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-md border border-[#262b36] bg-[#191c22] p-3 text-[11px] leading-relaxed text-[#b8c0d0]">
                <span className="font-semibold text-[#f26522]">Dica de Engenharia: </span>
                {guideSpec.installTip}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onToggleInstall(guideSpec.id)}
                  className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                    guideInstalled
                      ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                      : 'bg-[#f26522] text-white hover:bg-[#d85213]'
                  }`}
                >
                  {guideInstalled ? (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remover {guideSpec.shortLabel} do Bastidor</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar {guideSpec.shortLabel} ao Bastidor</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onInspectSlotOrComponent(guideSpec.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#3a4152] bg-[#22262f] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:border-[#f26522]"
                  >
                    <Crosshair className="h-3.5 w-3.5 text-[#f26522]" />
                    <span>Focar Slot 3D</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenSupport(
                        `Dúvida na instalação do módulo ${guideSpec.title} (${guideSpec.ref}, ${guideSpec.uRange})`,
                      )
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#3a4152] bg-[#22262f] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:border-[#f26522]"
                  >
                    <Wrench className="h-3.5 w-3.5 text-[#f26522]" />
                    <span>Apoio Técnico</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cabling' && (
          <div className="space-y-5">
            {/* Copper Patch Cords */}
            <section aria-labelledby="copper-heading" className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 id="copper-heading" className="text-xs font-semibold text-[#9ca3af]">
                  Patch Cords RJ45 (Cobre)
                </h3>
                <button
                  type="button"
                  onClick={() => onInspectCable('copper-cat6a')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f26522] hover:underline"
                >
                  <Cable className="h-3 w-3" />
                  <span>Ver em 3D</span>
                </button>
              </div>
              <div className="space-y-2">
                {COPPER_OPTIONS.map((opt) => {
                  const active = copperOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectCopper(opt.id)}
                      aria-pressed={active}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        active
                          ? 'border-[#f26522] bg-[#f26522]/10'
                          : 'border-[#2d323e] bg-[#21252e] hover:border-[#4b5366]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">{opt.title}</span>
                        <span className="font-mono-tech text-[11px] font-medium text-[#f26522]">
                          {opt.badgeText}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#9ca3af]">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Fiber Optics, Pigtails & CPA */}
            <section aria-labelledby="fiber-heading" className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 id="fiber-heading" className="text-xs font-semibold text-[#9ca3af]">
                  Fibra Óptica e CPA&apos;s
                </h3>
                <button
                  type="button"
                  onClick={() => onInspectCable('sc-apc')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f26522] hover:underline"
                >
                  <Cable className="h-3 w-3" />
                  <span>Ver Cabos 3D</span>
                </button>
              </div>
              <div className="space-y-2">
                {FIBER_OPTIONS.map((opt) => {
                  const active = fiberOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectFiber(opt.id)}
                      aria-pressed={active}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        active
                          ? 'border-[#f26522] bg-[#f26522]/10'
                          : 'border-[#2d323e] bg-[#21252e] hover:border-[#4b5366]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">{opt.title}</span>
                        <span
                          className="font-mono-tech text-[11px] font-medium"
                          style={{ color: opt.swatchHex }}
                        >
                          {opt.badgeText}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#9ca3af]">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3D Cable Specimens Quick Inspection */}
            <section aria-labelledby="specimens-heading" className="space-y-2">
              <h3 id="specimens-heading" className="text-xs font-semibold text-[#9ca3af]">
                Inspecionar Cabos &amp; Conectores em 3D
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {CABLE_CATALOG.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onInspectCable(item.id)}
                    className="flex items-center gap-2 rounded-lg border border-[#2d323e] bg-[#21252e] px-2.5 py-2 text-left text-xs font-semibold text-[#e6e8ec] transition-colors hover:border-[#f26522] hover:text-white"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.badgeColor }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.shortName}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Live Configuration Summary Footer */}
      <div className="border-t border-[#2d323e] bg-[#14171d] px-5 py-3 text-[11px]">
        <div className="flex items-center justify-between font-semibold text-[#d1d5db]">
          <span>Resumo Ativo</span>
          <span className="font-mono-tech text-[#f26522]">{summary.freeU}U livres</span>
        </div>
        <div className="mt-1 space-y-0.5 text-[#8b93a5]">
          <div className="truncate">Cobre: {summary.copperLabel}</div>
          <div className="truncate">Fibra: {summary.fiberLabel}</div>
        </div>
      </div>
    </aside>
  );
};
