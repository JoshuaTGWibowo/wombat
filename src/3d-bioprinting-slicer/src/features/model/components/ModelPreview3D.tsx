import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Box, Paper, Stack, Button } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setModelDimensions } from '../slice/modelSlice';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

function LoadedModel({ file, targetDims, orientation }: { file: File; targetDims?: { width?: number; height?: number; depth?: number } | null; orientation: { rx: number; ry: number; rz: number } }) {
  const [object3D, setObject3D] = useState<THREE.Object3D | null>(null);
  const [originalSize, setOriginalSize] = useState<THREE.Vector3 | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const ext = file.name.toLowerCase().split('.').pop();

    const material = new THREE.MeshStandardMaterial({ color: '#7c4dff', metalness: 0.1, roughness: 0.8 });

    const addObject = (obj: THREE.Object3D) => {
      // Compute bounding box BEFORE any scaling to capture real model units
      const preBox = new THREE.Box3().setFromObject(obj);
      const preSize = new THREE.Vector3();
      preBox.getSize(preSize);
      setOriginalSize(preSize.clone());
      // Dispatch auto-detected dimensions (mm assumed as per UI)
      const height = Number(preSize.y.toFixed(4));
      const width = Number(preSize.x.toFixed(4));
      const depth = Number(preSize.z.toFixed(4));
      if (Number.isFinite(height) && Number.isFinite(width) && Number.isFinite(depth)) {
        dispatch(setModelDimensions({ height, width, depth }));
      }
      // Apply initial placement; scaling will be handled below effect
      setObject3D(obj);
    };

    if (ext === 'stl') {
      const loader = new STLLoader();
      loader.load(url, (geometry) => {
        const mesh = new THREE.Mesh(geometry, material);
        addObject(mesh);
      });
    } else if (ext === 'obj') {
      const loader = new OBJLoader();
      loader.load(url, (obj) => {
        obj.traverse((child) => {
          // Assign a basic material if none
          const anyChild = child as any;
          if (anyChild.isMesh && !anyChild.material) {
            anyChild.material = material;
          }
        });
        addObject(obj);
      });
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, dispatch]);

  // Recompute scaling and placement when target dimensions or object change
  useEffect(() => {
    if (!object3D || !originalSize) return;
    const desiredW = Math.max(1e-6, targetDims?.width ?? originalSize.x);
    const desiredH = Math.max(1e-6, targetDims?.height ?? originalSize.y);
    const desiredD = Math.max(1e-6, targetDims?.depth ?? originalSize.z);

    const scaleX = desiredW / originalSize.x;
    const scaleY = desiredH / originalSize.y;
    const scaleZ = desiredD / originalSize.z;

    object3D.scale.set(scaleX, scaleY, scaleZ);

    // Apply orientation before recentering
    object3D.rotation.set(orientation.rx, orientation.ry, orientation.rz);

    // After scaling, recenter X/Z and set base to Y=0
    const box = new THREE.Box3().setFromObject(object3D);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const minY = box.min.y;
    object3D.position.x -= center.x;
    object3D.position.z -= center.z;
    object3D.position.y -= minY;
  }, [object3D, originalSize, targetDims?.width, targetDims?.height, targetDims?.depth, orientation.rx, orientation.ry, orientation.rz]);

  if (!object3D) return null;
  return <primitive object={object3D} />;
}

