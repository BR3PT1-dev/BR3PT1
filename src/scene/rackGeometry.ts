import * as THREE from 'three';
import {
  ComponentId,
  COPPER_OPTIONS,
  CopperOptionId,
  FIBER_OPTIONS,
  FiberOptionId,
  RACK_COMPONENTS,
  RACK_DIMS,
  rackUnitToY,
} from '../data/rackData';
import { createDimensionLabelTexture, ProceduralTextureSet } from './textures';

export interface RackAssemblyHandles {
  root: THREE.Group;
  frontDoorPivot: THREE.Group;
  rearDoorPivot: THREE.Group;
  leftSidePanel: THREE.Group;
  rightSidePanel: THREE.Group;
  topCover: THREE.Group;
  ventilationGroup: THREE.Group;
  roofBlankingPlate: THREE.Mesh;
  fanRotors: THREE.Group[];
  fiberDrawer: THREE.Group;
  kvmTray: THREE.Group;
  kvmScreenPivot: THREE.Group;
  verticalTrunk: THREE.Group;
  componentGroups: Map<ComponentId, THREE.Group>;
  dimensionsGroup: THREE.Group;
  interactableMeshes: THREE.Mesh[];
  highlightMeshes: Map<ComponentId, THREE.LineSegments>;
  slotGuideMeshes: Map<ComponentId, THREE.LineSegments>;
  setCopperStyle: (optionId: CopperOptionId) => void;
  setFiberStyle: (optionId: FiberOptionId) => void;
  setVentilationActive: (on: boolean) => void;
  setInteriorLightActive: (on: boolean) => void;
  dispose: () => void;
}

const INTERACT_LAYER = 1;

