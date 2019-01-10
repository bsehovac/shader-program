class Photon {

  constructor( options = {} ) {

    options = Object.assign( {
      antialias: false,
      holder: null,
      vertex: `
        precision highp float;

        attribute vec3 a_position;

        uniform vec2 u_resolution;
        uniform float u_time;

        void main() {

          gl_Position = vec4((a_position.xy / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
          gl_PointSize = a_position.z;

        }`,
      fragment: `
        precision highp float;

        uniform sampler2D u_texture;
        uniform float u_hasTexture;

        void main() {

          if ( u_hasTexture > 0.5 ) {

            gl_FragColor = texture2D(u_texture, gl_PointCoord);

          } else {

            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);

          }

        }`,
      uniforms: {},
      buffers: {},
      texture: null,
      blending: [ 'SRC_ALPHA', 'ONE' ],
      onUpdate: ( () => {} ),
    }, options )

    const uniforms = Object.assign( {
      resolution: { type: '2f', value: [ 0, 0 ] },
      time: { type: '1f', value: 0 },
      hasTexture: { type: '1f', value: 0 },
    }, options.uniforms )

    const buffers = Object.assign( {
      position: { size: 3, data: [] },
    }, options.buffers )

    const canvas = document.createElement( 'canvas' )
    const gl = canvas.getContext( 'webgl', { antialias: options.antialias } )

    if ( ! gl ) return false

    this.count = 0
    this.gl = gl
    this.canvas = canvas
    this.holder = options.holder
    this.onUpdate = options.onUpdate
    this.data = {}

    this.holder.appendChild( canvas )

    this.createProgram( options.vertex, options.fragment )

    this.createBuffers( buffers )
    this.createUniforms( uniforms )

    this.updateBuffers()
    this.updateUniforms()

    this.createTexture( options.texture )

    gl.blendFunc( gl[ options.blending[ 0 ] ], gl[ options.blending[ 1 ] ] )
    gl.enable( gl.BLEND )
    gl.disable( gl.DEPTH_TEST )

    window.addEventListener( 'resize', () => this.setSize(), false )
    this.setSize( options.width, options.height )

    this.update = this.update.bind( this )
    this.start = performance.now()
    this.update()

  }

  setSize() {

    const canvas = this.canvas
    const gl = this.gl

    const width = this.holder.offsetWidth
    const height = this.holder.offsetHeight
    const dpi = devicePixelRatio

    canvas.width = width * dpi
    canvas.height = height * dpi
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    this.width = width
    this.height = height

    gl.viewport( 0, 0, width, height )
    gl.clearColor( 0, 0, 0, 0 )

    this.uniforms.resolution = [ width, height ]

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

  createProgram( vertex, fragment ) {

    const gl = this.gl

    var vertexShader = this.createShader( gl.VERTEX_SHADER, vertex )
    var fragmentShader = this.createShader( gl.FRAGMENT_SHADER, fragment )

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

  createUniforms( data ) {

    const gl = this.gl
    const uniforms = this.data.uniforms = data
    const values = this.uniforms = {}

    Object.keys( uniforms ).forEach( name => {

      const uniform = uniforms[ name ]

      uniform.uniform = gl.getUniformLocation( this.program, 'u_' + name )

      this.setUniform( name, uniform.value )

      Object.defineProperty( values, name, {
        set: value => {

          uniforms[ name ].value = value
          this.setUniform( name, value )

        },
        get: () => uniforms[ name ].value
      } )

    } )

  }

  setUniform( name, value ) {

    const gl = this.gl
    const uniform = this.data.uniforms[ name ]

    uniform.value = value

    switch ( uniform.type ) {
      case '1f': {
        value = [ value ]
        break;
      }
      case '2f': {
        value = value
        break;
      }
    }

    gl[ 'uniform' + uniform.type ]( uniform.uniform, ...value )

  }

  updateUniforms() {

    const gl = this.gl
    const uniforms = this.data.uniforms

    Object.keys( uniforms ).forEach( name => {

      const uniform = uniforms[ name ]

      this.uniforms[ name ] = uniform.value

    } )

  }

  createBuffers( data ) {

    const gl = this.gl
    const buffers = this.data.buffers = data
    const values = this.buffers = {}

    Object.keys( buffers ).forEach( name => {

      const buffer = buffers[ name ]

      buffer.buffer = this.createBuffer( 'a_' + name, buffer.size )

      Object.defineProperty( values, name, {
        set: data => {

          buffers[ name ].data = data
          this.setBuffer( name, data )

          if ( name == 'position' )
            this.count = buffers.position.data.length / 3

        },
        get: () => buffers[ name ].data
      } )

    } )

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
    const buffers = this.data.buffers

    if ( name == null && ! gl.bindBuffer( gl.ARRAY_BUFFER, null ) ) return

    gl.bindBuffer( gl.ARRAY_BUFFER, buffers[ name ].buffer )
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( data ), gl.STATIC_DRAW )

  }

  updateBuffers() {

    const gl = this.gl
    const buffers = this.buffers

    Object.keys( buffers ).forEach( name =>
      buffers[ name ] = buffer.data
    )

    this.setBuffer( null )

  }

  createTexture( src ) {

    const gl = this.gl
    const texture = gl.createTexture()

    gl.bindTexture( gl.TEXTURE_2D, texture )
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array( [ 0, 0, 0, 0 ] ) )

    this.texture = texture

    if ( src ) {

      this.uniforms.hasTexture = 1
      this.loadTexture( src )

    }

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

  update() {

    const gl = this.gl
    const elapsed = ( performance.now() - this.start ) / 5000

    this.uniforms.time = elapsed

    if ( this.count > 0 ) {
      gl.clear( gl.COLORBUFFERBIT )
      gl.drawArrays( gl.POINTS, 0, this.count )
    }

    this.onUpdate()

    requestAnimationFrame( this.update )

  }

}