import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_COMPONENT_IDS,
  CableCatalogItem,
  CableTypeId,
  CameraPresetId,
  ComponentId,
  CopperOptionId,
  FiberOptionId,
  RACK_COMPONENTS,
} from './data/rackData';
import { RackSceneState, ViewportMode } from './scene/RackSceneController';
import { RackViewport, RackViewportHandle } from './components/RackViewport';
import { BottomDock } from './components/BottomDock';
import { ConfigDrawer } from './components/ConfigDrawer';
import { ProductModal } from './components/ProductModal';
import { SupportModal } from './components/SupportModal';
import { BarpaAiSupportPanel } from './components/BarpaAiSupportPanel';
import { BarpaRoamingChatbot } from './components/BarpaRoamingChatbot';
import { CableCatalogView } from './components/CableCatalogView';

interface PersistedRackConfig {
  installedComponents: ComponentId[];
  copperOption: CopperOptionId;
  fiberOption: FiberOptionId;
  ventilationOn: boolean;
  interiorLightOn: boolean;
}

const CONFIG_STORAGE_KEY = 'barpa_rack_builder_v2';

function loadPersistedConfig(): PersistedRackConfig {
  const defaults: PersistedRackConfig = {
    installedComponents: [],
    copperOption: 'mixed-norma1',
    fiberOption: 'os2-sc-apc',
    ventilationOn: true,
    interiorLightOn: true,
  };
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PersistedRackConfig>;
    const validInstalled = Array.isArray(parsed.installedComponents)
      ? Array.from(
          new Set(
            parsed.installedComponents.filter(
              (id): id is ComponentId =>
                typeof id === 'string' && Boolean(RACK_COMPONENTS[id as ComponentId]),
            ),
          ),
        )
      : defaults.installedComponents;

    return {
      installedComponents: validInstalled,
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

  // Installed products in the 3D rack (starts empty without accessories so the user mounts step-by-step)
  const [installedComponents, setInstalledComponents] = useState<ComponentId[]>(
    initialConfig.installedComponents,
  );

  // Mechanical & 3D scene controls (door starts open to clearly inspect empty 19" rails and U-numbers)
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

  // Active camera preset, inspected component, slot preview & installation guide
  const [activePreset, setActivePreset] = useState<CameraPresetId>('hero');
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>(null);
  const [previewComponent, setPreviewComponent] = useState<ComponentId | null>(null);
  const [activeGuideComponent, setActiveGuideComponent] = useState<ComponentId>('ventilation');
  const [modalComponent, setModalComponent] = useState<ComponentId | null>(null);

  // UI panels & drawers (side product catalog open by default on desktop, closed on mobile)
  const [dockCollapsed, setDockCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
  );
  const [configDrawerOpen, setConfigDrawerOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 768,
  );
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportPrefill, setSupportPrefill] = useState<string | undefined>(undefined);

  const viewportApiRef = useRef<RackViewportHandle | null>(null);

  // Persist user rack build & cabling configuration locally across reloads
  useEffect(() => {
    try {
      const payload: PersistedRackConfig = {
        installedComponents,
        copperOption,
        fiberOption,
        ventilationOn,
        interiorLightOn,
      };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors
    }
  }, [installedComponents, copperOption, fiberOption, ventilationOn, interiorLightOn]);

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
      installedComponents,
      selectedComponent,
      previewComponent,
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
      installedComponents,
      selectedComponent,
      previewComponent,
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
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        setModalComponent(null);
        setAiPanelOpen(false);
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
    setPreviewComponent(null);
    viewportApiRef.current?.focusPreset(presetId);
  }, []);

  const handleSelectComponent = useCallback((id: ComponentId) => {
    setViewMode('rack');
    setSelectedComponent(id);
    setActiveGuideComponent(id);
    setPreviewComponent(null);
    setModalComponent(id);
    setDoorOpen(true);
    viewportApiRef.current?.focusComponent(id);
  }, []);

  const handleFocusOnlyComponent = useCallback((id: ComponentId) => {
    setViewMode('rack');
    setSelectedComponent(id);
    setActiveGuideComponent(id);
    setDoorOpen(true);
    if (id === 'pp-fiber') setFiberSlideOpen(true);
    if (id === 'kvm') setKvmOpen(true);
    if (id === 'ventilation') setVentilationOn(true);
    viewportApiRef.current?.focusComponent(id);
  }, []);

  const handleToggleInstall = useCallback((id: ComponentId) => {
    setViewMode('rack');
    setDoorOpen(true);
    setActiveGuideComponent(id);

    setInstalledComponents((prev) => {
      const alreadyInstalled = prev.includes(id);
      if (alreadyInstalled) {
        setSelectedComponent((sel) => (sel === id ? null : sel));
        setModalComponent((mod) => (mod === id ? null : mod));
        setPreviewComponent(id);
        return prev.filter((item) => item !== id);
      }

      setSelectedComponent(id);
      setPreviewComponent(null);
      if (id === 'ventilation') setVentilationOn(true);
      if (id === 'kvm') setKvmOpen(true);
      viewportApiRef.current?.focusComponent(id);
      return [...prev, id];
    });
  }, []);

  const handleRemoveFromRack = useCallback((id: ComponentId) => {
    setInstalledComponents((prev) => prev.filter((item) => item !== id));
    setSelectedComponent((sel) => (sel === id ? null : sel));
    setModalComponent((mod) => (mod === id ? null : mod));
    setPreviewComponent(id);
  }, []);

  const handleInstallAll = useCallback(() => {
    setViewMode('rack');
    setDoorOpen(true);
    setInstalledComponents(ALL_COMPONENT_IDS);
    setPreviewComponent(null);
    setSelectedComponent(null);
    setActivePreset('hero');
    viewportApiRef.current?.focusPreset('hero');
  }, []);

  const handleClearAll = useCallback(() => {
    setViewMode('rack');
    setInstalledComponents([]);
    setSelectedComponent(null);
    setModalComponent(null);
    setPreviewComponent(null);
    setActivePreset('hero');
    viewportApiRef.current?.focusPreset('hero');
  }, []);

  const handleInspectSlotOrComponent = useCallback(
    (id: ComponentId) => {
      setViewMode('rack');
      setDoorOpen(true);
      setActiveGuideComponent(id);
      const isInstalled = installedComponents.includes(id);
      if (isInstalled) {
        setSelectedComponent(id);
        setPreviewComponent(null);
      } else {
        setSelectedComponent(null);
        setPreviewComponent(id);
      }
      viewportApiRef.current?.focusComponent(id);
    },
    [installedComponents],
  );

  const handleInspectCable = useCallback((id: CableTypeId) => {
    setActiveCableSpecimen(id);
    setViewMode('cable-showcase');
    setModalComponent(null);
  }, []);

  const handleApplyCableToRack = useCallback((item: CableCatalogItem) => {
    if (item.linkedFiberOption) setFiberOption(item.linkedFiberOption);
    if (item.linkedCopperOption) setCopperOption(item.linkedCopperOption);
    setInstalledComponents((prev) =>
      prev.includes(item.linkedComponent) ? prev : [...prev, item.linkedComponent],
    );
    setViewMode('rack');
    setDoorOpen(true);
    setPreviewComponent(null);
    setSelectedComponent(item.linkedComponent);
    setActiveGuideComponent(item.linkedComponent);
    if (item.linkedComponent === 'pp-fiber') setFiberSlideOpen(true);
    viewportApiRef.current?.focusComponent(item.linkedComponent);
  }, []);

  const handleOpenSupport = useCallback((prefill?: string) => {
    setSupportPrefill(prefill);
    setSupportModalOpen(true);
  }, []);

  const hasKvm = installedComponents.includes('kvm');
  const hasFiber = installedComponents.includes('pp-fiber');
  const hasVentilation = installedComponents.includes('ventilation');

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#111317] text-[#e6e8ec]">
      {/* Clean 3-Zone Top Bar Contract (zero overflow on desktop and 390px mobile) */}
      <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#262b36] bg-[#16191f] px-3 sm:gap-6 sm:px-5">
        {/* Zone 1: Single-line lowercase barpa brand wordmark */}
        <span className="text-lg sm:text-xl font-extrabold lowercase tracking-tight text-[#f26522] whitespace-nowrap shrink-0">
          barpa
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
            onClick={() => {
              if (viewMode !== 'rack') {
                setViewMode('rack');
                setConfigDrawerOpen(true);
              } else {
                setConfigDrawerOpen((prev) => !prev);
              }
            }}
            aria-expanded={configDrawerOpen && viewMode === 'rack'}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              configDrawerOpen && viewMode === 'rack'
                ? 'text-white border-b-2 border-[#f26522]'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Produtos
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

        {/* Zone 3: Single primary CTA for Suporte barpa IA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setAiPanelOpen((prev) => !prev)}
            aria-label="Suporte barpa IA"
            aria-expanded={aiPanelOpen}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#f26522] px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#d85213] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f26522]"
          >
            <span className="hidden sm:inline">Suporte barpa IA</span>
            <span className="sm:hidden">barpa IA</span>
          </button>
        </div>
      </header>

      {/* Main Content Workspace: Unobstructed 3D Viewport + Side Product Builder Drawer */}
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
              hasKvm={hasKvm}
              fiberSlideOpen={fiberSlideOpen}
              onToggleFiberSlide={() => setFiberSlideOpen((prev) => !prev)}
              hasFiber={hasFiber}
              ventilationOn={ventilationOn}
              onToggleVentilation={() => setVentilationOn((prev) => !prev)}
              hasVentilation={hasVentilation}
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

        {/* Structural side product & installation guide drawer */}
        <ConfigDrawer
          open={configDrawerOpen && viewMode === 'rack'}
          onClose={() => setConfigDrawerOpen(false)}
          installedComponents={installedComponents}
          onToggleInstall={handleToggleInstall}
          onInstallAll={handleInstallAll}
          onClearAll={handleClearAll}
          activeGuideComponent={activeGuideComponent}
          onSelectGuideComponent={setActiveGuideComponent}
          copperOption={copperOption}
          onSelectCopper={setCopperOption}
          fiberOption={fiberOption}
          onSelectFiber={setFiberOption}
          onInspectSlotOrComponent={handleInspectSlotOrComponent}
          onInspectCable={handleInspectCable}
          onOpenSupport={handleOpenSupport}
        />
      </main>

      {/* Technical Specification & Step-by-Step Installation Modal */}
      <ProductModal
        componentId={modalComponent}
        isInstalled={modalComponent ? installedComponents.includes(modalComponent) : false}
        onClose={() => setModalComponent(null)}
        onFocus3D={handleFocusOnlyComponent}
        onRemoveFromRack={handleRemoveFromRack}
        onRequestSupport={handleOpenSupport}
      />

      {/* Roaming 3D 'b' Chatbot Companion asking "Precisa de ajuda?" */}
      <BarpaRoamingChatbot
        visible={!aiPanelOpen && !supportModalOpen && modalComponent === null}
        rightReserved={configDrawerOpen && viewMode === 'rack' ? 416 : 20}
        bottomReserved={viewMode === 'rack' && !dockCollapsed ? 185 : 92}
        onOpenChat={() => setAiPanelOpen(true)}
      />

      {/* Suporte barpa IA Floating Chatbot Window with Animated 3D Orange 'b' */}
      <BarpaAiSupportPanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        installedComponents={installedComponents}
        copperOption={copperOption}
        fiberOption={fiberOption}
        activeCableSpecimen={activeCableSpecimen}
        onFocusComponent={(id) => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setAiPanelOpen(false);
          }
          handleInspectSlotOrComponent(id);
        }}
        onEscalateToHuman={(prefill) => handleOpenSupport(prefill)}
      />

      {/* Technical Support Request Modal */}
      <SupportModal
        open={supportModalOpen}
        onClose={() => {
          setSupportModalOpen(false);
          setSupportPrefill(undefined);
        }}
        installedComponents={installedComponents}
        copperOption={copperOption}
        fiberOption={fiberOption}
        prefillMessage={supportPrefill}
      />
    </div>
  );
}

export default App;
