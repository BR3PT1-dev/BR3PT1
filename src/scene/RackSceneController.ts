import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CAMERA_PRESETS,
  CameraPresetId,
  CableTypeId,
  COMPONENT_LIST,
  ComponentId,
  CopperOptionId,
  FiberOptionId,
  RACK_COMPONENTS,
} from '../data/rackData';
import { buildCableSpecimens, CableShowcaseHandles } from './cableSpecimens';
import { buildNorma1Rack, RackAssemblyHandles } from './rackGeometry';
import { createProceduralTextures, ProceduralTextureSet } from './textures';

export type ViewportMode = 'rack' | 'cable-showcase';

export interface ProjectedHotspot {
  id: ComponentId;
  number: number;
  label: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface RackSceneState {
  doorOpen: boolean;
  kvmOpen: boolean;
  fiberSlideOpen: boolean;
  ventilationOn: boolean;
  interiorLightOn: boolean;
  explodedAmount: number; // 0..1
  showDimensions: boolean;
  copperOption: CopperOptionId;
  fiberOption: FiberOptionId;
  selectedComponent: ComponentId | null;
  viewMode: ViewportMode;
  activeCableSpecimen: CableTypeId;
}

export interface RackSceneCallbacks {
  onSelectComponent: (id: ComponentId) => void;
  onHoverComponent: (id: ComponentId | null) => void;
  onHotspotsProjected: (hotspots: ProjectedHotspot[]) => void;
  onContextLostChange?: (lost: boolean) => void;
}

// Reusable scratch vectors outside render loop (Zero GC)
const _projVec = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class RackSceneController {
  private container: HTMLElement;
  private callbacks: RackSceneCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private textures: ProceduralTextureSet;
  private rack: RackAssemblyHandles;
  private cableShowcase: CableShowcaseHandles;
  private interiorPointLight: THREE.PointLight;
  private interiorFillLight: THREE.PointLight;
  private baseFillLight: THREE.PointLight;
  private showcaseSpotLight: THREE.PointLight;
  private envRenderTarget: THREE.WebGLRenderTarget;
  private raycaster: THREE.Raycaster;
  private resizeObserver: ResizeObserver;

  // On-demand render & transition scheduling
  private frameId = 0;
  private renderBusy = false;
  private renderDirty = false;
  private disposed = false;
  private lastTickTime = performance.now();

  // Animated kinematics (current vs target)
  private doorAngleCur = THREE.MathUtils.degToRad(104);
  private doorAngleTarget = THREE.MathUtils.degToRad(104);
  private kvmOpenCur = 1;
  private kvmOpenTarget = 1;
  private fiberSlideCur = 0;
  private fiberSlideTarget = 0;
  private explodeCur = 0;
  private explodeTarget = 0;
  private ventilationOn = true;
  private interiorLightOn = true;
  private viewMode: ViewportMode = 'rack';

  // Scripted camera glide
  private cameraGliding = false;

  // Pointer tracking for click vs drag
  private pointerDownPos = { x: 0, y: 0 };
  private lastHoverCheck = 0;
  private hoveredId: ComponentId | null = null;
  private selectedId: ComponentId | null = null;

  constructor(container: HTMLElement, initialState: RackSceneState, callbacks: RackSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    // 1. Modern WebGLRenderer with software-WebGL safeguards
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // 2. Scene, Studio Atmosphere & RoomEnvironment Reflections
    this.scene = new THREE.Scene();
    const bgColor = new THREE.Color(0x13161c);
    this.scene.background = bgColor;
    this.scene.fog = new THREE.FogExp2(0x13161c, 0.085);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // 3. Camera & OrbitControls
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.08, 45);
    const heroPreset = CAMERA_PRESETS[0];
    this.camera.position.set(...heroPreset.position);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...heroPreset.target);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 0.85;
    this.controls.maxDistance = 6.2;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.minPolarAngle = 0.18;
    this.controls.panSpeed = 0.65;
    this.controls.update();

