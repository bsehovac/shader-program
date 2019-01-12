## Constructor
ShaderProgram( options : *Object* )

### Options
antialias: *Boolean*,\
holder: *HTMLElement*,\
vertex: *GLSL Vertex Shader*,\
fragment: *GLSL Fragment Shader*,\
uniforms: *Object*,\
buffers: *Object*,\
camera: *Object*,\
texture: *Image*,\
onUpdate: *Function*,

#### Uniforms
name: { type: *Uniform Type*, value: *Number || Array* },

#### Camera
fov: *Degrees*,\
near: *Number*,\
far: *Number*,\
z: *Number*,\
perspective: *Boolean*

## Basic Example
```javascript
const program = new ShaderProgram( document.querySelector( '.particles' ) )
const positions = [], colors = []

for ( var i = 0; i < 1000; i ++ ) {
  positions.push(
    -60 + Math.random() * 120,
    -60 + Math.random() * 120,
    -50 + Math.random() * 100
  )
  colors.push( 0, 0.5, 1, 0.5 )
}

program.buffers.position = positions
program.buffers.color = colors
```
