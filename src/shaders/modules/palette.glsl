#define colorA vec3(0.5, 0.5, 0.5)
#define colorB vec3(0.5, 0.5, 0.5)
#define colorC vec3(2.0, 1.0, 0.0)
#define colorD vec3(0.50, 0.20, 0.25)

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
  return a + b*cos( 6.28318*(c*t+d) );
}

#pragma glslify: export(palette)
