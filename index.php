<?php $v = time(); ?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WebGL Particles</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" type="text/css" href="styles.css?v=<?=$v?>">
</head>
<body>
  <script id="vs" type="notjs">
    attribute vec4 a_position;
    uniform vec2 u_resolution;
    uniform float u_time;
    varying float opacity;
    void main() {
      opacity = a_position.a;
      vec2 pos = vec2(a_position.x, a_position.y);
      //pos.x = pos.x + opacity * cos(u_time);
      //pos.y = pos.y + opacity * sin(u_time);
      gl_Position = vec4((pos.xy / u_resolution) * 2.0 - 1.0, 0, 1);
      gl_PointSize = a_position.z; // INSTEAD OPACITY USE LIFESPAN * POINTSIZE, SO POINT GET SMALLER
    }
  </script>
  <script id="fs" type="notjs">
    precision mediump float;
    uniform sampler2D u_texture;
    varying float opacity;
    void main() {
      float mid = 0.5;
      float vRotation = opacity;
      /*vec2 rotated = vec2(cos(vRotation) * (gl_PointCoord.x - mid) + sin(vRotation) * (gl_PointCoord.y - mid) + mid,
                          cos(vRotation) * (gl_PointCoord.y - mid) - sin(vRotation) * (gl_PointCoord.x - mid) + mid);
      vec4 texColor = texture2D(u_texture, rotated);*/
      vec4 texColor = texture2D(u_texture, gl_PointCoord);
      gl_FragColor = vec4(texColor.rgb, texColor.a * 1.0);
      //gl_FragColor = vec4(0.0, 0.5, 1.0, opacity);
    }
  </script>
  <div id="fps"></div>
  <!--<script type="text/javascript" src="webgl.js?v=<?=$v?>"></script>-->
  <script type="text/javascript" src="scripts.js?v=<?=$v?>"></script>
</body>
</html>
