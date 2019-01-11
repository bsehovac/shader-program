class Photon {

  constructor( options = {} ) {

    options = Object.assign( {
      antialias: false,
      holder: null,
      vertex: `
        precision highp float;

        attribute vec4 a_position;
        attribute vec4 a_color;

        uniform float u_time;
        uniform vec2 u_resolution;
        uniform mat4 u_projection;

        varying vec4 v_color;

        void main() {

          gl_Position = u_projection * a_position;
          gl_PointSize = (10.0 / gl_Position.w) * 100.0;

          v_color = a_color;

        }`,
      fragment: `
        precision highp float;

        uniform sampler2D u_texture;
        uniform int u_hasTexture;

        varying vec4 v_color;

        void main() {

          if ( u_hasTexture == 1 ) {

            gl_FragColor = v_color * texture2D(u_texture, gl_PointCoord);

          } else {

            gl_FragColor = v_color;

          }

        }`,
      uniforms: {},
      buffers: {},
      texture: null,
      blending: [ 'SRC_ALPHA', 'ONE' ],
      onUpdate: ( () => {} ),
      camera: {}
    }, options )

    const uniforms = Object.assign( {
      time: { type: 'float', value: 0 },
      hasTexture: { type: 'int', value: 0 },
      resolution: { type: 'vec2', value: [ 0, 0 ] },
      projection: { type: 'mat4', value: [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ] },
    }, options.uniforms )

    const buffers = Object.assign( {
      position: { size: 3, data: [] },
      color: { size: 4, data: [] },
    }, options.buffers )

    const camera = Object.assign( {
      fov: 60,
      near: 1,
      far: 10000,
      aspect: 1,
      z: 100,
    }, options.camera )

    const canvas = document.createElement( 'canvas' )
    const gl = canvas.getContext( 'webgl', { antialias: options.antialias } )

    if ( ! gl ) return false

    this.count = 0
    this.gl = gl
    this.canvas = canvas
    this.camera = camera
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
    this.setSize()

    this.update = this.update.bind( this )
    this.start = performance.now()
    this.update()

  }

  setSize() {

    const holder = this.holder
    const canvas = this.canvas
    const gl = this.gl

    const width = this.width = holder.offsetWidth
    const height = this.height = holder.offsetHeight
    const dpi = devicePixelRatio

    canvas.width = width * dpi
    canvas.height = height * dpi
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    gl.viewport( 0, 0, width, height )
    gl.clearColor( 0, 0, 0, 0 )

    this.uniforms.resolution = [ width, height ]
    this.uniforms.projection = this.projection( width / height )

  }

  projection( aspect ) {

    const camera = this.camera

    camera.aspect = aspect

    const fovRad = camera.fov * ( Math.PI / 180 )
    const f = Math.tan( Math.PI * 0.5 - 0.5 * fovRad )
    const rangeInv = 1.0 / ( camera.near - camera.far )

    const matrix = [
      f / camera.aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (camera.near + camera.far) * rangeInv, -1,
      0, 0, camera.near * camera.far * rangeInv * 2, 0
    ]

    matrix[ 14 ] += camera.z
    matrix[ 15 ] += camera.z

    return matrix

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

    const vertexShader = this.createShader( gl.VERTEX_SHADER, vertex )
    const fragmentShader = this.createShader( gl.FRAGMENT_SHADER, fragment )

    const program = gl.createProgram()

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

      uniform.location = gl.getUniformLocation( this.program, 'u_' + name )

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
      case 'int': {
        gl.uniform1i( uniform.location, value )
        break
      }
      case 'float': {
        gl.uniform1f( uniform.location, value )
        break
      }
      case 'vec2': {
        gl.uniform2f( uniform.location, ...value )
        break
      }
      case 'vec3': {
        gl.uniform3f( uniform.location, ...value )
        break
      }
      case 'mat2': {
        gl.uniformMatrix2fv( uniform.location, false, value )
        break
      }
      case 'mat3': {
        gl.uniformMatrix3fv( uniform.location, false, value )
        break
      }
      case 'mat4': {
        gl.uniformMatrix4fv( uniform.location, false, value )
        break
      }
    }

    // float       : uniform1f,
    // vec2        : uniform2f,
    // vec3        : uniform3f,
    // vec4        : uniform4f,
    // int         : uniform1i,
    // ivec2       : uniform2i,
    // ivec3       : uniform3i,
    // ivec4       : uniform4i,
    // sampler2D   : uniform1i,
    // samplerCube : uniform1i,

    // mat2        : uniformMatrix2fv,
    // mat3        : uniformMatrix3fv,
    // mat4        : uniformMatrix4fv,

    // bool        : uniform1i,
    // bvec2       : uniform2i,
    // bvec3       : uniform3i,
    // bvec4       : uniform4i,

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
            this.count = buffers.position.data.length / 4

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

    const textureImage = new Image()

    textureImage.onload = () => {

      gl.bindTexture( gl.TEXTURE_2D, texture )
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