varying vec2 vUv;

uniform vec3 uDirection;
uniform float uTime;
uniform float uInfluence;

void main() {
  vec3 pos = position + uDirection*uInfluence;
  vec4 mvPosition = vec4(pos, 1.0);
  mvPosition = instanceMatrix * mvPosition;

  vec4 modelViewPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * modelViewPosition;

  vUv = uv;
}
