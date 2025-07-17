import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { AudioFeatures } from '../types/audio';

interface ThreeHeartPackingProps {
  audioFeatures: AudioFeatures;
  isPlaying: boolean;
  currentTime: number;
}

interface HeadData {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  originalPosition: THREE.Vector3;
  color: THREE.Color;
  size: number;
  bounceCount: number;
  pulse: number;
  rotationSpeed: THREE.Vector3;
}

// Utility to create a radial gradient canvas for glow
function createGlowTexture(color: string = '#a020f0') {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, color + '88'); // semi-transparent center
  gradient.addColorStop(0.5, color + '44');
  gradient.addColorStop(1, color + '00'); // fully transparent edge
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const ThreeHeartPacking: React.FC<ThreeHeartPackingProps> = ({ audioFeatures, isPlaying, currentTime }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const headsRef = useRef<HeadData[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  
  // Store latest audio features for use in animation loop
  const latestAudioFeatures = useRef(audioFeatures);
  const latestIsPlaying = useRef(isPlaying);
  
  // Update refs when props change
  useEffect(() => {
    latestAudioFeatures.current = audioFeatures;
  }, [audioFeatures]);
  
  useEffect(() => {
    latestIsPlaying.current = isPlaying;
  }, [isPlaying]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Texture loader
    textureLoaderRef.current = new THREE.TextureLoader();

    // Create heads
    createHeads();

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      updateHeads();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Create head meshes with SVG texture
  const createHeads = () => {
    if (!sceneRef.current || !textureLoaderRef.current) return;

    const scene = sceneRef.current;
    const textureLoader = textureLoaderRef.current;

    // Remove any old heads from previous mount
    headsRef.current.forEach((head) => {
      scene.remove(head.mesh);
    });
    headsRef.current = [];

    // Load the SVG texture
    textureLoader.load('/assets/irlhotpersonhead.svg', (texture) => {
      const colors = [
        new THREE.Color(0xff0080), // Hot Pink
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0xff00ff), // Magenta
        new THREE.Color(0x0080ff), // Blue
        new THREE.Color(0x8000ff), // Purple
        new THREE.Color(0xff8000), // Orange
        new THREE.Color(0x80ff00), // Lime
        new THREE.Color(0xff0080), // Hot Pink (repeat)
      ];
      const NUM_HEARTS = 70;
      const heads: HeadData[] = [];
      const glowTexture = createGlowTexture('#a020f0');
      for (let i = 0; i < NUM_HEARTS; i++) {
        const size = 0.22 + Math.random() * 0.32;
        const color = colors[i % colors.length].clone();
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshLambertMaterial({
          map: texture,
          color: color,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        const glowMaterial = new THREE.SpriteMaterial({
          map: glowTexture,
          color: color.getHex(),
          transparent: true,
          opacity: 0.45
        });
        const glow = new THREE.Sprite(glowMaterial);
        glow.scale.set(size * 2.2, size * 2.2, 1);
        mesh.add(glow);
        // Spread hearts all over the panel
        const x = (Math.random() - 0.5) * 6;
        const y = (Math.random() - 0.5) * 4;
        const z = (Math.random() - 0.5) * 2;
        mesh.position.set(x, y, z);
        // Gentle, floaty initial velocity
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.02
        );
        const headData: HeadData = {
          mesh,
          velocity,
          originalPosition: new THREE.Vector3(x, y, z),
          color: color,
          size,
          bounceCount: 0,
          pulse: 0,
          rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
          )
        };
        heads.push(headData);
        scene.add(mesh);
      }
      headsRef.current = heads;
    });
  };

  // Update head physics and music reactivity
  const updateHeads = () => {
    if (!headsRef.current.length) return;
    const t = performance.now() * 0.001;
    const energy = latestAudioFeatures.current.energy || 0;
    const beat = latestAudioFeatures.current.beat;
    const bass = latestAudioFeatures.current.spectralCentroid || 0;
    headsRef.current.forEach((head, i) => {
      const { mesh, velocity, color, size, rotationSpeed } = head;
      // Gentle gravity
      velocity.y -= 0.002 + energy * 0.002;
      // Gentle sinusoidal drifting (like butterflies)
      const driftX = Math.sin(t * 0.7 + i) * 0.003 + Math.cos(t * 0.5 + i * 1.3) * 0.002;
      const driftZ = Math.cos(t * 0.6 + i * 0.7) * 0.003;
      velocity.x += driftX;
      velocity.z += driftZ;
      // On beat, add a soft upward/lateral impulse
      if (latestIsPlaying.current && beat) {
        velocity.y += 0.03 + Math.random() * 0.02;
        velocity.x += (Math.random() - 0.5) * 0.01;
      }
      // Air resistance for smoothness
      velocity.x *= 0.97;
      velocity.y *= 0.97;
      velocity.z *= 0.97;
      // Bounds (gentle bounce)
      const bounds = { x: 3.5, y: 2.5, z: 1.5 };
      if (Math.abs(mesh.position.x) > bounds.x) {
        mesh.position.x = Math.sign(mesh.position.x) * bounds.x;
        velocity.x *= -0.5;
      }
      if (mesh.position.y < -bounds.y) {
        mesh.position.y = -bounds.y;
        velocity.y *= -0.5;
      }
      if (mesh.position.y > bounds.y) {
        mesh.position.y = bounds.y;
        velocity.y *= -0.5;
      }
      if (Math.abs(mesh.position.z) > bounds.z) {
        mesh.position.z = Math.sign(mesh.position.z) * bounds.z;
        velocity.z *= -0.5;
      }
      // Update position with lerp for smoothness
      mesh.position.add(velocity);
      // Music reactivity (gentle pulse)
      if (latestIsPlaying.current) {
        const pulseScale = 1 + energy * 0.15;
        mesh.scale.setScalar(pulseScale);
        const intensity = 0.6 + bass * 0.3;
        (mesh.material as THREE.MeshLambertMaterial).color.setRGB(
          color.r * intensity,
          color.g * intensity,
          color.b * intensity
        );
        // Gentle rotation
        mesh.rotation.x += rotationSpeed.x * (0.5 + energy * 0.5);
        mesh.rotation.y += rotationSpeed.y * (0.5 + energy * 0.5);
        mesh.rotation.z += rotationSpeed.z * (0.5 + energy * 0.5);
      } else {
        mesh.scale.setScalar(1);
        (mesh.material as THREE.MeshLambertMaterial).color.copy(color);
      }
      // Natural rotation
      mesh.rotation.x += 0.002;
      mesh.rotation.y += 0.0015;
    });
  };

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
};

export default ThreeHeartPacking; 