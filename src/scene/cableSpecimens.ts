import * as THREE from 'three';
import { CableTypeId } from '../data/rackData';

export interface CableShowcaseHandles {
  root: THREE.Group;
  setActiveCable: (id: CableTypeId) => void;
  dispose: () => void;
}

const _lookTarget = new THREE.Vector3();

/**
 * Places a connector group at either the start or end of a 3D curve.
 * Canonical connector convention:
 * - Origin (0, 0, 0) = cable entry end of the strain-relief boot
 * - Local +Z = outward direction toward the connector tip / ferrule / RJ45 contacts
 */
function alignConnectorToCurve(
  connector: THREE.Group,
  curve: THREE.Curve<THREE.Vector3>,
  end: 'start' | 'end',
  rollRadians = 0,
): void {
  const t = end === 'end' ? 1 : 0;
  const pos = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  if (end === 'start') {
    tangent.negate();
  }
  connector.position.copy(pos);
  _lookTarget.copy(pos).add(tangent);
  connector.lookAt(_lookTarget);
  if (rollRadians !== 0) {
    connector.rotateZ(rollRadians);
  }
}

export function buildCableSpecimens(isSoftwareGl: boolean): CableShowcaseHandles {
  const root = new THREE.Group();
  root.name = 'barpaCableShowcase';

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
      metalness: 0.48,
      roughness: 0.52,
    }),
  );
  const plinthRingMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf26522,
      metalness: 0.25,
      roughness: 0.34,
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

  // Calibrated Realistic PBR Materials (LSOH satin sheen, ABS molded polymers, crystal polycarbonate)
  const matYellowFiber = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf5c418,
      metalness: 0.02,
      roughness: 0.36,
      clearcoat: 0.32,
      clearcoatRoughness: 0.28,
    }),
  );
  const matGreenApc = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x2d9b44,
      metalness: 0.04,
      roughness: 0.32,
      clearcoat: 0.25,
      clearcoatRoughness: 0.32,
    }),
  );
  const matGreenBoot = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x35ab4d,
      metalness: 0.02,
      roughness: 0.46,
    }),
  );
  const matWhiteCeramic = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.02,
      roughness: 0.22,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    }),
  );
  const matDustCap = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.02,
      roughness: 0.3,
      transparent: true,
      opacity: 0.88,
    }),
  );
  const matSilverMark = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.6,
      roughness: 0.28,
    }),
  );
  const matBlackArmor = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1a1d22,
      metalness: 0.14,
      roughness: 0.54,
    }),
  );
  const matBlackVelcro = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x111317,
      metalness: 0.04,
      roughness: 0.85,
    }),
  );
  const matMagentaTube = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe11d74,
      metalness: 0.02,
      roughness: 0.35,
      clearcoat: 0.28,
      clearcoatRoughness: 0.3,
    }),
  );
  const matMagentaConn = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xc2497e,
      metalness: 0.04,
      roughness: 0.36,
      clearcoat: 0.24,
      clearcoatRoughness: 0.34,
    }),
  );
  const matWhiteSleeve = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.02,
      roughness: 0.4,
    }),
  );
  const matBarpaOrange = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf26522,
      metalness: 0.04,
      roughness: 0.36,
      clearcoat: 0.26,
      clearcoatRoughness: 0.32,
    }),
  );
  const matClearRj45 = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xeaf0f6,
      metalness: 0.02,
      roughness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.78,
      transparent: true,
      opacity: isSoftwareGl ? 0.44 : 0.88,
      ior: 1.49,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      depthWrite: false,
    }),
  );
  const matGoldPins = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf5b82e,
      metalness: 0.94,
      roughness: 0.16,
    }),
  );

  /**
   * Builds a realistic slotted strain-relief boot extending from z = 0 (cable entry) to z = length (housing).
   */
  const buildSlottedBootZ = (
    parent: THREE.Group,
    mat: THREE.Material,
    innerJacketMat: THREE.Material | null,
    length: number,
    rStart: number,
    rEnd: number,
    innerRadius: number,
    slots: number,
  ) => {
    // Inner flexible jacket visible through the flex-relief slots (just like real barpa connectors)
    if (innerJacketMat) {
      const core = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(innerRadius, innerRadius, length * 0.96, 12)),
        innerJacketMat,
      );
      core.rotation.x = Math.PI / 2;
      core.position.set(0, 0, length * 0.48);
      parent.add(core);
    }

    // Tapered collar rings with gaps between them to create realistic strain-relief slots
    const ringThick = (length / slots) * 0.56;
    for (let i = 0; i < slots; i++) {
      const t = i / (slots - 1);
      const r = THREE.MathUtils.lerp(rStart, rEnd, t);
      const ring = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(r * 1.03, r * 0.96, ringThick, 16)),
        mat,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0, t * (length - ringThick) + ringThick * 0.5);
      ring.castShadow = true;
      parent.add(ring);
    }

    // Two thin longitudinal spine bridges connecting the flex rings along left & right sides
    for (const side of [-1, 1]) {
      const spine = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(rStart * 0.42, rStart * 0.55, length * 0.92)),
        mat,
      );
      spine.position.set(side * (rStart + rEnd) * 0.36, 0, length * 0.46);
      parent.add(spine);
    }
  };

  /**
   * SC-APC Connector (boot enters at z = 0, dust cap tip points toward +Z).
   */
  const buildScApcConnector = (): THREE.Group => {
    const g = new THREE.Group();

    // 1. Slotted green flex-boot (z: 0 -> 0.062)
    buildSlottedBootZ(g, matGreenBoot, matYellowFiber, 0.062, 0.0052, 0.0105, 0.0038, 7);

    // Solid cylindrical transition collar (z: 0.052 -> 0.072)
    const bootNeck = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.0112, 0.0102, 0.022, 16)),
      matGreenBoot,
    );
    bootNeck.rotation.x = Math.PI / 2;
    bootNeck.position.set(0, 0, 0.063);
    bootNeck.castShadow = true;
    g.add(bootNeck);

    // 2. Stepped SC outer grip sleeve (z: 0.070 -> 0.138)
    const housing = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.025, 0.025, 0.068)),
      matGreenApc,
    );
    housing.position.set(0, 0, 0.104);
    housing.castShadow = true;
    g.add(housing);

    // 5 raised grip ridges along sleeve back half
    for (let i = 0; i < 5; i++) {
      const rib = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.0268, 0.0268, 0.0028)),
        matGreenApc,
      );
      rib.position.set(0, 0, 0.079 + i * 0.0055);
      g.add(rib);
    }

    // Top keying rail + silver alignment dashes
    const keyRidge = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.007, 0.0045, 0.024)),
      matGreenApc,
    );
    keyRidge.position.set(0, 0.0145, 0.118);
    g.add(keyRidge);

    const stripe = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.026, 0.002, 0.003)),
      matSilverMark,
    );
    stripe.position.set(0, 0.0128, 0.114);
    g.add(stripe);

    // White push-pull side release blocks
    const latch = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.0265, 0.013, 0.022)),
      matWhiteCeramic,
    );
    latch.position.set(0, -0.001, 0.12);
    g.add(latch);

    // Front inner nose + ceramic ferrule collar + translucent white dust cap (z: 0.138 -> 0.168)
    const ferruleSleeve = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.0052, 0.0052, 0.014, 14)),
      matWhiteCeramic,
    );
    ferruleSleeve.rotation.x = Math.PI / 2;
    ferruleSleeve.position.set(0, 0, 0.144);
    g.add(ferruleSleeve);

    const dustCap = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.0068, 0.0062, 0.018, 16)),
      matDustCap,
    );
    dustCap.rotation.x = Math.PI / 2;
    dustCap.position.set(0, 0, 0.156);
    g.add(dustCap);

    const dustCapRim = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.0082, 0.0082, 0.004, 16)),
      matDustCap,
    );
    dustCapRim.rotation.x = Math.PI / 2;
    dustCapRim.position.set(0, 0, 0.166);
    g.add(dustCapRim);

    return g;
  };

  /**
   * LC-APC Connector (single or duplex). Boot enters at z = 0, dust cap tip points toward +Z.
   */
  const buildLcApcConnector = (
    duplex: boolean,
    matHousing: THREE.Material,
    matBoot: THREE.Material,
    innerStrandMat: THREE.Material | null,
    includeYellowClip = false,
  ): THREE.Group => {
    const g = new THREE.Group();
    const xOffsets = duplex ? [-0.0115, 0.0115] : [0];

    for (const ox of xOffsets) {
      if (includeYellowClip) {
        const clip = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.0072, 0.0072, 0.007, 14)),
          matYellowFiber,
        );
        clip.rotation.x = Math.PI / 2;
        clip.position.set(ox, 0, -0.004);
        g.add(clip);
      }

      // Slotted boot (z: 0 -> 0.044)
      const bootWrap = new THREE.Group();
      bootWrap.position.set(ox, 0, 0);
      buildSlottedBootZ(bootWrap, matBoot, innerStrandMat, 0.044, 0.004, 0.0072, 0.0028, 6);
      g.add(bootWrap);

      // LC housing body (z: 0.042 -> 0.094)
      const body = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.0145, 0.015, 0.052)),
        matHousing,
      );
      body.position.set(ox, 0, 0.068);
      body.castShadow = true;
      g.add(body);

      // LC top angled thumb trigger latch
      const latch = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.0085, 0.0038, 0.032)),
        matHousing,
      );
      latch.rotation.x = -0.24;
      latch.position.set(ox, 0.0115, 0.068);
      g.add(latch);

      // White dust cap at +Z tip
      const capStem = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.0038, 0.0038, 0.014, 12)),
        matDustCap,
      );
      capStem.rotation.x = Math.PI / 2;
      capStem.position.set(ox, 0, 0.1);
      g.add(capStem);

      const capFlange = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.0058, 0.0058, 0.0035, 12)),
        matDustCap,
      );
      capFlange.rotation.x = Math.PI / 2;
      capFlange.position.set(ox, 0, 0.107);
      g.add(capFlange);
    }

    if (duplex) {
      // Duplex unifying yoke & top trigger paddle
      const yoke = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.037, 0.011, 0.026)),
        matHousing,
      );
      yoke.position.set(0, 0.006, 0.058);
      yoke.castShadow = true;
      g.add(yoke);

      const paddle = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.033, 0.0045, 0.022)),
        matHousing,
      );
      paddle.rotation.x = -0.28;
      paddle.position.set(0, 0.0155, 0.052);
      g.add(paddle);
    }

    return g;
  };

  /**
   * Macro-Detailed barpa Orange Cat.6A RJ45 Plug (matches image_88bc3593.png).
   * Boot enters at z = 0, crystal RJ45 nose & gold pins point toward +Z.
   */
  const buildRj45Plug = (): THREE.Group => {
    const g = new THREE.Group();

    // 1. Cutout ribbed barpa orange strain-relief boot (z: 0 -> 0.052)
    buildSlottedBootZ(g, matBarpaOrange, matBarpaOrange, 0.052, 0.0085, 0.0135, 0.0072, 5);

    // 2. Molded orange plug body collar + side shoulders (z: 0.050 -> 0.088)
    const collar = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.034, 0.026, 0.038)),
      matBarpaOrange,
    );
    collar.position.set(0, 0, 0.069);
    collar.castShadow = true;
    g.add(collar);

    // Orange inner wedge extending partway inside clear housing (matching photo)
    const innerOrangeCore = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.028, 0.016, 0.022)),
      matBarpaOrange,
    );
    innerOrangeCore.position.set(0, -0.002, 0.095);
    g.add(innerOrangeCore);

    // 3. Curved snagless latch protector arch sweeping forward over the locking clip
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.013, 0.052),
      new THREE.Vector3(0, 0.027, 0.072),
      new THREE.Vector3(0, 0.024, 0.098),
      new THREE.Vector3(0, 0.018, 0.106),
    ]);
    const archGeo = trackGeo(new THREE.TubeGeometry(archCurve, 16, 0.006, 8, false));
    archGeo.scale(1.65, 0.55, 1);
    const snagArch = new THREE.Mesh(archGeo, matBarpaOrange);
    snagArch.castShadow = true;
    g.add(snagArch);

    // 4. Crystal-clear polycarbonate RJ45 nose (z: 0.088 -> 0.142)
    const nose = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.032, 0.023, 0.054)),
      matClearRj45,
    );
    nose.position.set(0, -0.001, 0.115);
    nose.renderOrder = 8;
    g.add(nose);

    // Clear locking tab rising from front tip toward the orange snagless arch
    const lockTab = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.015, 0.004, 0.04)),
      matClearRj45,
    );
    lockTab.rotation.x = -0.34;
    lockTab.position.set(0, 0.017, 0.108);
    g.add(lockTab);

    // 5. 8 internal color-coded twisted-pair conductors visible inside polycarbonate nose
    const wireColors = [
      0xf26522, 0xffffff, 0x16a34a, 0x2563eb, 0xffffff, 0x16a34a, 0x92400e, 0xffffff,
    ];
    wireColors.forEach((hex, idx) => {
      const wMat = trackMat(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.42 }));
      const wire = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.0014, 0.0014, 0.044, 8)),
        wMat,
      );
      wire.rotation.x = Math.PI / 2;
      wire.position.set(-0.0105 + idx * 0.003, -0.002, 0.114);
      g.add(wire);
    });

    // 6. 8 gleaming 50µin gold 8P8C pins at the front contact comb (z: 0.125 -> 0.141)
    for (let p = 0; p < 8; p++) {
      const pin = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.0019, 0.0045, 0.016)),
        matGoldPins,
      );
      pin.position.set(-0.0105 + p * 0.003, -0.0105, 0.133);
      g.add(pin);
    }

    return g;
  };

  // ==============================================================
  // SPECIMEN 1: SC-APC SIMPLEX MONOMODO OS2 (matches image_1afd039c.png)
  // ==============================================================
  const scApcGroup = new THREE.Group();
  root.add(scApcGroup);

  const scCoilPts: THREE.Vector3[] = [];
  const scStartAngle = 1.15 * Math.PI;
  const scTurns = 4.45;
  const scSteps = 220;
  for (let i = 0; i <= scSteps; i++) {
    const a = scStartAngle + (i / scSteps) * scTurns * Math.PI * 2;
    const r = 0.235 + Math.sin(a * 0.5) * 0.006;
    const y = 0.056 + (i / scSteps) * 0.066;
    scCoilPts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  const scCoilMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(scCoilPts), 220, 0.0062, 10, false)),
    matYellowFiber,
  );
  scCoilMesh.castShadow = true;
  scApcGroup.add(scCoilMesh);

  // Top exiting tail continuing smoothly along the coil's +Z/-X tangent at a = 0.05π (no kink)
  const scTopTail = new THREE.CatmullRomCurve3([
    scCoilPts[scCoilPts.length - 2],
    scCoilPts[scCoilPts.length - 1],
    new THREE.Vector3(0.215, 0.135, 0.14),
    new THREE.Vector3(0.14, 0.144, 0.225),
    new THREE.Vector3(0.055, 0.146, 0.215),
  ]);
  const scTopTailMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(scTopTail, 32, 0.0062, 10, false)),
    matYellowFiber,
  );
  scTopTailMesh.castShadow = true;
  scApcGroup.add(scTopTailMesh);

  const scTopConn = buildScApcConnector();
  alignConnectorToCurve(scTopConn, scTopTail, 'end');
  scApcGroup.add(scTopConn);

  // Bottom exiting tail continuing smoothly along the backward spiral tangent at a = 1.15π (front-left)
  const scBotTail = new THREE.CatmullRomCurve3([
    scCoilPts[1],
    scCoilPts[0],
    new THREE.Vector3(-0.242, 0.056, 0.02),
    new THREE.Vector3(-0.215, 0.058, 0.15),
    new THREE.Vector3(-0.15, 0.06, 0.22),
  ]);
  const scBotTailMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(scBotTail, 32, 0.0062, 10, false)),
    matYellowFiber,
  );
  scBotTailMesh.castShadow = true;
  scApcGroup.add(scBotTailMesh);

  const scBotConn = buildScApcConnector();
  alignConnectorToCurve(scBotConn, scBotTail, 'end');
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
      const a = 0.45 + (i / steps) * 2.75 * Math.PI * 2;
      const r = 0.245 + offset;
      const y = 0.058 + (i / steps) * 0.032;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const mesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.0052, 8, false)),
      matYellowFiber,
    );
    mesh.castShadow = true;
    lcApcGroup.add(mesh);
  }

  // Yellow velcro wrap gathering duplex loop at the front
  const strap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.017, 0.017, 0.036, 16)),
    matYellowFiber,
  );
  strap.rotation.z = Math.PI / 2;
  strap.position.set(0.0, 0.074, 0.245);
  lcApcGroup.add(strap);

  // Helper to render twin parallel zipcord duplex curve
  const buildDuplexLeadMesh = (curve: THREE.CatmullRomCurve3, parent: THREE.Group) => {
    for (const dx of [-0.0055, 0.0055]) {
      const pts = curve.getPoints(20).map((p) => new THREE.Vector3(p.x + dx, p.y, p.z));
      const subCurve = new THREE.CatmullRomCurve3(pts);
      const mesh = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(subCurve, 20, 0.0046, 8, false)),
        matYellowFiber,
      );
      mesh.castShadow = true;
      parent.add(mesh);
    }
  };

  // Front-Right Duplex Lead -> Green LC-APC Duplex Connector pointing outward
  const lcRightLead = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.015, 0.075, 0.242),
    new THREE.Vector3(0.11, 0.066, 0.248),
    new THREE.Vector3(0.21, 0.058, 0.21),
  ]);
  buildDuplexLeadMesh(lcRightLead, lcApcGroup);

  const lcConnRight = buildLcApcConnector(true, matGreenApc, matGreenBoot, matYellowFiber, true);
  alignConnectorToCurve(lcConnRight, lcRightLead, 'end');
  lcApcGroup.add(lcConnRight);

  // Front-Left Duplex Lead -> Green LC-APC Duplex Connector pointing outward
  const lcLeftLead = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.015, 0.075, 0.242),
    new THREE.Vector3(-0.11, 0.066, 0.248),
    new THREE.Vector3(-0.21, 0.058, 0.21),
  ]);
  buildDuplexLeadMesh(lcLeftLead, lcApcGroup);

  const lcConnLeft = buildLcApcConnector(true, matGreenApc, matGreenBoot, matYellowFiber, true);
  alignConnectorToCurve(lcConnLeft, lcLeftLead, 'end');
  lcApcGroup.add(lcConnLeft);

  // ==============================================================
  // SPECIMEN 3: CPA · CABO PRÉ-CONECTORIZADO ARMADO (matches image_b397d765.png)
  // ==============================================================
  const cpaGroup = new THREE.Group();
  root.add(cpaGroup);

  // Heavy matte black armored central coil positioned slightly back on plinth
  const cpaCoilCenterZ = -0.09;
  const cpaPts: THREE.Vector3[] = [];
  const cpaTurns = 4.6;
  for (let i = 0; i <= 180; i++) {
    const a = (i / 180) * cpaTurns * Math.PI * 2;
    const r = 0.195 + (i % 2) * 0.003;
    const y = 0.062 + (i / 180) * 0.058;
    cpaPts.push(new THREE.Vector3(Math.cos(a) * r, y, cpaCoilCenterZ + Math.sin(a) * r));
  }
  const cpaTrunk = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cpaPts), 180, 0.011, 10, false)),
    matBlackArmor,
  );
  cpaTrunk.castShadow = true;
  cpaGroup.add(cpaTrunk);

  // Two dark velcro wraps with subtle barpa orange accent stitch
  for (const vx of [-0.195, 0.195]) {
    const wrap = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.036, 0.068, 0.022)),
      matBlackVelcro,
    );
    wrap.position.set(vx, 0.09, cpaCoilCenterZ);
    cpaGroup.add(wrap);
  }

  // Left & Right breakout boots feeding a crossed X-fan of 10 magenta LC pigtails per side
  const buildCrossedFanOut = (bootSide: -1 | 1) => {
    const bootAnchor = new THREE.Vector3(bootSide * 0.295, 0.084, -0.02);
    const trunkOut = new THREE.CatmullRomCurve3([
      new THREE.Vector3(bootSide * 0.195, 0.09, cpaCoilCenterZ + 0.02),
      new THREE.Vector3(bootSide * 0.275, 0.09, cpaCoilCenterZ + 0.045),
      bootAnchor,
    ]);
    const trunkOutMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(trunkOut, 16, 0.011, 10, false)),
      matBlackArmor,
    );
    trunkOutMesh.castShadow = true;
    cpaGroup.add(trunkOutMesh);

    const furcationBoot = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.016, 0.019, 0.052, 16)),
      matBlackArmor,
    );
    furcationBoot.rotation.x = Math.PI / 2 - 0.35;
    furcationBoot.rotation.z = bootSide * 0.32;
    furcationBoot.position.copy(bootAnchor);
    furcationBoot.castShadow = true;
    cpaGroup.add(furcationBoot);

    // Crossed fan: left boot fans toward front-right (+X); right boot fans toward front-left (-X)
    const targetSide = -bootSide;
    const strandCount = 10;
    for (let i = 0; i < strandCount; i++) {
      const t = i / (strandCount - 1);
      const endX = targetSide * (0.13 + t * 0.24);
      const endZ = 0.24 - t * 0.1;
      const tipPos = new THREE.Vector3(endX, 0.056, endZ);

      const fanCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(bootAnchor.x - bootSide * 0.01, bootAnchor.y - 0.004, bootAnchor.z + 0.02),
        new THREE.Vector3(
          THREE.MathUtils.lerp(bootAnchor.x, endX, 0.48),
          0.062 + (bootSide > 0 ? 0.004 : 0), // subtle over/under weave clearance
          THREE.MathUtils.lerp(bootAnchor.z, endZ, 0.45) + 0.03,
        ),
        tipPos,
      ]);

      const strand = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(fanCurve, 18, 0.0026, 6, false)),
        matMagentaTube,
      );
      strand.castShadow = true;
      cpaGroup.add(strand);

      // White strain sleeve just behind the magenta LC boot (as seen in image_b397d765.png)
      const tipTangent = fanCurve.getTangentAt(1).normalize();
      const sleeveEnd = tipPos.clone().addScaledVector(tipTangent, 0.014);
      const sleeveGeo = trackGeo(new THREE.CylinderGeometry(0.0034, 0.0034, 0.016, 10));
      const sleeve = new THREE.Mesh(sleeveGeo, matWhiteSleeve);
      sleeve.position.copy(tipPos).addScaledVector(tipTangent, 0.007);
      sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tipTangent);
      cpaGroup.add(sleeve);

      // Magenta LC connector properly oriented outward along pigtail tangent
      const lcTip = buildLcApcConnector(false, matMagentaConn, matMagentaConn, matMagentaTube);
      lcTip.scale.setScalar(0.68);
      lcTip.position.copy(sleeveEnd);
      _lookTarget.copy(sleeveEnd).add(tipTangent);
      lcTip.lookAt(_lookTarget);
      cpaGroup.add(lcTip);
    }
  };

  buildCrossedFanOut(-1);
  buildCrossedFanOut(1);

  // ==============================================================
  // SPECIMEN 4: CABO DE COBRE CAT.6A S/FTP RJ45 (matches image_88bc3593.png)
  // ==============================================================
  const copperGroup = new THREE.Group();
  root.add(copperGroup);

  // Smooth natural coiled orange LSOH cable with BOTH ends sweeping forward into upright RJ45 plugs
  const copperCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 0.088, 0.14),
    new THREE.Vector3(-0.31, 0.072, -0.02),
    new THREE.Vector3(-0.18, 0.068, -0.24),
    new THREE.Vector3(0.0, 0.072, -0.28),
    new THREE.Vector3(0.18, 0.068, -0.24),
    new THREE.Vector3(0.31, 0.072, -0.02),
    new THREE.Vector3(0.22, 0.088, 0.14),
  ]);
  const copperCableMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(copperCurve, 84, 0.011, 14, false)),
    matBarpaOrange,
  );
  copperCableMesh.castShadow = true;
  copperGroup.add(copperCableMesh);

  // Left RJ45 Plug — boot mates cleanly at curve start (t=0), crystal nose points forward-right toward viewer
  const plugLeft = buildRj45Plug();
  plugLeft.scale.setScalar(1.3);
  alignConnectorToCurve(plugLeft, copperCurve, 'start', 0.18);
  copperGroup.add(plugLeft);

  // Right RJ45 Plug — boot mates cleanly at curve end (t=1), crystal nose points forward-left toward viewer
  const plugRight = buildRj45Plug();
  plugRight.scale.setScalar(1.3);
  alignConnectorToCurve(plugRight, copperCurve, 'end', -0.18);
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
