# Photon
WebGL Particle System\
Only 4kb minified

## Constructor
Photon( options : *Object* )

### Options
antialias: *Boolean*,\
holder: *HTMLElement*,\
vertex: *GLSL Vertex Shader*,\
fragment: *GLSL Fragment Shader*,\
uniforms: *Object*,\
buffers: *Object*,\
camera: *Object*,\
texture: *Image*,\
blending: *Array*,\
onUpdate: *Function*,

### Camera
fov: *60*,
near: *1*,
far: *10000*,
z: *100*,

## Basic Example
```javascript
const photon = new Photon( {
  holder: document.querySelector( '.particles' ),
} )

const position = [], color = []

for ( var i = 0; i < 1000; i ++ ) {

  position.push(
    -60 + Math.random() * 120,
    -60 + Math.random() * 120,
    -50 + Math.random() * 100
  ) // x, y, z

  color.push( 0, 0.5, 1, 0.5 )

}

photon.buffers.position = position
photon.buffers.color = color
```