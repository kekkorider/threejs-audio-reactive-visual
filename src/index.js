
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  ShaderMaterial,
  Mesh,
  Color,
  Clock,
  SphereGeometry,
  MeshBasicMaterial,
  Vector3,
  Object3D,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  AdditiveBlending,
  Vector2
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'

import { Pane } from 'tweakpane'

class App {
  constructor(container) {
    this.container = document.querySelector(container)

    this.config = {
      particlesCount: 4000,
      bloomStrength: 1.5,
      bloomThreshold: 0.3,
      bloomRadius: 0.5
    }

    this.tick = 0

    this._resizeCb = () => this._onResize()
  }

  init() {
    this._createScene()
    this._createCamera()
    this._createRenderer()
    this._createPostprocess()
    this._createMainGroup()
    this._createIcosahedron()
    this._createSphere()
    this._createSampler()
    this._createParticles()
    this._createClock()
    this._addListeners()
    this._createControls()
    this._createDebugPanel()

    this.renderer.setAnimationLoop(() => {
      this._update()
      this._render()
    })

    console.log(this)
  }

  destroy() {
    this.renderer.dispose()
    this._removeListeners()
  }

  _update() {
    const elapsed = this.clock.getElapsedTime()

    this.mainGroup.rotation.y += 0.002
    this.mainGroup.rotation.z += 0.0012

    this.icosahedron.rotation.x += 0.009

    this.particles.material.uniforms.uTime.value = elapsed
  }

  _render() {
    this.composer.render()
  }

  _createScene() {
    this.scene = new Scene()
  }

  _createCamera() {
    this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
    this.camera.position.set(0, 0, 2)
  }

  _createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true
    })

    this.container.appendChild(this.renderer.domElement)

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
    this.renderer.setClearColor(0x121212)
  }

  _createPostprocess() {
    this.renderPass = new RenderPass(this.scene, this.camera)

    const resolution = new Vector2(this.container.clientWidth, this.container.clientHeight)

    this.bloomPass = new UnrealBloomPass(resolution, 0, 0, 0)
    this.bloomPass.threshold = this.config.bloomThreshold
    this.bloomPass.strength = this.config.bloomStrength
    this.bloomPass.radius = this.config.bloomRadius

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.bloomPass)
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
  }

  _createMainGroup() {
    this.mainGroup = new Group()
    this.scene.add(this.mainGroup)
  }

  _createSphere() {
    const geom = new SphereGeometry(1, 32, 16)

    const mat = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      opacity: 0.1,
      transparent: true
    })

    this.sphere = new Mesh(geom, mat)
  }

  _createSampler() {
    this.sampler = new MeshSurfaceSampler(this.sphere).build()
  }

  _createParticles() {
    const geom = new SphereGeometry(0.01, 16, 16)

    const material = new ShaderMaterial({
      vertexShader: require('./shaders/particle.vertex.glsl'),
      fragmentShader: require('./shaders/particle.fragment.glsl'),
      transparent: true,
      blending: AdditiveBlending,
      uniforms: {
        uTime: {
          value: 0
        },
        uDirection: {
          value: new Vector3()
        },
        uRandom: {
          value: 0
        }
      }
    })

    this.particles = new InstancedUniformsMesh(geom, material, this.config.particlesCount)

    const tempPosition = new Vector3()
    const tempObject = new Object3D()
    const center = new Vector3()

    const directions = []

    for (let i = 0; i < this.config.particlesCount; i++) {
      this.sampler.sample(tempPosition)
      tempObject.position.copy(tempPosition)
      tempObject.scale.setScalar(0.5 + Math.random()*0.5)
      tempObject.updateMatrix()
      this.particles.setMatrixAt(i, tempObject.matrix)

      // Set direction of the particle
      const dir = new Vector3()
      dir.subVectors(tempPosition, center).normalize()
      this.particles.setUniformAt('uDirection', i, dir)
      this.particles.setUniformAt('uRandom', i, Math.random())
    }

    geom.setAttribute('aDirection', new Float32BufferAttribute(directions, 3))
    geom.attributes.aDirection.needsUpdate = true

    this.mainGroup.add(this.particles)
  }

  _createIcosahedron() {
    const geom = new IcosahedronGeometry(0.4, 0)
    const mat = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    })

    this.icosahedron = new Mesh(geom, mat)

    this.mainGroup.add(this.icosahedron)
  }

  _createDebugPanel() {
    this.pane = new Pane()

    /**
     * Scene configuration
     */
    const sceneFolder = this.pane.addFolder({ title: 'Scene' })

    let params = { background: { r: 18, g: 18, b: 18 } }

    sceneFolder.addInput(params, 'background', { label: 'Background Color' }).on('change', e => {
      this.renderer.setClearColor(new Color(e.value.r / 255, e.value.g / 255, e.value.b / 255))
    })

    const ppFolder = this.pane.addFolder({ title: 'Bloom' })

    ppFolder.addInput(this.config, 'bloomStrength', { label: 'Strength', min: 0, max: 3 }).on('change', e => {
      this.bloomPass.strength = e.value
    })

    ppFolder.addInput(this.config, 'bloomThreshold', { label: 'Threshold', min: 0, max: 1 }).on('change', e => {
      this.bloomPass.threshold = e.value
    })

    ppFolder.addInput(this.config, 'bloomRadius', { label: 'Radius', min: 0, max: 1 }).on('change', e => {
      this.bloomPass.radius = e.value
    })
  }

  _createClock() {
    this.clock = new Clock()
  }

  _addListeners() {
    window.addEventListener('resize', this._resizeCb, { passive: true })
  }

  _removeListeners() {
    window.removeEventListener('resize', this._resizeCb, { passive: true })
  }

  _onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
}

const app = new App('#app')
app.init()
