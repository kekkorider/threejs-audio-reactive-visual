
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
  Vector2,
  BackSide,
  AudioListener,
  Audio,
  AudioLoader,
  AudioAnalyser
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass'

import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'

import { Pane } from 'tweakpane'
import { gsap } from 'gsap'

class App {
  constructor(container) {
    this.container = document.querySelector(container)

    this.config = {
      backgroundColor: new Color('#0d021f'),
      cameraSpeed: 0,
      cameraRadius: 4.5,
      particlesSpeed: 0,
      particlesCount: 3000,
      bloomStrength: 1.45,
      bloomThreshold: 0.34,
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
    this._createBigSphere()
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

    const audioBtn = document.querySelector('#audio-btn')
    audioBtn
      .addEventListener('click', () => {
        const tl = new gsap.timeline({
          onComplete: () => {
            this._loadMusic()
          }
        })

        tl
          .set('#audio-btn-icon', { transition: 'none' })
          .to('#audio-btn-label', { '--clip': 1, duration: 0.6 })
          .to('#audio-btn-icon', { rotation: 140, scale: 0.8, duration: 0.5 }, '<0.05')
          .to('#audio-btn-icon', { opacity: 0, duration: 0.65 }, '<')
          .to(audioBtn, { width: 66, ease: 'back.inOut(2)', duration: 0.9}, '<0.2')
      }, { once: true })

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

    this.bigSphere.rotation.z -= 0.003
    this.bigSphere.rotation.y -= 0.001

    this.particles.material.uniforms.uTime.value += 0.05*this.config.particlesSpeed

    this.bigSphere.material.uniforms.uTime.value = elapsed

    if (!!this.analyser) {
      const d = this.analyser.getFrequencyData()

      const o = d.reduce((prev, curr) => prev + curr, 0)

      this.particles.material.uniforms.uInfluence.value = o / d.length * 0.03

      this.icosahedron.scale.setScalar(1 - o / d.length * 0.006)

      this.tick += 0.01
      this.camera.position.x = Math.sin(this.tick*0.63)*2.7*this.config.cameraSpeed
      this.camera.position.y = Math.sin(this.tick*0.84)*2.15*this.config.cameraSpeed
      this.camera.position.z = Math.cos(this.tick*0.39)*this.config.cameraRadius*this.config.cameraSpeed
      this.camera.lookAt(this.scene.position)
    }
  }

  _render() {
    this.composer.render()
  }

  _createScene() {
    this.scene = new Scene()
  }

  _createCamera() {
    this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
    this.camera.position.set(0, 0, this.config.cameraRadius)
  }

  _createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true
    })

    this.container.appendChild(this.renderer.domElement)

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
    this.renderer.setClearColor(this.config.backgroundColor)
  }

  _createPostprocess() {
    this.renderPass = new RenderPass(this.scene, this.camera)

    const resolution = new Vector2(this.container.clientWidth, this.container.clientHeight)

    this.bloomPass = new UnrealBloomPass(resolution, 0, 0, 0)
    this.bloomPass.threshold = this.config.bloomThreshold
    this.bloomPass.strength = this.config.bloomStrength
    this.bloomPass.radius = this.config.bloomRadius

    this.afterimagePass = new AfterimagePass()
    this.afterimagePass.uniforms.damp.value = 0.6

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.afterimagePass)
    this.composer.addPass(this.bloomPass)
  }

  _createControls() {
    if (process.env.NODE_ENV === 'production') return
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
  }

  _createMainGroup() {
    this.mainGroup = new Group()
    this.scene.add(this.mainGroup)
  }

  _createSphere() {
    const geom = new SphereGeometry(2, 32, 16)

    const mat = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      opacity: 0.1,
      transparent: true
    })

    this.sphere = new Mesh(geom, mat)
  }

  _createBigSphere() {
    const material = new ShaderMaterial({
      fragmentShader: require('./shaders/background.fragment.glsl'),
      vertexShader: require('./shaders/background.vertex.glsl'),
      side: BackSide,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
      uniforms: {
        uTime: { value: 0 }
      }
    })

    const geom = new SphereGeometry(6.5, 120, 60)

    this.bigSphere = new Mesh(geom, material)

    this.scene.add(this.bigSphere)
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
        uTime: { value: 1 },
        uDirection: { value: new Vector3() },
        uRandom: { value: 0 },
        uInfluence: { value: 0 }
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
    const geom = new IcosahedronGeometry(1.2, 0)
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
    // const sceneFolder = this.pane.addFolder({ title: 'Scene' })

    // sceneFolder.addInput(this.config, 'backgroundColor', { label: 'Background Color' }).on('change', e => {
    //   this.renderer.setClearColor(new Color(e.value.r, e.value.g, e.value.b))
    // })

    // sceneFolder.addInput(this.particles.material.uniforms.uInfluence, 'value', { label: 'Influence', min: 0, max: 1 })
    // sceneFolder.addInput(this.config, 'particlesSpeed', { label: 'Speed', min: 0, max: 1 })

    /**
     * Bloom
     */
    const bloomFolder = this.pane.addFolder({ title: 'Bloom effect Options', expanded: false })

    bloomFolder.addInput(this.bloomPass, 'enabled', { label: 'Enabled' })
    bloomFolder.addInput(this.bloomPass, 'strength', { label: 'Strength', min: 0, max: 3 })
    bloomFolder.addInput(this.bloomPass, 'threshold', { label: 'Threshold', min: 0, max: 1 })
    bloomFolder.addInput(this.bloomPass, 'radius', { label: 'Radius', min: 0, max: 1 })

    /**
     * Afterimage
     */
    const afterimageFolder = this.pane.addFolder({ title: 'Afterimage effect options', expanded: false })

    afterimageFolder.addInput(this.afterimagePass, 'enabled', { label: 'Enabled' })
    afterimageFolder.addInput(this.afterimagePass.uniforms.damp, 'value', { label: 'Damp', min: 0, max: 1 })
  }

  _loadMusic() {
    return new Promise(resolve => {
      const listener = new AudioListener()
      this.camera.add(listener)

      this.music = new Audio(listener)
      this.scene.add(this.music)

      const loader = new AudioLoader()

      loader.load('/music.mp3', buffer => {
        const tl = new gsap.timeline({
          onComplete: () => {
            this.music.setBuffer(buffer)
            this.music.setLoop(true)
            this.music.setVolume(0.1)

            this.analyser = new AudioAnalyser(this.music, 128)

            gsap.delayedCall(0.3, () => this.music.play())

            resolve()
          }
        })

        tl
          .add('start')
          .to('#audio-btn', {
            scale: 0,
            duration: 0.6,
            ease: 'back.in(2)'
          })
          .to('#audio-btn', { autoAlpha: 0, duration: 0.65 }, 'start+=0.3')

          .to(this.config, {
            particlesSpeed: 0.55,
            cameraSpeed: 1,
            duration: 1.3
          }, 'start')
      }, progress => {
        gsap.to('#audio-btn-loader', {
          '--scale': () => progress.loaded / progress.total,
          duration: 0.15,
          overwrite: true,
          ease: 'power1.out'
        })
      })
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
