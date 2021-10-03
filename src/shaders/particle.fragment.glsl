varying vec2 vUv;
varying float vAlpha;

void main() {
  vec3 color = vec3(vUv, 0.5);

  gl_FragColor = vec4(color, 1.0)*vAlpha;
}
