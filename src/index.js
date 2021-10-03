
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
  InstancedMesh,
  Vector3,
  Object3D
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler'

import { Pane } from 'tweakpane'

class App {
  constructor(container) {
    this.container = document.querySelector(container)

    this.config = {
      particlesCount: 1000
    }

    this._resizeCb = () => this._onResize()
  }

  init() {
    this._createScene()
    this._createCamera()
    this._createRenderer()
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
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
  }

  _createScene() {
    this.scene = new Scene()
  }

  _createCamera() {
    this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
    this.camera.position.set(0, 0, 3)
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

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
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
    const geom = new SphereGeometry(0.02, 6, 6)

    const material = new ShaderMaterial({
      vertexShader: require('./shaders/particle.vertex.glsl'),
      fragmentShader: require('./shaders/particle.fragment.glsl'),
      transparent: false
    })

    const particles = new InstancedMesh(geom, material, this.config.particlesCount)

    this.scene.add(particles)

    const tempPosition = new Vector3()
    const tempObject = new Object3D()

    for (let i = 0; i < this.config.particlesCount; i++) {
      this.sampler.sample(tempPosition)
      tempObject.position.copy(tempPosition)
      tempObject.scale.setScalar(0.5 + Math.random()*0.5)
      tempObject.updateMatrix()
      particles.setMatrixAt(i, tempObject.matrix)
      particles.instanceMatrix.needsUpdate = true
    }
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
  }
}

const app = new App('#app')
app.init()
