import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AudioFeatures } from '../types/audio';

interface ThreeCubeDanceProps {
  audioFeatures: AudioFeatures;
  isPlaying: boolean;
  currentTime: number;
}

// Custom RoundedBoxGeometry class (exact copy from CodePen)
class RoundedBoxGeometry extends THREE.BufferGeometry {
  constructor(width: number, height: number, depth: number, radius: number, radiusSegments: number) {
    super();
    (this as any).type = 'RoundedBoxGeometry';

    // Validate params
    radiusSegments = !isNaN(radiusSegments) ? Math.max(1, Math.floor(radiusSegments)) : 1;
    width = !isNaN(width) ? width : 1;
    height = !isNaN(height) ? height : 1;
    depth = !isNaN(depth) ? depth : 1;
    radius = !isNaN(radius) ? radius : 0.15;
    radius = Math.min(radius, Math.min(width, Math.min(height, Math.min(depth))) / 2);

    const edgeHalfWidth = width / 2 - radius;
    const edgeHalfHeight = height / 2 - radius;
    const edgeHalfDepth = depth / 2 - radius;

    (this as any).parameters = {
      width, height, depth, radius, radiusSegments
    };

    // Calculate vertices count
    const rs1 = radiusSegments + 1;
    const totalVertexCount = (rs1 * radiusSegments + 1) << 3;

    // Make buffers
    const positions = new THREE.BufferAttribute(new Float32Array(totalVertexCount * 3), 3);
    const normals = new THREE.BufferAttribute(new Float32Array(totalVertexCount * 3), 3);

    // Some vars
    const cornerVerts: THREE.Vector3[][] = [];
    const cornerNormals: THREE.Vector3[][] = [];
    const normal = new THREE.Vector3();
    const vertex = new THREE.Vector3();
    const vertexPool: THREE.Vector3[] = [];
    const normalPool: THREE.Vector3[] = [];
    const indices: number[] = [];

    const lastVertex = rs1 * radiusSegments;
    const cornerVertNumber = rs1 * radiusSegments + 1;

    doVertices();
    doFaces();
    doCorners();
    doHeightEdges();
    doWidthEdges();
    doDepthEdges();

    // Calculate vert positions
    function doVertices() {
      // Corner offsets
      const cornerLayout = [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, 1, -1),
        new THREE.Vector3(-1, 1, -1),
        new THREE.Vector3(-1, 1, 1),
        new THREE.Vector3(1, -1, 1),
        new THREE.Vector3(1, -1, -1),
        new THREE.Vector3(-1, -1, -1),
        new THREE.Vector3(-1, -1, 1)
      ];

      // Corner holder
      for (let j = 0; j < 8; j++) {
        cornerVerts.push([]);
        cornerNormals.push([]);
      }

      // Construct 1/8 sphere
      const PIhalf = Math.PI / 2;
      const cornerOffset = new THREE.Vector3(edgeHalfWidth, edgeHalfHeight, edgeHalfDepth);

      for (let y = 0; y <= radiusSegments; y++) {
        const v = y / radiusSegments;
        const va = v * PIhalf;
        const cosVa = Math.cos(va);
        const sinVa = Math.sin(va);

        if (y == radiusSegments) {
          vertex.set(0, 1, 0);
          const vert = vertex.clone().multiplyScalar(radius).add(cornerOffset);
          cornerVerts[0].push(vert);
          vertexPool.push(vert);
          const norm = vertex.clone();
          cornerNormals[0].push(norm);
          normalPool.push(norm);
          continue;
        }

        for (let x = 0; x <= radiusSegments; x++) {
          const u = x / radiusSegments;
          const ha = u * PIhalf;

          vertex.x = cosVa * Math.cos(ha);
          vertex.y = sinVa;
          vertex.z = cosVa * Math.sin(ha);

          const vert = vertex.clone().multiplyScalar(radius).add(cornerOffset);
          cornerVerts[0].push(vert);
          vertexPool.push(vert);

          const norm = vertex.clone().normalize();
          cornerNormals[0].push(norm);
          normalPool.push(norm);
        }
      }

      // Distribute corner verts
      for (let i = 1; i < 8; i++) {
        for (let j = 0; j < cornerVerts[0].length; j++) {
          const vert = cornerVerts[0][j].clone().multiply(cornerLayout[i]);
          cornerVerts[i].push(vert);
          vertexPool.push(vert);

          const norm = cornerNormals[0][j].clone().multiply(cornerLayout[i]);
          cornerNormals[i].push(norm);
          normalPool.push(norm);
        }
      }
    }

