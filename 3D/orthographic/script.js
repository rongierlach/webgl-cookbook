window.onload = main;

// globals
var canvas, gl;
// transforms
var translation = {x: 0, y: 0, z: 0};
var rotation    = {x: 0, y: 0, z: 0};
var scale       = {x: 1, y: 1, z: 1};

function main() {
  setupWebGL();
  setupControls();
  render();
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  // compute matrices
  var scale_matrix = getScaleMatrix();
  var rotation_matrix_x = getRotationMatrixX();
  var rotation_matrix_y = getRotationMatrixY();
  var rotation_matrix_z = getRotationMatrixZ();
  var translation_matrix = getTranslationMatrix();
  var projection_matrix = getProjectionMatrix();
  // multiply the matrices
  var result_matrix = matrixMultiply(
    scale_matrix,
    rotation_matrix_x,
    rotation_matrix_y,
    rotation_matrix_z,
    translation_matrix,
    projection_matrix
  );
  // set the matrix
  gl.uniformMatrix4fv(program.matrix, false, result_matrix);
  gl.drawArrays(gl.TRIANGLES, 0, 9);
}

function setupWebGL() {
  /* Canvas & Context
  ** ************************ */
  canvas = document.createElement('canvas');
  canvas.width = 400; // window.innerWidth;
  canvas.height = 300; // window.innerHeight;
  document.body.appendChild(canvas);
  gl = canvas.getContext("webgl");

  /* Clear Color
  ** ************************ */
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  /* Shader Setup
  ** ************************ */
  // Vertex Shader
  var v_shader       = gl.createShader(gl.VERTEX_SHADER);
  var v_shader_source = document.getElementById("vertex-shader").text;
  gl.shaderSource(v_shader, v_shader_source);
  gl.compileShader(v_shader);
  // Fragment Shader
  var f_shader       = gl.createShader(gl.FRAGMENT_SHADER);
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
  // uniforms
  program.matrix = gl.getUniformLocation(program, 'u_matrix');
  program.color = gl.getUniformLocation(program, 'color');
  // assign data
  gl.uniform4fv(program.color, [1, 1, 1, 1]);

  /* Buffers
  ** ************************ */
  geometry_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, geometry_buffer);
  gl.enableVertexAttribArray(program.position);
  gl.vertexAttribPointer(program.position, 3, gl.FLOAT, false, 0, 0);
  // fill buffer
  setGeometry();

  /* Draw Shit
  ** ************************ */
  // render();
}

function setupControls() {
  var transforms = ['translation', 'rotation', 'scale'];
  var axes = ['x', 'y', 'z'];
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
  // then run 'em!
  for (i = 0; i < funcs.length; i++) {
    funcs[i]();
  }
}

function setInputHandler(transformation, axis) {
  return function () {
    var slider_id = [axis, transformation, 'slider'].join('-');
    var label_id = [axis, transformation, 'label'].join('-');
    var slider = document.getElementById(slider_id);
    var label = document.getElementById(label_id);
    slider.oninput = function(e) {
      window[transformation][axis] = label.innerHTML = parseFloat(this.value);
      render();
    }
  }
}

function setGeometry(x, y, side_length=200) {
  if (!x) { x = canvas.width / 2 };
  if (!y) { y = canvas.height / 2 };
  var p = new Pentagon(side_length);
  var points = p.calculatePoints(x, y);
  var vertices = new Float32Array([
    // abc
    points.a.x, points.a.y, 0,
    points.b.x, points.b.y, 0,
    points.c.x, points.c.y, 0,
    // abd
    points.a.x, points.a.y, 0,
    points.b.x, points.b.y, 0,
    points.d.x, points.d.y, 0,
    // abe
    points.a.x, points.a.y, 0,
    points.c.x, points.c.y, 0,
    points.e.x, points.e.y, 0
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
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
  var s = this.s, r = this.r, h = this.h, k = this.k, c = this.c;
  return {
    a: { x: x,         y: y - r },
    b: { x: x - s / 2, y: y + k },
    c: { x: x + s / 2, y: y + k },
    d: { x: x - c / 2, y: y - sqrt(sq(r) - sq(c / 2)) },
    e: { x: x + c / 2, y: y - sqrt(sq(r) - sq(c / 2)) },
    f: { x: x,         y: y }
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
  var d = 200; // depth
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
