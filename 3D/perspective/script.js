window.onload = main;

// globals
var canvas, gl;
// transforms
var translation = {x: 0, y: 0, z: 0};
var rotation    = {x: -10, y: 25, z: 0};
var scale       = {x: 1, y: 1, z: 1};
var perspective = {fov: 60, near: 0, far: 400};

function main() {
  setupWebGL();
  setupControls();
  render();
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // compute matrices
  var scale_matrix = getScaleMatrix();
  var rotation_matrix_x = getRotationMatrixX();
  var rotation_matrix_y = getRotationMatrixY();
  var rotation_matrix_z = getRotationMatrixZ();
  var translation_matrix = getTranslationMatrix();
  var projection_matrix = getProjectionMatrix();
  var perspective_matrix = getPerspectiveMatrix();
  // multiply the matrices
  var result_matrix = matrixMultiply(
    scale_matrix,
    rotation_matrix_x,
    rotation_matrix_y,
    rotation_matrix_z,
    translation_matrix,
    projection_matrix,
    perspective_matrix
  );
  // set the matrix
  gl.uniformMatrix4fv(program.matrix, false, result_matrix);

  gl.drawArrays(gl.TRIANGLES, 0, 48);
}

function setupWebGL() {
  /* Canvas & Context
  ** ************************ */
  canvas = document.createElement('canvas');
  canvas.width = 400; // window.innerWidth;
  canvas.height = 300; // window.innerHeight;
  document.body.appendChild(canvas);
  gl = canvas.getContext("webgl");

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  /* Clear Color
  ** ************************ */
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  /* Shader Setup
  ** ************************ */
  // Vertex Shader
  var v_shader = gl.createShader(gl.VERTEX_SHADER);
  var v_shader_source = document.getElementById("vertex-shader").text;
  gl.shaderSource(v_shader, v_shader_source);
  gl.compileShader(v_shader);
  // Fragment Shader
  var f_shader = gl.createShader(gl.FRAGMENT_SHADER);
  var f_shader_source = document.getElementById("fragment-shader").text;
  gl.shaderSource(f_shader, f_shader_source);
  gl.compileShader(f_shader);

  /* Program Setup
  ** ************************ */
  program = gl.createProgram();
  gl.attachShader(program, v_shader);
  gl.attachShader(program, f_shader);
  gl.linkProgram(program);
  gl.useProgram(program);

  /* Shader Vars
  ** ************************ */
  // attributes
  program.position = gl.getAttribLocation(program, 'a_position');
  program.color = gl.getAttribLocation(program, 'a_color');
  // uniforms
  program.matrix = gl.getUniformLocation(program, 'u_matrix');

  /* Buffers
  ** ************************ */
  // geometry buffer
  geometry_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, geometry_buffer);
  // fill buffer w/ geometry
  gl.enableVertexAttribArray(program.position);
  gl.vertexAttribPointer(program.position, 3, gl.FLOAT, false, 0, 0);
  setGeometry();
  // color buffer
  color_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  // fill buffer w/ colors
  gl.enableVertexAttribArray(program.color);
  gl.vertexAttribPointer(program.color, 3, gl.UNSIGNED_BYTE, true, 0, 0);
  setColors();


  /* Draw Shit
  ** ************************ */
  // render();
}

function setupControls() {
  var transforms = ['translation', 'rotation', 'scale'];
  var axes = ['x', 'y', 'z'];
  var perspective_attrs = ['fov', 'near', 'far'];
  var funcs = [];
  // No block scope in es5 got me down :(
  // Assign functions by iterating over transforms and axes
  for (var i = 0; i < transforms.length; i++) {
    var transformation = transforms[i];
    for (var j = 0; j < axes.length; j++) {
      var axis = axes[j];
      funcs.push(setInputHandler(transformation, axis));
    }
  }
  for (i = 0; i < perspective_attrs.length; i++) {
    var attr = perspective_attrs[i];
    funcs.push(setInputHandler('perspective', attr));
  }
  // then run 'em!
  for (i = 0; i < funcs.length; i++) funcs[i]();
}

function setInputHandler(transformation, axis) {
  return function () {
    var slider_id = [axis, transformation, 'slider'].join('-');
    var label_id = [axis, transformation, 'label'].join('-');
    console.log(slider_id + " " + label_id);
    var slider = document.getElementById(slider_id);
    var label = document.getElementById(label_id);
    slider.oninput = function(e) {
      window[transformation][axis] = label.innerHTML = parseFloat(this.value);
      render();
    }
  }
}

