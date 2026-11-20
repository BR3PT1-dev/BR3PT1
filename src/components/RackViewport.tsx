import React, { useEffect, useRef, useState } from 'react';
import {
  CameraPresetId,
  ComponentId,
  RACK_COMPONENTS,
} from '../data/rackData';
import {
  ProjectedHotspot,
  RackSceneController,
  RackSceneState,
} from '../scene/RackSceneController';

export interface RackViewportHandle {
  focusPreset: (presetId: CameraPresetId) => void;
  focusComponent: (componentId: ComponentId) => void;
}

interface RackViewportProps {
  sceneState: RackSceneState;
  showHotspots: boolean;
  onSelectComponent: (id: ComponentId) => void;
  controllerApiRef: React.MutableRefObject<RackViewportHandle | null>;
}

export const RackViewport: React.FC<RackViewportProps> = ({
  sceneState,
  showHotspots,
  onSelectComponent,
  controllerApiRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<RackSceneController | null>(null);
  const onSelectRef = useRef(onSelectComponent);
  onSelectRef.current = onSelectComponent;

  const [hotspots, setHotspots] = useState<ProjectedHotspot[]>([]);
  const [hoveredId, setHoveredId] = useState<ComponentId | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Mount Three.js scene strictly once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const controller = new RackSceneController(container, sceneState, {
      onSelectComponent: (id) => {
        onSelectRef.current(id);
      },
      onHoverComponent: (id) => {
        setHoveredId(id);
      },
      onHotspotsProjected: (projected) => {
        setHotspots(projected);
      },
      onContextLostChange: (lost) => {
        setContextLost(lost);
      },
    });

    controllerRef.current = controller;
    controllerApiRef.current = {
      focusPreset: (presetId) => controller.focusPreset(presetId),
      focusComponent: (componentId) => controller.focusComponent(componentId),
    };

    return () => {
      controllerApiRef.current = null;
      controllerRef.current = null;
      controller.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push reactive state changes into controller without remounting WebGL
  useEffect(() => {
    controllerRef.current?.updateState(sceneState);
  }, [sceneState]);

  const hoveredSpec = hoveredId ? RACK_COMPONENTS[hoveredId] : null;

  const isRackMode = sceneState.viewMode === 'rack';

  return (
    <div
      className="relative flex-1 w-full h-full overflow-hidden bg-[#13161c]"
      data-testid="rack-canvas-container"
      data-view-mode={sceneState.viewMode}
      data-cable-specimen={sceneState.activeCableSpecimen}
      data-door-open={String(sceneState.doorOpen)}
      data-kvm-open={String(sceneState.kvmOpen)}
      data-ventilation-on={String(sceneState.ventilationOn)}
      data-interior-light={String(sceneState.interiorLightOn)}
      data-copper={sceneState.copperOption}
      data-fiber={sceneState.fiberOption}
      data-dimensions={String(sceneState.showDimensions)}
    >
      {/* Isolated empty WebGL mount div */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label="Visualizador 3D interativo do Bastidor Barpa Norma 1 42U"
      />

      {/* Minimal unobtrusive top-left architectural specification label (static text, zero pills/dots) */}
      {isRackMode && (
        <div className="pointer-events-none absolute top-2.5 left-2.5 sm:top-3.5 sm:left-4 z-10 flex flex-col gap-0.5 rounded-md border border-[#262b36] bg-[#13161c]/88 px-2.5 py-1.5 sm:px-3 sm:py-2 select-none">
          <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-[#e6e8ec]">
            Bastidor Norma 1 · 42U
          </span>
          <span className="font-mono-tech text-[10px] sm:text-[11px] text-[#9aa3b5]">
            <span className="hidden sm:inline">2050 × 800 × 800 mm · Arraste para rodar · Clique nos componentes</span>
            <span className="sm:hidden">2050 × 800 × 800 mm · Arraste p/ rodar</span>
          </span>
        </div>
      )}

      {/* Projected 3D interactive hotspots */}
      {isRackMode && showHotspots && !contextLost && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {hotspots.map((hs) => {
            if (!hs.visible) return null;
            const isSelected = sceneState.selectedComponent === hs.id;
            const isHovered = hoveredId === hs.id;
            return (
              <button
                key={hs.id}
                type="button"
                aria-label={`Inspecionar componente ${hs.number}: ${hs.label}`}
                onClick={() => onSelectComponent(hs.id)}
                style={{
                  transform: `translate3d(${hs.x}px, ${hs.y}px, 0) translate(-50%, -50%)`,
                }}
                className={`pointer-events-auto group absolute top-0 left-0 flex items-center gap-1.5 rounded-full border text-xs font-semibold transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f26522] ${
                  isSelected || isHovered
                    ? 'z-20 scale-105 border-[#ffffff] bg-[#f26522] text-white pr-2.5 pl-1 py-0.5 shadow-md'
                    : 'z-10 border-[#f26522]/80 bg-[#191c22]/95 text-[#f3f4f6] hover:border-white hover:bg-[#f26522] w-7 h-7 justify-center'
                }`}
              >
                <span
                  className={`font-mono-tech flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    isSelected || isHovered
                      ? 'bg-black/25 text-white'
                      : 'text-[#f26522] group-hover:text-white'
                  }`}
                >
                  {hs.number}
                </span>
                {(isSelected || isHovered) && (
                  <span className="whitespace-nowrap text-[11px] font-medium">
                    {hs.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Subtle hover caption in top-right corner when hovering a 3D mesh */}
      {isRackMode && hoveredSpec && (
        <div className="pointer-events-none absolute top-4 right-5 z-10 rounded-md border border-[#2d323e] bg-[#191c22]/95 px-3 py-2 text-right">
          <div className="text-xs font-semibold text-white">{hoveredSpec.shortLabel}</div>
          <div className="font-mono-tech text-[11px] text-[#f26522]">
            {hoveredSpec.ref} · {hoveredSpec.uRange}
          </div>
        </div>
      )}

      {/* Graceful WebGL fallback overlay */}
      {contextLost && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#13161c] p-6 text-center">
          <img
            src="/assets/aistudio/image_4f8a1084.png"
            alt="Bastidor Barpa Norma 1 42U"
            className="mb-4 max-h-80 rounded-lg border border-[#2d323e] object-contain"
          />
          <p className="text-sm font-medium text-[#e6e8ec]">
            Contexto WebGL temporariamente indisponível. A restaurar visualização 3D...
          </p>
        </div>
      )}
    </div>
  );
};
