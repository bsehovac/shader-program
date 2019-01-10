# Photon
WebGL Particle System
Only 4kb minified

## Constructor
Photon( options : *Object* )

### Options
  antialias: *Boolean*,
  holder: *HTMLElement*,
  vertex: *GLSL Vertex Shader*,
  fragment: *GLSL Fragment Shader*,
  uniforms: *Object*,
  buffers: *Object*,
  texture: *Image*,
  blending: *Array*,
  onUpdate: *Function*,

## Basic Example
```javascript
const photon = new Shaderphoton( {
  holder: document.querySelector( '.particles' ),
  texture: 'particle.png',
} )

const positions = []

for ( var i = 0; i < 2000; i ++ ) {

  positions.push(
    photon.width * Math.random(),
    photon.height * Math.random(),
    5 + 5 * Math.random()
  ) // x, y, size

}

photon.buffers.position.data = positions
```

## Advanced Example
```javascript
const texture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAQMAAACQp+OdAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAABRJREFUKM9jAAL5H0BilDHKIIMBAGOyRcGL+JfhAAAAAElFTkSuQmCC'

const photon = new Photon( {
  holder: document.querySelector( '.particles' ),
  texture: texture,
  buffers: {
    color: { size: 4, data: [] },
    rotation: { size: 1, data: [] },
  },
  vertex: `
    precision highp float;

    attribute vec3 a_position;
    attribute vec4 a_color;
    attribute float a_rotation;

    uniform vec2 u_resolution;
    uniform float u_time;

    varying vec4 v_color;
    varying float v_rotation;

    const float PI = 3.14;

    void main() {
      v_color = a_color;
      v_rotation = a_rotation;

      vec2 pos = vec2(a_position.x, a_position.y);

      pos.x += cos(pos.x + u_time) * 200.0;
      pos.y += sin(pos.y + u_time) * 200.0;

      v_rotation += cos(pos.x / 50.0) * PI * 2.0;

      gl_Position = vec4((pos.xy / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
      gl_PointSize = a_position.z;
    }`,
  fragment: `
    precision highp float;

    uniform sampler2D u_texture;

    varying vec4 v_color;
    varying float v_rotation;

    void main() {

      float mid = 0.5;

      vec2 rotated = vec2(
        cos(v_rotation) * (gl_PointCoord.x - mid) + sin(v_rotation) * (gl_PointCoord.y - mid) + mid,
        cos(v_rotation) * (gl_PointCoord.y - mid) - sin(v_rotation) * (gl_PointCoord.x - mid) + mid
      );

      vec4 texColor = texture2D(u_texture, rotated);
      gl_FragColor = v_color * texColor;
    }`,
} )

const positions = [], rotations = [], colors = []

for ( var i = 0; i < 5000; i ++ ) {

  positions.push(
    photon.width * Math.random(),
    photon.height * Math.random(),
    5 + 5 * Math.random()
  ) // x, y, size

  rotations.push(
    Math.PI * 2 * Math.random()
  )

  colors.push(
    Math.random(),
    Math.random(),
    Math.random(),
    0.5 + 0.5 * Math.random(),
  )

}

photon.buffers.position = positions
photon.buffers.color = colors
photon.buffers.rotation = rotations
```