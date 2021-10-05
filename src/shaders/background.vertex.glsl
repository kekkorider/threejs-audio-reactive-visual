uniform float uTime;

varying float vColorMix;
varying vec3 vColor;

#pragma glslify: noise = require(./modules/noise.glsl)
#pragma glslify: palette = require(./modules/palette.glsl)

void main() {
  float n = noise(position*0.2 + uTime*0.1);
  n = n*0.5 + 0.5;

  vec3 pos = position;
  vec3 dir = normalize(pos - vec3(0.0));
  pos -= dir*n*2.0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  vColorMix = n;
  vColor = palette(pos.x*0.1 + uTime*0.1, colorA, colorB, colorC, colorD);
}
