import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CableCatalogItem,
  CableTypeId,
  CameraPresetId,
  ComponentId,
  CopperOptionId,
  FiberOptionId,
} from './data/rackData';
import { RackSceneState, ViewportMode } from './scene/RackSceneController';
import { RackViewport, RackViewportHandle } from './components/RackViewport';
import { BottomDock } from './components/BottomDock';
import { ConfigDrawer } from './components/ConfigDrawer';
import { ProductModal } from './components/ProductModal';
import { SupportModal } from './components/SupportModal';
import { CableCatalogView } from './components/CableCatalogView';

interface PersistedRackConfig {
  copperOption: CopperOptionId;
  fiberOption: FiberOptionId;
  ventilationOn: boolean;
  interiorLightOn: boolean;
}

const CONFIG_STORAGE_KEY = 'barpa_rack_config_v1';

function loadPersistedConfig(): PersistedRackConfig {
  const defaults: PersistedRackConfig = {
    copperOption: 'mixed-norma1',
    fiberOption: 'os2-sc-apc',
    ventilationOn: true,
    interiorLightOn: true,
  };
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PersistedRackConfig>;
    return {
      copperOption: parsed.copperOption ?? defaults.copperOption,
      fiberOption: parsed.fiberOption ?? defaults.fiberOption,
      ventilationOn:
        typeof parsed.ventilationOn === 'boolean' ? parsed.ventilationOn : defaults.ventilationOn,
      interiorLightOn:
        typeof parsed.interiorLightOn === 'boolean'
          ? parsed.interiorLightOn
          : defaults.interiorLightOn,
    };
  } catch {
    return defaults;
  }
}

