varying vec2 vUv;
varying float vAlpha;

uniform vec3 uDirection;
uniform float uTime;
uniform float uInfluence;
uniform float uRandom;

void main() {
  float progress = fract(uTime*0.4*uRandom);

  float alpha = smoothstep(0., .4, progress);
  alpha *= smoothstep(1., .4, progress);

  vec3 pos = position + uDirection*progress;
  vec4 mvPosition = vec4(pos, 1.0);
  mvPosition = instanceMatrix * mvPosition;

  vec4 modelViewPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * modelViewPosition;

  vUv = uv;
  vAlpha = alpha;
}
