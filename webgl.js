function FPS() {
  this.elapsed = 0;
  this.frame = 0;
  this.last = new Date().getTime();
  this.el = document.getElementById('fps');
  this.el.innerHTML = 0;
}

FPS.prototype.update = function(returnDelta) {
  var now = new Date().getTime();
  var delta = now - this.last;
  this.frame ++;
  this.elapsed += delta;
  this.last = now;
  if (this.elapsed >= 1000) {
    this.el.innerHTML = this.frame;
    this.frame = 0;
    this.elapsed -= 1000;
  }
  return (returnDelta) ? delta : now;
};

function WEBGL(options) {
  var canvas = this.canvas = document.createElement('canvas');
  var gl = this.gl = canvas.getContext('webgl', { antialias: options.antialias || false });
  if (!gl) { return false; }

  canvas.width = options.width || 640;
  canvas.height = options.width || 480;

  this.vertex = createShader(gl, gl.VERTEX_SHADER, options.vertex);
  this.fragment = createShader(gl, gl.FRAGMENT_SHADER, options.fragment);
  this.program = createProgram(gl, this.vertex, this.fragment);
  gl.useProgram(this.program);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  // pass resolution to shader

  this.resolution = gl.getUniformLocation(this.program, 'u_resolution');
  gl.uniform2f(this.resolution, canvas.width, canvas.height);

  // positions attribute

  var a_position = this.position = gl.getAttribLocation(this.program, 'a_position');
  this.position_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 4, gl.FLOAT, false, 0, 0); // second value is number of values per particle

  // texture uniform

  var texture = this.texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 0]));

  var texture_image = this.texture_image = new Image();
  texture_image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture_image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  texture_image.src = options.texture;

  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) { return shader; }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }

  function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) { return program; }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }
}

WEBGL.prototype.canvas = function() {
  return this.canvas;
};

WEBGL.prototype.setSize = function(width, height) {
  var gl = this.gl;
  this.canvas.width = width;
  this.canvas.height = height;
  gl.viewport(0, 0, width, height);
  gl.uniform2f(this.resolution, width, height);
};

WEBGL.prototype.setPositions = function(positions) {
  var gl = this.gl;
  this.positions = positions;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

WEBGL.prototype.render = function() {
  var gl = this.gl;

  gl.drawArrays(gl.POINTS, 0, this.positions/4);
};

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

gl = new WEBGL({
  width: WIDTH,
  height: HEIGHT,
  vertex: document.getElementById('vs').text,
  fragment: document.getElementById('fs').text,
  texture: 'spark.png',
});
document.body.appendChild(gl.canvas);

function resize() {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
  gl.setSize(WIDTH, HEIGHT);
}
window.addEventListener('resize', resize, false);
resize();

var particles = [];
for (var i = 0; i < 1; i++) {
  var x = Math.random() * WIDTH;
  var y = Math.random() * HEIGHT;
  var size = Math.random() * 10 + 10;
  var opacity = Math.random();
  particles.push(x, y, size, opacity);
}
//gl.setPositions(particles);

var fps = new FPS();

function update() {
  var delta = fps.update(false);
  gl.gl.clear(gl.COLOR_BUFFER_BIT);
  gl.setPositions(particles);
  gl.render();
  requestAnimationFrame(update);
}
requestAnimationFrame(update);
