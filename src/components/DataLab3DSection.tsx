import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SKILLS_DATA } from '../data/portfolioData';
import {
  ChevronDown,
  ChevronUp,
  Expand,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

// Module-scoped reusable math helpers (zero per-frame GC allocations)
const _dummy = new THREE.Object3D();
const _targetVec = new THREE.Vector3();

function createProceduralGridTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const step = 64;
    for (let i = 0; i <= size; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Subtle concentric calibration ring
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      8,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const DataLab3DSection: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [resetCounter, setResetCounter] = useState<number>(0);

  // Store mutable control refs so React state never re-creates the WebGLRenderer
  const controlStateRef = useRef({
    selectedIndex: 0,
    isExploded: false,
    speedMultiplier: 1,
    resetRequested: false,
  });

  useEffect(() => {
    controlStateRef.current.selectedIndex = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    controlStateRef.current.isExploded = isExploded;
  }, [isExploded]);

  useEffect(() => {
    controlStateRef.current.speedMultiplier = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    if (resetCounter > 0) {
      controlStateRef.current.resetRequested = true;
    }
  }, [resetCounter]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect Software WebGL cleanly from GPU renderer string
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const getResponsiveCameraZ = (aspect: number) => {
      if (aspect >= 1.35) return 8.6;
      const halfFovRad = THREE.MathUtils.degToRad(21);
      return Math.min(13.8, 4.65 / (Math.tan(halfFovRad) * Math.max(aspect, 0.62)));
    };

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 540;
    const initialAspect = width / height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050507);
    scene.fog = new THREE.FogExp2(0x050507, 0.042);

    const camera = new THREE.PerspectiveCamera(42, initialAspect, 0.1, 80);
    const defaultCameraPos = new THREE.Vector3(0, 2.2, getResponsiveCameraZ(initialAspect));
    camera.position.copy(defaultCameraPos);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Procedural Studio IBL Reflection Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x18181b, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.4);
    keyLight.position.set(5.5, 8.5, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 1.35);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // OrbitControls (zoom disabled & touchAction pan-y preserved so mobile page scrolling never traps)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.56;
    controls.target.set(0, 0.45, 0);
    renderer.domElement.style.touchAction = 'pan-y';

    // Track disposable resources
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    // Ground Grid Plane + Contact Shadow Disc (offset >= 0.02 to prevent Z-fighting)
    const gridTex = createProceduralGridTexture();
    gridTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    textures.push(gridTex);

    const floorGeo = new THREE.CircleGeometry(14, 64);
    floorGeo.rotateX(-Math.PI / 2);
    geometries.push(floorGeo);
    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.78,
      metalness: 0.25,
    });
    materials.push(floorMat);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -2.15;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const shadowTex = createContactShadowTexture();
    textures.push(shadowTex);
    const contactGeo = new THREE.PlaneGeometry(5.8, 5.8);
    contactGeo.rotateX(-Math.PI / 2);
    geometries.push(contactGeo);
    const contactMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    materials.push(contactMat);
    const contactPlane = new THREE.Mesh(contactGeo, contactMat);
    contactPlane.position.y = -2.12;
    scene.add(contactPlane);

    // Composite Multi-Part Hero Sculpture ("Analytical Core Observatory")
    const sculptureRoot = new THREE.Group();
    sculptureRoot.position.set(0, 0.5, 0);
    scene.add(sculptureRoot);

    // Part 1: Faceted Brushed Obsidian Core
    const coreGeo = new THREE.IcosahedronGeometry(0.95, 0);
    geometries.push(coreGeo);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      roughness: 0.24,
      metalness: 0.88,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
    });
    materials.push(coreMat);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.castShadow = true;
    sculptureRoot.add(coreMesh);

    // Part 2: Precision Metallic Wireframe Cage
    const edgesGeo = new THREE.EdgesGeometry(coreGeo, 1);
    geometries.push(edgesGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0xe4e4e7,
      transparent: true,
      opacity: 0.65,
    });
    materials.push(edgesMat);
    const coreCage = new THREE.LineSegments(edgesGeo, edgesMat);
    coreCage.scale.setScalar(1.06);
    sculptureRoot.add(coreCage);

    // Part 3: Glowing Inner Energy Crystal
    const innerGeo = new THREE.OctahedronGeometry(0.45, 0);
    geometries.push(innerGeo);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.5,
      roughness: 0.15,
      metalness: 0.2,
    });
    materials.push(innerMat);
    const innerCrystal = new THREE.Mesh(innerGeo, innerMat);
    sculptureRoot.add(innerCrystal);

    // Part 4: Machined Lathe Top & Bottom Polar Collars
    const lathePoints = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.42, 0.0),
      new THREE.Vector2(0.5, 0.1),
      new THREE.Vector2(0.32, 0.22),
      new THREE.Vector2(0.0, 0.22),
    ];
    const collarGeo = new THREE.LatheGeometry(lathePoints, 28);
    geometries.push(collarGeo);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.2,
      metalness: 0.92,
    });
    materials.push(collarMat);
    const topCollar = new THREE.Mesh(collarGeo, collarMat);
    topCollar.position.y = 1.05;
    topCollar.castShadow = true;
    sculptureRoot.add(topCollar);

    const bottomCollar = new THREE.Mesh(collarGeo, collarMat);
    bottomCollar.rotation.x = Math.PI;
    bottomCollar.position.y = -1.05;
    bottomCollar.castShadow = true;
    sculptureRoot.add(bottomCollar);

    // Part 5: 3 Concentric Orbital Gimbal Rings
    const ring1Geo = new THREE.TorusGeometry(1.75, 0.032, 16, 96);
    const ring2Geo = new THREE.TorusGeometry(2.25, 0.026, 16, 112);
    const ring3Geo = new THREE.TorusGeometry(2.9, 0.02, 16, 128);
    geometries.push(ring1Geo, ring2Geo, ring3Geo);

    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      roughness: 0.18,
      metalness: 0.94,
    });
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      roughness: 0.38,
      metalness: 0.72,
    });
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.45,
      metalness: 0.85,
    });
    materials.push(ring1Mat, ring2Mat, ring3Mat);

    const gimbal1 = new THREE.Mesh(ring1Geo, ring1Mat);
    gimbal1.rotation.set(Math.PI * 0.35, 0.2, 0);
    sculptureRoot.add(gimbal1);

    const gimbal2 = new THREE.Mesh(ring2Geo, ring2Mat);
    gimbal2.rotation.set(-Math.PI * 0.28, 0.5, 0.3);
    sculptureRoot.add(gimbal2);

    const gimbal3 = new THREE.Mesh(ring3Geo, ring3Mat);
    gimbal3.rotation.set(Math.PI * 0.48, -0.15, 0);
    sculptureRoot.add(gimbal3);

    // Part 6: 6 Composite Orbiting Tool Satellites (beveled hex ExtrudeGeometry + metallic sleeve + beacon)
    const hexShape = new THREE.Shape();
    const hexRadius = 0.24;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const hx = Math.cos(a) * hexRadius;
      const hy = Math.sin(a) * hexRadius;
      if (i === 0) hexShape.moveTo(hx, hy);
      else hexShape.lineTo(hx, hy);
    }
    hexShape.closePath();

    const prismGeo = new THREE.ExtrudeGeometry(hexShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 2,
    });
    prismGeo.center();
    const sleeveGeo = new THREE.CylinderGeometry(0.16, 0.19, 0.12, 16);
    const beaconGeo = new THREE.SphereGeometry(0.09, 16, 16);
    geometries.push(prismGeo, sleeveGeo, beaconGeo);

    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.22,
      metalness: 0.92,
    });
    materials.push(sleeveMat);

    interface SatelliteNode {
      group: THREE.Group;
      beaconMat: THREE.MeshStandardMaterial;
      baseAngle: number;
      orbitTilt: number;
    }

    const satellites: SatelliteNode[] = SKILLS_DATA.map((skill, idx) => {
      const satGroup = new THREE.Group();
      const toolColor = new THREE.Color(skill.colorHex);

      const prismMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.48,
        metalness: 0.72,
      });
      const beaconMat = new THREE.MeshStandardMaterial({
        color: toolColor,
        emissive: toolColor,
        emissiveIntensity: idx === 0 ? 1.8 : 0.7,
        roughness: 0.18,
        metalness: 0.15,
      });
      materials.push(prismMat, beaconMat);

      const prism = new THREE.Mesh(prismGeo, prismMat);
      prism.castShadow = true;
      satGroup.add(prism);

      const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
      sleeve.position.y = -0.14;
      satGroup.add(sleeve);

      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 0.16;
      satGroup.add(beacon);

      sculptureRoot.add(satGroup);

      return {
        group: satGroup,
        beaconMat,
        baseAngle: (idx / SKILLS_DATA.length) * Math.PI * 2,
        orbitTilt: (idx % 2 === 0 ? 1 : -1) * 0.42,
      };
    });

    // Part 7: 120-Instance Orbiting Data Particle Field (InstancedMesh)
    const particleCount = 120;
    const particleGeo = new THREE.OctahedronGeometry(0.045, 0);
    geometries.push(particleGeo);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.75,
    });
    materials.push(particleMat);

    const particleMesh = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      particleCount
    );
    particleMesh.frustumCulled = false;

    const particleParams = Array.from({ length: particleCount }, (_, i) => {
      const radius = 2.6 + (i % 7) * 0.34;
      const angle = (i / particleCount) * Math.PI * 2 * 3;
      const speed = 0.12 + (i % 5) * 0.04;
      const yAmp = 0.55 + (i % 4) * 0.25;
      const scale = 0.75 + ((i * 17) % 10) * 0.05;
      return { radius, angle, speed, yAmp, scale };
    });

    const paletteColors = SKILLS_DATA.map((s) => new THREE.Color(s.colorHex));
    for (let i = 0; i < particleCount; i++) {
      const p = particleParams[i];
      _dummy.position.set(
        Math.cos(p.angle) * p.radius,
        Math.sin(p.angle * 2) * p.yAmp,
        Math.sin(p.angle) * p.radius
      );
      _dummy.scale.setScalar(p.scale);
      _dummy.updateMatrix();
      particleMesh.setMatrixAt(i, _dummy.matrix);
      particleMesh.setColorAt(i, paletteColors[i % paletteColors.length]);
    }
    particleMesh.instanceMatrix.needsUpdate = true;
    if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;
    particleMesh.computeBoundingSphere();
    sculptureRoot.add(particleMesh);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // ResizeObserver for crisp responsive sizing & mobile camera framing
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      const aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      defaultCameraPos.set(0, 2.2, getResponsiveCameraZ(aspect));
      const dist = camera.position.distanceTo(controls.target);
      const targetDist = defaultCameraPos.distanceTo(controls.target);
      if (Math.abs(dist - targetDist) > 0.25) {
        camera.position.setLength(targetDist);
      }
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation loop with exponential damping & software-WebGL pacing
    let frameId = 0;
    let disposed = false;
    let elapsedSim = 0;
    let explodeAlpha = 0;
    let lastTs = performance.now();

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const rawDelta = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;

      const { selectedIndex: activeIdx, isExploded: targetExplode, speedMultiplier: speed, resetRequested } =
        controlStateRef.current;

      if (resetRequested) {
        camera.position.copy(defaultCameraPos);
        controls.target.set(0, 0.45, 0);
        controls.update();
        controlStateRef.current.resetRequested = false;
      }

      const effectiveSpeed = prefersReducedMotion ? 0 : speed;
      elapsedSim += rawDelta * effectiveSpeed;

      // Exponentially damp exploded state
      explodeAlpha = THREE.MathUtils.damp(
        explodeAlpha,
        targetExplode ? 1 : 0,
        6,
        rawDelta
      );

      // Core kinetic motion
      coreMesh.rotation.y = elapsedSim * 0.35;
      coreMesh.rotation.x = Math.sin(elapsedSim * 0.4) * 0.18;
      coreCage.rotation.y = -elapsedSim * 0.25;
      coreCage.rotation.z = elapsedSim * 0.18;
      innerCrystal.rotation.y = elapsedSim * 0.9;
      innerCrystal.rotation.x = elapsedSim * 0.55;

      // Exploded separation of collars & rings
      topCollar.position.y = THREE.MathUtils.lerp(1.05, 1.75, explodeAlpha);
      bottomCollar.position.y = THREE.MathUtils.lerp(-1.05, -1.75, explodeAlpha);

      gimbal1.rotation.z += rawDelta * 0.32 * effectiveSpeed;
      gimbal2.rotation.x += rawDelta * 0.22 * effectiveSpeed;
      gimbal3.rotation.y -= rawDelta * 0.16 * effectiveSpeed;

      const activeColorHex = SKILLS_DATA[activeIdx]?.colorHex || '#34d399';
      innerMat.color.set(activeColorHex);
      innerMat.emissive.set(activeColorHex);

      // Orbiting Composite Tool Satellites
      const orbitBaseRadius = THREE.MathUtils.lerp(2.75, 3.65, explodeAlpha);
      satellites.forEach((sat, idx) => {
        const isSelected = idx === activeIdx;
        const a = sat.baseAngle + elapsedSim * 0.28;
        const tx = Math.cos(a) * orbitBaseRadius;
        const tz = Math.sin(a) * orbitBaseRadius;
        const ty =
          Math.sin(a + idx) * (0.48 + explodeAlpha * 0.45) +
          (isSelected ? 0.32 : 0);

        _targetVec.set(tx, ty, tz);
        sat.group.position.lerp(_targetVec, 1 - Math.exp(-8 * rawDelta));
        sat.group.rotation.y = -a + elapsedSim * 0.6;
        sat.group.rotation.x = sat.orbitTilt * Math.sin(elapsedSim * 0.5 + idx);

        const targetScale = isSelected ? 1.48 : 0.95;
        const s = THREE.MathUtils.damp(
          sat.group.scale.x,
          targetScale,
          8,
          rawDelta
        );
        sat.group.scale.setScalar(s);
        sat.beaconMat.emissiveIntensity = isSelected ? 2.2 : 0.65;
      });

      // Instanced Data Particle Field update (zero allocations)
      const cloudExpand = 1 + explodeAlpha * 0.35;
      for (let i = 0; i < particleCount; i++) {
        const p = particleParams[i];
        const angle = p.angle + elapsedSim * p.speed;
        const r = p.radius * cloudExpand;
        _dummy.position.set(
          Math.cos(angle) * r,
          Math.sin(angle * 1.5 + i) * p.yAmp,
          Math.sin(angle) * r
        );
        _dummy.rotation.set(elapsedSim + i, elapsedSim * 0.7, 0);
        _dummy.scale.setScalar(p.scale);
        _dummy.updateMatrix();
        particleMesh.setMatrixAt(i, _dummy.matrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const activeSkill = SKILLS_DATA[selectedIndex] || SKILLS_DATA[0];

  return (
    <section
      id="data-lab"
      className="py-20 sm:py-24 bg-black text-white px-4 sm:px-8 border-t border-zinc-900"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] text-zinc-400 uppercase mb-3">
            Interactive 3D Learning Stack
          </p>
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-white uppercase mb-4"
            style={{ textWrap: 'balance' }}
          >
            3D Analytical Core
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
            Drag to orbit the 3D scene and inspect the 6 core Data Analytics tools I am practicing as a fresher. No completed projects yet—focused on building strong technical fundamentals first.
          </p>
        </div>

        {/* Responsive 3D Viewport Container (Unobstructed 3D canvas + stacked dock on mobile, floating collapsible dock on desktop) */}
        <div className="relative w-full bg-[#050507] border border-zinc-800 overflow-hidden select-none">
          <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[580px]">
            {/* Minimal Top-Left Corner Spec Badge (Single-line on mobile) */}
            <div className="pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 z-10 px-2.5 py-1.5 bg-black/85 border border-zinc-800 text-[10px] sm:text-[11px] font-mono text-zinc-300 inline-flex items-center gap-1.5 max-w-[calc(100%-1.5rem)] truncate">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Interactive 3D · Drag to Rotate</span>
            </div>

            {/* Isolated Three.js WebGL Mount */}
            <div
              ref={mountRef}
              className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
            />
          </div>

          {/* Unified Control Dock: cleanly stacked below canvas on mobile (< lg), collapsible overlay on desktop (lg:) */}
          <div
            className={`relative lg:absolute lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2 z-10 w-full lg:w-[calc(100%-2rem)] lg:max-w-[920px] transition-transform duration-300 ${
              dockCollapsed ? 'lg:translate-y-[calc(100%-36px)]' : 'lg:translate-y-0'
            }`}
          >
            {/* Desktop Collapse / Expand Toggle Handle */}
            <div className="hidden lg:flex justify-center">
              <button
                type="button"
                onClick={() => setDockCollapsed((prev) => !prev)}
                className="px-4 py-1.5 bg-zinc-950/95 hover:bg-zinc-900 border border-b-0 border-zinc-700 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                aria-expanded={!dockCollapsed}
              >
                {dockCollapsed ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Show 3D Controls (H)</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Hide Controls (H)</span>
                  </>
                )}
              </button>
            </div>

            {/* Main Dock Body */}
            <div className="bg-zinc-950/95 border-t lg:border border-zinc-800 lg:border-zinc-700 p-3.5 sm:p-4 space-y-3 shadow-2xl">
              {/* Row 1: 6 Tool Orbit Selectors + Kinetic Mode Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5">
                  {SKILLS_DATA.map((skill, idx) => {
                    const active = idx === selectedIndex;
                    return (
                      <button
                        key={skill.name}
                        type="button"
                        onClick={() => setSelectedIndex(idx)}
                        className={`px-2.5 py-2 lg:py-1.5 min-h-[44px] lg:min-h-0 text-[11px] font-mono uppercase tracking-wider border transition-colors cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap ${
                          active
                            ? 'bg-white text-black border-white font-semibold'
                            : 'bg-black text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: skill.colorHex }}
                        />
                        <span className="truncate">{skill.name.replace('Microsoft ', '')}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Kinetic Controls */}
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsExploded((prev) => !prev)}
                    className={`px-2.5 py-2 lg:py-1.5 min-h-[44px] lg:min-h-0 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider border transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap ${
                      isExploded
                        ? 'bg-emerald-500 text-black border-emerald-400 font-semibold'
                        : 'bg-black text-zinc-300 hover:text-white border-zinc-700'
                    }`}
                  >
                    {isExploded ? (
                      <>
                        <Minimize2 className="w-3 h-3 shrink-0" />
                        <span>Assemble</span>
                      </>
                    ) : (
                      <>
                        <Expand className="w-3 h-3 shrink-0" />
                        <span>Explode 3D</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSpeedMultiplier((s) => (s === 0 ? 1 : s === 1 ? 2 : 0))
                    }
                    className="px-2.5 py-2 lg:py-1.5 min-h-[44px] lg:min-h-0 bg-black hover:bg-zinc-900 border border-zinc-700 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-300 hover:text-white cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    {speedMultiplier === 0 ? (
                      <>
                        <Play className="w-3 h-3 shrink-0" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 shrink-0" />
                        <span>{speedMultiplier}x Orbit</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetCounter((c) => c + 1)}
                    className="px-2.5 py-2 lg:py-1.5 min-h-[44px] lg:min-h-0 bg-black hover:bg-zinc-900 border border-zinc-700 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-300 hover:text-white cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    title="Reset Camera Angle"
                  >
                    <RotateCcw className="w-3 h-3 shrink-0" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Active Tool Practice Readout */}
              <div className="pt-2.5 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="font-mono text-white font-semibold mr-2">
                    {activeSkill.name}:
                  </span>
                  <span className="text-zinc-300 font-light">
                    {activeSkill.practiceTask}
                  </span>
                </div>
                <code className="px-2.5 py-1.5 bg-black border border-zinc-800 font-mono text-[10px] text-emerald-300 overflow-x-auto whitespace-nowrap max-w-full shrink-0">
                  {activeSkill.sampleCommand}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
