import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { AudioFeatures } from '../types/audio'

interface SpaceShooterProps {
  audioFeatures: AudioFeatures
  isPlaying: boolean
  currentTime: number
  onReady?: () => void
}

const SpaceShooter: React.FC<SpaceShooterProps> = ({
  audioFeatures,
  isPlaying,
  currentTime,
  onReady
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Game state
  const mouseRef = useRef({ x: 0, y: 0 })
  const shipRef = useRef<THREE.Object3D | null>(null)
  const shotsRef = useRef<THREE.Mesh[]>([])
  const starsRef = useRef<THREE.Points | null>(null)
  const mountainsRef = useRef<THREE.Mesh | null>(null)
  const groundRef = useRef<THREE.Mesh | null>(null)
  const shootingStarsRef = useRef<THREE.Mesh[]>([])
  const engineTextureRef = useRef<THREE.Texture | null>(null)

  // Audio-reactive parameters
  const energy = audioFeatures.energy || 0
  const volume = audioFeatures.rms || 0
  const beat = audioFeatures.beat

  useEffect(() => {
    if (!mountRef.current || isInitialized) return

    const init = async () => {
      const container = mountRef.current!
      const width = container.clientWidth
      const height = container.clientHeight

      // Scene setup
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // Camera setup
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 20000)
      camera.position.set(0, 0, 300)
      cameraRef.current = camera

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true, 
        precision: 'mediump' 
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setClearColor(0x000000, 0)
      renderer.sortObjects = true
      container.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Lighting
      const light = new THREE.PointLight(0xffffff, 4, 1000)
      light.position.set(0, 200, -500)
      light.castShadow = false
      scene.add(light)

      // Create starfield
      createStarfield(scene)
      
      // Create mountains
      createMountains(scene)
      
      // Create ground
      createGround(scene)
      
      // Create ship
      await createShip(scene)

      // Event listeners
      const handleMouseMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect()
        mouseRef.current.x = ((event.clientX - rect.left) / width) * 2 - 1
        mouseRef.current.y = -((event.clientY - rect.top) / height) * 2 + 1
      }

      const handleClick = () => {
        if (shipRef.current) {
          createShot(scene)
        }
      }

      const handleWheel = (event: WheelEvent) => {
        if (cameraRef.current) {
          const z = cameraRef.current.position.z
          const delta = event.deltaY * 0.1
          const newZ = Math.max(-130, Math.min(-30, z + delta))
          cameraRef.current.position.z = newZ
        }
      }

      const handleResize = () => {
        const newWidth = container.clientWidth
        const newHeight = container.clientHeight
        
        if (cameraRef.current) {
          cameraRef.current.aspect = newWidth / newHeight
          cameraRef.current.updateProjectionMatrix()
        }
        
        if (rendererRef.current) {
          rendererRef.current.setSize(newWidth, newHeight)
        }
      }

      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('click', handleClick)
      container.addEventListener('wheel', handleWheel)
      window.addEventListener('resize', handleResize)

      // Animation loop
      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate)
        
        if (scene && camera && renderer) {
          updateScene()
          renderer.render(scene, camera)
        }
      }

      animate()
      setIsInitialized(true)
      if (onReady) onReady()

      // Cleanup function
      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('click', handleClick)
        container.removeEventListener('wheel', handleWheel)
        window.removeEventListener('resize', handleResize)
        
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current)
        }
        
        if (renderer && container) {
          container.removeChild(renderer.domElement)
        }
      }
    }

    init()
  }, [isInitialized, onReady])

  const createStarfield = (scene: THREE.Scene) => {
    const geometry = new THREE.BufferGeometry()
    const vertices = []
    const total = 400
    const spread = 8000

    for (let i = 0; i < total; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * spread
      
      vertices.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius / 10,
        Math.random() * spread - spread / 2
      )
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    
    const material = new THREE.PointsMaterial({
      size: 64,
      color: 0xffffff,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      transparent: false,
      depthTest: false,
    })

    const starfield = new THREE.Points(geometry, material)
    starfield.position.set(0, 1200, -1000)
    scene.add(starfield)
    starsRef.current = starfield
  }

  const createMountains = (scene: THREE.Scene) => {
    const geometry = new THREE.PlaneGeometry(10000, 1000, 128, 32)
    const material = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      side: THREE.BackSide,
      transparent: false,
      depthTest: false,
    })

    const mountains = new THREE.Mesh(geometry, material)
    mountains.position.set(0, -500, -3000)
    mountains.rotation.x = Math.PI / 2 + 1.35
    scene.add(mountains)
    mountainsRef.current = mountains
  }

  const createGround = (scene: THREE.Scene) => {
    const geometry = new THREE.PlaneGeometry(4000, 2000, 128, 64)
    const material = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 0.3,
      depthTest: false,
      wireframe: true,
    })

    const ground = new THREE.Mesh(geometry, material)
    ground.position.set(0, -300, -1000)
    ground.rotation.x = 29.8 * Math.PI / 180
    scene.add(ground)
    groundRef.current = ground
  }

  const createShip = async (scene: THREE.Scene) => {
    // Create ship group
    const shipGroup = new THREE.Object3D()
    
    // Try to load the head SVG as texture
    let headTexture: THREE.Texture | null = null
    try {
      const textureLoader = new THREE.TextureLoader()
      headTexture = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load('/assets/irlhotpersonhead.svg', resolve, undefined, reject)
      })
    } catch (error) {
      console.log('Could not load head texture, using default ship')
    }

    if (headTexture) {
      // Use head as ship - make it larger and more prominent
      const geometry = new THREE.PlaneGeometry(30, 30)
      const material = new THREE.MeshBasicMaterial({
        map: headTexture,
        transparent: true,
        side: THREE.DoubleSide,
        color: 0xFF8C00 // Dark orange to match the theme
      })
      const headMesh = new THREE.Mesh(geometry, material)
      headMesh.position.set(0, 0, 300)
      shipGroup.add(headMesh)
    } else {
      // Create default ship geometry
      const geometry = new THREE.ConeGeometry(10, 20, 8)
      const material = new THREE.MeshPhongMaterial({
        color: 0x0099ff,
        transparent: false,
        depthTest: true,
      })
      const shipMesh = new THREE.Mesh(geometry, material)
      shipMesh.position.set(0, 0, 300)
      shipMesh.rotation.x = Math.PI / 2
      shipGroup.add(shipMesh)
    }

    // Add engine glow effect
    const engineGeometry = new THREE.CylinderGeometry(0, 4, 8, 32, 32, true)
    const engineMaterial = new THREE.MeshBasicMaterial({
      color: 0x0099ff,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthTest: true,
    })
    const engine = new THREE.Mesh(engineGeometry, engineMaterial)
    engine.position.set(0, 4, 307)
    engine.rotation.x = Math.PI / 2
    shipGroup.add(engine)

    scene.add(shipGroup)
    shipRef.current = shipGroup
  }

  const createShot = (scene: THREE.Scene) => {
    if (!shipRef.current) return

    const shipPosition = shipRef.current.position
    const color = new THREE.Color()
    color.setHSL(Math.random(), 1, 0.5)

    const geometry = new THREE.CylinderGeometry(0.3, 0, 20, 10)
    const material = new THREE.MeshBasicMaterial({
      color,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: false,
      depthTest: true,
    })

    const shot = new THREE.Mesh(geometry, material)
    shot.position.set(shipPosition.x, shipPosition.y, shipPosition.z + 290)
    shot.rotation.set(11 * Math.PI / 180, 0, 0)

    scene.add(shot)
    shotsRef.current.push(shot)
  }

  const createShootingStar = (scene: THREE.Scene) => {
    const geometry = new THREE.CylinderGeometry(0, 2, 120, 10)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffcc,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: false,
      depthTest: true,
    })

    const randx = Math.random() * 2000 - 1000
    const cylinder = new THREE.Mesh(geometry, material)
    cylinder.position.set(randx, 300, 200)
    cylinder.rotation.set(Math.PI / 2, 0, 0)

    scene.add(cylinder)
    shootingStarsRef.current.push(cylinder)
  }

  const updateScene = () => {
    if (!sceneRef.current || !cameraRef.current) return

    const scene = sceneRef.current
    const mouse = mouseRef.current

    // Update starfield - more dramatic movement
    if (starsRef.current) {
      starsRef.current.position.x = -(mouse.x * 1000)
      starsRef.current.rotation.z = mouse.x * 0.1
    }

    // Update mountains - more dramatic movement
    if (mountainsRef.current) {
      mountainsRef.current.position.x = -(mouse.x * 2000)
      // Animate mountain vertices for wave effect
      const geometry = mountainsRef.current.geometry
      const positions = geometry.attributes.position.array as Float32Array
      const time = Date.now() * 0.0005
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const y = positions[i + 1]
        positions[i + 2] = Math.sin(x * 0.01 + time) * 50 * (1 + energy)
      }
      geometry.attributes.position.needsUpdate = true
    }

    // Update ground - more dramatic movement
    if (groundRef.current) {
      groundRef.current.position.x = -(mouse.x * 4000)
      // Animate ground vertices
      const geometry = groundRef.current.geometry
      const positions = geometry.attributes.position.array as Float32Array
      const time = Date.now() * 0.001
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const y = positions[i + 1]
        positions[i + 2] = Math.sin(x * 0.02 + time) * 30 * (1 + volume)
      }
      geometry.attributes.position.needsUpdate = true
    }

    // Update ship - more responsive movement
    if (shipRef.current) {
      shipRef.current.position.x = mouse.x * 50
      shipRef.current.position.y = -mouse.y * 40 - 4
      shipRef.current.rotation.z = mouse.x * 0.1

      // Audio-reactive ship movement
      if (beat) {
        shipRef.current.scale.setScalar(1.1)
      } else {
        shipRef.current.scale.setScalar(1.0)
      }
    }

    // Update shots
    for (let i = shotsRef.current.length - 1; i >= 0; i--) {
      const shot = shotsRef.current[i]
      shot.position.z -= 6

      if (shot.position.z < -300) {
        scene.remove(shot)
        shotsRef.current.splice(i, 1)
      }
    }

    // Update shooting stars
    for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
      const star = shootingStarsRef.current[i]
      star.position.z -= 20

      if (star.position.z < -3000) {
        scene.remove(star)
        shootingStarsRef.current.splice(i, 1)
      }
    }

    // Create new shooting stars randomly
    if (Math.random() > 0.99) {
      createShootingStar(scene)
    }

    // Auto-shoot on beat
    if (beat && Math.random() > 0.7) {
      createShot(scene)
    }

    // Update camera position based on audio
    if (cameraRef.current) {
      const targetZ = -40 + volume * 20
      cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * 0.1
    }
  }

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full relative"
      style={{ 
        background: 'linear-gradient(to bottom, #000000 0%, #1a1a2e 50%, #16213e 100%)',
        cursor: 'crosshair'
      }}
    />
  )
}

export default SpaceShooter 