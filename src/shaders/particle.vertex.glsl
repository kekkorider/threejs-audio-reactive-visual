varying vec2 vUv;

void main() {
  vec4 mvPosition = vec4(position, 1.0 );
  mvPosition = instanceMatrix * mvPosition;

  vec4 modelViewPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * modelViewPosition;

  vUv = uv;
}
