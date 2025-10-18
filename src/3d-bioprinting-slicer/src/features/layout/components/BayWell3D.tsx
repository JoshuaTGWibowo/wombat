import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useAppSelector } from '../../../app/hooks';

function LoadedModelInWell({ file, fitRadius, fitHeight }: { file: File; fitRadius: number; fitHeight: number }) {
  const [object3D, setObject3D] = useState<THREE.Object3D | null>(null);
  const [origBox, setOrigBox] = useState<THREE.Box3 | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const ext = file.name.toLowerCase().split('.').pop();
    const material = new THREE.MeshStandardMaterial({ color: '#7c4dff', metalness: 0.1, roughness: 0.8 });

    const place = (obj: THREE.Object3D) => {
      const preBox = new THREE.Box3().setFromObject(obj);
      setOrigBox(preBox.clone());
      setObject3D(obj);
    };

    if (ext === 'stl') {
      const loader = new STLLoader();
      loader.load(url, (geometry) => {
        const mesh = new THREE.Mesh(geometry, material);
        place(mesh);
      });
    } else if (ext === 'obj') {
      const loader = new OBJLoader();
      loader.load(url, (obj) => {
        obj.traverse((child) => {
          const anyChild = child as any;
          if (anyChild.isMesh && !anyChild.material) anyChild.material = material;
        });
        place(obj);
      });
    }

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!object3D || !origBox) return;
    const size = new THREE.Vector3();
    origBox.getSize(size);
    const maxXZ = Math.max(size.x, size.z);
    const sxz = maxXZ > 0 ? (2 * fitRadius) / maxXZ : 1;
    const sy = size.y > 0 ? fitHeight / size.y : 1;
    const s = Math.min(sxz, sy);
    object3D.scale.setScalar(s);

    // center XZ and place base on well floor at y=0
    const box = new THREE.Box3().setFromObject(object3D);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const minY = box.min.y;
    object3D.position.x -= center.x;
    object3D.position.z -= center.z;
    object3D.position.y -= minY; // put on the floor
  }, [object3D, origBox, fitRadius, fitHeight]);

  if (!object3D) return null;
  return <primitive object={object3D} />;
}

export default function BayWell3D() {
  const modelFile = useAppSelector((s) => s.model.modelData);
  // Keep all wells same world size; scene is small to fit the cell
  const wellRadius = 10; // world units (consistent well size across bays)
  const wallThickness = 0.7;
  const wellDepth = 6;
  const fitRadius = useMemo(() => wellRadius * 0.8, [wellRadius]);
  const fitHeight = useMemo(() => wellDepth * 0.8, [wellDepth]);

  return (
    <Canvas camera={{ position: [18, 16, 18], fov: 35 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[25, 40, 25]} intensity={0.8} />
      <Suspense fallback={null}>
        {/* Well walls as a hollow cylinder */}
        <group position={[0, 0, 0]}>
          {/* Transparent outer wall (open-ended cylinder, no caps) */}
          <mesh position={[0, wellDepth / 2, 0]}>
            <cylinderGeometry args={[wellRadius, wellRadius, wellDepth, 64, 1, true]} />
            <meshStandardMaterial
              color="#7c4dff"
              metalness={0.1}
              roughness={0.6}
              transparent
              opacity={0.15}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Transparent floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <circleGeometry args={[wellRadius - wallThickness, 64]} />
            <meshStandardMaterial color="#7c4dff" transparent opacity={0.08} depthWrite={false} />
          </mesh>
        </group>

        {/* Model placed inside the well */}
        {modelFile ? (
          <LoadedModelInWell file={modelFile} fitRadius={fitRadius} fitHeight={fitHeight} />
        ) : (
          <mesh position={[0, 0, 0]}> {/* placeholder cube */}
            <boxGeometry args={[fitRadius, Math.min(4, fitHeight), fitRadius]} />
            <meshStandardMaterial color="#7c4dff" />
          </mesh>
        )}
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI * 0.49} />
    </Canvas>
  );
}