function setGeometry(x, y, z, side_length=500) {
  if (!x) { x = canvas.width / 2 };
  if (!y) { y = canvas.height / 2 };
  if (!z) { z = 200 };
  var p = new Pentagon(side_length);
  var points = p.calculatePoints(x, y);
  var vertices = new Float32Array([
    // Front Face
    // abc
    points.a.x, points.a.y, 100,
    points.c.x, points.c.y, 100,
    points.b.x, points.b.y, 100,
    // acd
    points.a.x, points.a.y, 100,
    points.d.x, points.d.y, 100,
    points.c.x, points.c.y, 100,
    // ade
    points.a.x, points.a.y, 100,
    points.e.x, points.e.y, 100,
    points.d.x, points.d.y, 100,
    // Rear Face
    // abc
    points.a.x, points.a.y, z,
    points.b.x, points.b.y, z,
    points.c.x, points.c.y, z,
    // acd
    points.a.x, points.a.y, z,
    points.c.x, points.c.y, z,
    points.d.x, points.d.y, z,
    // ade
    points.a.x, points.a.y, z,
    points.d.x, points.d.y, z,
    points.e.x, points.e.y, z,
    // Sides
    // ab
    points.a.x, points.a.y, 100,
    points.b.x, points.b.y, 100,
    points.a.x, points.a.y, z,
    points.b.x, points.b.y, z,
    points.a.x, points.a.y, z,
    points.b.x, points.b.y, 100,
    // bc
    points.b.x, points.b.y, 100,
    points.c.x, points.c.y, 100,
    points.b.x, points.b.y, z,
    points.c.x, points.c.y, z,
    points.b.x, points.b.y, z,
    points.c.x, points.c.y, 100,
    // cd
    points.c.x, points.c.y, 100,
    points.d.x, points.d.y, 100,
    points.c.x, points.c.y, z,
    points.d.x, points.d.y, z,
    points.c.x, points.c.y, z,
    points.d.x, points.d.y, 100,
    // de
    points.d.x, points.d.y, 100,
    points.e.x, points.e.y, 100,
    points.d.x, points.d.y, z,
    points.e.x, points.e.y, z,
    points.d.x, points.d.y, z,
    points.e.x, points.e.y, 100,
    // ea
    points.e.x, points.e.y, 100,
    points.a.x, points.a.y, 100,
    points.e.x, points.e.y, z,
    points.a.x, points.a.y, z,
    points.e.x, points.e.y, z,
    points.a.x, points.a.y, 100
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function setColors() {
  var white = [255, 255, 255];
  var grey = [122, 122, 122];
  var red = [255, 0, 0];
  var repeatArray = function(arr, times) {
    var repeated = [];
    for (var i = 0; i < times; i++) {
      repeated = repeated.concat(arr);
    }
    return repeated;
  }
  var front_face = repeatArray(white, 9);
  var rear_face = repeatArray(white, 9);
  var faces = front_face.concat(rear_face);
  var sides = repeatArray(repeatArray(red, 6).concat(repeatArray(grey, 6)), 2).concat(repeatArray(red, 6));
  var colors = new Uint8Array( faces.concat(sides) );
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
}

/* Classes
** ************************ */
class Pentagon {
  constructor(side_length) {
    this.side_length = this.s = side_length;
    this.circumradius = this.r = this.s / (2 * Math.sin(Math.PI/5));
    this.height = this.h = this.r * (1 + Math.cos(Math.PI/5));
    this.inradius = this.k = this.h - this.r;
    this.width = this.c = this.h / (Math.cos(Math.PI/10));
  }
}

// Helper to determine vertice locations
Pentagon.prototype.calculatePoints = function (x, y) {
  /* Points go clockwise from 12 'o clock
  //     A
  //  E / \ B
  //   |   |
  //  D --- C
  */
  var s = this.s, r = this.r, h = this.h, k = this.k, c = this.c;
  return {
    a: { x: x,         y: y - r },
    b: { x: x + c / 2, y: y - sqrt(sq(r) - sq(c / 2)) },
    c: { x: x + s / 2, y: y + k },
    d: { x: x - s / 2, y: y + k },
    e: { x: x - c / 2, y: y - sqrt(sq(r) - sq(c / 2)) },
    f: { x: x,         y: y } // center
  };
};

/* Helper Functions
** ************************ */
// math
function sq(n) { return n * n; }
function sqrt(n) { return Math.sqrt(n); }
function degToRad(deg) { return deg * Math.PI / 180; }
// matrices
function getProjectionMatrix() {
  var w = canvas.width;
  var h = canvas.height;
  var d = 400; // depth
  return [
    2/w,  0.0, 0.0, 0.0,
    0.0, -2/h, 0.0, 0.0,
    0.0,  0.0, 2/d, 0.0,
    -1.0, 1.0, 0, 1.0
  ];
}
function getTranslationMatrix() {
  var tx = translation.x + canvas.width / 2
  var ty = translation.y + canvas.height / 2
  var tz = translation.z
  return [
     1,  0,  0, 0,
     0,  1,  0, 0,
     0,  0,  1, 0,
    tx, ty, tz, 1
  ];
}
function getRotationMatrixX() {
  var c = Math.cos( degToRad(rotation.x) );
  var s = Math.sin( degToRad(rotation.x) );
  return [
    1,  0, 0, 0,
    0,  c, s, 0,
    0, -s, c, 0,
    0,  0, 0, 1
  ];
}
function getRotationMatrixY() {
  var c = Math.cos( degToRad(rotation.y) );
  var s = Math.sin( degToRad(rotation.y) );
  return [
    c, 0, -s, 0,
    0, 1,  0, 0,
    s, 0,  c, 0,
    0, 0,  0, 1
  ];
}
function getRotationMatrixZ() {
  var c = Math.cos( degToRad(rotation.z) );
  var s = Math.sin( degToRad(rotation.z) );
  return [
     c, s, 0, 0,
    -s, c, 0, 0,
     0, 0, 1, 0,
     0, 0, 0, 1
  ];
}
function getScaleMatrix() {
  var sx = scale.x;
  var sy = scale.y;
  var sz = scale.z;
  return [
    sx,  0,  0, 0,
     0, sy,  0, 0,
     0,  0, sz, 0,
     0,  0,  0, 1
  ];
}
function getPerspectiveMatrix() {
  var fov_rad = degToRad(perspective.fov);
  var aspect = canvas.width / canvas.height;
  var near = perspective.near;
  var far = perspective.far;
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fov_rad);
  var range_inv = 1.0 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * range_inv, -1,
    0, 0, near * far * range_inv * 2, 0
  ];
}
function getIdentityMatrix() {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}
function matrixMultiply(/* args */) {
  // *arguments* does not inherit prototypical Array methods,
  // javascript is weird like this...
  var args = [].slice.call(arguments);

  if (args.length > 1) {
    var a = args[0];
    var b = args[1];

    var a00 = a[0*4+0], a01 = a[0*4+1], a02 = a[0*4+2], a03 = a[0*4+3];
    var a10 = a[1*4+0], a11 = a[1*4+1], a12 = a[1*4+2], a13 = a[1*4+3];
    var a20 = a[2*4+0], a21 = a[2*4+1], a22 = a[2*4+2], a23 = a[2*4+3];
    var a30 = a[3*4+0], a31 = a[3*4+1], a32 = a[3*4+2], a33 = a[3*4+3];

    var b00 = b[0*4+0], b01 = b[0*4+1], b02 = b[0*4+2], b03 = b[0*4+3];
    var b10 = b[1*4+0], b11 = b[1*4+1], b12 = b[1*4+2], b13 = b[1*4+3];
    var b20 = b[2*4+0], b21 = b[2*4+1], b22 = b[2*4+2], b23 = b[2*4+3];
    var b30 = b[3*4+0], b31 = b[3*4+1], b32 = b[3*4+2], b33 = b[3*4+3];

    var product = [a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
                   a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
                   a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
                   a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,

                   a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
                   a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
                   a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
                   a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,

                   a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
                   a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
                   a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
                   a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,

                   a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
                   a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
                   a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
                   a30 * b03 + a31 * b13 + a32 * b23 + a33 + b33];

    args = args.slice(2, args.length);
    args.unshift(product);
    // recursively compute the next product
    return matrixMultiply.apply(this, args);

  } else if (args.length == 0) {
    // identity matrix
    return [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1];
  } else {
    return args[0];
  }
}
