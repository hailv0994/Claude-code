import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppStore } from '../../store/appStore';

interface Props {
  showWeld?: boolean;
}

export default function WeldModel3D({ showWeld = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { analysis } = useAppStore();

  const thickness = analysis?.material?.thickness_mm ?? 12;
  const jointType = analysis?.joint?.type ?? 'butt';
  const grooveAngle = analysis?.joint?.groove_angle_deg ?? 60;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 600;
    const H = mount.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(80, 60, 120);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(50, 80, 60);
    dir.castShadow = true;
    scene.add(dir);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x7c8fa6, metalness: 0.6, roughness: 0.4 });
    const weldMat = new THREE.MeshStandardMaterial({ color: 0xff8c00, metalness: 0.3, roughness: 0.6, emissive: showWeld ? 0xff4400 : 0x000000, emissiveIntensity: showWeld ? 0.2 : 0 });
    const hazMat = new THREE.MeshStandardMaterial({ color: 0xffcc44, metalness: 0.4, roughness: 0.5, transparent: true, opacity: 0.7 });

    const plateW = 60;
    const plateL = 100;
    const t = thickness;
    const gap = 2;

    if (jointType === 'butt' || jointType === 'butt joint') {
      // Two plates side by side
      const geo = new THREE.BoxGeometry(plateW, t, plateL);
      const p1 = new THREE.Mesh(geo, steelMat);
      const p2 = new THREE.Mesh(geo, steelMat);
      p1.position.set(-(plateW / 2 + gap / 2), 0, 0);
      p2.position.set(plateW / 2 + gap / 2, 0, 0);
      p1.castShadow = true;
      p2.castShadow = true;
      scene.add(p1, p2);

      if (showWeld) {
        const weldW = gap + 8;
        const weldGeo = new THREE.BoxGeometry(weldW, t, plateL);
        const weld = new THREE.Mesh(weldGeo, weldMat);
        weld.position.set(0, 0, 0);
        scene.add(weld);

        const hazGeo = new THREE.BoxGeometry(weldW + 6, t, plateL);
        const haz = new THREE.Mesh(hazGeo, hazMat);
        haz.position.set(0, 0, 0);
        scene.add(haz);
      }
    } else {
      // T-joint / fillet
      const baseGeo = new THREE.BoxGeometry(plateL, t, plateW);
      const webGeo = new THREE.BoxGeometry(t, plateW * 0.8, plateL);
      const base = new THREE.Mesh(baseGeo, steelMat);
      const web = new THREE.Mesh(webGeo, steelMat);
      base.position.set(0, -plateW * 0.4, 0);
      web.position.set(0, 0, 0);
      base.castShadow = true;
      web.castShadow = true;
      scene.add(base, web);

      if (showWeld) {
        const fGeo = new THREE.CylinderGeometry(6, 8, plateL, 4);
        fGeo.rotateX(Math.PI / 2);
        const fillet1 = new THREE.Mesh(fGeo, weldMat);
        const fillet2 = new THREE.Mesh(fGeo, weldMat);
        fillet1.position.set(t / 2 + 3, -plateW * 0.4 + t / 2, 0);
        fillet2.position.set(-(t / 2 + 3), -plateW * 0.4 + t / 2, 0);
        scene.add(fillet1, fillet2);
      }
    }

    // Grid helper
    const grid = new THREE.GridHelper(200, 20, 0xcccccc, 0xe8e8e8);
    grid.position.y = -t / 2 - 0.5;
    scene.add(grid);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [thickness, jointType, grooveAngle, showWeld]);

  return <div ref={mountRef} className="w-full h-full" />;
}
