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

function main() {
  'use strict';

  var canvas = document.createElement('canvas');
  var gl = canvas.getContext('webgl', { antialias: false });
  if (!gl) { return false; }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  var vertex = createShader(gl, gl.VERTEX_SHADER, document.getElementById('vs').text);
  var fragment = createShader(gl, gl.FRAGMENT_SHADER, document.getElementById('fs').text);
  var program = createProgram(gl, vertex, fragment);
  gl.useProgram(program);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  // ATRIBUTE POSITION

  var a_position = gl.getAttribLocation(program, 'a_position');
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 4, gl.FLOAT, false, 0, 0); // second value is number of values per particle

  // TEXTURE

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

  var textureImage = new Image();
  textureImage.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  textureImage.src = 'spark.png';

  // UNIFORMS

  var u_resolution = gl.getUniformLocation(program, 'u_resolution');
  var u_size = gl.getUniformLocation(program, 'u_size');
  var u_time = gl.getUniformLocation(program, 'u_time');
  gl.uniform2f(u_resolution, canvas.width, canvas.height);
  gl.uniform1f(u_size, 20);
  gl.uniform1f(u_time, 0);

  // SET POSITIONS

  var positions = [];
  for (var i = 0; i < 10000; i++) {
    positions.push(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 10 + 10, Math.random() * 100);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // code above this line is initialization code.
  // code below this line is rendering code.

  var fps = new FPS();
  var angle = 0;

  function update() {

    var delta = fps.update(false) / 1000000000;

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(u_time, angle);
    angle += 0.01;

    var upos = positions.slice();
    for (var i = 0; i < positions.length; i+= 4) {
      upos[i] = positions[i] + Math.cos(delta*i) * 50;
      upos[i+1] = positions[i+1] + Math.sin(delta*i) * 50;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(upos), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.drawArrays(gl.POINTS, 0, positions.length/4);
    //gl.flush();

    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);

}


main();