export function App() {
  const initialConfig = useMemo(() => loadPersistedConfig(), []);

  // Mechanical & 3D scene controls (starts open to match the Barpa Norma 1 reference view)
  const [doorOpen, setDoorOpen] = useState(true);
  const [kvmOpen, setKvmOpen] = useState(true);
  const [fiberSlideOpen, setFiberSlideOpen] = useState(false);
  const [ventilationOn, setVentilationOn] = useState(initialConfig.ventilationOn);
  const [interiorLightOn, setInteriorLightOn] = useState(initialConfig.interiorLightOn);
  const [explodedAmount, setExplodedAmount] = useState(0);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);

  // Live cabling configurator & 3D Cable Showcase state
  const [copperOption, setCopperOption] = useState<CopperOptionId>(initialConfig.copperOption);
  const [fiberOption, setFiberOption] = useState<FiberOptionId>(initialConfig.fiberOption);
  const [viewMode, setViewMode] = useState<ViewportMode>('rack');
  const [activeCableSpecimen, setActiveCableSpecimen] = useState<CableTypeId>('sc-apc');

  // Active camera preset & inspected component
  const [activePreset, setActivePreset] = useState<CameraPresetId>('hero');
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>(null);
  const [modalComponent, setModalComponent] = useState<ComponentId | null>(null);

  // UI panels & drawers (dock starts collapsed on narrow mobile screens to respect <=15% sticky cap)
  const [dockCollapsed, setDockCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
  );
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportPrefill, setSupportPrefill] = useState<string | undefined>(undefined);

  const viewportApiRef = useRef<RackViewportHandle | null>(null);

  // Persist user rack configuration locally across reloads
  useEffect(() => {
    try {
      const payload: PersistedRackConfig = {
        copperOption,
        fiberOption,
        ventilationOn,
        interiorLightOn,
      };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors
    }
  }, [copperOption, fiberOption, ventilationOn, interiorLightOn]);

  const sceneState: RackSceneState = useMemo(
    () => ({
      doorOpen,
      kvmOpen,
      fiberSlideOpen,
      ventilationOn,
      interiorLightOn,
      explodedAmount,
      showDimensions,
      copperOption,
      fiberOption,
      selectedComponent,
      viewMode,
      activeCableSpecimen,
    }),
    [
      doorOpen,
      kvmOpen,
      fiberSlideOpen,
      ventilationOn,
      interiorLightOn,
      explodedAmount,
      showDimensions,
      copperOption,
      fiberOption,
      selectedComponent,
      viewMode,
      activeCableSpecimen,
    ],
  );

  // Keyboard shortcut 'H' to toggle HUD visibility (Zen Mode)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        setModalComponent(null);
        setSupportModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectPreset = useCallback((presetId: CameraPresetId) => {
    setViewMode('rack');
    setActivePreset(presetId);
    setSelectedComponent(null);
    viewportApiRef.current?.focusPreset(presetId);
  }, []);

  const handleSelectComponent = useCallback((id: ComponentId) => {
    setViewMode('rack');
    setSelectedComponent(id);
    setModalComponent(id);
    setDoorOpen(true);
    viewportApiRef.current?.focusComponent(id);
  }, []);

  const handleFocusOnlyComponent = useCallback((id: ComponentId) => {
    setViewMode('rack');
    setSelectedComponent(id);
    setDoorOpen(true);
    if (id === 'pp-fiber') setFiberSlideOpen(true);
    if (id === 'kvm') setKvmOpen(true);
    if (id === 'ventilation') setVentilationOn(true);
    viewportApiRef.current?.focusComponent(id);
  }, []);

  const handleInspectCable = useCallback((id: CableTypeId) => {
    setActiveCableSpecimen(id);
    setViewMode('cable-showcase');
    setModalComponent(null);
  }, []);

  const handleApplyCableToRack = useCallback((item: CableCatalogItem) => {
    if (item.linkedFiberOption) setFiberOption(item.linkedFiberOption);
    if (item.linkedCopperOption) setCopperOption(item.linkedCopperOption);
    setViewMode('rack');
    setDoorOpen(true);
    setSelectedComponent(item.linkedComponent);
    if (item.linkedComponent === 'pp-fiber') setFiberSlideOpen(true);
    viewportApiRef.current?.focusComponent(item.linkedComponent);
  }, []);

  const handleOpenSupport = useCallback((prefill?: string) => {
    setSupportPrefill(prefill);
    setSupportModalOpen(true);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#111317] text-[#e6e8ec]">
      {/* Clean 3-Zone Top Bar Contract (zero overflow on desktop and 390px mobile) */}
      <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#262b36] bg-[#16191f] px-3 sm:gap-6 sm:px-5">
        {/* Zone 1: Single-line brand wordmark */}
        <span className="text-base sm:text-lg font-extrabold tracking-wider text-[#f26522] whitespace-nowrap shrink-0">
          BARPA
        </span>

        {/* Zone 2: Concise single-line navigation controls */}
        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-2.5 sm:gap-5 text-[11px] sm:text-xs font-medium min-w-0"
        >
          <button
            type="button"
            onClick={() => handleSelectPreset('hero')}
            className={`hidden sm:inline-block whitespace-nowrap shrink-0 py-1 transition-colors ${
              viewMode === 'rack' && !configDrawerOpen && !showDimensions
                ? 'text-white border-b-2 border-[#f26522]'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Bastidor 3D
          </button>
          <button
            type="button"
            onClick={() => setConfigDrawerOpen((prev) => !prev)}
            aria-expanded={configDrawerOpen}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              configDrawerOpen
                ? 'text-white border-b-2 border-[#f26522]'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Cablagem
          </button>
          <button
            type="button"
            onClick={() =>
              setViewMode((prev) => (prev === 'cable-showcase' ? 'rack' : 'cable-showcase'))
            }
            aria-pressed={viewMode === 'cable-showcase'}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              viewMode === 'cable-showcase'
                ? 'text-white border-b-2 border-[#f26522]'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Cabos 3D
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('rack');
              setShowDimensions((prev) => !prev);
            }}
            aria-pressed={showDimensions}
            className={`hidden md:inline-block whitespace-nowrap shrink-0 py-1 transition-colors ${
              showDimensions && viewMode === 'rack'
                ? 'text-white border-b-2 border-[#f26522]'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Escala 1:1
          </button>
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => handleOpenSupport(undefined)}
            aria-label="Apoio Técnico"
            className="rounded-md bg-[#f26522] px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#d85213] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f26522]"
          >
            <span className="hidden sm:inline">Apoio Técnico</span>
            <span className="sm:hidden">Suporte</span>
          </button>
        </div>
      </header>

      {/* Main Content Workspace: Unobstructed 3D Viewport + Optional Side Config Drawer */}
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="relative flex min-w-0 flex-1 flex-col">
          <RackViewport
            sceneState={sceneState}
            showHotspots={showHotspots}
            onSelectComponent={handleSelectComponent}
            controllerApiRef={viewportApiRef}
          />

          {viewMode === 'cable-showcase' ? (
            <CableCatalogView
              activeCable={activeCableSpecimen}
              onSelectCable={setActiveCableSpecimen}
              onApplyToRack={handleApplyCableToRack}
              onBackToRack={() => setViewMode('rack')}
            />
          ) : (
            <BottomDock
              collapsed={dockCollapsed}
              onToggleCollapse={() => setDockCollapsed((prev) => !prev)}
              activePreset={activePreset}
              onSelectPreset={handleSelectPreset}
              doorOpen={doorOpen}
              onToggleDoor={() => setDoorOpen((prev) => !prev)}
              kvmOpen={kvmOpen}
              onToggleKvm={() => setKvmOpen((prev) => !prev)}
              fiberSlideOpen={fiberSlideOpen}
              onToggleFiberSlide={() => setFiberSlideOpen((prev) => !prev)}
              ventilationOn={ventilationOn}
              onToggleVentilation={() => setVentilationOn((prev) => !prev)}
              interiorLightOn={interiorLightOn}
              onToggleInteriorLight={() => setInteriorLightOn((prev) => !prev)}
              explodedAmount={explodedAmount}
              onExplodedChange={setExplodedAmount}
              showDimensions={showDimensions}
              onToggleDimensions={() => setShowDimensions((prev) => !prev)}
              showHotspots={showHotspots}
              onToggleHotspots={() => setShowHotspots((prev) => !prev)}
              onOpenConfigDrawer={() => setConfigDrawerOpen(true)}
            />
          )}
        </div>

        {/* Structural side configurator drawer (resizes viewport cleanly without overlapping rack) */}
        <ConfigDrawer
          open={configDrawerOpen}
          onClose={() => setConfigDrawerOpen(false)}
          copperOption={copperOption}
          onSelectCopper={setCopperOption}
          fiberOption={fiberOption}
          onSelectFiber={setFiberOption}
          selectedComponent={selectedComponent}
          onInspectComponent={handleSelectComponent}
          onInspectCable={handleInspectCable}
        />
      </main>

      {/* Technical Specification Modal */}
      <ProductModal
        componentId={modalComponent}
        onClose={() => setModalComponent(null)}
        onFocus3D={handleFocusOnlyComponent}
        onRequestSupport={() => handleOpenSupport(undefined)}
      />

      {/* Technical Support Request Modal */}
      <SupportModal
        open={supportModalOpen}
        onClose={() => {
          setSupportModalOpen(false);
          setSupportPrefill(undefined);
        }}
        copperOption={copperOption}
        fiberOption={fiberOption}
        prefillMessage={supportPrefill}
      />
    </div>
  );
}

export default App;