export default function ModelPreview3D() {
  const modelFile = useAppSelector((s) => s.model.modelData);
  // Adaptive grid size; recompute when model dimensions change
  const dims = useAppSelector((s) => s.model.dimensions);
  const layerHeight = useAppSelector((s) => s.slicing.layerHeight);
  const printHeadDiameter = useAppSelector((s) => s.slicing.physicsParams.printHeadDiameter);
  const dispatch = useAppDispatch();
  const [orientation, setOrientation] = useState<{ rx: number; ry: number; rz: number }>({ rx: 0, ry: 0, rz: 0 });
  const gridConfig = useMemo(() => {
    const width = dims?.width ?? 1;
    const depth = dims?.depth ?? 1;
    const maxFootprint = Math.max(width, depth);
    const sizeRaw = Math.max(2, Math.ceil(1.2 * maxFootprint));
    // choose a nice cell size around size/20 from {1,2,5,10}
    const approx = sizeRaw / 20;
    const candidates = [1, 2, 5, 10, 20, 50];
    let cell = candidates[0];
    for (const c of candidates) {
      if (approx <= c) { cell = c; break; }
    }
    // Cap grid size to avoid excessive draw calls
    const size = Math.min(200, sizeRaw);
    // If capped hard, also coarsen cell a bit for perf
    if (sizeRaw > 200) {
      const next = candidates.find((c) => c >= cell * 2);
      if (next) cell = next;
    }
    return { size, cell };
  }, [dims]);
  const axesLen = useMemo(() => Math.max(1, Math.min(25, Math.round(gridConfig.size * 0.4))), [gridConfig.size]);
  const headRadius = useMemo(() => Math.max(0.1, (printHeadDiameter ?? 0) / 2), [printHeadDiameter]);
  const layerY = useMemo(() => Math.max(0, layerHeight ?? 0), [layerHeight]);
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 64, right: 340, bottom: 0 }}>
      <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          {modelFile ? (
            <LoadedModel file={modelFile} targetDims={dims} orientation={orientation} />
          ) : (
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#7c4dff" />
            </mesh>
          )}
          <Grid
            args={[gridConfig.size, gridConfig.size]}
            cellSize={gridConfig.cell}
            infiniteGrid={gridConfig.size <= 200}
            fadeDistance={Math.min(100, Math.max(20, gridConfig.size))}
            position={[0, 0, 0]}
          />
          <axesHelper args={[axesLen]} />
          {/* Print head footprint (XZ circle at Y=0) */}
          {Number.isFinite(headRadius) && headRadius > 0 && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}> 
              <ringGeometry args={[headRadius * 0.98, headRadius, 64]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
            </mesh>
          )}
          {/* Model footprint vs ring fit (centered rectangle in XZ) */}
          {dims?.width && dims?.depth && Number.isFinite(headRadius) && headRadius > 0 && (
            <group>
              {(() => {
                // Calculate actual footprint after orientation transforms
                const originalW = Math.max(0, dims.width as number);
                const originalD = Math.max(0, dims.depth as number);
                const originalH = Math.max(0, dims.height as number);
                
                // Create a temporary box to calculate rotated dimensions
                const tempBox = new THREE.Box3();
                const tempSize = new THREE.Vector3(originalW, originalH, originalD);
                tempBox.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), tempSize);
                
                // Apply the same rotation as the model
                const rotationMatrix = new THREE.Matrix4();
                rotationMatrix.makeRotationFromEuler(new THREE.Euler(orientation.rx, orientation.ry, orientation.rz));
                
                // Transform the bounding box corners
                const corners = [
                  new THREE.Vector3(tempBox.min.x, tempBox.min.y, tempBox.min.z),
                  new THREE.Vector3(tempBox.max.x, tempBox.min.y, tempBox.min.z),
                  new THREE.Vector3(tempBox.min.x, tempBox.max.y, tempBox.min.z),
                  new THREE.Vector3(tempBox.max.x, tempBox.max.y, tempBox.min.z),
                  new THREE.Vector3(tempBox.min.x, tempBox.min.y, tempBox.max.z),
                  new THREE.Vector3(tempBox.max.x, tempBox.min.y, tempBox.max.z),
                  new THREE.Vector3(tempBox.min.x, tempBox.max.y, tempBox.max.z),
                  new THREE.Vector3(tempBox.max.x, tempBox.max.y, tempBox.max.z),
                ];
                
                const rotatedCorners = corners.map(corner => corner.applyMatrix4(rotationMatrix));
                
                // Find the XZ footprint after rotation
                let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
                rotatedCorners.forEach(corner => {
                  minX = Math.min(minX, corner.x);
                  maxX = Math.max(maxX, corner.x);
                  minZ = Math.min(minZ, corner.z);
                  maxZ = Math.max(maxZ, corner.z);
                });
                
                const actualW = maxX - minX;
                const actualD = maxZ - minZ;
                const halfW = actualW / 2;
                const halfD = actualD / 2;
                const requiredRadius = Math.sqrt(halfW * halfW + halfD * halfD);
                const fits = requiredRadius <= headRadius + 1e-6;
                
                // Debug logging (remove in production)
                console.log('Shadow calculation:', {
                  original: { w: originalW, d: originalD, h: originalH },
                  orientation: { rx: orientation.rx, ry: orientation.ry, rz: orientation.rz },
                  actual: { w: actualW, d: actualD },
                  requiredRadius,
                  headRadius,
                  fits
                });
                const fillColor = fits ? '#10b981' : '#ef4444';
                const lineColor = fits ? '#059669' : '#b91c1c';
                return (
                  <group>
                    {/* translucent footprint fill */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}> 
                      <planeGeometry args={[actualW, actualD, 1, 1]} />
                      <meshBasicMaterial color={fillColor} transparent opacity={0.08} depthWrite={false} />
                    </mesh>
                    {/* rectangle outline */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}> 
                      <planeGeometry args={[actualW, actualD, 1, 1]} />
                      <meshBasicMaterial color={lineColor} wireframe />
                    </mesh>
                  </group>
                );
              })()}
            </group>
          )}
          {/* Layer preview plane at current layer height */}
          {Number.isFinite(layerY) && layerY > 0 && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, layerY, 0]}> 
              <planeGeometry args={[gridConfig.size, gridConfig.size, 1, 1]} />
              <meshBasicMaterial color="#60a5fa" transparent opacity={0.1} />
            </mesh>
          )}
        </Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={Math.max(5, gridConfig.cell * 2)}
          maxDistance={Math.max(50, gridConfig.size * 2)}
          maxPolarAngle={Math.PI * 0.49}
        />
      </Canvas>
      {/* Orientation controls overlay */}
      <Paper elevation={0} sx={{ position: 'absolute', left: 80, top: 12, p: 1, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => setOrientation((o) => ({ ...o, ry: o.ry + Math.PI / 2 }))}>Rotate Y +90°</Button>
          <Button size="small" variant="outlined" onClick={() => setOrientation((o) => ({ ...o, ry: o.ry - Math.PI / 2 }))}>Rotate Y -90°</Button>
          <Button size="small" variant="outlined" onClick={() => setOrientation((o) => ({ ...o, rx: o.rx + Math.PI / 2 }))}>Flip X</Button>
          <Button size="small" variant="outlined" onClick={() => setOrientation((o) => ({ ...o, rz: o.rz + Math.PI / 2 }))}>Flip Z</Button>
        </Stack>
      </Paper>
    </Box>
  );
}


