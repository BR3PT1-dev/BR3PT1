import React from 'react';
import { ArrowLeft, Cable, Check } from 'lucide-react';
import { CABLE_CATALOG, CableCatalogItem, CableTypeId } from '../data/rackData';

interface CableCatalogViewProps {
  activeCable: CableTypeId;
  onSelectCable: (id: CableTypeId) => void;
  onApplyToRack: (item: CableCatalogItem) => void;
  onBackToRack: () => void;
}

export const CableCatalogView: React.FC<CableCatalogViewProps> = ({
  activeCable,
  onSelectCable,
  onApplyToRack,
  onBackToRack,
}) => {
  const current = CABLE_CATALOG.find((c) => c.id === activeCable) ?? CABLE_CATALOG[0];

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-5"
      data-testid="cable-showcase-hud"
    >
      {/* Top Row: Cable Type Switcher + Return Button */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto flex flex-col gap-2 rounded-xl border border-[#2d323e] bg-[#181b21]/95 p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cable className="h-4 w-4 text-[#f26522]" aria-hidden="true" />
              <span className="text-xs font-bold tracking-wide text-white">
                Inspeção 3D de Cabos barpa
              </span>
            </div>
            <span className="font-mono-tech hidden text-[11px] text-[#8b93a5] sm:inline">
              360° · Arraste e aproxime
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Tipos de cabos 3D">
            {CABLE_CATALOG.map((item) => {
              const active = item.id === current.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectCable(item.id)}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'border-[#f26522] bg-[#f26522] text-white'
                      : 'border-[#2d323e] bg-[#21252e] text-[#cbd5e1] hover:border-[#4b5366] hover:text-white'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/30"
                    style={{ backgroundColor: item.badgeColor }}
                    aria-hidden="true"
                  />
                  <span>{item.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToRack}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-[#2d323e] bg-[#181b21]/95 px-3.5 py-2 text-xs font-semibold text-white shadow-xl transition-colors hover:border-[#f26522] hover:bg-[#22262f]"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#f26522]" />
          <span>Voltar ao Bastidor 3D</span>
        </button>
      </div>

      {/* Bottom/Right Technical Specification Card */}
      <div className="flex justify-end">
        <aside
          aria-label="Especificações do Cabo 3D"
          className="pointer-events-auto w-full max-w-md rounded-xl border border-[#2d323e] bg-[#181b21]/95 p-4 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono-tech text-[11px] font-medium text-[#f26522]">
                {current.ref} · {current.category}
              </div>
              <h2 className="mt-0.5 text-sm sm:text-base font-bold text-white">
                {current.name}
              </h2>
            </div>
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full border border-white/25"
              style={{ backgroundColor: current.badgeColor }}
              aria-hidden="true"
            />
          </div>

          <p className="mt-2 text-xs leading-relaxed text-[#cbd5e1]">{current.summary}</p>

          <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-[#2d323e]">
            <table className="w-full border-collapse text-[11px]">
              <tbody className="divide-y divide-[#262b36]">
                {Object.entries(current.specs).map(([key, value]) => (
                  <tr key={key} className="bg-[#1e222b]">
                    <td className="w-2/5 px-2.5 py-1.5 font-semibold text-[#9ca3af]">{key}</td>
                    <td className="font-mono-tech px-2.5 py-1.5 text-[#e6e8ec]">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 rounded-lg border border-[#262b36] bg-[#13161c] px-3 py-2 text-[11px] leading-relaxed text-[#b8c0d0]">
            <span className="font-semibold text-[#f26522]">Aplicação no Bastidor: </span>
            {current.rackApplication}
          </div>

          <div className="mt-3.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onApplyToRack(current)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#f26522] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d85213]"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Aplicar no Bastidor e Focar 3D</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
