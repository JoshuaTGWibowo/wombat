import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { wellTypeDims, setSelectedBay } from '../slice/layoutSlice';

function WellMesh({ radius, depth, wall, selected }: { radius: number; depth: number; wall: number; selected: boolean }) {
  const color = selected ? '#a78bfa' : '#7c4dff';
  const wallOpacity = selected ? 0.22 : 0.15;
  const floorOpacity = selected ? 0.12 : 0.08;
  return (
    <group>
      {/* Transparent outer wall (open-ended cylinder) */}
      <mesh position={[0, depth / 2, 0]}>
        <cylinderGeometry args={[radius, radius, depth, 48, 1, true]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.6} transparent opacity={wallOpacity} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Transparent floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[radius - wall, 48]} />
        <meshStandardMaterial color={color} transparent opacity={floorOpacity} depthWrite={false} />
      </mesh>
    </group>
  );
}

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
      loader.load(url, (geometry) => place(new THREE.Mesh(geometry, material)));
    } else if (ext === 'obj') {
      const loader = new OBJLoader();
      loader.load(url, (obj) => {
        obj.traverse((child) => { const anyChild = child as any; if (anyChild.isMesh && !anyChild.material) anyChild.material = material; });
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
    const box = new THREE.Box3().setFromObject(object3D);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const minY = box.min.y;
    object3D.position.x -= center.x;
    object3D.position.z -= center.z;
    object3D.position.y -= minY;
  }, [object3D, origBox, fitRadius, fitHeight]);

  if (!object3D) return null;
  return <primitive object={object3D} />;
}

export default function BayGrid3D() {
  const dispatch = useAppDispatch();
  const wellType = useAppSelector((s) => s.layout.wellType);
  const selectedId = useAppSelector((s) => s.layout.selectedBayId);
  const soloSelected = useAppSelector((s) => s.layout.soloSelected3D ?? false);
  const dims = wellTypeDims(wellType);
  const modelFile = useAppSelector((s) => s.model.modelData);

  // Well geometry constants (uniform across bays)
  const radius = 10; // world units
  const depth = 6;
  const wall = 0.7;
  const pitch = radius * 2 + 6; // spacing between well centers

  const gridWidth = (dims.cols - 1) * pitch;
  const gridHeight = (dims.rows - 1) * pitch;
  const startX = -gridWidth / 2;
  const startZ = -gridHeight / 2;

  // Camera distance heuristic based on grid extent
  const diag = Math.sqrt(gridWidth * gridWidth + gridHeight * gridHeight) + radius * 4;
  const camPos = useMemo<[number, number, number]>(() => {
    const d = Math.max(30, diag * 0.9);
    return [d, d * 0.7, d];
  }, [diag]);

  return (
    <Canvas camera={{ position: camPos, fov: 45 }} style={{ width: 880, height: 880 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[25, 40, 25]} intensity={0.8} />
      <Suspense fallback={null}>
        {/* Render the grid of wells */}
        {(soloSelected && selectedId ? [selectedId - 1] : Array.from({ length: dims.count }, (_, i) => i)).map((i) => {
          const row = Math.floor(i / dims.cols);
          const col = i % dims.cols;
          const x = startX + col * pitch;
          const z = startZ + row * pitch;
          const id = i + 1;
          const isSelected = id === selectedId;
          return (
            <group key={id} position={[x, 0, z]} onClick={() => dispatch(setSelectedBay(id))}>
              <WellMesh radius={radius} depth={depth} wall={wall} selected={isSelected} />
              {isSelected && modelFile && (
                <LoadedModelInWell file={modelFile} fitRadius={radius * 0.8} fitHeight={depth * 0.8} />
              )}
            </group>
          );
        })}
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI * 0.49} />
    </Canvas>
  );
}
