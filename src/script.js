import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()
const pictureTexture = textureLoader.load('./picture-1.png')

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Materials
    particlesMaterial.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 18)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setClearColor('#181818')
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)


//2D canvas
const displacement = {}
displacement.canvas = document.createElement('canvas')
displacement.canvas.width = '128'
displacement.canvas.height = '128'
displacement.canvas.style.width = '256px'
displacement.canvas.style.height = '256px'
displacement.canvas.style.left = 0
displacement.canvas.style.top = 0
displacement.canvas.style.zIndex = 10
displacement.canvas.style.position = 'fixed'
document.body.append(displacement.canvas)

displacement.contex = displacement.canvas.getContext('2d')
displacement.contex.fillRect(0,0,displacement.canvas.width,displacement.canvas.height)

//Interactive plane
displacement.interactivePlane = new THREE.Mesh(new THREE.PlaneGeometry(10,10), new THREE.MeshBasicMaterial({wireframe:true, side:THREE.DoubleSide}))
scene.add(displacement.interactivePlane)
displacement.interactivePlane.visible = false

//RayCaster
displacement.rayCaster = new THREE.Raycaster()
displacement.screenCursor = new THREE.Vector2(9999,9999)
displacement.canvasCursor = new THREE.Vector2(9999,9999) 
displacement.preCanvasCursor = new THREE.Vector2(9999,9999) 

window.addEventListener("pointermove", (event) =>{
    displacement.screenCursor.x = (event.clientX / sizes.width) *2 -1
    displacement.screenCursor.y = -(event.clientY / sizes.height) *2 +1
})

displacement.texture = new THREE.CanvasTexture(displacement.canvas)

displacement.glowImage = new Image()
displacement.glowImage.src = './glow.png'
/**
 * Particles
 */
const particlesGeometry = new THREE.PlaneGeometry(10, 10, 128, 128)

const particlesMaterial = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms:
    {
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
        uTexture:new THREE.Uniform(pictureTexture),
        uCanvasTexture: new THREE.Uniform(displacement.texture)
    }
})
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
const angle = new Float32Array(particlesGeometry.attributes.position.count)
for(let i=0; i<angle.length; i++){
    angle[i] = Math.random() * 2 * Math.PI
}
particles.geometry.setAttribute('aAngle',new THREE.BufferAttribute(angle,1))
scene.add(particles)
/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()
    //raycaster
    displacement.rayCaster.setFromCamera(displacement.screenCursor,camera)
    const intersectObject = displacement.rayCaster.intersectObject(displacement.interactivePlane)
    const glowSize = displacement.canvas.width * 0.25
    if(intersectObject.length){
        const uv = intersectObject[0].uv
        displacement.canvasCursor.x = uv.x * displacement.canvas.width
        displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height
    }
    displacement.contex.globalCompositeOperation = 'source-over'
    displacement.contex.globalAlpha = 0.02
    displacement.contex.fillRect(0,0,displacement.canvas.width,displacement.canvas.height)
    const speedAlpha =  Math.min(displacement.preCanvasCursor.distanceTo(displacement.canvasCursor) * 0.1 , 1)
    displacement.preCanvasCursor.copy(displacement.canvasCursor)

    displacement.contex.globalCompositeOperation = 'lighten'
    displacement.contex.globalAlpha = speedAlpha
    displacement.contex.drawImage(
        displacement.glowImage,
        displacement.canvasCursor.x - glowSize/2,
        displacement.canvasCursor.y - glowSize/2,
        glowSize,
        glowSize)
    displacement.texture.needsUpdate = true

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()