    // Weave corners
    function doCorners() {
      const flips = [true, false, true, false, false, true, false, true];
      const lastRowOffset = rs1 * (radiusSegments - 1);

      for (let i = 0; i < 8; i++) {
        const cornerOffset = cornerVertNumber * i;

        for (let v = 0; v < radiusSegments - 1; v++) {
          const r1 = v * rs1;
          const r2 = (v + 1) * rs1;

          for (let u = 0; u < radiusSegments; u++) {
            const u1 = u + 1;
            const a = cornerOffset + r1 + u;
            const b = cornerOffset + r1 + u1;
            const c = cornerOffset + r2 + u;
            const d = cornerOffset + r2 + u1;

            if (!flips[i]) {
              indices.push(a, b, c, b, d, c);
            } else {
              indices.push(a, c, b, b, c, d);
            }
          }
        }

        for (let u = 0; u < radiusSegments; u++) {
          const a = cornerOffset + lastRowOffset + u;
          const b = cornerOffset + lastRowOffset + u + 1;
          const c = cornerOffset + lastVertex;

          if (!flips[i]) {
            indices.push(a, b, c);
          } else {
            indices.push(a, c, b);
          }
        }
      }
    }

    // Plates
    function doFaces() {
      // Top
      let a = lastVertex;
      let b = lastVertex + cornerVertNumber;
      let c = lastVertex + cornerVertNumber * 2;
      let d = lastVertex + cornerVertNumber * 3;

      indices.push(a, b, c, a, c, d);

      // Bottom
      a = lastVertex + cornerVertNumber * 4;
      b = lastVertex + cornerVertNumber * 5;
      c = lastVertex + cornerVertNumber * 6;
      d = lastVertex + cornerVertNumber * 7;

      indices.push(a, c, b, a, d, c);

      // Left
      a = 0;
      b = cornerVertNumber;
      c = cornerVertNumber * 4;
      d = cornerVertNumber * 5;

      indices.push(a, c, b, b, c, d);

      // Right
      a = cornerVertNumber * 2;
      b = cornerVertNumber * 3;
      c = cornerVertNumber * 6;
      d = cornerVertNumber * 7;

      indices.push(a, c, b, b, c, d);

      // Front
      a = radiusSegments;
      b = radiusSegments + cornerVertNumber * 3;
      c = radiusSegments + cornerVertNumber * 4;
      d = radiusSegments + cornerVertNumber * 7;

      indices.push(a, b, c, b, d, c);

      // Back
      a = radiusSegments + cornerVertNumber;
      b = radiusSegments + cornerVertNumber * 2;
      c = radiusSegments + cornerVertNumber * 5;
      d = radiusSegments + cornerVertNumber * 6;

      indices.push(a, c, b, b, c, d);
    }

    // Weave edges
    function doHeightEdges() {
      for (let i = 0; i < 4; i++) {
        const cOffset = i * cornerVertNumber;
        const cRowOffset = 4 * cornerVertNumber + cOffset;
        const needsFlip = (i & 1) === 1;

        for (let u = 0; u < radiusSegments; u++) {
          const u1 = u + 1;
          const a = cOffset + u;
          const b = cOffset + u1;
          const c = cRowOffset + u;
          const d = cRowOffset + u1;

          if (!needsFlip) {
            indices.push(a, b, c, b, d, c);
          } else {
            indices.push(a, c, b, b, c, d);
          }
        }
      }
    }

