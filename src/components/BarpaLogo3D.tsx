import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BarpaLogo3DProps {
  thinking?: boolean;
  size?: number;
  className?: string;
}

function createLowercaseBGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();

  // Geometric lowercase 'b' contour (stem on left + circular bowl on right)
  const stemLeft = -0.56;
  const stemRight = -0.31;
  const stemTop = 0.84;
  const bowlCx = 0.04;
  const bowlCy = -0.13;
  const bowlR = 0.49;

  // Intersection height of stemRight (-0.31) with top arc of bowl
  const dx = stemRight - bowlCx; // -0.35
  const dy = Math.sqrt(Math.max(0, bowlR * bowlR - dx * dx)); // ~0.343
  const joinAngle = Math.atan2(dy, dx);

  shape.moveTo(stemLeft, bowlCy - bowlR);
  shape.lineTo(stemLeft, stemTop - 0.05);
  shape.quadraticCurveTo(stemLeft, stemTop, stemLeft + 0.05, stemTop);
  shape.lineTo(stemRight - 0.05, stemTop);
  shape.quadraticCurveTo(stemRight, stemTop, stemRight, stemTop - 0.05);
  shape.lineTo(stemRight, bowlCy + dy);
  shape.absarc(bowlCx, bowlCy, bowlR, joinAngle, -Math.PI / 2, true);
  shape.lineTo(stemLeft, bowlCy - bowlR);

  const hole = new THREE.Path();
  hole.absarc(bowlCx, bowlCy, 0.23, 0, Math.PI * 2, false);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.032,
    bevelSegments: 4,
    curveSegments: 36,
  });
  geo.center();
  return geo;
}

export const BarpaLogo3D: React.FC<BarpaLogo3DProps> = ({
  thinking = false,
  size = 76,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;
  const hoveredRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20);
    camera.position.set(0.05, 0.12, 3.35);
    camera.lookAt(0, 0, 0);

    // 3-point studio lighting so the 3D orange 'b' gleams across bevels
    const ambient = new THREE.HemisphereLight(0xfff1e6, 0x1a1e26, 1.05);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    keyLight.position.set(2.2, 2.8, 3.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffb38a, 1.45);
    rimLight.position.set(-2.4, -1.2, -2.2);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);

    const bGeo = createLowercaseBGeometry();
    const bMat = new THREE.MeshPhysicalMaterial({
      color: 0xf26522,
      emissive: 0x7c2808,
      emissiveIntensity: 0.25,
      metalness: 0.22,
      roughness: 0.24,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
    });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    group.add(bMesh);

    const ringGeo = new THREE.TorusGeometry(0.92, 0.022, 12, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xff8c4d,
      emissive: 0xf26522,
      emissiveIntensity: 0.45,
      metalness: 0.35,
      roughness: 0.3,
      transparent: true,
      opacity: 0.72,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI * 0.38;
    ringMesh.rotation.y = -0.25;
    group.add(ringMesh);

    let disposed = false;
    let rafId = 0;
    let phase = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      if (disposed || !renderer) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now * 0.001;

      const isThinking = thinkingRef.current;
      const isHovered = hoveredRef.current;
      const speed = isThinking ? 3.4 : isHovered ? 2.4 : 1.45;
      phase += dt * speed;

      // Smooth front-facing 3D oscillation (±25°) + levitation so the lowercase 'b' never flips backward into a 'd'
      group.position.y = Math.sin(phase * 1.15) * 0.075;
      bMesh.rotation.y = Math.sin(phase) * 0.44;
      bMesh.rotation.x = Math.sin(phase * 0.78) * 0.14;
      bMesh.rotation.z = Math.cos(phase * 0.65) * 0.055;

      const pulseScale = isThinking ? 1 + Math.sin(t * 6) * 0.045 : 1;
      bMesh.scale.setScalar(pulseScale);

      ringMesh.rotation.z += dt * (isThinking ? 2.2 : 0.8);
      bMat.emissiveIntensity = isThinking ? 0.52 + Math.sin(t * 8) * 0.18 : 0.24;

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      bGeo.dispose();
      bMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer?.dispose();
      if (renderer?.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
      aria-label="Logótipo 3D animado barpa em laranja"
      data-testid="barpa-logo-3d"
      style={{ width: size, height: size }}
      className={`relative shrink-0 select-none ${className}`}
    />
  );
};
