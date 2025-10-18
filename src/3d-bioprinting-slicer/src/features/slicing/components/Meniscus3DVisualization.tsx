import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Stack, Chip, IconButton, Tooltip } from '@mui/material';
import {
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../../app/hooks';
import * as THREE from 'three';

interface Meniscus3DVisualizationProps {
  width?: number | '100%';
  height?: number;
  showControls?: boolean;
  showParameters?: boolean;
  autoRotate?: boolean;
}

export default function Meniscus3DVisualization({
  width = '100%',
  height = 180,
  showControls = true,
  showParameters = true,
  autoRotate = true,
}: Meniscus3DVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meniscusRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const baseDistanceRef = useRef<number>(5);
  const autoBaseRotationYRef = useRef<number>(0);

  const physicsParams = useAppSelector((state) => state.slicing.physicsParams);
  const convexMetadata = useAppSelector((state) => state.slicing.convexMetadata);
  const slicingMode = useAppSelector((state) => state.slicing.slicingMode);

  const [isInitialized, setIsInitialized] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [wireframe, setWireframe] = useState(false);

  // Generate meniscus geometry
  const meniscusGeometry = useMemo(() => {
    if (!convexMetadata?.controlPoints || convexMetadata.controlPoints.length === 0) {
      return null;
    }

    const points = convexMetadata.controlPoints;
    const geometry = new THREE.CylinderGeometry(
      physicsParams.printHeadDiameter / 2,
      physicsParams.printHeadDiameter / 2,
      physicsParams.rimStartHeight,
      32,
      1,
      true
    );

    // Apply meniscus deformation
    const positions = geometry.attributes.position;
    const vertices = positions.array as Float32Array;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];

      // Calculate radius from center
      const radius = Math.sqrt(x * x + z * z);
      const normalizedRadius = radius / (physicsParams.printHeadDiameter / 2);

      // Apply meniscus profile using Bézier curve
      let meniscusHeight = 0;
      for (let j = 0; j < points.length; j++) {
        const n = points.length - 1;
        const binomial = (n: number, k: number): number => {
          if (k > n) return 0;
          if (k === 0 || k === n) return 1;
          return binomial(n - 1, k - 1) + binomial(n - 1, k);
        };
        meniscusHeight += points[j][1] * binomial(n, j) * Math.pow(normalizedRadius, j) * Math.pow(1 - normalizedRadius, n - j);
      }

      // Apply the meniscus deformation
      vertices[i + 1] = y + meniscusHeight * 0.1; // Scale factor for visualization
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, [convexMetadata, physicsParams]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);
    sceneRef.current = scene;

    // Camera setup
    const rect = containerRef.current.getBoundingClientRect();
    const initialWidth = typeof width === 'number' ? width : Math.max(1, Math.floor(rect.width));
    const initialHeight = typeof height === 'number' ? height : Math.max(1, Math.floor(rect.height));
    const camera = new THREE.PerspectiveCamera(75, initialWidth / initialHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(initialWidth, initialHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create meniscus mesh if geometry already available
    if (meniscusGeometry) {
      const material = new THREE.MeshPhongMaterial({
        color: 0x8B5CF6,
        transparent: true,
        opacity: 0.8,
        wireframe: wireframe,
      });
      const meniscus = new THREE.Mesh(meniscusGeometry, material);
      meniscus.castShadow = true;
      meniscus.receiveShadow = true;
      scene.add(meniscus);
      meniscusRef.current = meniscus;
    }

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
    scene.add(gridHelper);

    setIsInitialized(true);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height, meniscusGeometry, wireframe]);

  // Fit camera to object utility
  const fitCameraToObject = useMemo(() => {
    return (object: THREE.Object3D) => {
      if (!cameraRef.current || !rendererRef.current) return;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;

      const boundingBox = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      boundingBox.getSize(size);
      boundingBox.getCenter(center);

      const maxSize = Math.max(size.x, size.y, size.z);
      const fitHeightDistance = maxSize / (2 * Math.tan((camera.fov * Math.PI) / 360));
      const fitWidthDistance = fitHeightDistance / (renderer.domElement.width / renderer.domElement.height);
      const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.5; // add margin

      // Place camera along Z axis looking at center; store target and base distance
      const direction = new THREE.Vector3(0, 0, 1);
      const target = center.clone();
      const position = center.clone().add(direction.multiplyScalar(distance));
      camera.position.copy(position);
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.lookAt(target);
      camera.updateProjectionMatrix();

      cameraTargetRef.current.copy(target);
      baseDistanceRef.current = distance;
    };
  }, []);

  // Create mesh lazily when geometry becomes available later
  useEffect(() => {
    if (!isInitialized) return;
    if (!sceneRef.current || !meniscusGeometry) return;
    if (meniscusRef.current) return; // already created

    const material = new THREE.MeshPhongMaterial({
      color: 0x8B5CF6,
      transparent: true,
      opacity: 0.8,
      wireframe: wireframe,
    });
    const meniscus = new THREE.Mesh(meniscusGeometry, material);
    meniscus.castShadow = true;
    meniscus.receiveShadow = true;
    sceneRef.current.add(meniscus);
    meniscusRef.current = meniscus;

    // Fit camera once mesh is available
    fitCameraToObject(meniscus);
  }, [isInitialized, meniscusGeometry, wireframe, fitCameraToObject]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized || !sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    const animate = () => {
      const mesh = meniscusRef.current;
      if (mesh) {
        if (autoRotate) {
          autoBaseRotationYRef.current += 0.01;
        }
        mesh.rotation.x = rotation.x;
        mesh.rotation.y = autoBaseRotationYRef.current + rotation.y;
      }

      // Keep camera at a stable distance from target and always look at target
      const camera = cameraRef.current;
      const target = cameraTargetRef.current;
      const currentDir = camera.position.clone().sub(target).normalize();
      const desiredDistance = baseDistanceRef.current * Math.max(0.5, Math.min(3, zoom));
      camera.position.copy(target.clone().add(currentDir.multiplyScalar(desiredDistance)));
      camera.lookAt(target);

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, autoRotate, rotation, zoom]);

  // Update meniscus when parameters change
  useEffect(() => {
    if (!meniscusGeometry) return;
    if (!meniscusRef.current) {
      // Will be created by lazy effect
      return;
    }
    meniscusRef.current.geometry.dispose();
    meniscusRef.current.geometry = meniscusGeometry;
    // Refit camera to updated geometry
    fitCameraToObject(meniscusRef.current);
  }, [meniscusGeometry, fitCameraToObject]);

  // Keep renderer and camera responsive to container size
  useEffect(() => {
    if (!isInitialized || !containerRef.current || !rendererRef.current || !cameraRef.current) return;
    const container = containerRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    // Initial size to container
    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const targetWidth = Math.max(1, Math.floor(rect.width));
      const targetHeight = Math.max(1, Math.floor(rect.height));
      renderer.setSize(targetWidth, targetHeight, false);
      camera.aspect = targetWidth / targetHeight;
      camera.updateProjectionMatrix();
    };
    setSize();

    const ro = new ResizeObserver(() => {
      setSize();
    });
    ro.observe(container);
    resizeObserverRef.current = ro;

    return () => {
      ro.disconnect();
      if (resizeObserverRef.current === ro) resizeObserverRef.current = null;
    };
  }, [isInitialized]);

  const handleRotate = (axis: 'x' | 'y', direction: 1 | -1) => {
    setRotation(prev => ({
      ...prev,
      [axis]: prev[axis] + direction * 0.1
    }));
  };

  const handleZoom = (direction: 1 | -1) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + direction * 0.1)));
  };

  const handleToggleWireframe = () => {
    setWireframe(prev => !prev);
  };

  const handleFullscreen = () => {
    // TODO: Implement fullscreen functionality
    console.log('Fullscreen not implemented yet');
  };

  if (slicingMode !== 'convex' || !convexMetadata) {
    return null;
  }

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        border: '1px solid', 
        borderColor: 'divider',
        borderRadius: 2 
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle2">
          3D Meniscus Visualization
        </Typography>
        {showControls && (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Rotate Left">
              <IconButton size="small" onClick={() => handleRotate('y', -1)}>
                <RotateLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate Right">
              <IconButton size="small" onClick={() => handleRotate('y', 1)}>
                <RotateRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={() => handleZoom(1)}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={() => handleZoom(-1)}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Wireframe">
              <IconButton size="small" onClick={handleToggleWireframe}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fullscreen">
              <IconButton size="small" onClick={handleFullscreen}>
                <FullscreenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      {/* 3D Canvas */}
      <Box
        ref={containerRef}
        sx={{
          width: width,
          height: height,
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      />

      {/* Parameters Display */}
      {showParameters && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          <Chip 
            label={`Head: ${physicsParams.printHeadDiameter}mm`} 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            label={`Rim: ${physicsParams.rimStartHeight}mm`} 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            label={`Angle: ${physicsParams.contactAngleDeg}°`} 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            label={`Tension: ${physicsParams.surfaceTension}mN/m`} 
            size="small" 
            variant="outlined" 
          />
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Interactive 3D meniscus profile with physics-based deformation
      </Typography>
    </Paper>
  );
}
