varying float vColorMix;
varying vec3 vColor;

#define colorA vec3(0.0)
#define colorB vec3(0.0784, 0.5882, 0.5451)

void main() {
  vec3 color = vec3(0.0);

  float alpha = smoothstep(0.3, 0.8, vColorMix);
  color = mix(colorA, vColor, alpha);

  gl_FragColor = vec4(color, 1.0)*alpha;
}
