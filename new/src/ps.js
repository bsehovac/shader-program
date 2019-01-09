const fps = new FPS()

class Renderer {

  constructor( options = {} ) {

    options = Object.assign( {
      antialias: true,
      holder: null,
      vertex: null,
      fragment: null,
      uniforms: {},
    }, options )

    const canvas = document.createElement( 'canvas' )
    const gl = canvas.getContext( 'webgl', { antialias: options.antialias } )

    if ( ! gl ) return false

    options.holder.appendChild( canvas )

    this.options = options
    this.canvas = canvas
    this.gl = gl

    this.createProgram()
    this.createTexture()

    this.uResolution = gl.getUniformLocation( this.program, 'u_resolution' )
    this.uTime = gl.getUniformLocation( this.program, 'u_time' )

    gl.blendFunc( gl.SRC_ALPHA, gl.ONE )
    gl.enable( gl.BLEND )
    gl.disable( gl.DEPTH_TEST )

    window.addEventListener( 'resize', () => this.setSize(), false )
    this.setSize( options.width, options.height )

    this.update = this.update.bind( this )

  }

  setSize() {

    const canvas = this.canvas
    const gl = this.gl

    const width = this.options.holder.offsetWidth
    const height = this.options.holder.offsetHeight
    const dpi = devicePixelRatio

    canvas.width = width * dpi
    canvas.height = height * dpi
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    this.width = width
    this.height = height

    gl.viewport( 0, 0, width, height )
    gl.clearColor( 0, 0, 0, 0 )

    gl.uniform2f( this.uResolution, width, height )

  }

  createShader( type, source ) {

    const gl = this.gl
    const shader = gl.createShader( type )

    gl.shaderSource( shader, source )
    gl.compileShader( shader )

    if ( gl.getShaderParameter (shader, gl.COMPILE_STATUS ) ) {

      return shader

    } else {

      console.log( gl.getShaderInfoLog( shader ) )
      gl.deleteShader( shader )

    }

  }

  createProgram() {

    const gl = this.gl
    const options = this.options

    var vertexShader = this.createShader( gl.VERTEX_SHADER, this.options.vertex )
    var fragmentShader = this.createShader( gl.FRAGMENT_SHADER, this.options.fragment )

    var program = gl.createProgram()

    gl.attachShader( program, vertexShader )
    gl.attachShader( program, fragmentShader )
    gl.linkProgram( program )

    if ( gl.getProgramParameter( program, gl.LINK_STATUS ) ) {

      gl.useProgram( program )
      this.program = program

    } else {

      console.log( gl.getProgramInfoLog( program ) )
      gl.deleteProgram( program )

    }

  }

  createBuffer( name, size ) {

    const gl = this.gl
    const program = this.program

    const index = gl.getAttribLocation( program, name )
    const buffer = gl.createBuffer()

    gl.bindBuffer( gl.ARRAY_BUFFER, buffer )
    gl.enableVertexAttribArray( index )
    gl.vertexAttribPointer( index, size, gl.FLOAT, false, 0, 0 )

    return buffer

  }

  setBuffer( name, data ) {

    const gl = this.gl

    if ( name == null && ! gl.bindBuffer( gl.ARRAY_BUFFER, null ) ) return

    gl.bindBuffer( gl.ARRAY_BUFFER, name )
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( data ), gl.STATIC_DRAW )

  }

  createTexture() {

    const gl = this.gl
    const texture = gl.createTexture()

    gl.bindTexture( gl.TEXTURE_2D, texture )
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array( [ 0, 0, 0, 0 ] ) )

    this.texture = texture

  }

  loadTexture( src ) {

    const gl = this.gl
    const texture = this.texture

    var textureImage = new Image()

    textureImage.onload = () => {

      gl.bindTexture( gl.TEXTURE_2D, this.texture )
      gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage )
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR )
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR )
      gl.generateMipmap( gl.TEXTURE_2D )

    }

    textureImage.src = src

  }

  start( count ) {

    this.start = performance.now()
    this.count = count
    this.update()

  }

  update() {

    const gl = this.gl
    const elapsed = ( performance.now() - this.start ) / 5000

    fps.update()

    gl.clear( gl.COLORBUFFERBIT )
    gl.uniform1f( this.uTime, elapsed )
    gl.drawArrays( gl.POINTS, 0, this.count )

    requestAnimationFrame( this.update )

  }

}


const POSITIONS_SIZE = 4
const COLOR_SIZE = 4

const renderer = new Renderer( {
  holder: document.querySelector( '.particles' ),
  antialias: false,
  // uniforms: {
  //   u_resolution: [ 0, 0 ],
  //   u_time: 0,
  // },
  vertex: `
    precision highp float;

    attribute vec${ POSITIONS_SIZE } a_position;
    attribute vec${ COLOR_SIZE } a_color;

    uniform vec2 u_resolution;
    uniform float u_time;

    varying vec${ COLOR_SIZE } v_color;
    varying float v_rotation;

    const float PI = 3.14;

    void main() {
      v_color = a_color;
      v_rotation = a_position.w;

      vec2 pos = vec2(a_position.x, a_position.y);

      pos.x += cos(pos.x + u_time) * 200.0;
      pos.y += sin(pos.y + u_time) * 200.0;

      v_rotation += cos(u_time * 20.0 * PI);

      gl_Position = vec4((pos.xy / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
      gl_PointSize = a_position.z;
    }
  `,
  fragment: `
    precision highp float;

    uniform sampler2D u_texture;

    varying vec${ COLOR_SIZE } v_color;
    varying float v_rotation;

    void main() {

      float mid = 0.5;

      vec2 rotated = vec2(
        cos(v_rotation) * (gl_PointCoord.x - mid) + sin(v_rotation) * (gl_PointCoord.y - mid) + mid,
        cos(v_rotation) * (gl_PointCoord.y - mid) - sin(v_rotation) * (gl_PointCoord.x - mid) + mid
      );

      vec4 texColor = texture2D(u_texture, rotated);
      gl_FragColor = v_color * texColor;

      // gl_FragColor = v_color;
    }
  `,
} )

const range = ( a, b, i ) => a + ( b - a ) * i

// INIT

const positions = []
const colors = []

const count = 20000

for ( var i = 0; i < count; i ++ ) {

  // set x and y
  positions.push(
    range( 0, renderer.width, Math.random() ),
    range( 0, renderer.height, Math.random() ),
    range( 2.0, 10.0, Math.random() ),
    range( 0, Math.PI / 2, Math.random() ),
  )

  colors.push(
    Math.random(),
    Math.random(),
    Math.random(),
    range( 0.2, 0.8, Math.random() ),
  )

}

renderer.loadTexture('particle.png');

renderer.setBuffer( renderer.createBuffer( 'a_position', POSITIONS_SIZE ), positions )
renderer.setBuffer( renderer.createBuffer( 'a_color', COLOR_SIZE ), colors )
renderer.setBuffer( null )

renderer.start( count )

// antialias slow performance
// 