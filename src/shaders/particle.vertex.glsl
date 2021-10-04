#define colorA vec3(0.5, 0.5, 0.5)
#define colorB vec3(0.5, 0.5, 0.5)
#define colorC vec3(2.0, 1.0, 0.0)
#define colorD vec3(0.50, 0.20, 0.25)

varying float vAlpha;
varying vec3 vColor;

uniform vec3 uDirection;
uniform float uTime;
uniform float uRandom;
uniform vec3 uColorA;
uniform vec3 uColorB;

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
  return a + b*cos( 6.28318*(c*t+d) );
}

#pragma glslify: noise = require('./modules/noise.glsl')

void main() {
  float progress = fract(uTime*0.4*uRandom);

  float alpha = smoothstep(0., .2, progress);
  alpha *= smoothstep(1., .6, progress);

  float n = noise(position + uTime*0.3);

  vec3 pos = position + uDirection*progress + uDirection*n;

  vec4 mvPosition = vec4(pos, 1.0);
  mvPosition = instanceMatrix * mvPosition;

  vec4 modelViewPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * modelViewPosition;

  vAlpha = alpha;
  vColor = mix(uColorA, uColorB, smoothstep(0.2, 0.45, progress)) / 255.;

  vColor = palette(distance(vec3(0), pos)*2.0 + uTime*0.15, colorA, colorB, colorC, colorD);
}