    // Cancel camera glide when user manually drags
    this.controls.addEventListener('start', () => {
      this.cameraGliding = false;
    });
    this.controls.addEventListener('change', () => {
      this.requestRender();
    });

    // 4. Studio 3-Point Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xdce8f8, 0x22252e, 0.85);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    keyLight.position.set(-2.6, 4.2, 3.2);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 12;
    const d = 2.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc7dcf5, 0.85);
    fillLight.position.set(3.4, 2.1, 1.8);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf6d3b3, 1.05);
    rimLight.position.set(1.2, 2.8, -3.4);
    this.scene.add(rimLight);

    // Subtle interior rack inspection lights + realistic shadow-casting cabinet PointLight
    this.interiorFillLight = new THREE.PointLight(0xfff7ed, 0.56, 3.2, 1.5);
    this.interiorFillLight.position.set(-0.25, 1.55, 0.92);
    this.scene.add(this.interiorFillLight);

    this.baseFillLight = new THREE.PointLight(0xfff1e0, 0.65, 2.4, 1.6);
    this.baseFillLight.position.set(-0.2, 0.42, 0.82);
    this.scene.add(this.baseFillLight);

    // Primary Realistic Interior PointLight inside the top LED bar casting shadows across equipment units
    this.interiorPointLight = new THREE.PointLight(0xfff1db, 3.2, 2.7, 1.4);
    this.interiorPointLight.position.set(-0.04, 1.93, 0.21);
    this.interiorPointLight.castShadow = !this.isSoftwareGl;
    this.interiorPointLight.shadow.mapSize.set(1024, 1024);
    this.interiorPointLight.shadow.camera.near = 0.08;
    this.interiorPointLight.shadow.camera.far = 2.4;
    this.interiorPointLight.shadow.bias = -0.0012;
    this.interiorPointLight.shadow.normalBias = 0.018;
    this.scene.add(this.interiorPointLight);

    // Dedicated crisp overhead accent light for the 3D Cable Specimen Plinth
    this.showcaseSpotLight = new THREE.PointLight(0xfff8ef, 0, 3.0, 1.4);
    this.showcaseSpotLight.position.set(0.2, 0.95, 0.65);
    this.scene.add(this.showcaseSpotLight);

    // Studio softbox highlight on GPU devices
    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xffffff, 2.4, 2.2, 1.6);
      softbox.position.set(-1.6, 2.6, 2.0);
      softbox.lookAt(0, 1.05, 0);
      this.scene.add(softbox);
    }

    // 5. Procedural Textures, Studio Floor & Contact Shadow
    this.textures = createProceduralTextures(this.renderer.capabilities.getMaxAnisotropy());

    const floorGeo = new THREE.PlaneGeometry(18, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: this.textures.floorTileMap,
      roughness: 0.78,
      metalness: 0.12,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Soft radial contact shadow plane directly beneath the cabinet (offset Y = 0.003 to prevent Z-fighting)
    const contactShadowGeo = new THREE.PlaneGeometry(1.55, 1.55);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadowMap,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.003;
    this.scene.add(contactShadow);

    // Subtle studio curved backdrop ring / horizon floor accent
    const ringFloor = new THREE.Mesh(
      new THREE.RingGeometry(0.88, 0.895, 64),
      new THREE.MeshBasicMaterial({
        color: 0x2c323f,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    ringFloor.rotation.x = -Math.PI / 2;
    ringFloor.position.y = 0.005;
    this.scene.add(ringFloor);

    // 6. Build the Hero 3D Barpa Norma 1 42U Rack + 3D Cable Showcase Specimens
    this.rack = buildNorma1Rack(this.textures, this.isSoftwareGl);
    this.scene.add(this.rack.root);

    this.cableShowcase = buildCableSpecimens(this.isSoftwareGl);
    this.scene.add(this.cableShowcase.root);

    // Apply initial mechanical, lighting, view mode & cabling state immediately
    this.doorAngleTarget = initialState.doorOpen ? THREE.MathUtils.degToRad(104) : 0;
    this.doorAngleCur = this.doorAngleTarget;
    this.kvmOpenTarget = initialState.kvmOpen ? 1 : 0;
    this.kvmOpenCur = this.kvmOpenTarget;
    this.fiberSlideTarget = initialState.fiberSlideOpen ? 1 : 0;
    this.fiberSlideCur = this.fiberSlideTarget;
    this.explodeTarget = initialState.explodedAmount;
    this.explodeCur = this.explodeTarget;
    this.ventilationOn = initialState.ventilationOn;
    this.interiorLightOn = initialState.interiorLightOn;
    this.viewMode = initialState.viewMode;
    this.rack.dimensionsGroup.visible = initialState.showDimensions;
    this.rack.setCopperStyle(initialState.copperOption);
    this.rack.setFiberStyle(initialState.fiberOption);
    this.rack.setVentilationActive(initialState.ventilationOn);
    this.rack.setInteriorLightActive(initialState.interiorLightOn);
    this.cableShowcase.setActiveCable(initialState.activeCableSpecimen);
    this.syncVisibilityAndLights();
    this.applyKinematics();

    // 7. Raycaster restricted to Layer 1 proxy boxes
    this.raycaster = new THREE.Raycaster();
    this.raycaster.layers.set(1);

    // Pre-warm shaders on GPU
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 8. Event Listeners
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    // Trigger initial render
    this.requestRender();
  }

  private syncVisibilityAndLights() {
    const isRack = this.viewMode === 'rack';
    this.rack.root.visible = isRack;
    this.cableShowcase.root.visible = !isRack;

    if (isRack) {
      this.interiorPointLight.intensity = this.interiorLightOn ? 3.2 : 0;
      this.interiorFillLight.intensity = this.interiorLightOn ? 0.65 : 0.25;
      this.baseFillLight.intensity = this.interiorLightOn ? 0.72 : 0.28;
      this.showcaseSpotLight.intensity = 0;
      this.controls.minDistance = 0.85;
      this.controls.maxDistance = 6.2;
    } else {
      this.interiorPointLight.intensity = 0;
      this.interiorFillLight.intensity = 0;
      this.baseFillLight.intensity = 0;
      this.showcaseSpotLight.intensity = 2.2;
      this.controls.minDistance = 0.35;
      this.controls.maxDistance = 2.2;
    }
  }

  public updateState(next: RackSceneState) {
    const modeChanged = next.viewMode !== this.viewMode;
    this.viewMode = next.viewMode;
    this.doorAngleTarget = next.doorOpen ? THREE.MathUtils.degToRad(104) : 0;
    this.kvmOpenTarget = next.kvmOpen ? 1 : 0;
    this.fiberSlideTarget = next.fiberSlideOpen ? 1 : 0;
    this.ventilationOn = next.ventilationOn;
    this.interiorLightOn = next.interiorLightOn;
    this.explodeTarget = next.explodedAmount;
    this.rack.dimensionsGroup.visible = next.showDimensions;
    this.rack.setCopperStyle(next.copperOption);
    this.rack.setFiberStyle(next.fiberOption);
    this.rack.setVentilationActive(next.ventilationOn);
    this.rack.setInteriorLightActive(next.interiorLightOn);
    this.cableShowcase.setActiveCable(next.activeCableSpecimen);
    this.selectedId = next.selectedComponent;
    this.syncVisibilityAndLights();
    this.syncHighlights();

    if (modeChanged) {
      this.cameraGliding = false;
      if (this.viewMode === 'cable-showcase') {
        this.camera.position.set(-0.04, 0.86, 1.32);
        this.controls.target.set(0.24, 0.08, 0.0);
      } else {
        const hero = CAMERA_PRESETS[0];
        this.camera.position.set(...hero.position);
        this.controls.target.set(...hero.target);
      }
      this.controls.update();
    }

    this.requestRender();
  }

  public focusPreset(presetId: CameraPresetId) {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    _camGoalPos.set(...preset.position);
    _camGoalTarget.set(...preset.target);
    this.cameraGliding = true;
    this.requestRender();
  }

  public focusComponent(componentId: ComponentId) {
    const comp = RACK_COMPONENTS[componentId];
    if (!comp) return;
    _camGoalPos.set(...comp.cameraPreset.position);
    _camGoalTarget.set(...comp.cameraPreset.target);
    this.cameraGliding = true;
    this.selectedId = componentId;
    this.syncHighlights();
    this.requestRender();
  }

  private syncHighlights() {
    this.rack.highlightMeshes.forEach((outline, id) => {
      outline.visible = id === this.selectedId || id === this.hoveredId;
    });
  }

  private applyKinematics() {
    // Hinged front door opens outward to the right (+Y rotation)
    this.rack.frontDoorPivot.rotation.y = this.doorAngleCur;

    // Exploded view smoothly separates outer envelope panels
    const ex = this.explodeCur;
    this.rack.leftSidePanel.position.x = -ex * 0.42;
    this.rack.rightSidePanel.position.x = ex * 0.42;
    this.rack.topCover.position.y = ex * 0.24;
    this.rack.rearDoorPivot.position.z = -0.4 + 0.005 - ex * 0.34;

    // Fiber optical drawer slides forward (+Z)
    this.rack.fiberDrawer.position.z = this.fiberSlideCur * 0.22;

    // KVM slides out first (0 -> 0.55), then flips LCD lid up (0.35 -> 1.0)
    const slideT = THREE.MathUtils.clamp(this.kvmOpenCur / 0.65, 0, 1);
    const flipT = THREE.MathUtils.clamp((this.kvmOpenCur - 0.25) / 0.75, 0, 1);
    this.rack.kvmTray.position.z = slideT * 0.31;
    // Rotate lid upward (-1.70 rad = ~97 deg open so screen faces viewer cleanly)
    this.rack.kvmScreenPivot.rotation.x = -flipT * 1.68;
  }

  private stepAnimations(dt: number): boolean {
    let stillMoving = false;
    const dampSpeed = this.isSoftwareGl ? 14 : 7.5;

    const dampToward = (cur: number, target: number, eps = 0.002): [number, boolean] => {
      if (Math.abs(cur - target) <= eps) return [target, false];
      const next = THREE.MathUtils.damp(cur, target, dampSpeed, dt);
      if (Math.abs(next - target) <= eps) return [target, false];
      return [next, true];
    };

    let moving = false;
    [this.doorAngleCur, moving] = dampToward(this.doorAngleCur, this.doorAngleTarget, 0.004);
    stillMoving = stillMoving || moving;

    [this.kvmOpenCur, moving] = dampToward(this.kvmOpenCur, this.kvmOpenTarget);
    stillMoving = stillMoving || moving;

    [this.fiberSlideCur, moving] = dampToward(this.fiberSlideCur, this.fiberSlideTarget);
    stillMoving = stillMoving || moving;

    [this.explodeCur, moving] = dampToward(this.explodeCur, this.explodeTarget);
    stillMoving = stillMoving || moving;

    if (this.cameraGliding) {
      const k = 1 - Math.exp(-(this.isSoftwareGl ? 12 : 6.5) * dt);
      this.camera.position.lerp(_camGoalPos, k);
      this.controls.target.lerp(_camGoalTarget, k);
      if (
        this.camera.position.distanceTo(_camGoalPos) < 0.015 &&
        this.controls.target.distanceTo(_camGoalTarget) < 0.012
      ) {
        this.camera.position.copy(_camGoalPos);
        this.controls.target.copy(_camGoalTarget);
        this.cameraGliding = false;
      } else {
        stillMoving = true;
      }
    }

    if (this.ventilationOn && this.viewMode === 'rack') {
      const spinStep = dt * 10.5;
      for (const rotor of this.rack.fanRotors) {
        rotor.rotation.y += spinStep;
      }
      stillMoving = true;
    }

    this.applyKinematics();
    return stillMoving;
  }

  private projectHotspots() {
    if (this.viewMode !== 'rack') {
      this.callbacks.onHotspotsProjected([]);
      return;
    }
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    if (width <= 0 || height <= 0) return;

    const result: ProjectedHotspot[] = COMPONENT_LIST.map((comp) => {
      _projVec.set(
        comp.hotspotLocalPos[0],
        comp.hotspotLocalPos[1],
        comp.hotspotLocalPos[2],
      );
      if (comp.id === 'kvm') {
        _projVec.z = 0.285 + this.kvmOpenCur * 0.24;
      } else if (comp.id === 'pp-fiber') {
        _projVec.z = 0.34 + this.fiberSlideCur * 0.22;
      } else if (comp.id === 'ventilation') {
        _projVec.y += this.explodeCur * 0.24;
      }

      _projVec.project(this.camera);
      const isInFront = _projVec.z >= -1 && _projVec.z <= 1;
      const sx = ((_projVec.x + 1) / 2) * width;
      const sy = ((-_projVec.y + 1) / 2) * height;
      const inBounds = isInFront && sx > 24 && sx < width - 24 && sy > 24 && sy < height - 24;

      return {
        id: comp.id,
        number: comp.hotspotNumber,
        label: comp.shortLabel,
        x: Math.round(sx),
        y: Math.round(sy),
        visible: inBounds,
      };
    });

    this.callbacks.onHotspotsProjected(result);
  }

  private afterDraw(cb: () => void) {
    if (this.disposed) return;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public requestRender = () => {
    if (this.disposed) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }
    this.renderBusy = true;
    this.frameId = requestAnimationFrame(() => {
      if (this.disposed) return;
      this.renderDirty = false;

      const now = performance.now();
      const dt = Math.min((now - this.lastTickTime) / 1000, 0.08);
      this.lastTickTime = now;

      const animating = this.stepAnimations(dt);
      const controlsMoved = this.controls.update();

      this.renderer.render(this.scene, this.camera);
      this.projectHotspots();

      const done = () => {
        this.renderBusy = false;
        if (this.renderDirty || animating || controlsMoved) {
          this.requestRender();
        }
      };

      if (this.isSoftwareGl) {
        this.afterDraw(done);
      } else {
        done();
      }
    });
  };

  private pickComponent(clientX: number, clientY: number): ComponentId | null {
    if (this.viewMode !== 'rack') return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    _pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(_pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.rack.interactableMeshes, false);
    if (hits.length > 0) {
      return (hits[0].object.userData.componentId as ComponentId) ?? null;
    }
    return null;
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.pointerDownPos.x = e.clientX;
    this.pointerDownPos.y = e.clientY;
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (this.viewMode !== 'rack') {
      if (this.hoveredId !== null) {
        this.hoveredId = null;
        this.renderer.domElement.style.cursor = 'grab';
        this.syncHighlights();
        this.callbacks.onHoverComponent(null);
      }
      return;
    }
    const now = performance.now();
    if (now - this.lastHoverCheck < 45) return;
    this.lastHoverCheck = now;

    const hitId = this.pickComponent(e.clientX, e.clientY);
    if (hitId !== this.hoveredId) {
      this.hoveredId = hitId;
      this.renderer.domElement.style.cursor = hitId ? 'pointer' : 'grab';
      this.syncHighlights();
      this.callbacks.onHoverComponent(hitId);
      this.requestRender();
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.viewMode !== 'rack') return;
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    if (dx * dx + dy * dy > 36) return; // User orbited/dragged

    const hitId = this.pickComponent(e.clientX, e.clientY);
    if (hitId) {
      this.callbacks.onSelectComponent(hitId);
    }
  };

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, 240);
    const height = Math.max(this.container.clientHeight, 240);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.requestRender();
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onContextLostChange?.(true);
  };

  private handleContextRestored = () => {
    this.callbacks.onContextLostChange?.(false);
    this.requestRender();
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.controls.dispose();
    this.rack.dispose();
    this.cableShowcase.dispose();
    this.textures.dispose();
    this.envRenderTarget.dispose();
    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
