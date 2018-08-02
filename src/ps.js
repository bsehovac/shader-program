;(function() {
  'use strict';

  var POSITIONS_SIZE = 2;
  var OPTIONS_SIZE = 3;
  var SHADER_PRECISION = 'lowp'; // highp, meidump, lowp

  window.PS = {};


  // Renderer

  PS.Renderer = function(options) {
    if (typeof options === 'undefined') options = {};

    var _this = this;

    var _options = PS.MergeOptions({
      antialias: false,
      shaders: {
        vertex: PS.Shaders.Vertex,
        fragment: PS.Shaders.Fragment,
      },
      width: 640,
      height: 480,
    }, options);

    _this.options = _options;

    var _domElement = document.createElement('canvas');
    var _gl = _domElement.getContext('webgl', { antialias: options.antialias });

    _this.domElement = _domElement;
    _this.gl = _gl;

    if (!_gl) return false;

    _this.createProgram();
    _this.createTexture();

    _this.resolution = _gl.getUniformLocation(_this.program, 'u_resolution');

    _this.hasTexture = _gl.getUniformLocation(_this.program, 'u_hasTexture');
    _gl.uniform1f(_this.hasTexture, 0);

    _this.setSize(_options.width, _options.height);

    _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE);
    _gl.enable(_gl.BLEND);
    _gl.disable(_gl.DEPTH_TEST);

    _this.buffers = {
      positions: _this.createBuffer('a_position', POSITIONS_SIZE),
      options: _this.createBuffer('a_options', OPTIONS_SIZE),
      color: _this.createBuffer('a_color', 3),
    };

    _this.lastTime = Date.now();

    return _this;
  };


  // Create Shaders and Program

  PS.Renderer.prototype.createShader = function(type, source) {
    var _this = this;
    var _gl = _this.gl;

    var shader = _gl.createShader(type);

    _gl.shaderSource(shader, source);
    _gl.compileShader(shader);

    if (_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)) {
      return shader;
    } else {
      // Error
      console.log(_gl.getShaderInfoLog(shader));
      _gl.deleteShader(shader);
    }
  };

  PS.Renderer.prototype.createProgram = function() {
    var _this = this;
    var _gl = _this.gl;
    var _options = _this.options;

    var _vertexShader = _this.createShader(_gl.VERTEX_SHADER, _options.shaders.vertex);
    var _fragmentShader = _this.createShader(_gl.FRAGMENT_SHADER, _options.shaders.fragment);

    var _program = _gl.createProgram();

    _gl.attachShader(_program, _vertexShader);
    _gl.attachShader(_program, _fragmentShader);
    _gl.linkProgram(_program);

    if (_gl.getProgramParameter(_program, _gl.LINK_STATUS)) {
      _gl.useProgram(_program);
      _this.program = _program;
    } else {
      // Error
      console.log(_gl.getProgramInfoLog(_program));
      _gl.deleteProgram(_program);
    }
  };


  // Create and Set Buffer

  PS.Renderer.prototype.createBuffer = function(name, size) {
    var _this = this;
    var _gl = _this.gl;
    var _program = _this.program;

    var index = _gl.getAttribLocation(_program, name);
    var buffer = _gl.createBuffer();

    _gl.bindBuffer(_gl.ARRAY_BUFFER, buffer);
    _gl.enableVertexAttribArray(index);
    _gl.vertexAttribPointer(index, size, _gl.FLOAT, false, 0, 0);

    return buffer;
  };

  PS.Renderer.prototype.setBuffer = function(name, data) {
    var _this = this;
    var _gl = this.gl;

    if (name == null) {
      _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
      return;
    }

    _gl.bindBuffer(_gl.ARRAY_BUFFER, name);
    _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(data), _gl.STATIC_DRAW);
  };


  // Load Texture

  PS.Renderer.prototype.createTexture = function() {
    var _this = this;
    var _gl = _this.gl;

    var texture = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, texture);
    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, 1, 1, 0, _gl.RGBA, _gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

    _this.texture = texture;
  };

  PS.Renderer.prototype.loadTexture = function(src) {
    var _this = this;
    var _gl = _this.gl;
    var _texture = _this.texture;

    _gl.uniform1f(_this.hasTexture, 1);

    var textureImage = new Image();
    textureImage.onload = function() {
      _gl.bindTexture(_gl.TEXTURE_2D, _texture);
      _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, textureImage);
      _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_LINEAR);
      _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
      _gl.generateMipmap(_gl.TEXTURE_2D);
    };

    textureImage.src = src;
  };


  // Get Delta and Set Size

  PS.Renderer.prototype.getDelta = function() {
    var _this = this;

    var now = Date.now();
    var delta = now - _this.lastTime;
    _this.lastTime = now;

    return delta;
  };

  PS.Renderer.prototype.setSize = function(width, height) {
    var _this = this;
    var _domElement = _this.domElement;
    var _gl = _this.gl;

    _domElement.width = width;
    _domElement.height = height;
    _domElement.style.width = width + 'px';
    _domElement.style.height = height + 'px';

    _gl.viewport(0, 0, width, height);
    _gl.clearColor(0, 0, 0, 0);

    _gl.uniform2f(_this.resolution, width, height);
  };


  // Render

  PS.Renderer.prototype.render = function(particles) {
    var _this = this;
    var _gl = _this.gl;
    var _buffers = _this.buffers;

    _gl.clear(_gl.COLOR_BUFFER_BIT);

    var particlesData = {
      positions: [],
      options: [],
      color: [],
    }

    for (var i = 0, count = particles.length; i < count; i++) {
      var p = particles[i];
      particlesData.positions.push(p.x, p.y);
      particlesData.options.push(p.size, p.alpha, p.rotation);
      particlesData.color.push(p.color[0], p.color[1], p.color[2]);
    }

    _this.setBuffer(_buffers.positions, particlesData.positions);
    _this.setBuffer(_buffers.options, particlesData.options);
    _this.setBuffer(_buffers.color, particlesData.color);
    _this.setBuffer(null);

    _gl.drawArrays(_gl.POINTS, 0, particlesData.positions.length / POSITIONS_SIZE);
  };


  // Particles

  PS.Particles = function(count) {
    if (typeof count === 'undefined') return;
    count = parseInt(count);

    var particles = [];

    for (var i = 0; i < count; i++)
      particles.push({
        x: 0,
        y: 0,
        size: 0,
        alpha: 1,
        rotation: 0,
        color: [1, 0, 0],
      });

    return particles;
  };


  // Shaders

  PS.Shaders = {
    Vertex: [
      'precision '+ SHADER_PRECISION +' float;',
      'attribute vec'+ POSITIONS_SIZE +' a_position;',
      'attribute vec'+ OPTIONS_SIZE +' a_options;',
      'attribute vec3 a_color;',
      'uniform vec2 u_resolution;',
      'varying float alpha;',
      'varying float rotation;',
      'varying vec3 color;',
      'void main() {',
        'alpha = a_options.y;',
        'rotation = a_options.z;',
        'color = a_color;',
        'vec2 pos = vec2(a_position.x, a_position.y);',
        'gl_Position = vec4((pos.xy / u_resolution) * 2.0 - 1.0, 0.0, 1.0);',
        'gl_PointSize = a_options.x;',
      '}',
    ].join('\n'),
    Fragment: [
      'precision '+ SHADER_PRECISION +' float;',
      'uniform sampler2D u_texture;',
      'uniform float u_hasTexture;',
      'varying float alpha;',
      'varying float rotation;',
      'varying vec3 color;',
      'void main() {',
        'if (u_hasTexture > 0.5) {',
          'float mid = 0.5;',
          'float vRotation = rotation;',
          'vec2 rotated = vec2(',
            'cos(vRotation) * (gl_PointCoord.x - mid) + sin(vRotation) * (gl_PointCoord.y - mid) + mid,',
            'cos(vRotation) * (gl_PointCoord.y - mid) - sin(vRotation) * (gl_PointCoord.x - mid) + mid',
          ');',
          'vec4 texColor = texture2D(u_texture, rotated);',
          'gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);',
        '} else {',
          'gl_FragColor = vec4(color.r, color.g, color.b, alpha);',
        '}',
      '}',
    ].join('\n'),
  };


  // Merge Options

  PS.MergeOptions = function(defaults, options) {
    var output = {};

    for (var key in defaults)
      if (defaults.hasOwnProperty(key)) output[key] = defaults[key];

    for (var key in options)
      if (options.hasOwnProperty(key)) output[key] = options[key];

    return output;
  };

})();