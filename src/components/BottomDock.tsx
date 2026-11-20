import React from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  Eye,
  Fan,
  Layers,
  Lightbulb,
  Monitor,
  Ruler,
  SlidersHorizontal,
} from 'lucide-react';
import { CAMERA_PRESETS, CameraPresetId } from '../data/rackData';

interface BottomDockProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activePreset: CameraPresetId;
  onSelectPreset: (id: CameraPresetId) => void;
  doorOpen: boolean;
  onToggleDoor: () => void;
  kvmOpen: boolean;
  onToggleKvm: () => void;
  fiberSlideOpen: boolean;
  onToggleFiberSlide: () => void;
  ventilationOn: boolean;
  onToggleVentilation: () => void;
  interiorLightOn: boolean;
  onToggleInteriorLight: () => void;
  explodedAmount: number;
  onExplodedChange: (val: number) => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  onOpenConfigDrawer: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  collapsed,
  onToggleCollapse,
  activePreset,
  onSelectPreset,
  doorOpen,
  onToggleDoor,
  kvmOpen,
  onToggleKvm,
  fiberSlideOpen,
  onToggleFiberSlide,
  ventilationOn,
  onToggleVentilation,
  interiorLightOn,
  onToggleInteriorLight,
  explodedAmount,
  onExplodedChange,
  showDimensions,
  onToggleDimensions,
  showHotspots,
  onToggleHotspots,
  onOpenConfigDrawer,
}) => {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col items-center px-3"
      data-testid="bottom-dock"
    >
      {/* Collapse / Expand toggle tab attached to top of dock */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Mostrar controlos 3D' : 'Ocultar controlos 3D'}
        className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-md border border-[#2d323e] bg-[#191c22]/95 px-3 py-1 text-[11px] font-medium text-[#b8c0d0] transition-colors hover:border-[#4b5366] hover:text-white focus-visible:outline-2 focus-visible:outline-[#f26522]"
      >
        {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        <span className="whitespace-nowrap">
          {collapsed ? 'Mostrar Controlos (H)' : 'Ocultar Controlos (H)'}
        </span>
      </button>

      {/* Main unified horizontal dock (solid high-opacity surface, no backdrop-filter over WebGL) */}
      <div
        className={`pointer-events-auto w-full max-w-[1060px] max-h-[42vh] overflow-y-auto sm:max-h-none sm:overflow-visible rounded-xl border border-[#2d323e] bg-[#181b21]/95 px-3.5 py-2.5 shadow-2xl transition-all duration-200 ${
          collapsed
            ? 'pointer-events-none translate-y-6 opacity-0 hidden'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="flex flex-col gap-2.5">
          {/* Row 1: Mechanical Kinematics & Inspection Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#262b36] pb-2">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={onToggleDoor}
                aria-pressed={doorOpen}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  doorOpen
                    ? 'border-[#f26522] bg-[#f26522]/15 text-white'
                    : 'border-[#2d323e] bg-[#22262f] text-[#c2c9d6] hover:text-white'
                }`}
              >
                <DoorOpen className="h-3.5 w-3.5 text-[#f26522]" />
                <span>{doorOpen ? 'Porta Aberta' : 'Porta Fechada'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleKvm}
                aria-pressed={kvmOpen}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  kvmOpen
                    ? 'border-[#f26522] bg-[#f26522]/15 text-white'
                    : 'border-[#2d323e] bg-[#22262f] text-[#c2c9d6] hover:text-white'
                }`}
              >
                <Monitor className="h-3.5 w-3.5 text-[#f26522]" />
                <span>{kvmOpen ? 'KVM Aberta' : 'KVM Recolhida'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleFiberSlide}
                aria-pressed={fiberSlideOpen}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  fiberSlideOpen
                    ? 'border-[#f26522] bg-[#f26522]/15 text-white'
                    : 'border-[#2d323e] bg-[#22262f] text-[#c2c9d6] hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-[#f26522]" />
                <span>{fiberSlideOpen ? 'Gaveta Fibra Extraída' : 'Gaveta Fibra'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleVentilation}
                aria-pressed={ventilationOn}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  ventilationOn
                    ? 'border-[#f26522] bg-[#f26522]/15 text-white'
                    : 'border-[#2d323e] bg-[#22262f] text-[#c2c9d6] hover:text-white'
                }`}
              >
                <Fan className="h-3.5 w-3.5 text-[#f26522]" />
                <span>{ventilationOn ? 'Ventilação Ativa' : 'Ventilação'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleInteriorLight}
                aria-pressed={interiorLightOn}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  interiorLightOn
                    ? 'border-[#f26522] bg-[#f26522]/15 text-white'
                    : 'border-[#2d323e] bg-[#22262f] text-[#c2c9d6] hover:text-white'
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5 text-[#f26522]" />
                <span>{interiorLightOn ? 'Luz Interior' : 'Luz Off'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleDimensions}
                aria-pressed={showDimensions}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  showDimensions
                    ? 'border-[#f26522] bg-[#f26522]/15 text-white'
                    : 'border-[#2d323e] bg-[#22262f] text-[#c2c9d6] hover:text-white'
                }`}
              >
                <Ruler className="h-3.5 w-3.5 text-[#f26522]" />
                <span>Cotas 1:1</span>
              </button>

              <button
                type="button"
                onClick={onToggleHotspots}
                aria-pressed={showHotspots}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  showHotspots
                    ? 'border-[#3a4152] bg-[#252a35] text-white'
                    : 'border-[#2d323e] bg-[#1e222a] text-[#8c95a6] hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Pontos</span>
              </button>
            </div>

            {/* Exploded View Slider */}
            <div className="flex items-center gap-2.5">
              <label
                htmlFor="exploded-slider"
                className="text-[11px] font-medium whitespace-nowrap text-[#9ca3af]"
              >
                Vista Explodida
              </label>
              <input
                id="exploded-slider"
                type="range"
                min={0}
                max={100}
                value={Math.round(explodedAmount * 100)}
                onChange={(e) => onExplodedChange(Number(e.target.value) / 100)}
                aria-label="Separar painéis em vista explodida"
                className="barpa-slider w-24 sm:w-28"
              />
              <span className="font-mono-tech w-8 text-right text-[11px] text-[#d1d5db]">
                {Math.round(explodedAmount * 100)}%
              </span>
            </div>
          </div>

          {/* Row 2: Camera Presets + Quick Open Cabling Drawer */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <Camera className="h-3.5 w-3.5 shrink-0 text-[#8b93a5] mr-1" aria-hidden="true" />
              {CAMERA_PRESETS.map((preset) => {
                const active = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-[#f26522] text-white'
                        : 'bg-[#22262f] text-[#b8c0d0] hover:bg-[#2b303c] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onOpenConfigDrawer}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#3a4152] bg-[#22262f] px-3 py-1 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:border-[#f26522] hover:bg-[#2a2f3a]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#f26522]" />
              <span>Configurar Cablagem</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
