import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

interface Disco5everThreeProps {
  // Props for future audio reactivity
}

const Disco5everThree: React.FC<Disco5everThreeProps> = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const discoGroupRef = useRef<THREE.Group | null>(null)
  const lightsRef = useRef<THREE.SpotLight[]>([])

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 4
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.offsetWidth, mountRef.current.offsetHeight)
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Silver mirror tile material
    const mirrorMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      metalness: 1.0,
      roughness: 0.2
    })

    // Create disco ball with larger mirror tiles
    const discoGroup = new THREE.Group()
    discoGroupRef.current = discoGroup
    const radius = 2
    const tileSize = 0.2

    for (let phi = 0; phi < Math.PI; phi += tileSize / radius) {
      for (let theta = 0; theta < 2 * Math.PI; theta += tileSize / radius) {
        const x = radius * Math.sin(phi) * Math.cos(theta)
        const y = radius * Math.cos(phi)
        const z = radius * Math.sin(phi) * Math.sin(theta)

        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(tileSize, tileSize, 0.05),
          mirrorMaterial
        )
        tile.position.set(x, y, z)
        tile.lookAt(0, 0, 0)
        discoGroup.add(tile)
      }
    }

    scene.add(discoGroup)

    // Ambient light for subtle fill
    scene.add(new THREE.AmbientLight(0x222222))

    // Bright colorful rotating lights
    const colors = [0xff00ff, 0x00ffff, 0xffff00, 0xff0000, 0x00ff00, 0xff00ff, 0x00ffff, 0xffff00, 0xff0000, 0x00ff00, 
                    0xff00ff, 0x00ffff, 0xffff00, 0xff0000, 0x00ff00, 0xff00ff, 0x00ffff, 0xffff00, 0xffffff, 0x00ff00]
    const lights: THREE.SpotLight[] = []

    colors.forEach((color, i) => {
      const angle = (i / colors.length) * Math.PI * 2
      const spot = new THREE.SpotLight(color, 50, 100, Math.PI / 6, 1)
      spot.position.set(Math.sin(angle) * 6, Math.cos(angle) * 6, Math.cos(angle) * 6)
      spot.target.position.set(0, 0, 0)
      scene.add(spot)
      scene.add(spot.target)
      lights.push(spot)
    })
    lightsRef.current = lights

    // Animation function
    const animate = () => {
      requestAnimationFrame(animate)
      
      if (discoGroupRef.current) {
        discoGroupRef.current.rotation.y += 0.01
      }

      lightsRef.current.forEach((light, i) => {
        const t = performance.now() * 0.0007 + i
        light.position.x = Math.cos(t) * 6
        light.position.z = Math.sin(t) * 6
        light.intensity = Math.tan(-10 * t) * 50
        
        if (discoGroupRef.current) {
          discoGroupRef.current.rotation.z += Math.cos(t) * 0.001
        }
      })

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = mountRef.current.offsetWidth / mountRef.current.offsetHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(mountRef.current.offsetWidth, mountRef.current.offsetHeight)
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full"
      style={{ background: '#000' }}
    />
  )
}

export default Disco5everThree 