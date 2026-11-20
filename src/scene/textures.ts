import * as THREE from 'three';

export interface ProceduralTextureSet {
  powderCoatBump: THREE.CanvasTexture;
  perforatedMeshAlpha: THREE.CanvasTexture;
  railMarkingsMap: THREE.CanvasTexture;
  patchPanelFaceMap: THREE.CanvasTexture;
  kvmScreenMap: THREE.CanvasTexture;
  keyboardMap: THREE.CanvasTexture;
  brushBristlesMap: THREE.CanvasTexture;
  floorTileMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  barpaBadgeMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to acquire 2D context for procedural texture');
  }
  return [canvas, ctx];
}

function configureTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = Math.min(maxAnisotropy, 8);
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Fine powder-coated steel micro-grain bump texture
  const [bumpCanvas, bumpCtx] = makeCanvas(256, 256);
  const imgData = bumpCtx.createImageData(256, 256);
  let seed = 1337;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.floor(110 + nextRand() * 38);
    imgData.data[i] = v;
    imgData.data[i + 1] = v;
    imgData.data[i + 2] = v;
    imgData.data[i + 3] = 255;
  }
  bumpCtx.putImageData(imgData, 0, 0);
  const powderCoatBump = configureTexture(bumpCanvas, maxAnisotropy, false, 6, 6);

  // 2. Perforated hexagonal ventilation mesh alpha texture (side/rear panels)
  const [perfCanvas, perfCtx] = makeCanvas(128, 128);
  perfCtx.fillStyle = '#ffffff';
  perfCtx.fillRect(0, 0, 128, 128);
  perfCtx.fillStyle = '#000000';
  const stepX = 16;
  const stepY = 14;
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 10; col++) {
      const cx = col * stepX + (row % 2 === 0 ? 0 : stepX / 2);
      const cy = row * stepY;
      perfCtx.beginPath();
      perfCtx.arc(cx, cy, 4.6, 0, Math.PI * 2);
      perfCtx.fill();
    }
  }
  const perforatedMeshAlpha = configureTexture(perfCanvas, maxAnisotropy, false, 10, 26);

  // 3. 19" vertical mounting rail with U markings (1U..42U) & square cage-nut holes
  const [railCanvas, railCtx] = makeCanvas(128, 2048);
  railCtx.fillStyle = '#20242c';
  railCtx.fillRect(0, 0, 128, 2048);
  // Subtle metallic vertical highlight
  railCtx.fillStyle = '#2c313d';
  railCtx.fillRect(4, 0, 8, 2048);
  const uPx = 2048 / 42;
  for (let u = 1; u <= 42; u++) {
    // Bottom is 1U, top is 42U
    const yBottom = 2048 - (u - 1) * uPx;
    const yTop = yBottom - uPx;
    // U divider line
    railCtx.fillStyle = '#525b6e';
    railCtx.fillRect(0, yTop, 128, 1.5);
    // 3 square cage nut holes per U
    railCtx.fillStyle = '#090a0d';
    for (let h = 0; h < 3; h++) {
      const hy = yTop + uPx * (0.18 + h * 0.31);
      railCtx.fillRect(24, hy, 18, 10);
      // subtle steel inner edge
      railCtx.strokeStyle = '#64748b';
      railCtx.lineWidth = 1;
      railCtx.strokeRect(24, hy, 18, 10);
    }
    // Crisp U number print
    railCtx.fillStyle = u % 5 === 0 ? '#f26522' : '#d1d5db';
    railCtx.font = 'bold 20px monospace';
    railCtx.textAlign = 'center';
    railCtx.textBaseline = 'middle';
    railCtx.fillText(String(u).padStart(2, '0'), 86, yTop + uPx * 0.52);
  }
  const railMarkingsMap = configureTexture(railCanvas, maxAnisotropy, true);

  // 4. 24-Port Shielded Cat.6A Patch Panel Faceplate Texture
  const [ppCanvas, ppCtx] = makeCanvas(1024, 128);
  ppCtx.fillStyle = '#181b21';
  ppCtx.fillRect(0, 0, 1024, 128);
  // Brushed horizontal metal trim
  ppCtx.fillStyle = '#262b35';
  ppCtx.fillRect(0, 0, 1024, 12);
  ppCtx.fillRect(0, 116, 1024, 12);
  // White labeling strip above ports
  ppCtx.fillStyle = '#d8dde6';
  ppCtx.fillRect(72, 18, 880, 20);
  // Barpa tiny branding left
  ppCtx.fillStyle = '#f26522';
  ppCtx.font = 'bold 16px sans-serif';
  ppCtx.fillText('BARPA', 14, 34);
  ppCtx.fillStyle = '#94a3b8';
  ppCtx.font = 'bold 12px monospace';
  ppCtx.fillText('CAT.6A', 14, 54);
  // Draw 4 groups of 6 shielded RJ45 keystone ports
  for (let g = 0; g < 4; g++) {
    const groupX = 82 + g * 218;
    for (let p = 0; p < 6; p++) {
      const portIdx = g * 6 + p + 1;
      const px = groupX + p * 34;
      // Port number on white strip
      ppCtx.fillStyle = '#111827';
      ppCtx.font = 'bold 13px monospace';
      ppCtx.textAlign = 'center';
      ppCtx.fillText(String(portIdx).padStart(2, '0'), px + 13, 33);
      // Shielded zinc housing
      ppCtx.fillStyle = '#7c8594';
      ppCtx.fillRect(px, 46, 26, 48);
      // Inner dark RJ45 jack recess
      ppCtx.fillStyle = '#090b0f';
      ppCtx.fillRect(px + 3, 50, 20, 34);
      // Gold contact pins inside
      ppCtx.fillStyle = '#eab308';
      for (let pin = 0; pin < 6; pin++) {
        ppCtx.fillRect(px + 5 + pin * 3, 52, 1.5, 8);
      }
      // Subtle port tab notch
      ppCtx.fillStyle = '#050608';
      ppCtx.fillRect(px + 9, 82, 8, 8);
    }
  }
  const patchPanelFaceMap = configureTexture(ppCanvas, maxAnisotropy, true);

  // 5. KVM 17" LCD Screen Diagnostics UI Texture (matching Barpa industrial aesthetic)
  const [kvmCanvas, kvmCtx] = makeCanvas(512, 384);
  const screenGrad = kvmCtx.createLinearGradient(0, 0, 0, 384);
  screenGrad.addColorStop(0, '#101620');
  screenGrad.addColorStop(1, '#090d14');
  kvmCtx.fillStyle = screenGrad;
  kvmCtx.fillRect(0, 0, 512, 384);
  // Subtle top bar
  kvmCtx.fillStyle = '#182232';
  kvmCtx.fillRect(0, 0, 512, 38);
  kvmCtx.fillStyle = '#f26522';
  kvmCtx.font = 'bold 16px sans-serif';
  kvmCtx.fillText('BARPA KVM-1U17', 16, 24);
  kvmCtx.fillStyle = '#94a3b8';
  kvmCtx.font = '12px monospace';
  kvmCtx.fillText('NORMA 1 · 42U LOCAL CONSOLE', 290, 24);
  // Clean terminal / port telemetry grid
  kvmCtx.strokeStyle = '#243144';
  kvmCtx.lineWidth = 1;
  kvmCtx.strokeRect(18, 56, 476, 138);
  kvmCtx.fillStyle = '#38bdf8';
  kvmCtx.font = 'bold 13px monospace';
  kvmCtx.fillText('SYSTEM CONSOLE · LINK STATUS', 32, 80);
  const rows = [
    ['CH-01  CORE-SW-42U', '10G-SFP+', 'UP   34°C'],
    ['CH-02  FIBER-PP-01', 'OS2/SC  ', 'OK   -1.8dB'],
    ['CH-03  PATCH-C6A-1', 'PoE++   ', 'ACT  24/24'],
    ['CH-04  UPS-PDU-01 ', '230V AC ', 'LOAD 42%'],
  ];
  rows.forEach((r, idx) => {
    const ry = 108 + idx * 22;
    kvmCtx.fillStyle = '#cbd5e1';
    kvmCtx.fillText(r[0], 32, ry);
    kvmCtx.fillStyle = '#94a3b8';
    kvmCtx.fillText(r[1], 235, ry);
    kvmCtx.fillStyle = idx === 0 || idx === 1 ? '#34d399' : '#f59e0b';
    kvmCtx.fillText(r[2], 370, ry);
  });
  // Thermal airflow mini-chart
  kvmCtx.strokeRect(18, 212, 476, 146);
  kvmCtx.fillStyle = '#94a3b8';
  kvmCtx.font = '12px monospace';
  kvmCtx.fillText('RACK THERMAL PROFILE · FRONT INTAKE 21.4°C', 32, 236);
  kvmCtx.strokeStyle = '#f26522';
  kvmCtx.lineWidth = 2;
  kvmCtx.beginPath();
  for (let i = 0; i < 24; i++) {
    const gx = 32 + i * 19;
    const gy = 315 - Math.sin(i * 0.45) * 22 - (i % 3) * 5;
    if (i === 0) kvmCtx.moveTo(gx, gy);
    else kvmCtx.lineTo(gx, gy);
  }
  kvmCtx.stroke();
  const kvmScreenMap = configureTexture(kvmCanvas, maxAnisotropy, true);

  // 6. KVM Keyboard + Touchpad Texture
  const [kbCanvas, kbCtx] = makeCanvas(512, 256);
  kbCtx.fillStyle = '#14161b';
  kbCtx.fillRect(0, 0, 512, 256);
  // Keyboard well
  kbCtx.fillStyle = '#0c0e12';
  kbCtx.fillRect(24, 18, 464, 142);
  // Keycaps grid
  for (let r = 0; r < 5; r++) {
    const cols = r === 4 ? 10 : 16;
    for (let c = 0; c < cols; c++) {
      const kw = r === 4 && c === 4 ? 110 : 24;
      const kx =
        r === 4
          ? 34 + (c > 4 ? 86 : 0) + c * 32
          : 32 + c * 28;
      if (kx + kw > 480) continue;
      kbCtx.fillStyle = '#252932';
      kbCtx.fillRect(kx, 26 + r * 26, kw, 20);
      kbCtx.strokeStyle = '#363c4a';
      kbCtx.lineWidth = 1;
      kbCtx.strokeRect(kx, 26 + r * 26, kw, 20);
    }
  }
  // Touchpad
  kbCtx.fillStyle = '#1d212a';
  kbCtx.fillRect(196, 174, 120, 64);
  kbCtx.strokeStyle = '#383f4f';
  kbCtx.lineWidth = 2;
  kbCtx.strokeRect(196, 174, 120, 64);
  const keyboardMap = configureTexture(kbCanvas, maxAnisotropy, true);

  // 7. Brush Bristles Texture (dense vertical nylon filaments)
  const [brushCanvas, brushCtx] = makeCanvas(512, 64);
  brushCtx.fillStyle = '#0b0c0f';
  brushCtx.fillRect(0, 0, 512, 64);
  for (let x = 0; x < 512; x += 2) {
    const shade = 20 + Math.floor(nextRand() * 28);
    brushCtx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
    brushCtx.fillRect(x, 0, 1.5, 64);
  }
  // Horizontal seam in middle where upper and lower bristles meet
  brushCtx.fillStyle = '#050608';
  brushCtx.fillRect(0, 30, 512, 4);
  const brushBristlesMap = configureTexture(brushCanvas, maxAnisotropy, true);

  // 8. Architectural Data-Center Raised Floor Tile Grid Texture
  const [floorCanvas, floorCtx] = makeCanvas(512, 512);
  floorCtx.fillStyle = '#1a1d24';
  floorCtx.fillRect(0, 0, 512, 512);
  // Subtle micro-speckle
  for (let i = 0; i < 1800; i++) {
    const fx = Math.floor(nextRand() * 512);
    const fy = Math.floor(nextRand() * 512);
    const lum = 28 + Math.floor(nextRand() * 14);
    floorCtx.fillStyle = `rgb(${lum},${lum + 2},${lum + 6})`;
    floorCtx.fillRect(fx, fy, 2, 2);
  }
  // Subtle 600mm raised tile seams
  floorCtx.strokeStyle = '#252a35';
  floorCtx.lineWidth = 2;
  floorCtx.strokeRect(1, 1, 510, 510);
  floorCtx.strokeStyle = '#14171d';
  floorCtx.lineWidth = 1;
  floorCtx.strokeRect(3, 3, 506, 506);
  const floorTileMap = configureTexture(floorCanvas, maxAnisotropy, true, 16, 16);

  // 9. Soft radial contact shadow beneath the cabinet
  const [shadowCanvas, shadowCtx] = makeCanvas(256, 256);
  const radGrad = shadowCtx.createRadialGradient(128, 128, 22, 128, 128, 124);
  radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
  radGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.42)');
  radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  shadowCtx.fillStyle = radGrad;
  shadowCtx.fillRect(0, 0, 256, 256);
  const contactShadowMap = configureTexture(shadowCanvas, maxAnisotropy, true);

  // 10. Top roof Barpa Nameplate texture
  const [badgeCanvas, badgeCtx] = makeCanvas(256, 64);
  badgeCtx.fillStyle = '#14161a';
  badgeCtx.fillRect(0, 0, 256, 64);
  badgeCtx.fillStyle = '#f26522';
  badgeCtx.font = '800 30px sans-serif';
  badgeCtx.textAlign = 'center';
  badgeCtx.textBaseline = 'middle';
  badgeCtx.fillText('BARPA', 90, 33);
  badgeCtx.fillStyle = '#d1d5db';
  badgeCtx.font = '600 15px monospace';
  badgeCtx.fillText('NORMA 1', 194, 34);
  const barpaBadgeMap = configureTexture(badgeCanvas, maxAnisotropy, true);

  return {
    powderCoatBump,
    perforatedMeshAlpha,
    railMarkingsMap,
    patchPanelFaceMap,
    kvmScreenMap,
    keyboardMap,
    brushBristlesMap,
    floorTileMap,
    contactShadowMap,
    barpaBadgeMap,
    dispose: () => {
      powderCoatBump.dispose();
      perforatedMeshAlpha.dispose();
      railMarkingsMap.dispose();
      patchPanelFaceMap.dispose();
      kvmScreenMap.dispose();
      keyboardMap.dispose();
      brushBristlesMap.dispose();
      floorTileMap.dispose();
      contactShadowMap.dispose();
      barpaBadgeMap.dispose();
    },
  };
}

/** Creates a crisp dimension label sprite texture for Scale 1:1 mode */
export function createDimensionLabelTexture(text: string): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 64);
  ctx.fillStyle = 'rgba(17, 19, 23, 0.92)';
  ctx.fillRect(8, 8, 240, 48);
  ctx.strokeStyle = '#f26522';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 240, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 33);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
