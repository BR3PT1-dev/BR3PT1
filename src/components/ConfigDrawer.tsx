import React from 'react';
import { Cable, ChevronRight, X } from 'lucide-react';
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
} from '../data/rackData';

interface ConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  copperOption: CopperOptionId;
  onSelectCopper: (id: CopperOptionId) => void;
  fiberOption: FiberOptionId;
  onSelectFiber: (id: FiberOptionId) => void;
  selectedComponent: ComponentId | null;
  onInspectComponent: (id: ComponentId) => void;
  onInspectCable: (id: CableTypeId) => void;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  open,
  onClose,
  copperOption,
  onSelectCopper,
  fiberOption,
  onSelectFiber,
  selectedComponent,
  onInspectComponent,
  onInspectCable,
}) => {
  if (!open) return null;

  const summary = calculateRackSummary(copperOption, fiberOption);

  return (
    <aside
      aria-label="Configuração de Cablagem e Componentes"
      className="z-20 flex h-full w-full shrink-0 flex-col border-l border-[#2d323e] bg-[#191c22] sm:w-[360px]"
    >
      <div className="flex items-center justify-between border-b border-[#2d323e] px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-white">Cablagem e Acessórios</h2>
          <p className="font-mono-tech text-[11px] text-[#8b93a5]">
            {summary.dimensionsLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel de cablagem"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#9ca3af] transition-colors hover:bg-[#252a35] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
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

        {/* Installed Components Jump List */}
        <section aria-labelledby="components-heading" className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 id="components-heading" className="text-xs font-semibold whitespace-nowrap text-[#9ca3af]">
              Componentes Instalados
            </h3>
            <span className="font-mono-tech text-[11px] whitespace-nowrap text-[#8b93a5]">
              {summary.occupiedU}U / {summary.occupiedU + summary.freeU}U
            </span>
          </div>
          <div className="divide-y divide-[#262b36] rounded-lg border border-[#2d323e] bg-[#21252e]">
            {COMPONENT_LIST.map((comp) => {
              const active = selectedComponent === comp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => onInspectComponent(comp.id)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'bg-[#f26522]/15 text-white'
                      : 'text-[#d1d5db] hover:bg-[#282d38] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono-tech flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#15181e] text-[11px] font-bold text-[#f26522]">
                      {comp.hotspotNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold">{comp.shortLabel}</div>
                      <div className="font-mono-tech text-[10px] text-[#8b93a5]">
                        {comp.uRange} · {comp.ref}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#6b7280]" />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Live Configuration Summary Footer */}
      <div className="border-t border-[#2d323e] bg-[#14171d] px-5 py-3.5 text-[11px]">
        <div className="font-semibold text-[#d1d5db]">Resumo Ativo</div>
        <div className="mt-1 space-y-0.5 text-[#8b93a5]">
          <div className="truncate">Cobre: {summary.copperLabel}</div>
          <div className="truncate">Fibra: {summary.fiberLabel}</div>
        </div>
      </div>
    </aside>
  );
};
