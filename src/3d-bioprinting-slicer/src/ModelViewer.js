import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

function LoadedModel({ object, interactiveScale, autoRotate }) {
  const group = useRef();

  const { centered, autoScale } = useMemo(() => {
    if (!object) return { centered: null, autoScale: 1 };
    const bbox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    const target = 8; // target size in scene units
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = target / maxDim;

    const wrapper = new THREE.Group();
    const cloned = object.clone(true);
    cloned.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        if (!c.material) c.material = new THREE.MeshStandardMaterial({ color: 0x8aa4b0 });
      }
    });
    wrapper.add(cloned);
    wrapper.position.set(-center.x, -center.y, -center.z);
    return { centered: wrapper, autoScale: scale };
  }, [object]);

  useFrame(() => {
    if (group.current && autoRotate) {
      group.current.rotation.y += 0.002;
    }
  });

  if (!object) return null;

  const finalScale = autoScale * interactiveScale;

  return (
    <group ref={group} scale={finalScale}>
      {centered && <primitive object={centered} />}
    </group>
  );
}

export default function ModelViewer({ file, onInfo, className, scale: interactiveScale = 1, autoRotate = true }) {
  const [object, setObject] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    let cancelled = false;

    async function load() {
      try {
        const ext = file.name.split('.').pop().toLowerCase();
        let loader;
        if (ext === 'stl') {
          const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
          loader = new STLLoader();
          const geom = await loader.loadAsync(url);
          const mat = new THREE.MeshStandardMaterial({ color: 0x3d6d7a, metalness: 0.2, roughness: 0.7 });
          const mesh = new THREE.Mesh(geom, mat);
          if (!cancelled) setObject(mesh);
        } else if (ext === 'obj') {
          const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
          loader = new OBJLoader();
          const obj = await loader.loadAsync(url);
          if (!cancelled) setObject(obj);
        } else if (ext === 'glb' || ext === 'gltf') {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          loader = new GLTFLoader();
          const gltf = await loader.loadAsync(url);
          if (!cancelled) setObject(gltf.scene || gltf.scenes?.[0]);
        } else {
          throw new Error('Unsupported format. Use STL, OBJ, GLB, or GLTF.');
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || 'Failed to load model');
      }
    }
    load();
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Report dimensions once the object is set
  useEffect(() => {
    if (!object || !onInfo) return;
    const bbox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    onInfo({ width: size.x, height: size.y, depth: size.z });
  }, [object, onInfo]);

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {error && (
        <div style={{ position: 'absolute', top: 12, left: 12, color: 'white', zIndex: 2, background: 'rgba(0,0,0,0.5)', padding: '6px 10px', borderRadius: 6 }}>
          {error}
        </div>
      )}
      <Canvas style={{ background: '#0b0b10', borderRadius: 16 }} shadows camera={{ position: [12, 8, 12], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[8, 10, 5]} intensity={1} castShadow />
        <Environment preset="city" />
        <gridHelper args={[40, 40, '#555', '#333' ]} />
        <LoadedModel object={object} interactiveScale={interactiveScale} autoRotate={autoRotate} />
        <OrbitControls enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  );
}