    function doDepthEdges() {
      const cStarts = [0, 2, 4, 6];
      const cEnds = [1, 3, 5, 7];

      for (let i = 0; i < 4; i++) {
        const cStart = cornerVertNumber * cStarts[i];
        const cEnd = cornerVertNumber * cEnds[i];
        const needsFlip = i <= 1;

        for (let u = 0; u < radiusSegments; u++) {
          const urs1 = u * rs1;
          const u1rs1 = (u + 1) * rs1;

          const a = cStart + urs1;
          const b = cStart + u1rs1;
          const c = cEnd + urs1;
          const d = cEnd + u1rs1;

          if (needsFlip) {
            indices.push(a, c, b, b, c, d);
          } else {
            indices.push(a, b, c, b, d, c);
          }
        }
      }
    }

    function doWidthEdges() {
      const end = radiusSegments - 1;
      const cStarts = [0, 1, 4, 5];
      const cEnds = [3, 2, 7, 6];
      const needsFlip = [false, true, true, false];

      for (let i = 0; i < 4; i++) {
        const cStart = cStarts[i] * cornerVertNumber;
        const cEnd = cEnds[i] * cornerVertNumber;

        for (let u = 0; u <= end; u++) {
          const a = cStart + radiusSegments + u * rs1;
          const b = cStart + (u != end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1);
          const c = cEnd + radiusSegments + u * rs1;
          const d = cEnd + (u != end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1);

          if (!needsFlip[i]) {
            indices.push(a, b, c, b, d, c);
          } else {
            indices.push(a, c, b, b, c, d);
          }
        }
      }
    }

    // Fill buffers
    let index = 0;
    for (let i = 0; i < vertexPool.length; i++) {
      positions.setXYZ(index, vertexPool[i].x, vertexPool[i].y, vertexPool[i].z);
      normals.setXYZ(index, normalPool[i].x, normalPool[i].y, normalPool[i].z);
      index++;
    }

    this.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    this.setAttribute('position', positions);
    this.setAttribute('normal', normals);
  }
}