export function buildNorma1Rack(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): RackAssemblyHandles {
  const root = new THREE.Group();
  root.name = 'BarpaNorma1_42U';

  const disposables: Array<{ dispose: () => void }> = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };

  // --- Shared Calibrated PBR Materials (varied roughness >= 0.25 between adjacent parts) ---
  const matCabinetSteel = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x181b20,
      metalness: 0.62,
      roughness: 0.46,
      bumpMap: textures.powderCoatBump,
      bumpScale: 0.0025,
    }),
  );

  const matCabinetMatte = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x121418,
      metalness: 0.35,
      roughness: 0.72,
      bumpMap: textures.powderCoatBump,
      bumpScale: 0.002,
    }),
  );

  const matPerforatedPanel = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1b1e25,
      metalness: 0.65,
      roughness: 0.44,
      alphaMap: textures.perforatedMeshAlpha,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
    }),
  );

  const matChrome = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd8dee9,
      metalness: 0.94,
      roughness: 0.16,
    }),
  );

  const matZincRail = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.railMarkingsMap,
      metalness: 0.55,
      roughness: 0.38,
    }),
  );

  const matTemperedGlass = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      metalness: 0.05,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.86,
      transparent: true,
      opacity: isSoftwareGl ? 0.22 : 1.0,
      ior: 1.52,
      thickness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );

  const matDarkPlastic = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x15171c,
      metalness: 0.08,
      roughness: 0.78,
    }),
  );

  const matBarpaAccent = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf26522,
      metalness: 0.15,
      roughness: 0.36,
    }),
  );

  // Dynamic cabling materials updated by user selection
  const matCopperPrimary = trackMat(
    new THREE.MeshStandardMaterial({
      color: COPPER_OPTIONS[0].primaryHex,
      metalness: 0.06,
      roughness: 0.42,
    }),
  );

  const matCopperSecondary = trackMat(
    new THREE.MeshStandardMaterial({
      color: COPPER_OPTIONS[0].secondaryHex,
      metalness: 0.06,
      roughness: 0.48,
    }),
  );

  const matFiberAdapter = trackMat(
    new THREE.MeshStandardMaterial({
      color: FIBER_OPTIONS[0].adapterHex,
      metalness: 0.1,
      roughness: 0.32,
    }),
  );

  const matFiberPigtail = trackMat(
    new THREE.MeshStandardMaterial({
      color: FIBER_OPTIONS[0].pigtailHex,
      metalness: 0.05,
      roughness: 0.35,
    }),
  );

  const matBaseCoilFiber = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x6366a8,
      metalness: 0.08,
      roughness: 0.45,
    }),
  );

  const matCpaArmor = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      metalness: 0.14,
      roughness: 0.56,
    }),
  );

  const matInteriorLedDiffuser = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfff7ed,
      emissive: 0xffe4b5,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.05,
    }),
  );

  const matFanSwitchLed = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf26522,
      emissive: 0xf26522,
      emissiveIntensity: 1.8,
      roughness: 0.25,
    }),
  );

  const matFanBlade = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x262b34,
      metalness: 0.25,
      roughness: 0.52,
    }),
  );

  const W = RACK_DIMS.width;
  const H = RACK_DIMS.height;
  const D = RACK_DIMS.depth;
  const castorH = RACK_DIMS.castorHeight;
  const baseH = RACK_DIMS.baseThickness;
  const topH = RACK_DIMS.topThickness;
  const bodyBottomY = castorH;
  const bodyTopY = H - topH;
  const frameHeight = bodyTopY - (bodyBottomY + baseH);

  // =========================================================
  // 1. HEAVY-DUTY CASTORS & LEVELING FEET (Grounded at Y = 0)
  // =========================================================
  const baseGroup = new THREE.Group();
  root.add(baseGroup);

  const wheelGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16));
  wheelGeo.rotateZ(Math.PI / 2);
  const bracketGeo = trackGeo(new THREE.BoxGeometry(0.032, 0.036, 0.038));
  const footPadGeo = trackGeo(new THREE.CylinderGeometry(0.018, 0.02, 0.012, 16));
  const footStemGeo = trackGeo(new THREE.CylinderGeometry(0.006, 0.006, 0.058, 10));

  const cornerCoords: Array<[number, number]> = [
    [-W / 2 + 0.08, D / 2 - 0.08],
    [W / 2 - 0.08, D / 2 - 0.08],
    [-W / 2 + 0.08, -D / 2 + 0.08],
    [W / 2 - 0.08, -D / 2 + 0.08],
  ];

  for (const [cx, cz] of cornerCoords) {
    const wheel = new THREE.Mesh(wheelGeo, matDarkPlastic);
    wheel.position.set(cx, 0.025, cz);
    wheel.castShadow = true;
    baseGroup.add(wheel);

    const bracket = new THREE.Mesh(bracketGeo, matChrome);
    bracket.position.set(cx, 0.056, cz);
    baseGroup.add(bracket);

    const fx = cx + (cx < 0 ? 0.055 : -0.055);
    const footPad = new THREE.Mesh(footPadGeo, matDarkPlastic);
    footPad.position.set(fx, 0.006, cz);
    baseGroup.add(footPad);

    const footStem = new THREE.Mesh(footStemGeo, matChrome);
    footStem.position.set(fx, 0.041, cz);
    baseGroup.add(footStem);
  }

  // Bottom Structural Plinth
  const plinthMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(W, baseH, D)),
    matCabinetSteel,
  );
  plinthMesh.position.set(0, bodyBottomY + baseH / 2, 0);
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  baseGroup.add(plinthMesh);

  // =========================================================
  // 2. MAIN STRUCTURAL FRAME (4 Corner Pillars + Crossbars)
  // =========================================================
  const pillarSize = 0.048;
  const pillarGeo = trackGeo(new THREE.BoxGeometry(pillarSize, frameHeight, pillarSize));
  const pillarY = bodyBottomY + baseH + frameHeight / 2;

  const pillarOffsets: Array<[number, number]> = [
    [-W / 2 + pillarSize / 2, D / 2 - pillarSize / 2],
    [W / 2 - pillarSize / 2, D / 2 - pillarSize / 2],
    [-W / 2 + pillarSize / 2, -D / 2 + pillarSize / 2],
    [W / 2 - pillarSize / 2, -D / 2 + pillarSize / 2],
  ];

  for (const [px, pz] of pillarOffsets) {
    const pillar = new THREE.Mesh(pillarGeo, matCabinetSteel);
    pillar.position.set(px, pillarY, pz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    root.add(pillar);
  }

  // Side horizontal structural mid-braces
  const midBraceGeo = trackGeo(new THREE.BoxGeometry(0.022, 0.045, D - pillarSize * 2));
  for (const side of [-1, 1]) {
    const brace = new THREE.Mesh(midBraceGeo, matCabinetSteel);
    brace.position.set(side * (W / 2 - 0.022), pillarY, 0);
    brace.castShadow = true;
    brace.receiveShadow = true;
    root.add(brace);
  }

  // Top Cover / Roof Assembly (moves upward in Exploded View)
  const topCover = new THREE.Group();
  root.add(topCover);

  // Outer perimeter roof rim leaving central aperture for the 4-fan ventilation unit
  const roofRimThick = 0.16;
  const roofFrontBar = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(W + 0.008, topH, roofRimThick)),
    matCabinetSteel,
  );
  roofFrontBar.position.set(0, bodyTopY + topH / 2, D / 2 - roofRimThick / 2 + 0.004);
  roofFrontBar.castShadow = true;
  roofFrontBar.receiveShadow = true;
  topCover.add(roofFrontBar);

  const roofRearBar = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(W + 0.008, topH, roofRimThick)),
    matCabinetSteel,
  );
  roofRearBar.position.set(0, bodyTopY + topH / 2, -D / 2 + roofRimThick / 2 - 0.004);
  roofRearBar.castShadow = true;
  roofRearBar.receiveShadow = true;
  topCover.add(roofRearBar);

  const sideRoofW = (W - 0.48) / 2 + 0.004;
  for (const side of [-1, 1]) {
    const roofSideBar = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(sideRoofW, topH, D - roofRimThick * 2 + 0.01)),
      matCabinetSteel,
    );
    roofSideBar.position.set(side * (W / 2 + 0.004 - sideRoofW / 2), bodyTopY + topH / 2, 0);
    roofSideBar.castShadow = true;
    roofSideBar.receiveShadow = true;
    topCover.add(roofSideBar);
  }

  // Removable blanking cover in roof aperture when BARPA-FAN-4U is not yet installed
  const roofBlankingPlate = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.475, 0.014, 0.44)),
    matCabinetSteel,
  );
  roofBlankingPlate.position.set(0, bodyTopY + topH - 0.008, -0.01);
  roofBlankingPlate.castShadow = true;
  roofBlankingPlate.receiveShadow = true;
  topCover.add(roofBlankingPlate);

  // =========================================================
  // 2B. TOP 4-FAN VENTILATION UNIT (BARPA-FAN-4U) + INTERIOR LED BAR
  // =========================================================
  const ventilationGroup = new THREE.Group();
  ventilationGroup.position.set(0, bodyTopY, -0.01);
  ventilationGroup.userData.restPos = [0, bodyTopY, -0.01];
  ventilationGroup.userData.installOffset = [0, 0.22, 0];
  topCover.add(ventilationGroup);

  const fanChassisTop = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.49, 0.022, 0.45)),
    matCabinetSteel,
  );
  fanChassisTop.position.set(0, topH + 0.004, 0);
  fanChassisTop.castShadow = true;
  fanChassisTop.receiveShadow = true;
  ventilationGroup.add(fanChassisTop);

  const fanPlenumSkirt = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.47, 0.044, 0.43)),
    matCabinetMatte,
  );
  fanPlenumSkirt.position.set(0, 0.012, 0);
  fanPlenumSkirt.castShadow = true;
  fanPlenumSkirt.receiveShadow = true;
  ventilationGroup.add(fanPlenumSkirt);

  const fanBottomGrille = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.44, 0.4)),
    matPerforatedPanel,
  );
  fanBottomGrille.rotation.x = Math.PI / 2;
  fanBottomGrille.position.set(0, -0.011, 0);
  ventilationGroup.add(fanBottomGrille);

  const controlFascia = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.47, 0.032, 0.028)),
    matCabinetSteel,
  );
  controlFascia.position.set(0, -0.004, 0.215);
  controlFascia.castShadow = true;
  ventilationGroup.add(controlFascia);

  const thermoDialBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.008, 20)),
    matChrome,
  );
  thermoDialBase.rotation.x = Math.PI / 2;
  thermoDialBase.position.set(-0.14, -0.004, 0.23);
  ventilationGroup.add(thermoDialBase);

  const thermoKnob = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.009, 0.01, 0.012, 16)),
    matBarpaAccent,
  );
  thermoKnob.rotation.x = Math.PI / 2;
  thermoKnob.position.set(-0.14, -0.004, 0.236);
  ventilationGroup.add(thermoKnob);

  const switchBezel = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.024, 0.015, 0.008)),
    matDarkPlastic,
  );
  switchBezel.position.set(-0.085, -0.004, 0.23);
  ventilationGroup.add(switchBezel);

  const switchLed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.016, 0.009, 0.006)),
    matFanSwitchLed,
  );
  switchLed.position.set(-0.085, -0.004, 0.235);
  ventilationGroup.add(switchLed);

  const fanRotors: THREE.Group[] = [];
  const fanOffsets: Array<[number, number]> = [
    [-0.115, -0.105],
    [0.115, -0.105],
    [-0.115, 0.095],
    [0.115, 0.095],
  ];

  const fanCowlGeo = trackGeo(new THREE.TorusGeometry(0.088, 0.008, 10, 28));
  fanCowlGeo.rotateX(Math.PI / 2);
  const fanGuardRing1 = trackGeo(new THREE.TorusGeometry(0.068, 0.0022, 6, 24));
  fanGuardRing1.rotateX(Math.PI / 2);
  const fanGuardRing2 = trackGeo(new THREE.TorusGeometry(0.042, 0.0022, 6, 20));
  fanGuardRing2.rotateX(Math.PI / 2);
  const fanHubGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.018, 16));
  const fanBladeGeo = trackGeo(new THREE.BoxGeometry(0.056, 0.004, 0.022));

  for (const [fx, fz] of fanOffsets) {
    const fanUnit = new THREE.Group();
    fanUnit.position.set(fx, topH + 0.018, fz);
    ventilationGroup.add(fanUnit);

    const cowl = new THREE.Mesh(fanCowlGeo, matDarkPlastic);
    cowl.castShadow = true;
    fanUnit.add(cowl);

    for (const gy of [0.009, -0.036]) {
      const g1 = new THREE.Mesh(fanGuardRing1, matChrome);
      g1.position.y = gy;
      const g2 = new THREE.Mesh(fanGuardRing2, matChrome);
      g2.position.y = gy;
      fanUnit.add(g1, g2);
    }

    const rotor = new THREE.Group();
    rotor.position.y = -0.008;
    const hub = new THREE.Mesh(fanHubGeo, matDarkPlastic);
    rotor.add(hub);

    const bladeCount = 7;
    for (let b = 0; b < bladeCount; b++) {
      const angle = (b / bladeCount) * Math.PI * 2;
      const bladePivot = new THREE.Group();
      bladePivot.rotation.y = angle;
      const blade = new THREE.Mesh(fanBladeGeo, matFanBlade);
      blade.position.set(0.046, 0, 0);
      blade.rotation.x = 0.48;
      bladePivot.add(blade);
      rotor.add(bladePivot);
    }
    fanUnit.add(rotor);
    fanRotors.push(rotor);
  }

  // Interior LED Light Bar Fixture (mounted along front-top soffit rail inside the rack)
  const ledFixtureGroup = new THREE.Group();
  ledFixtureGroup.position.set(0, bodyTopY - 0.024, 0.255);
  ledFixtureGroup.rotation.x = 0.35;
  topCover.add(ledFixtureGroup);

  const ledHousing = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.42, 0.018, 0.028)),
    matCabinetMatte,
  );
  ledHousing.castShadow = true;
  ledFixtureGroup.add(ledHousing);

  const ledDiffuser = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.39, 0.007, 0.018)),
    matInteriorLedDiffuser,
  );
  ledDiffuser.position.set(0, -0.009, 0);
  ledFixtureGroup.add(ledDiffuser);

  // Barpa Front Roof Nameplate
  const badgeMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.barpaBadgeMap,
      roughness: 0.35,
      metalness: 0.4,
    }),
  );
  const badgePlate = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.14, 0.032)), badgeMat);
  badgePlate.position.set(-W / 2 + 0.13, bodyTopY + topH / 2, D / 2 + 0.0055);
  topCover.add(badgePlate);

  // =========================================================
  // 3. SIDE PANELS & REAR PERFORATED DOOR
  // =========================================================
  const buildSidePanel = (side: -1 | 1): THREE.Group => {
    const grp = new THREE.Group();
    const panelH = frameHeight - 0.02;
    const panelD = D - pillarSize * 2 - 0.01;
    const xPos = side * (W / 2 - 0.009);

    // Outer metallic border strips
    const topStrip = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.014, 0.04, panelD)),
      matCabinetSteel,
    );
    topStrip.position.set(xPos, bodyTopY - 0.028, 0);
    grp.add(topStrip);

    const botStrip = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.014, 0.04, panelD)),
      matCabinetSteel,
    );
    botStrip.position.set(xPos, bodyBottomY + baseH + 0.028, 0);
    grp.add(botStrip);

    // Perforated steel ventilation sheet
    const perfPlane = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(panelD - 0.02, panelH - 0.07)),
      matPerforatedPanel,
    );
    perfPlane.rotation.y = side * (Math.PI / 2);
    perfPlane.position.set(xPos, pillarY, 0);
    grp.add(perfPlane);

    // Cam lock cylinder at top center
    const lock = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.016, 12)),
      matChrome,
    );
    lock.rotation.z = Math.PI / 2;
    lock.position.set(xPos + side * 0.005, bodyTopY - 0.03, 0);
    grp.add(lock);

    return grp;
  };

  const leftSidePanel = buildSidePanel(-1);
  const rightSidePanel = buildSidePanel(1);
  root.add(leftSidePanel, rightSidePanel);

  // Rear Perforated Door
  const rearDoorPivot = new THREE.Group();
  rearDoorPivot.position.set(-W / 2 + 0.015, pillarY, -D / 2 + 0.005);
  root.add(rearDoorPivot);

  const rearFrameW = W - 0.03;
  const rearFrameH = frameHeight + 0.03;
  const rearMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(rearFrameW - 0.08, rearFrameH - 0.08)),
    matPerforatedPanel,
  );
  rearMesh.position.set(rearFrameW / 2, 0, -0.006);
  rearDoorPivot.add(rearMesh);

  // Rear door perimeter bars
  const rVertGeo = trackGeo(new THREE.BoxGeometry(0.045, rearFrameH, 0.018));
  const rHorizGeo = trackGeo(new THREE.BoxGeometry(rearFrameW, 0.045, 0.018));
  const rLeft = new THREE.Mesh(rVertGeo, matCabinetSteel);
  rLeft.position.set(0.022, 0, -0.006);
  const rRight = new THREE.Mesh(rVertGeo, matCabinetSteel);
  rRight.position.set(rearFrameW - 0.022, 0, -0.006);
  const rTop = new THREE.Mesh(rHorizGeo, matCabinetSteel);
  rTop.position.set(rearFrameW / 2, rearFrameH / 2 - 0.022, -0.006);
  const rBot = new THREE.Mesh(rHorizGeo, matCabinetSteel);
  rBot.position.set(rearFrameW / 2, -rearFrameH / 2 + 0.022, -0.006);
  rearDoorPivot.add(rLeft, rRight, rTop, rBot);

  // =========================================================
  // 4. HINGED FRONT TEMPERED GLASS DOOR (Opens Right like photo)
  // =========================================================
  const frontDoorPivot = new THREE.Group();
  // Hinge located at front-right corner of the cabinet
  frontDoorPivot.position.set(W / 2 - 0.012, pillarY, D / 2 + 0.006);
  root.add(frontDoorPivot);

  const doorW = W - 0.024;
  const doorH = frameHeight + 0.035;
  const stileW = 0.068;
  const railH = 0.046;

  // Vertical door stiles (hinge side at x = 0, latch side at x = -doorW)
  const stileGeo = trackGeo(new THREE.BoxGeometry(stileW, doorH, 0.022));
  const hingeStile = new THREE.Mesh(stileGeo, matCabinetSteel);
  hingeStile.position.set(-stileW / 2, 0, 0);
  hingeStile.castShadow = true;
  frontDoorPivot.add(hingeStile);

  const latchStile = new THREE.Mesh(stileGeo, matCabinetSteel);
  latchStile.position.set(-doorW + stileW / 2, 0, 0);
  latchStile.castShadow = true;
  frontDoorPivot.add(latchStile);

  // Angled ventilation louvers on both front door stiles (signature detail from photo!)
  const slotCount = 34;
  const slotGeo = trackGeo(new THREE.BoxGeometry(0.028, 0.007, 0.025));
  const slotMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x050608,
      metalness: 0.2,
      roughness: 0.9,
    }),
  );
  const slotInst = new THREE.InstancedMesh(slotGeo, slotMat, slotCount * 2);
  const dummy = new THREE.Object3D();
  let sIdx = 0;
  for (const sx of [-stileW / 2, -doorW + stileW / 2]) {
    for (let i = 0; i < slotCount; i++) {
      const sy = -doorH / 2 + 0.09 + (i / (slotCount - 1)) * (doorH - 0.18);
      dummy.position.set(sx, sy, 0);
      dummy.rotation.set(0, 0, sx < -doorW / 2 ? -0.35 : 0.35);
      dummy.updateMatrix();
      slotInst.setMatrixAt(sIdx++, dummy.matrix);
    }
  }
  slotInst.instanceMatrix.needsUpdate = true;
  slotInst.computeBoundingSphere();
  frontDoorPivot.add(slotInst);

  // Top & Bottom door horizontal rails
  const horizDoorGeo = trackGeo(new THREE.BoxGeometry(doorW - stileW * 2, railH, 0.022));
  const topDoorRail = new THREE.Mesh(horizDoorGeo, matCabinetSteel);
  topDoorRail.position.set(-doorW / 2, doorH / 2 - railH / 2, 0);
  const botDoorRail = new THREE.Mesh(horizDoorGeo, matCabinetSteel);
  botDoorRail.position.set(-doorW / 2, -doorH / 2 + railH / 2, 0);
  frontDoorPivot.add(topDoorRail, botDoorRail);

  // Clear Tempered Glass Center Pane
  const glassMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(doorW - stileW * 2 + 0.006, doorH - railH * 2 + 0.006)),
    matTemperedGlass,
  );
  glassMesh.position.set(-doorW / 2, 0, 0);
  glassMesh.renderOrder = 10;
  frontDoorPivot.add(glassMesh);

  // Chrome Swing-Handle Lock on latch stile
  const handleBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.028, 0.135, 0.016)),
    matDarkPlastic,
  );
  handleBase.position.set(-doorW + stileW / 2, 0.02, 0.016);
  const handleLever = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.016, 0.088, 0.014)),
    matChrome,
  );
  handleLever.position.set(-doorW + stileW / 2, 0.015, 0.026);
  frontDoorPivot.add(handleBase, handleLever);

  // =========================================================
  // 5. INTERNAL 19" VERTICAL MOUNTING RAILS & LEFT/RIGHT CABLE ORGANIZERS
  // =========================================================
  const rackCenterX = 0; // Symmetric 19" bay flanked by BOTH left and right vertical cable organizers
  const railSpan = RACK_DIMS.railWidth; // 0.4826m
  const railHeight = RACK_DIMS.totalU * RACK_DIMS.uHeight; // ~1.867m
  const railCenterY = rackUnitToY(21.5);
  const frontRailZ = 0.285;
  const rearRailZ = -0.255;

  const railGeo = trackGeo(new THREE.BoxGeometry(0.032, railHeight, 0.022));
  const railPositions: Array<[number, number]> = [
    [rackCenterX - railSpan / 2, frontRailZ],
    [rackCenterX + railSpan / 2, frontRailZ],
    [rackCenterX - railSpan / 2, rearRailZ],
    [rackCenterX + railSpan / 2, rearRailZ],
  ];

  for (const [rx, rz] of railPositions) {
    const rail = new THREE.Mesh(railGeo, rz > 0 ? matZincRail : matCabinetMatte);
    rail.position.set(rx, railCenterY, rz);
    root.add(rail);
  }

  // Symmetric Left & Right Vertical Cable Management Organizers (matching Norma 1 twin vertical ducts)
  const ductOffset = railSpan / 2 + 0.068;
  const leftDuctX = rackCenterX - ductOffset;
  const ductX = rackCenterX + ductOffset;
  const ductBodyGeo = trackGeo(new THREE.BoxGeometry(0.084, railHeight - 0.04, 0.082));
  const ductFrontCoverGeo = trackGeo(new THREE.BoxGeometry(0.072, railHeight - 0.06, 0.01));

  for (const side of [-1, 1] as const) {
    const sx = rackCenterX + side * ductOffset;
    const ductCover = new THREE.Mesh(ductBodyGeo, matCabinetMatte);
    ductCover.position.set(sx, railCenterY, frontRailZ - 0.022);
    ductCover.castShadow = true;
    ductCover.receiveShadow = true;
    root.add(ductCover);

    const frontTrimDoor = new THREE.Mesh(ductFrontCoverGeo, matCabinetSteel);
    frontTrimDoor.position.set(sx, railCenterY, frontRailZ + 0.022);
    frontTrimDoor.castShadow = true;
    root.add(frontTrimDoor);
  }

  // Slotted horizontal cable-entry fingers along the inner face of BOTH left and right organizers
  const fingerCountPerSide = 20;
  const sideFingerGeo = trackGeo(new THREE.BoxGeometry(0.024, 0.014, 0.036));
  const sideFingersInst = new THREE.InstancedMesh(
    sideFingerGeo,
    matDarkPlastic,
    fingerCountPerSide * 2,
  );
  let sfIdx = 0;
  for (const side of [-1, 1] as const) {
    const innerEdgeX = rackCenterX + side * (railSpan / 2 + 0.024);
    for (let i = 0; i < fingerCountPerSide; i++) {
      const fy = rackUnitToY(2 + i * 2);
      dummy.position.set(innerEdgeX, fy, frontRailZ + 0.004);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      sideFingersInst.setMatrixAt(sfIdx++, dummy.matrix);
    }
  }
  sideFingersInst.instanceMatrix.needsUpdate = true;
  sideFingersInst.computeBoundingSphere();
  root.add(sideFingersInst);

  // Inner D-ring cable guides along both left and right rails
  const ringGeo = trackGeo(new THREE.TorusGeometry(0.018, 0.0038, 8, 16));
  const sideRingsInst = new THREE.InstancedMesh(ringGeo, matCabinetSteel, 20);
  let srIdx = 0;
  for (const side of [-1, 1] as const) {
    const ringX = rackCenterX + side * (railSpan / 2 + 0.022);
    for (let i = 0; i < 10; i++) {
      dummy.position.set(ringX, rackUnitToY(4 + i * 4), frontRailZ + 0.018);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.updateMatrix();
      sideRingsInst.setMatrixAt(srIdx++, dummy.matrix);
    }
  }
  sideRingsInst.instanceMatrix.needsUpdate = true;
  sideRingsInst.computeBoundingSphere();
  root.add(sideRingsInst);

  // Vertical cable bundles peeking inside BOTH left and right organizer channels
  const verticalTrunk = new THREE.Group();
  root.add(verticalTrunk);

  const rightTrunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(ductX - 0.028, rackUnitToY(36), frontRailZ + 0.012),
    new THREE.Vector3(ductX - 0.022, rackUnitToY(24), frontRailZ - 0.008),
    new THREE.Vector3(ductX - 0.026, rackUnitToY(14), frontRailZ + 0.008),
    new THREE.Vector3(ductX - 0.024, 0.22, frontRailZ - 0.036),
  ]);
  const rightTrunkMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(rightTrunkCurve, 28, 0.015, 8, false)),
    matCopperPrimary,
  );
  verticalTrunk.add(rightTrunkMesh);

  const leftTrunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(leftDuctX + 0.028, rackUnitToY(39), frontRailZ + 0.012),
    new THREE.Vector3(leftDuctX + 0.022, rackUnitToY(26), frontRailZ - 0.008),
    new THREE.Vector3(leftDuctX + 0.026, rackUnitToY(14), frontRailZ + 0.008),
    new THREE.Vector3(leftDuctX + 0.024, 0.22, frontRailZ - 0.036),
  ]);
  const leftTrunkMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(leftTrunkCurve, 28, 0.014, 8, false)),
    matCopperSecondary,
  );
  verticalTrunk.add(leftTrunkMesh);

  // =========================================================
  // 6. COMPONENT 1: PAINEL ÓPTICO DESLIZANTE (39U - 41U)
  // =========================================================
  const fiberGroup = new THREE.Group();
  const fiberY = rackUnitToY(40.2);
  fiberGroup.position.set(rackCenterX, fiberY, frontRailZ);
  fiberGroup.userData.restPos = [rackCenterX, fiberY, frontRailZ];
  fiberGroup.userData.installOffset = [0, 0, 0.28];
  root.add(fiberGroup);

  // Fixed outer mounting ears
  const fiberEars = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(railSpan + 0.02, 0.132, 0.012)),
    matCabinetMatte,
  );
  fiberEars.position.set(0, 0, -0.004);
  fiberGroup.add(fiberEars);

  // Sliding optical drawer tray
  const fiberDrawer = new THREE.Group();
  fiberGroup.add(fiberDrawer);

  const fiberChassis = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(railSpan - 0.038, 0.124, 0.34)),
    matCabinetSteel,
  );
  fiberChassis.position.set(0, 0, -0.17);
  fiberChassis.castShadow = true;
  fiberChassis.receiveShadow = true;
  fiberDrawer.add(fiberChassis);

  // Optical module cassette bays (dark vertical cartridges across the face)
  for (let b = 0; b < 6; b++) {
    const bay = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.052, 0.105, 0.018)),
      matDarkPlastic,
    );
    bay.position.set(-0.08 + b * 0.056, 0.004, 0.003);
    bay.castShadow = true;
    bay.receiveShadow = true;
    fiberDrawer.add(bay);
  }

  // Left vertical adapter bank (2 columns of 12 SC/APC green or LC/CPA magenta adapters)
  const adapterGeo = trackGeo(new THREE.BoxGeometry(0.012, 0.008, 0.014));
  const adapterInst = new THREE.InstancedMesh(adapterGeo, matFiberAdapter, 24);
  let aIdx = 0;
  for (let col = 0; col < 2; col++) {
    for (let row = 0; row < 12; row++) {
      dummy.position.set(-0.185 + col * 0.022, 0.048 - row * 0.0085, 0.008);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      adapterInst.setMatrixAt(aIdx++, dummy.matrix);
    }
  }
  adapterInst.instanceMatrix.needsUpdate = true;
  adapterInst.computeBoundingSphere();
  fiberDrawer.add(adapterInst);

  // 4 Brushed Chrome Optical Radius Guide Rings below fiber modules
  const guideLoopGeo = trackGeo(new THREE.BoxGeometry(0.022, 0.032, 0.028));
  for (let r = 0; r < 4; r++) {
    const guide = new THREE.Mesh(guideLoopGeo, matChrome);
    guide.position.set(-0.15 + r * 0.105, -0.068, 0.018);
    guide.castShadow = true;
    fiberDrawer.add(guide);
  }

  // Dressed yellow/magenta fiber pigtails sweeping from adapters through guide rings
  for (let p = 0; p < 6; p++) {
    const yStart = 0.04 - p * 0.015;
    const pCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.175 + (p % 2) * 0.018, yStart, 0.016),
      new THREE.Vector3(-0.195, yStart - 0.035, 0.034),
      new THREE.Vector3(-0.13 + p * 0.02, -0.065, 0.032),
      new THREE.Vector3(0.06, -0.068, 0.026),
      new THREE.Vector3(0.24, -0.068, 0.016),
    ]);
    const pigtailMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(pCurve, 22, 0.0024, 6, false)),
      matFiberPigtail,
    );
    pigtailMesh.castShadow = true;
    fiberDrawer.add(pigtailMesh);
  }

  // CPA Furcation Boot & Armored Trunk visual (visible when CPA option is active)
  const cpaTrunkVisual = new THREE.Group();
  cpaTrunkVisual.visible = false;
  fiberDrawer.add(cpaTrunkVisual);

  const cpaBoot = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.012, 0.015, 0.044, 14)),
    matCpaArmor,
  );
  cpaBoot.rotation.z = Math.PI / 2;
  cpaBoot.position.set(0.215, -0.066, 0.016);
  cpaBoot.castShadow = true;
  cpaTrunkVisual.add(cpaBoot);

  const cpaTrunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.236, -0.066, 0.016),
    new THREE.Vector3(0.265, -0.14, 0.008),
    new THREE.Vector3(0.265, -0.82, -0.012),
    new THREE.Vector3(0.24, -1.52, -0.035),
  ]);
  const cpaTrunkMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(cpaTrunkCurve, 28, 0.009, 8, false)),
    matCpaArmor,
  );
  cpaTrunkMesh.castShadow = true;
  cpaTrunkVisual.add(cpaTrunkMesh);

  // =========================================================
  // 7. COMPONENT 2: PATCH PANELS CAT.6A + CURVED PATCH CORDS (31U - 36U)
  // =========================================================
  const copperGroup = new THREE.Group();
  copperGroup.userData.restPos = [0, 0, 0];
  copperGroup.userData.installOffset = [0, 0, 0.28];
  root.add(copperGroup);

  const ppFaceMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.patchPanelFaceMap,
      metalness: 0.45,
      roughness: 0.38,
    }),
  );

  const panelUs = [36, 34, 32];
  const guideUs = [35, 33, 31];

  const ppBodyGeo = trackGeo(new THREE.BoxGeometry(railSpan - 0.03, 0.043, 0.12));
  const ppFaceGeo = trackGeo(new THREE.PlaneGeometry(railSpan - 0.01, 0.042));
  const fingerBarGeo = trackGeo(new THREE.BoxGeometry(railSpan + 0.01, 0.042, 0.016));
  const ringBracketGeo = trackGeo(new THREE.BoxGeometry(0.012, 0.028, 0.046));

  for (const u of panelUs) {
    const py = rackUnitToY(u);
    const body = new THREE.Mesh(ppBodyGeo, matCabinetMatte);
    body.position.set(rackCenterX, py, frontRailZ - 0.06);
    body.castShadow = true;
    body.receiveShadow = true;
    copperGroup.add(body);

    const face = new THREE.Mesh(ppFaceGeo, ppFaceMat);
    face.position.set(rackCenterX, py, frontRailZ + 0.002);
    face.receiveShadow = true;
    copperGroup.add(face);
  }

  for (const u of guideUs) {
    const gy = rackUnitToY(u);
    const bar = new THREE.Mesh(fingerBarGeo, matCabinetSteel);
    bar.position.set(rackCenterX, gy, frontRailZ - 0.004);
    bar.castShadow = true;
    bar.receiveShadow = true;
    copperGroup.add(bar);

    for (let k = 0; k < 5; k++) {
      const rx = rackCenterX - 0.18 + k * 0.09;
      const hook = new THREE.Mesh(ringBracketGeo, matDarkPlastic);
      hook.position.set(rx, gy, frontRailZ + 0.024);
      hook.castShadow = true;
      copperGroup.add(hook);
    }
  }

  const plugGeo = trackGeo(new THREE.BoxGeometry(0.009, 0.009, 0.018));
  const cablesPerRow = 10;
  const totalPlugs = panelUs.length * cablesPerRow;
  const plugsInst = new THREE.InstancedMesh(plugGeo, matDarkPlastic, totalPlugs);
  let plugIdx = 0;

  panelUs.forEach((u, rowIdx) => {
    const py = rackUnitToY(u);
    const gy = rackUnitToY(guideUs[rowIdx]);
    const matCable = rowIdx === 0 ? matCopperPrimary : matCopperSecondary;

    for (let i = 0; i < cablesPerRow; i++) {
      const t = i / (cablesPerRow - 1);
      const startX = rackCenterX - 0.18 + t * 0.36;
      const startZ = frontRailZ + 0.016;
      const goLeft = i < cablesPerRow / 2;
      const edgeSide = goLeft ? -1 : 1;
      const sag = 0.016 + Math.abs(0.5 - t) * 0.016 + (i % 3) * 0.004;
      const bulgeZ = frontRailZ + 0.038 + (i % 4) * 0.004;

      dummy.position.set(startX, py - 0.004, frontRailZ + 0.009);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      plugsInst.setMatrixAt(plugIdx++, dummy.matrix);

      const exitRailX = rackCenterX + edgeSide * (railSpan / 2 + 0.022);
      const targetDuctX = goLeft ? leftDuctX + 0.024 : ductX - 0.024;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, py - 0.004, startZ),
        new THREE.Vector3(startX + edgeSide * 0.018, gy + 0.014 - sag * 0.3, bulgeZ),
        new THREE.Vector3(
          THREE.MathUtils.lerp(startX, exitRailX, 0.55),
          gy - 0.004 + (i % 3) * 0.004,
          bulgeZ + 0.004,
        ),
        new THREE.Vector3(exitRailX, gy - 0.01, frontRailZ + 0.02),
        new THREE.Vector3(targetDuctX, gy - 0.038, frontRailZ - 0.006),
      ]);

      const cableMesh = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(curve, 18, 0.0036, 6, false)),
        matCable,
      );
      cableMesh.castShadow = true;
      copperGroup.add(cableMesh);
    }
  });
  plugsInst.instanceMatrix.needsUpdate = true;
  plugsInst.computeBoundingSphere();
  copperGroup.add(plugsInst);

  // =========================================================
  // 8. COMPONENT 3: CONSOLA KVM 1U COM LCD 17" E TECLADO (22U - 27U)
  // =========================================================
  const kvmBaseY = rackUnitToY(22.5);
  const kvmAnchor = new THREE.Group();
  kvmAnchor.position.set(rackCenterX, kvmBaseY, frontRailZ);
  kvmAnchor.userData.restPos = [rackCenterX, kvmBaseY, frontRailZ];
  kvmAnchor.userData.installOffset = [0, 0, 0.28];
  root.add(kvmAnchor);

  // Fixed chassis housing inside rack
  const kvmHousing = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(railSpan - 0.03, 0.044, 0.52)),
    matCabinetMatte,
  );
  kvmHousing.position.set(0, 0, -0.26);
  kvmAnchor.add(kvmHousing);

  // Telescopic chrome side slide rails
  const slideRailGeo = trackGeo(new THREE.BoxGeometry(0.008, 0.028, 0.42));
  const leftSlide = new THREE.Mesh(slideRailGeo, matChrome);
  leftSlide.position.set(-(railSpan - 0.04) / 2, 0, 0.02);
  const rightSlide = new THREE.Mesh(slideRailGeo, matChrome);
  rightSlide.position.set((railSpan - 0.04) / 2, 0, 0.02);
  kvmAnchor.add(leftSlide, rightSlide);

  // Sliding Keyboard & Touchpad Tray (animates forward along +Z)
  const kvmTray = new THREE.Group();
  kvmAnchor.add(kvmTray);

  const trayDeck = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(railSpan - 0.05, 0.022, 0.36)),
    matCabinetSteel,
  );
  trayDeck.position.set(0, -0.004, -0.16);
  trayDeck.castShadow = true;
  kvmTray.add(trayDeck);

  // Keyboard + Touchpad textured surface
  const kbMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.keyboardMap,
      roughness: 0.65,
      metalness: 0.15,
    }),
  );
  const kbPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(railSpan - 0.08, 0.24)),
    kbMat,
  );
  kbPlane.rotation.x = -Math.PI / 2;
  kbPlane.position.set(0, 0.0085, -0.14);
  kvmTray.add(kbPlane);

  // Front chrome pull handle bar on KVM drawer
  const kvmHandle = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.16, 0.01, 0.018)),
    matChrome,
  );
  kvmHandle.position.set(0, -0.004, 0.028);
  kvmTray.add(kvmHandle);

  // Hinged 17" LCD Monitor Pivot (rotates smoothly from flat 0 rad to upright ~1.72 rad)
  const kvmScreenPivot = new THREE.Group();
  kvmScreenPivot.position.set(0, 0.009, -0.32);
  kvmTray.add(kvmScreenPivot);

  const lidW = railSpan - 0.065;
  const lidH = 0.335;
  // Back shell / bezel of LCD lid (local +Y extends upward when opened, lying along +Z when closed)
  const lcdBezel = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(lidW, 0.018, lidH)),
    matCabinetSteel,
  );
  // Pivot is at hinge edge (z = 0), lid extends forward along +Z when closed
  lcdBezel.position.set(0, 0.009, lidH / 2);
  lcdBezel.castShadow = true;
  kvmScreenPivot.add(lcdBezel);

  // Screen surface on underside of lid so when rotated up (-X rotation) it faces +Z toward user!
  const screenMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.kvmScreenMap,
      roughness: 0.22,
      metalness: 0.05,
      emissive: 0x0e1826,
      emissiveMap: textures.kvmScreenMap,
      emissiveIntensity: 0.55,
    }),
  );
  const screenPane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(lidW - 0.055, lidH - 0.06)),
    screenMat,
  );
  // Faces -Y when lid is flat; after rotating kvmScreenPivot.rotation.x = -1.72, it faces +Z!
  screenPane.rotation.x = Math.PI / 2;
  screenPane.position.set(0, -0.001, lidH / 2);
  kvmScreenPivot.add(screenPane);

  // Iconic small red latch / power accent dot at top-left of KVM bezel (visible in reference photo!)
  const redDotMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0x9f1239,
      emissiveIntensity: 0.5,
      roughness: 0.25,
    }),
  );
  const redDot = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.0065, 12, 12)), redDotMat);
  redDot.position.set(-lidW / 2 + 0.025, -0.002, lidH - 0.018);
  kvmScreenPivot.add(redDot);

  // =========================================================
  // 9. ACCESSORY DRAWER (18U-19U) + CORE MANAGED SWITCH (16U)
  // =========================================================
  const drawerGroup = new THREE.Group();
  drawerGroup.userData.restPos = [0, 0, 0];
  drawerGroup.userData.installOffset = [0, 0, 0.26];
  root.add(drawerGroup);

  const drawer2U = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(railSpan - 0.015, 0.086, 0.42)),
    matCabinetSteel,
  );
  drawer2U.position.set(rackCenterX, rackUnitToY(18.5), frontRailZ - 0.21);
  drawer2U.castShadow = true;
  drawerGroup.add(drawer2U);

  const drawerLock = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.014, 12)),
    matChrome,
  );
  drawerLock.rotation.x = Math.PI / 2;
  drawerLock.position.set(rackCenterX, rackUnitToY(18.5) + 0.01, frontRailZ + 0.006);
  drawerGroup.add(drawerLock);

  // 1U Core Switch (16U)
  const switchGroup = new THREE.Group();
  switchGroup.userData.restPos = [0, 0, 0];
  switchGroup.userData.installOffset = [0, 0, 0.26];
  root.add(switchGroup);

  const switchY = rackUnitToY(16);
  const switchBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(railSpan - 0.015, 0.043, 0.38)),
    matCabinetMatte,
  );
  switchBody.position.set(rackCenterX, switchY, frontRailZ - 0.19);
  switchBody.castShadow = true;
  switchBody.receiveShadow = true;
  switchGroup.add(switchBody);

  // Static LED indicators along the switch faceplate (green/cyan/amber)
  const ledGeo = trackGeo(new THREE.BoxGeometry(0.005, 0.004, 0.004));
  const ledGreenMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    }),
  );
  const ledCyanMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    }),
  );
  const ledGreenInst = new THREE.InstancedMesh(ledGeo, ledGreenMat, 14);
  const ledCyanInst = new THREE.InstancedMesh(ledGeo, ledCyanMat, 6);
  for (let i = 0; i < 14; i++) {
    dummy.position.set(rackCenterX - 0.19 + i * 0.018, switchY + 0.008, frontRailZ + 0.002);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    ledGreenInst.setMatrixAt(i, dummy.matrix);
  }
  for (let i = 0; i < 6; i++) {
    dummy.position.set(rackCenterX + 0.09 + i * 0.018, switchY + 0.008, frontRailZ + 0.002);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    ledCyanInst.setMatrixAt(i, dummy.matrix);
  }
  ledGreenInst.instanceMatrix.needsUpdate = true;
  ledCyanInst.instanceMatrix.needsUpdate = true;
  ledGreenInst.computeBoundingSphere();
  ledCyanInst.computeBoundingSphere();
  switchGroup.add(ledGreenInst, ledCyanInst);

  // =========================================================
  // 10. COMPONENT 4: PAINEL GUIA COM ESCOVA 1U + CABOS (13U - 15U)
  // =========================================================
  const brushY = rackUnitToY(14);
  const brushGroup = new THREE.Group();
  brushGroup.userData.restPos = [0, 0, 0];
  brushGroup.userData.installOffset = [0, 0, 0.24];
  root.add(brushGroup);

  const brushFrame = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(railSpan + 0.008, 0.043, 0.014)),
    matCabinetSteel,
  );
  brushFrame.position.set(rackCenterX, brushY, frontRailZ - 0.004);
  brushFrame.castShadow = true;
  brushFrame.receiveShadow = true;
  brushGroup.add(brushFrame);

  const brushMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.brushBristlesMap,
      roughness: 0.88,
      metalness: 0.05,
    }),
  );
  const brushStrip = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(railSpan - 0.07, 0.028)),
    brushMat,
  );
  brushStrip.position.set(rackCenterX, brushY, frontRailZ + 0.004);
  brushGroup.add(brushStrip);

  const lowerBundleCount = 10;
  for (let i = 0; i < lowerBundleCount; i++) {
    const startX = rackCenterX - 0.15 + i * 0.033;
    const goLeft = i < lowerBundleCount / 2;
    const edgeSide = goLeft ? -1 : 1;
    const targetDuctX = goLeft ? leftDuctX + 0.024 : ductX - 0.024;
    const isOrange = i % 2 === 0;
    const bCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(startX, brushY, frontRailZ - 0.01),
      new THREE.Vector3(
        startX + edgeSide * 0.028,
        brushY + ((i % 3) - 1) * 0.012,
        frontRailZ + 0.032,
      ),
      new THREE.Vector3(
        rackCenterX + edgeSide * (railSpan / 2 + 0.02),
        brushY - 0.008,
        frontRailZ + 0.034,
      ),
      new THREE.Vector3(targetDuctX, brushY - 0.035, frontRailZ - 0.006),
    ]);
    const bMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(bCurve, 16, 0.0038, 6, false)),
      isOrange ? matCopperPrimary : matCopperSecondary,
    );
    bMesh.castShadow = true;
    brushGroup.add(bMesh);
  }

  // Lower 1U PDU Power Distribution Bar (11U)
  const pduGroup = new THREE.Group();
  pduGroup.userData.restPos = [0, 0, 0];
  pduGroup.userData.installOffset = [0, 0, 0.24];
  root.add(pduGroup);

  const pduY = rackUnitToY(11);
  const pduShelf = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(railSpan - 0.02, 0.042, 0.24)),
    matCabinetMatte,
  );
  pduShelf.position.set(rackCenterX, pduY, frontRailZ - 0.14);
  pduShelf.castShadow = true;
  pduShelf.receiveShadow = true;
  pduGroup.add(pduShelf);

  // 8 Schuko outlet sockets + red power switch along PDU front face
  const pduSocketGeo = trackGeo(new THREE.CylinderGeometry(0.011, 0.011, 0.008, 12));
  pduSocketGeo.rotateX(Math.PI / 2);
  for (let s = 0; s < 8; s++) {
    const sock = new THREE.Mesh(pduSocketGeo, matDarkPlastic);
    sock.position.set(rackCenterX - 0.16 + s * 0.042, pduY, frontRailZ - 0.018);
    pduGroup.add(sock);
  }
  const pduSwitch = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.018, 0.012, 0.008)),
    matBarpaAccent,
  );
  pduSwitch.position.set(rackCenterX + 0.19, pduY, frontRailZ - 0.018);
  pduGroup.add(pduSwitch);

  // =========================================================
  // 11. COMPONENT 5: RESERVA DE CABOS DA BASE (COILED COPPER & FIBER/CPA SLACK)
  // =========================================================
  const baseReserveY = bodyBottomY + baseH + 0.012;
  const spoolGroup = new THREE.Group();
  spoolGroup.position.set(0, baseReserveY, 0.04);
  spoolGroup.userData.restPos = [0, baseReserveY, 0.04];
  spoolGroup.userData.installOffset = [0, 0.16, 0.14];
  root.add(spoolGroup);

  const spoolPlate = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.032, 28)),
    matCabinetSteel,
  );
  spoolPlate.position.set(0, 0.016, 0);
  spoolPlate.receiveShadow = true;
  spoolGroup.add(spoolPlate);

  const buildCoil = (
    radiusStart: number,
    turns: number,
    radiusStep: number,
    tubeRadius: number,
    yOffset: number,
    material: THREE.Material,
  ) => {
    const pts: THREE.Vector3[] = [];
    const segs = Math.floor(turns * 28);
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * turns * Math.PI * 2;
      const r = radiusStart + (i / segs) * radiusStep;
      const y = yOffset + Math.sin(a * 2) * 0.004 + (i / segs) * 0.022;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const mesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(curve, segs * 2, tubeRadius, 7, false)),
      material,
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  spoolGroup.add(buildCoil(0.26, 3.4, 0.06, 0.011, 0.014, matCopperPrimary));
  spoolGroup.add(buildCoil(0.275, 2.6, 0.04, 0.0095, 0.034, matCopperPrimary));
  spoolGroup.add(buildCoil(0.165, 3.2, 0.065, 0.0095, 0.016, matBaseCoilFiber));
  spoolGroup.add(buildCoil(0.185, 2.4, 0.045, 0.0085, 0.036, matCopperSecondary));

  // =========================================================
  // 12. 1:1 DIMENSIONAL CALLOUT RIG (Toggled in Scale 1:1 / AR Mode)
  // =========================================================
  const dimensionsGroup = new THREE.Group();
  dimensionsGroup.visible = false;
  root.add(dimensionsGroup);

  const dimLineMat = trackMat(new THREE.LineBasicMaterial({ color: 0xf26522 }));
  const addDimLine = (a: THREE.Vector3, b: THREE.Vector3) => {
    const geo = trackGeo(new THREE.BufferGeometry().setFromPoints([a, b]));
    dimensionsGroup.add(new THREE.Line(geo, dimLineMat));
  };

  const addDimLabel = (text: string, pos: THREE.Vector3) => {
    const tex = createDimensionLabelTexture(text);
    disposables.push(tex);
    const mat = trackMat(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(pos);
    sprite.scale.set(0.32, 0.08, 1);
    sprite.renderOrder = 20;
    dimensionsGroup.add(sprite);
  };

  // Height line (2050 mm) on left side
  const hX = -W / 2 - 0.16;
  const hZ = D / 2;
  addDimLine(new THREE.Vector3(hX, 0, hZ), new THREE.Vector3(hX, H, hZ));
  addDimLine(new THREE.Vector3(hX - 0.04, 0, hZ), new THREE.Vector3(hX + 0.04, 0, hZ));
  addDimLine(new THREE.Vector3(hX - 0.04, H, hZ), new THREE.Vector3(hX + 0.04, H, hZ));
  addDimLabel('2050 mm · 42U', new THREE.Vector3(hX - 0.12, H / 2, hZ));

  // Width line (800 mm) in front of base
  const wY = 0.02;
  const wZ = D / 2 + 0.18;
  addDimLine(new THREE.Vector3(-W / 2, wY, wZ), new THREE.Vector3(W / 2, wY, wZ));
  addDimLine(new THREE.Vector3(-W / 2, wY, wZ - 0.04), new THREE.Vector3(-W / 2, wY, wZ + 0.04));
  addDimLine(new THREE.Vector3(W / 2, wY, wZ - 0.04), new THREE.Vector3(W / 2, wY, wZ + 0.04));
  addDimLabel('800 mm', new THREE.Vector3(0, wY + 0.06, wZ + 0.06));

  // Depth line (800 mm) on left floor edge
  const dX = -W / 2 - 0.16;
  addDimLine(new THREE.Vector3(dX, wY, -D / 2), new THREE.Vector3(dX, wY, D / 2));
  addDimLabel('800 mm', new THREE.Vector3(dX - 0.12, wY + 0.06, 0));

  // =========================================================
  // 13. INTERACTABLE RAYCAST PROXY BOXES (Layer 1) + SELECTION & TARGET SLOT GUIDES
  // =========================================================
  const componentGroups = new Map<ComponentId, THREE.Group>([
    ['ventilation', ventilationGroup],
    ['pp-fiber', fiberGroup],
    ['patch-copper', copperGroup],
    ['kvm', kvmAnchor],
    ['accessory-drawer', drawerGroup],
    ['core-switch', switchGroup],
    ['brush-guide', brushGroup],
    ['pdu-bar', pduGroup],
    ['cable-management', spoolGroup],
  ]);

  const interactableMeshes: THREE.Mesh[] = [];
  const highlightMeshes = new Map<ComponentId, THREE.LineSegments>();
  const slotGuideMeshes = new Map<ComponentId, THREE.LineSegments>();

  const proxyMat = trackMat(
    new THREE.MeshBasicMaterial({
      visible: false,
    }),
  );

  for (const id of Object.keys(RACK_COMPONENTS) as ComponentId[]) {
    const spec = RACK_COMPONENTS[id];
    const geo = trackGeo(new THREE.BoxGeometry(...spec.slotBox.size));
    const proxy = new THREE.Mesh(geo, proxyMat);
    proxy.position.set(...spec.slotBox.center);
    proxy.layers.set(INTERACT_LAYER);
    proxy.userData.componentId = id;
    proxy.name = `proxy_${id}`;
    root.add(proxy);
    interactableMeshes.push(proxy);

    const edges = trackGeo(new THREE.EdgesGeometry(geo));

    // Selection/Hover highlight outline (for installed units)
    const outlineMat = trackMat(
      new THREE.LineBasicMaterial({
        color: 0xf26522,
        transparent: true,
        opacity: 0.92,
      }),
    );
    const outline = new THREE.LineSegments(edges, outlineMat);
    outline.position.copy(proxy.position);
    outline.visible = false;
    root.add(outline);
    highlightMeshes.set(id, outline);

    // Target U-Slot Mounting Guide (amber dashed wireframe shown when previewing an uninstalled product)
    const slotGuideMat = trackMat(
      new THREE.LineDashedMaterial({
        color: 0xff8a3d,
        dashSize: 0.025,
        gapSize: 0.015,
        transparent: true,
        opacity: 0.95,
      }),
    );
    const slotGuide = new THREE.LineSegments(edges, slotGuideMat);
    slotGuide.computeLineDistances();
    slotGuide.position.copy(proxy.position);
    slotGuide.visible = false;
    root.add(slotGuide);
    slotGuideMeshes.set(id, slotGuide);
  }

  // Top edge Barpa orange accent trim bar
  const frontAccentTrim = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(W - 0.02, 0.006, 0.008)),
    matBarpaAccent,
  );
  frontAccentTrim.position.set(0, bodyTopY + 0.003, D / 2 + 0.004);
  topCover.add(frontAccentTrim);

  // Sync dynamic cabling style setters
  const setCopperStyle = (optionId: CopperOptionId) => {
    const opt = COPPER_OPTIONS.find((c) => c.id === optionId) ?? COPPER_OPTIONS[0];
    matCopperPrimary.color.setHex(opt.primaryHex);
    matCopperSecondary.color.setHex(opt.secondaryHex);
  };

  const setFiberStyle = (optionId: FiberOptionId) => {
    const opt = FIBER_OPTIONS.find((f) => f.id === optionId) ?? FIBER_OPTIONS[0];
    matFiberAdapter.color.setHex(opt.adapterHex);
    matFiberPigtail.color.setHex(opt.pigtailHex);
    matBaseCoilFiber.color.setHex(opt.trunkHex);
    cpaTrunkVisual.visible = opt.isCpa;
  };

  const setVentilationActive = (on: boolean) => {
    matFanSwitchLed.emissiveIntensity = on ? 2.0 : 0.05;
    matFanSwitchLed.color.setHex(on ? 0xf26522 : 0x3b1f14);
  };

  const setInteriorLightActive = (on: boolean) => {
    matInteriorLedDiffuser.emissiveIntensity = on ? 2.4 : 0.05;
    matInteriorLedDiffuser.color.setHex(on ? 0xfff7ed : 0x6b7280);
  };

  return {
    root,
    frontDoorPivot,
    rearDoorPivot,
    leftSidePanel,
    rightSidePanel,
    topCover,
    ventilationGroup,
    roofBlankingPlate,
    fanRotors,
    fiberDrawer,
    kvmTray,
    kvmScreenPivot,
    verticalTrunk,
    componentGroups,
    dimensionsGroup,
    interactableMeshes,
    highlightMeshes,
    slotGuideMeshes,
    setCopperStyle,
    setFiberStyle,
    setVentilationActive,
    setInteriorLightActive,
    dispose: () => {
      for (const item of disposables) {
        item.dispose();
      }
    },
  };
}
