import * as THREE from 'three';
import { CableTypeId } from '../data/rackData';

export interface CableShowcaseHandles {
  root: THREE.Group;
  setActiveCable: (id: CableTypeId) => void;
  dispose: () => void;
}

export function buildCableSpecimens(isSoftwareGl: boolean): CableShowcaseHandles {
  const root = new THREE.Group();
  root.name = 'BarpaCableShowcase';

  const disposables: Array<{ dispose: () => void }> = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };

  // Studio inspection plinth (grounded at Y = 0)
  const plinthMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1a1e26,
      metalness: 0.45,
      roughness: 0.55,
    }),
  );
  const plinthRingMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf26522,
      metalness: 0.25,
      roughness: 0.35,
    }),
  );

  const plinthBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.46, 0.49, 0.04, 48)),
    plinthMat,
  );
  plinthBase.position.set(0, 0.02, 0);
  plinthBase.receiveShadow = true;
  root.add(plinthBase);

  const plinthTrim = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.462, 0.004, 12, 64)),
    plinthRingMat,
  );
  plinthTrim.rotation.x = Math.PI / 2;
  plinthTrim.position.set(0, 0.04, 0);
  root.add(plinthTrim);

  // Shared calibrated PBR materials
  const matYellowFiber = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf5c518, metalness: 0.04, roughness: 0.36 }),
  );
  const matGreenApc = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2f9e44, metalness: 0.05, roughness: 0.34 }),
  );
  const matWhiteLatch = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.02, roughness: 0.45 }),
  );
  const matBlackArmor = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1c1f24, metalness: 0.14, roughness: 0.58 }),
  );
  const matMagentaTube = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe11d74, metalness: 0.04, roughness: 0.36 }),
  );
  const matMagentaConn = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xc0487c, metalness: 0.06, roughness: 0.4 }),
  );
  const matBarpaOrange = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf26522, metalness: 0.06, roughness: 0.38 }),
  );
  const matClearRj45 = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.05,
      roughness: 0.12,
      transmission: isSoftwareGl ? 0 : 0.78,
      transparent: true,
      opacity: isSoftwareGl ? 0.45 : 0.85,
      ior: 1.49,
      depthWrite: false,
    }),
  );
  const matGoldPins = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.92, roughness: 0.18 }),
  );

  // Helper to build segmented flexible boot
  const buildSegmentedBoot = (
    parent: THREE.Group,
    mat: THREE.Material,
    length: number,
    rStart: number,
    rEnd: number,
    segments: number,
  ) => {
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const r = THREE.MathUtils.lerp(rStart, rEnd, t);
      const ring = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(r, r * 0.94, (length / segments) * 0.72, 16)),
        mat,
      );
      ring.rotation.z = Math.PI / 2;
      ring.position.set(t * length, 0, 0);
      ring.castShadow = true;
      parent.add(ring);
    }
  };

  // Helper to build detailed SC-APC green connector pointing along -X (boot extends +X)
  const buildScApcConnector = (): THREE.Group => {
    const g = new THREE.Group();
    const housing = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.068, 0.024, 0.024)),
      matGreenApc,
    );
    housing.position.set(-0.028, 0, 0);
    housing.castShadow = true;
    g.add(housing);

    // Top keying ridge
    const keyRidge = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.02, 0.005, 0.007)),
      matGreenApc,
    );
    keyRidge.position.set(-0.04, 0.014, 0);
    g.add(keyRidge);

    // Ribbed side grip ridges
    for (let i = 0; i < 4; i++) {
      const rib = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.003, 0.026, 0.026)),
        matGreenApc,
      );
      rib.position.set(-0.012 - i * 0.006, 0, 0);
      g.add(rib);
    }

    // White release latch & dust cap
    const latch = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.022, 0.014, 0.026)),
      matWhiteLatch,
    );
    latch.position.set(-0.044, -0.002, 0);
    g.add(latch);

    const dustCap = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.0065, 0.0065, 0.022, 14)),
      matWhiteLatch,
    );
    dustCap.rotation.z = Math.PI / 2;
    dustCap.position.set(-0.072, 0, 0);
    g.add(dustCap);

    // Tapered green boot
    const bootCore = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.0045, 0.008, 0.07, 14)),
      matGreenApc,
    );
    bootCore.rotation.z = Math.PI / 2;
    bootCore.position.set(0.04, 0, 0);
    g.add(bootCore);
    const bootGroup = new THREE.Group();
    bootGroup.position.set(0.012, 0, 0);
    buildSegmentedBoot(bootGroup, matGreenApc, 0.062, 0.0095, 0.0048, 8);
    g.add(bootGroup);

    return g;
  };

  // Helper to build detailed LC-APC green connector (single or duplex)
  const buildLcApcConnector = (duplex: boolean, matHousing: THREE.Material): THREE.Group => {
    const g = new THREE.Group();
    const offsets = duplex ? [-0.011, 0.011] : [0];
    for (const oz of offsets) {
      const body = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.052, 0.015, 0.014)),
        matHousing,
      );
      body.position.set(-0.024, 0, oz);
      body.castShadow = true;
      g.add(body);

      // Angled LC trigger latch on top
      const latch = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.032, 0.004, 0.008)),
        matHousing,
      );
      latch.rotation.z = 0.24;
      latch.position.set(-0.018, 0.012, oz);
      g.add(latch);

      // White dust cap
      const cap = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.0042, 0.0042, 0.016, 12)),
        matWhiteLatch,
      );
      cap.rotation.z = Math.PI / 2;
      cap.position.set(-0.056, 0, oz);
      g.add(cap);

      // Slotted boot
      const boot = new THREE.Group();
      boot.position.set(0.006, 0, oz);
      buildSegmentedBoot(boot, matHousing, 0.045, 0.0068, 0.0036, 6);
      g.add(boot);
    }

    if (duplex) {
      const yoke = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.026, 0.018, 0.034)),
        matHousing,
      );
      yoke.position.set(-0.014, 0.004, 0);
      g.add(yoke);
    }
    return g;
  };

  // Helper to build macro-detailed Barpa Orange Cat.6A RJ45 Plug
  const buildRj45Plug = (): THREE.Group => {
    const g = new THREE.Group();

    // Clear polycarbonate RJ45 nose housing
    const nose = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.048, 0.024, 0.032)),
      matClearRj45,
    );
    nose.position.set(-0.024, 0, 0);
    nose.renderOrder = 8;
    g.add(nose);

    // 8 internal color-coded copper twisted wires visible inside plug
    const wireColors = [0xf26522, 0xffffff, 0x16a34a, 0x2563eb, 0xffffff, 0x16a34a, 0x92400e, 0xffffff];
    wireColors.forEach((hex, idx) => {
      const wMat = trackMat(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45 }));
      const wire = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.0014, 0.0014, 0.038, 8)),
        wMat,
      );
      wire.rotation.z = Math.PI / 2;
      wire.position.set(-0.02, -0.002, -0.0105 + idx * 0.003);
      g.add(wire);
    });

    // 8 gold 8P8C pins at tip
    for (let p = 0; p < 8; p++) {
      const pin = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.014, 0.004, 0.0018)),
        matGoldPins,
      );
      pin.position.set(-0.041, -0.011, -0.0105 + p * 0.003);
      g.add(pin);
    }

    // Clear snagless latch tab on top
    const tab = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.034, 0.004, 0.014)),
      matClearRj45,
    );
    tab.rotation.z = 0.28;
    tab.position.set(-0.012, 0.016, 0);
    g.add(tab);

    // Molded orange collar + snagless arch + ribbed strain-relief boot
    const collar = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.034, 0.026, 0.034)),
      matBarpaOrange,
    );
    collar.position.set(0.014, 0, 0);
    collar.castShadow = true;
    g.add(collar);

    const snagArch = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.028, 0.006, 0.022)),
      matBarpaOrange,
    );
    snagArch.rotation.z = -0.35;
    snagArch.position.set(0.004, 0.021, 0);
    g.add(snagArch);

    const boot = new THREE.Group();
    boot.position.set(0.032, 0, 0);
    buildSegmentedBoot(boot, matBarpaOrange, 0.055, 0.012, 0.0075, 6);
    g.add(boot);

    return g;
  };

  // ==============================================================
  // SPECIMEN 1: SC-APC SIMPLEX MONOMODO OS2 (matches image_1afd039c.png)
  // ==============================================================
  const scApcGroup = new THREE.Group();
  root.add(scApcGroup);

  const scCoilPts: THREE.Vector3[] = [];
  const scTurns = 5.5;
  const scSteps = 220;
  for (let i = 0; i <= scSteps; i++) {
    const a = (i / scSteps) * scTurns * Math.PI * 2;
    const r = 0.24 + Math.sin(a * 0.5) * 0.008;
    const y = 0.068 + (i / scSteps) * 0.075;
    scCoilPts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  const scCoilMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(scCoilPts), 220, 0.0065, 10, false)),
    matYellowFiber,
  );
  scCoilMesh.castShadow = true;
  scApcGroup.add(scCoilMesh);

  // Top & Bottom exiting tails into Green SC-APC connectors
  const scTopTail = new THREE.CatmullRomCurve3([
    scCoilPts[scCoilPts.length - 1],
    new THREE.Vector3(0.24, 0.165, 0.08),
    new THREE.Vector3(0.16, 0.18, 0.16),
    new THREE.Vector3(0.04, 0.18, 0.18),
  ]);
  scApcGroup.add(
    new THREE.Mesh(trackGeo(new THREE.TubeGeometry(scTopTail, 24, 0.0065, 10, false)), matYellowFiber),
  );
  const scTopConn = buildScApcConnector();
  scTopConn.position.set(-0.025, 0.18, 0.18);
  scTopConn.rotation.y = Math.PI;
  scApcGroup.add(scTopConn);

  const scBotTail = new THREE.CatmullRomCurve3([
    scCoilPts[0],
    new THREE.Vector3(0.21, 0.068, -0.11),
    new THREE.Vector3(0.11, 0.068, -0.2),
    new THREE.Vector3(-0.05, 0.068, -0.21),
  ]);
  scApcGroup.add(
    new THREE.Mesh(trackGeo(new THREE.TubeGeometry(scBotTail, 24, 0.0065, 10, false)), matYellowFiber),
  );
  const scBotConn = buildScApcConnector();
  scBotConn.position.set(-0.11, 0.068, -0.21);
  scApcGroup.add(scBotConn);

  // ==============================================================
  // SPECIMEN 2: LC-APC DUPLEX OS2 (matches image_0cd9c4ac.png)
  // ==============================================================
  const lcApcGroup = new THREE.Group();
  root.add(lcApcGroup);

  for (const offset of [-0.0055, 0.0055]) {
    const pts: THREE.Vector3[] = [];
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const a = 0.4 + (i / steps) * 2.8 * Math.PI * 2;
      const r = 0.25 + offset;
      const y = 0.065 + (i / steps) * 0.036;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const mesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.0052, 8, false)),
      matYellowFiber,
    );
    mesh.castShadow = true;
    lcApcGroup.add(mesh);
  }

  // Yellow retention strap & duplex breakout leads
  const strap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.036, 16)),
    matYellowFiber,
  );
  strap.rotation.z = Math.PI / 2;
  strap.position.set(0.0, 0.084, 0.25);
  lcApcGroup.add(strap);

  const lcLeftLead = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.085, 0.245),
    new THREE.Vector3(0.14, 0.08, 0.24),
    new THREE.Vector3(0.24, 0.072, 0.19),
  ]);
  lcApcGroup.add(
    new THREE.Mesh(trackGeo(new THREE.TubeGeometry(lcLeftLead, 16, 0.0052, 8, false)), matYellowFiber),
  );
  const lcConnA = buildLcApcConnector(true, matGreenApc);
  lcConnA.position.set(0.28, 0.072, 0.17);
  lcConnA.rotation.y = Math.PI * 0.82;
  lcApcGroup.add(lcConnA);

  const lcRightLead = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, 0.085, 0.245),
    new THREE.Vector3(-0.15, 0.076, 0.23),
    new THREE.Vector3(-0.24, 0.068, 0.17),
  ]);
  lcApcGroup.add(
    new THREE.Mesh(trackGeo(new THREE.TubeGeometry(lcRightLead, 16, 0.0052, 8, false)), matYellowFiber),
  );
  const lcConnB = buildLcApcConnector(true, matGreenApc);
  lcConnB.position.set(-0.27, 0.068, 0.145);
  lcConnB.rotation.y = 0.45;
  lcApcGroup.add(lcConnB);

  // ==============================================================
  // SPECIMEN 3: CPA · CABO PRÉ-CONECTORIZADO ARMADO (matches image_b397d765.png)
  // ==============================================================
  const cpaGroup = new THREE.Group();
  root.add(cpaGroup);

  // Heavy black armored central coil
  const cpaPts: THREE.Vector3[] = [];
  const cpaTurns = 4.6;
  for (let i = 0; i <= 180; i++) {
    const a = (i / 180) * cpaTurns * Math.PI * 2;
    const r = 0.21 + (i % 2) * 0.003;
    const y = 0.072 + (i / 180) * 0.062;
    cpaPts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  const cpaTrunk = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cpaPts), 180, 0.011, 10, false)),
    matBlackArmor,
  );
  cpaTrunk.castShadow = true;
  cpaGroup.add(cpaTrunk);

  // Two velcro wraps holding the armored coil
  for (const vx of [-0.21, 0.21]) {
    const wrap = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.036, 0.072, 0.022)),
      matBlackArmor,
    );
    wrap.position.set(vx, 0.102, 0);
    cpaGroup.add(wrap);
  }

  // Symmetrical left & right breakout boots with 10 magenta LC fan-out pigtails each
  const buildFanOut = (side: -1 | 1) => {
    const bootAnchor = new THREE.Vector3(side * 0.29, 0.088, 0.04);
    const trunkOut = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.21, 0.095, 0.04),
      new THREE.Vector3(side * 0.26, 0.095, 0.04),
      bootAnchor,
    ]);
    cpaGroup.add(
      new THREE.Mesh(trackGeo(new THREE.TubeGeometry(trunkOut, 14, 0.011, 10, false)), matBlackArmor),
    );

    const furcationBoot = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.016, 0.019, 0.055, 16)),
      matBlackArmor,
    );
    furcationBoot.rotation.z = Math.PI / 2;
    furcationBoot.position.copy(bootAnchor);
    furcationBoot.castShadow = true;
    cpaGroup.add(furcationBoot);

    const strandCount = 10;
    for (let i = 0; i < strandCount; i++) {
      const zSpread = -0.17 + (i / (strandCount - 1)) * 0.34;
      const tipX = side * 0.42;
      const tipPos = new THREE.Vector3(tipX, 0.058, 0.04 + zSpread);
      const fanCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(bootAnchor.x + side * 0.02, bootAnchor.y, bootAnchor.z),
        new THREE.Vector3(bootAnchor.x + side * 0.07, 0.072, bootAnchor.z + zSpread * 0.45),
        tipPos,
      ]);
      const strand = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(fanCurve, 14, 0.0028, 6, false)),
        matMagentaTube,
      );
      cpaGroup.add(strand);

      const lcTip = buildLcApcConnector(false, matMagentaConn);
      lcTip.scale.setScalar(0.72);
      lcTip.position.set(tipPos.x + side * 0.012, tipPos.y, tipPos.z);
      lcTip.rotation.y = side > 0 ? Math.PI : 0;
      cpaGroup.add(lcTip);
    }
  };

  buildFanOut(-1);
  buildFanOut(1);

  // ==============================================================
  // SPECIMEN 4: CABO DE COBRE CAT.6A S/FTP RJ45 (matches image_88bc3593.png)
  // ==============================================================
  const copperGroup = new THREE.Group();
  root.add(copperGroup);

  // Smooth sweeping Cat.6A orange cable arc showcasing both RJ45 plugs in close-up
  const copperCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.24, 0.088, 0.16),
    new THREE.Vector3(-0.32, 0.125, -0.02),
    new THREE.Vector3(-0.14, 0.155, -0.24),
    new THREE.Vector3(0.15, 0.145, -0.22),
    new THREE.Vector3(0.32, 0.115, 0.0),
    new THREE.Vector3(0.24, 0.088, 0.16),
  ]);
  const copperCableMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(copperCurve, 72, 0.011, 14, false)),
    matBarpaOrange,
  );
  copperCableMesh.castShadow = true;
  copperGroup.add(copperCableMesh);

  const plugLeft = buildRj45Plug();
  plugLeft.scale.setScalar(1.35);
  plugLeft.position.set(-0.22, 0.088, 0.17);
  plugLeft.rotation.y = 0.65;
  copperGroup.add(plugLeft);

  const plugRight = buildRj45Plug();
  plugRight.scale.setScalar(1.35);
  plugRight.position.set(0.22, 0.088, 0.17);
  plugRight.rotation.y = Math.PI - 0.65;
  copperGroup.add(plugRight);

  const specimens: Record<CableTypeId, THREE.Group> = {
    'sc-apc': scApcGroup,
    'lc-apc': lcApcGroup,
    cpa: cpaGroup,
    'copper-cat6a': copperGroup,
  };

  const setActiveCable = (id: CableTypeId) => {
    (Object.keys(specimens) as CableTypeId[]).forEach((key) => {
      specimens[key].visible = key === id;
    });
  };

  setActiveCable('sc-apc');

  return {
    root,
    setActiveCable,
    dispose: () => {
      for (const item of disposables) {
        item.dispose();
      }
    },
  };
}