const ThreeCubeDance: React.FC<ThreeCubeDanceProps> = ({ audioFeatures, isPlaying, currentTime: _currentTime }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const oddsRef = useRef<THREE.Mesh[]>([]);
  const evensRef = useRef<THREE.Mesh[]>([]);
  const animationRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef2 = useRef(new THREE.Vector2());
  const isUserInteractingRef = useRef(false);
  
  // Store audio features for reactivity
  const latestAudioFeatures = useRef(audioFeatures);

  useEffect(() => {
    latestAudioFeatures.current = audioFeatures;
  }, [audioFeatures]);

  const init = useCallback(() => {
    if (!mountRef.current || isInitializedRef.current) return;
    console.log('🎯 ThreeCubeDance initializing...');
    
    isInitializedRef.current = true;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 1, 1000);
    camera.position.set(0, 30, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Add OrbitControls for interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Listen for user interaction events
    controls.addEventListener('start', () => { isUserInteractingRef.current = true; });
    controls.addEventListener('end', () => { isUserInteractingRef.current = false; });

    // Vibrant materials
    const lightMaterialProps = {
      color: '#00ff88', // Bright cyan
      emissive: '#00ff88',
      emissiveIntensity: 0.3,
    };

    const darkMaterialProps = {
      color: '#ff0088', // Bright magenta
      emissive: '#ff0088',
      emissiveIntensity: 0.3,
    };

    const darkMaterial = new THREE.MeshPhongMaterial(darkMaterialProps);
    const lightMaterial = new THREE.MeshPhongMaterial(lightMaterialProps);

    // Dynamic lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const light = new THREE.PointLight(0x00ffff, 2, 1000);
    light.position.set(0, 20, 0);
    light.castShadow = true;
    scene.add(light);

    const light1 = new THREE.PointLight(0xff00ff, 2, 100);
    light1.position.set(20, 20, 0);
    light1.castShadow = true;
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffff00, 2, 1000);
    light2.position.set(-20, 20, 0);
    scene.add(light2);

    // Create boxes with special irlhotpersonhead cubes
    const gridSize = 20; // Reduced for testing
    const boxSize = 1;
    const roundedGeometry = new RoundedBoxGeometry(boxSize, boxSize, boxSize, 0.04, 4);

    // Load irlhotpersonhead texture
    const textureLoader = new THREE.TextureLoader();
    console.log('🎯 Loading irlhotpersonhead.svg texture...');

    // Create a canvas to convert SVG to texture
    const createHeadTexture = () => {
      return new Promise<THREE.Texture>((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
        
        if (ctx) {
          // Load the actual SVG content
          const img = new Image();
          img.onload = () => {
            // Clear canvas
            ctx.clearRect(0, 0, 256, 256);
            // Draw the SVG image centered
            ctx.drawImage(img, 0, 0, 256, 256);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            resolve(texture);
          };
          // Use the actual SVG file content
          img.src = '/assets/irlhotpersonhead.svg';
        } else {
          // Fallback texture if canvas context fails
          const fallbackTexture = new THREE.Texture();
          resolve(fallbackTexture);
        }
      });
    };

    // Create head texture asynchronously
    let headTexture: THREE.Texture | null = null;
    const updateHeadCubes = () => {
      if (headTexture) {
        const allCubes = [...oddsRef.current, ...evensRef.current];
        allCubes.forEach(cube => {
          if (cube.userData.isHeadCube) {
            // Update existing head cubes with the loaded texture
            const specialMaterial = new THREE.MeshPhongMaterial({
              color: cube.userData.isRedCube ? '#FF4444' : '#4444FF', // Red or blue
              map: headTexture, // Apply the head texture
              transparent: true,
              opacity: 1.0,
              alphaTest: 0.05,
              side: THREE.DoubleSide,
              shininess: 120,
              specular: '#ffffff'
            });
            cube.material = specialMaterial;
            cube.material.needsUpdate = true;
          }
        });
        console.log('🎯 Updated all head cubes with texture');
      }
    };
    
    createHeadTexture().then(texture => {
      headTexture = texture;
      console.log('🎯 Head texture loaded successfully');
      updateHeadCubes(); // Update existing cubes with the texture
    }).catch(err => {
      console.error('🎯 Failed to load head texture:', err);
    });

    console.log('🎲 Creating cubes...');
    let headCubeCount = 0;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Create cube with rounded corners
        const roundedGeometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
        const radius = 0.1;
        const position = roundedGeometry.attributes.position;
        
        for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex++) {
          const x = position.getX(vertexIndex);
          const y = position.getY(vertexIndex);
          const z = position.getZ(vertexIndex);
          
          // Apply rounded corners
          const newX = Math.sign(x) * Math.max(Math.abs(x) - radius, 0);
          const newY = Math.sign(y) * Math.max(Math.abs(y) - radius, 0);
          const newZ = Math.sign(z) * Math.max(Math.abs(z) - radius, 0);
          
          position.setXYZ(vertexIndex, newX, newY, newZ);
        }
        
        position.needsUpdate = true;
        roundedGeometry.computeVertexNormals();
        
        // All cubes will be head cubes with SVG texture, alternating colors
        const isRedCube = (i + j) % 2 === 0;
        
        if (isRedCube) {
          headCubeCount++;
        }
        
        let box: THREE.Mesh;
        
        if (headTexture) {
          // Create material with head texture for all cubes
          const specialMaterial = new THREE.MeshPhongMaterial({
            color: isRedCube ? '#FF4444' : '#4444FF', // Red or blue
            map: headTexture, // Apply the head texture
            transparent: true,
            opacity: 1.0,
            alphaTest: 0.05,
            side: THREE.DoubleSide,
            shininess: 120,
            specular: '#ffffff'
          });
          box = new THREE.Mesh(roundedGeometry, specialMaterial);
          box.userData.isHeadCube = true;
          box.userData.isRedCube = isRedCube;
        } else {
          // Fallback material if texture not loaded
          const material = new THREE.MeshPhongMaterial({ 
            color: isRedCube ? '#FF4444' : '#4444FF' // Red or blue
          });
          box = new THREE.Mesh(roundedGeometry, material);
          box.userData.isHeadCube = true;
          box.userData.isRedCube = isRedCube;
        }
        box.position.set(
          (i * boxSize) + gridSize * -0.5,
          0, // Start at ground level
          (j * boxSize) + gridSize * -0.5
        );
        box.castShadow = true;
        box.receiveShadow = true;
        // Add user data for interaction
        box.userData = { 
          isHeadCube: true, 
          isRedCube,
          originalY: 0,
          index: i * gridSize + j,
          originalScale: 1.0
        };
        if ((i + j) % 2 === 0) {
          evensRef.current.push(box);
        } else {
          oddsRef.current.push(box);
        }
        scene.add(box);
      }
    }
    console.log(`🎲 Created ${gridSize * gridSize} cubes (${evensRef.current.length} evens, ${oddsRef.current.length} odds, all with SVG head texture)`);

    // Start animations
    animateOdds();
    gsap.delayedCall(1.5, animateEvens);

    // Animation loop with audio reactivity
    let frameCount = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      frameCount++;
      
      // Log every 60 frames (once per second at 60fps)
      if (frameCount % 60 === 0) {
        console.log('🎬 Three.js animation frame:', frameCount);
      }
      
      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Audio reactivity
      const audioFeatures = latestAudioFeatures.current;
      const energy = audioFeatures?.energy || 0;
      const volume = audioFeatures?.rms || 0;
      const beat = audioFeatures?.beat || false;
      
      // React to audio
      if (isPlaying && (energy > 0.01 || volume > 0.01)) {
        // Only override camera if user is NOT interacting
        if (!isUserInteractingRef.current) {
          const cameraDistance = 30 + energy * 10; // More noticeable movement
          camera.position.y = cameraDistance * 0.7;
          camera.position.z = cameraDistance;
        }
        
        // More visible camera rotation on beat - but only if not interacting
        if (beat && !isUserInteractingRef.current) {
          camera.rotation.y += 0.02; // More noticeable rotation
        }
        
        // Extremely mild light pulsing on beat
        if (beat) {
          light.intensity = 2.1;
          light1.intensity = 2.1;
          light2.intensity = 2.1;
        } else {
          light.intensity = 2;
          light1.intensity = 2;
          light2.intensity = 2;
        }

        // More visible cube reactivity to music
        const allCubes = [...oddsRef.current, ...evensRef.current];
        allCubes.forEach((cube, index) => {
          const baseScale = cube.userData.originalScale || 1.0;
          const scale = baseScale + volume * 0.3; // More noticeable scaling
          cube.scale.setScalar(scale);
          
          // Special behavior for head cubes
          if (cube.userData.isHeadCube) {
            // Enhanced music reactivity for head cubes
            if (beat) {
              // Special beat animation for head cubes
              cube.rotation.y += 0.15; // Faster rotation on beat
              cube.rotation.x += 0.08;
              cube.rotation.z += 0.05;
              
              // Pulse effect on beat
              const pulseScale = baseScale * 1.4 + volume * 0.5;
              cube.scale.setScalar(pulseScale);
              
              // Enhanced glow on beat - use color-specific emissive
              (cube.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.6;
              if (cube.userData.isRedCube) {
                (cube.material as THREE.MeshPhongMaterial).emissive.setHex(0xff4444);
              } else {
                (cube.material as THREE.MeshPhongMaterial).emissive.setHex(0x4444ff);
              }
            } else {
              // Normal state for head cubes
              cube.rotation.y += 0.02; // Gentle continuous rotation
              (cube.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2;
              if (cube.userData.isRedCube) {
                (cube.material as THREE.MeshPhongMaterial).emissive.setHex(0xff4444);
              } else {
                (cube.material as THREE.MeshPhongMaterial).emissive.setHex(0x4444ff);
              }
            }
            
            // Add subtle floating motion for head cubes
            const time = Date.now() * 0.001;
            cube.position.y = Math.sin(time + index * 0.5) * 0.3;
          } else {
            // Regular cube behavior
            if (beat) {
              cube.rotation.x += 0.05;
              cube.rotation.z += 0.03;
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    console.log('✅ ThreeCubeDance initialized successfully');
  }, []);

  const animateOdds = useCallback(() => {
    animateBoxes(oddsRef.current, animateOdds);
  }, []);

  const animateEvens = useCallback(() => {
    animateBoxes(evensRef.current, animateEvens);
  }, []);

  const animateBoxes = useCallback((list: THREE.Mesh[], callback: () => void) => {
    for (let i = 0; i < list.length; i++) {
      const element = list[i];

      // Dynamic audio-reactive bounce height
      const audioFeatures = latestAudioFeatures.current;
      const energy = audioFeatures?.energy || 0;
      const volume = audioFeatures?.rms || 0;
      const beat = audioFeatures?.beat || false;
      
      // Base bounce height increases with music energy
      let bounceHeight = 3.0 + energy * 4.0; // Much larger bounces
      
      // Add extra height on beat
      if (beat) {
        bounceHeight += 2.0;
      }
      
      // Add volume-based variation
      bounceHeight += volume * 3.0;
      
      // Ensure minimum bounce for visual appeal
      bounceHeight = Math.max(bounceHeight, 2.0);
      
      // Vary timing based on cube position for wave effect
      const delay = (i / list.length) * 0.5;
      const duration = 1.2 + (energy * 0.8); // Faster with more energy

      gsap.to(element.position, {
        y: bounceHeight,
        duration: duration,
        delay: delay,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });

      // More dynamic rotation
      const rotationSpeed = 0.8 + (energy * 0.4);
      gsap.to(element.rotation, {
        z: `-=${Math.PI * 2}`,
        y: `+=${Math.PI * 2}`,
        duration: rotationSpeed,
        delay: delay,
        ease: "power2.inOut",
        repeat: -1
      });
    }

    // Shorter delay for more responsive animation
    gsap.delayedCall(2.0, callback);
  }, []);

  useEffect(() => {
    init();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      isInitializedRef.current = false;
    };
  }, [init]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse interaction
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mouseRef2.current.x = mouseRef.current.x;
      mouseRef2.current.y = mouseRef.current.y;
      
      // Set user interaction flag
      isUserInteractingRef.current = true;
      
      // Reset interaction flag after a delay
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 2000);
    };

    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current || !sceneRef.current || !cameraRef.current) return;
      
      // Set user interaction flag
      isUserInteractingRef.current = true;
      
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
      const allCubes = [...oddsRef.current, ...evensRef.current];
      const intersects = raycasterRef.current.intersectObjects(allCubes);
      
      if (intersects.length > 0) {
        const clickedCube = intersects[0].object as THREE.Mesh;
        console.log('🎯 Clicked cube:', clickedCube.userData);
        
        if (clickedCube.userData.isHeadCube) {
          // Special animation for head cubes: rapid spin and glow
          gsap.to(clickedCube.rotation, {
            y: clickedCube.rotation.y + Math.PI * 2,
            x: clickedCube.rotation.x + Math.PI * 2,
            duration: 0.8,
            ease: "power2.inOut"
          });
          const originalEmissive = (clickedCube.material as THREE.MeshPhongMaterial).emissive.clone();
          // Use white glow for click effect
          (clickedCube.material as THREE.MeshPhongMaterial).emissive.setHex(0xffffff);
          (clickedCube.material as THREE.MeshPhongMaterial).emissiveIntensity = 1.2;
          setTimeout(() => {
            (clickedCube.material as THREE.MeshPhongMaterial).emissive.copy(originalEmissive);
            (clickedCube.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2;
          }, 1000);
        } else {
          // Make clicked cube bounce extra high
          gsap.to(clickedCube.position, {
            y: clickedCube.position.y + 10,
            duration: 0.5,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
          });
          // Change color temporarily
          const originalColor = (clickedCube.material as THREE.MeshPhongMaterial).color.clone();
          (clickedCube.material as THREE.MeshPhongMaterial).color.setHex(0xffffff);
          setTimeout(() => {
            (clickedCube.material as THREE.MeshPhongMaterial).color.copy(originalColor);
          }, 1000);
        }
      }
      
      // Reset interaction flag after a delay
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 3000);
    };

    if (mountRef.current) {
      mountRef.current.addEventListener('mousemove', handleMouseMove);
      mountRef.current.addEventListener('click', handleClick);
    }

    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeEventListener('click', handleClick);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
};

export default ThreeCubeDance; 