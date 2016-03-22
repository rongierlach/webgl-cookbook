window.onload = main;

var canvas, gl, p, side_length;
var px = 200, py = 150;
var translation = {x: 0, y: 0};
var rotation = {cos: 1, sin: 0, deg: 0}; // 0rad
var scale = {x: 1.0, y: 1.0};

// Helper functions
function sq(n) {
  return n * n;
}

function sqrt(n) {
  return Math.sqrt(n);
}

function degToRad(deg) {
  return deg * Math.PI / 180;
}

function getTranslationMatrix() {
  return [
    1, 0, 0,
    0, 1, 0,
    px + translation.x, py + translation.y, 1
  ];
}

function getRotationMatrix() {
  return [
    rotation.cos, -rotation.sin, 0,
    rotation.sin, rotation.cos, 0,
    0, 0, 1
  ];
}

function getScaleMatrix() {
  return [
    scale.x, 0, 0,
    0, scale.y, 0,
    0, 0, 1
  ];
}

function matrixMultiply(/* args */) {
  // *arguments* does not inherit prototypical Array methods,
  // javascript is weird like this...
  var args = [].slice.call(arguments);

  if (args.length > 1) {
    var a = args[0];
    var b = args[1];

    var a00 = a[0*3+0], a01 = a[0*3+1], a02 = a[0*3+2];
    var a10 = a[1*3+0], a11 = a[1*3+1], a12 = a[1*3+2];
    var a20 = a[2*3+0], a21 = a[2*3+1], a22 = a[2*3+2];

    var b00 = b[0*3+0], b01 = b[0*3+1], b02 = b[0*3+2];
    var b10 = b[1*3+0], b11 = b[1*3+1], b12 = b[1*3+2];
    var b20 = b[2*3+0], b21 = b[2*3+1], b22 = b[2*3+2];

    var product = [a00 * b00 + a01 * b10 + a02 * b20,
                   a00 * b01 + a01 * b11 + a02 * b21,
                   a00 * b02 + a01 * b12 + a02 * b22,
                   a10 * b00 + a11 * b10 + a12 * b20,
                   a10 * b01 + a11 * b11 + a12 * b21,
                   a10 * b02 + a11 * b12 + a12 * b22,
                   a20 * b00 + a21 * b10 + a22 * b20,
                   a20 * b01 + a21 * b11 + a22 * b21,
                   a20 * b02 + a21 * b12 + a22 * b22];

    args = args.slice(2, args.length);
    args.unshift(product);
    // recursively compute the next product
    return matrixMultiply.apply(this, args);

  } else if (args.length == 0) {
    // identity matrix
    return [1, 0, 0,
            0, 1, 0,
            0, 0, 1];
  } else {
    return args[0];
  }
}

function setupSliders() {
  var xSlider = document.getElementById("x-slider");
  var ySlider = document.getElementById("y-slider");
  var degSlider = document.getElementById("deg-slider");
  var xScaleSlider = document.getElementById("x-scale-slider");
  var yScaleSlider = document.getElementById("y-scale-slider");

  var xLabel = document.getElementById("x-value");
  var yLabel = document.getElementById("y-value");
  var degLabel = document.getElementById("deg-value");
  var xScaleLabel = document.getElementById("x-scale-value");
  var yScaleLabel = document.getElementById("y-scale-value");

  var deg;

  xSlider.oninput = function(e) {
    translation.x = xLabel.innerHTML = parseInt(this.value);
    render();
  };

  ySlider.oninput = function(e) {
    translation.y = yLabel.innerHTML = parseInt(this.value);
    render();
  };

  degSlider.oninput = function(e) {
    deg = degLabel.innerHTML = parseInt(this.value);
    rotation.sin = Math.sin( degToRad(deg) );
    rotation.cos = Math.cos( degToRad(deg) );
    render();
  };

  xScaleSlider.oninput = function(e) {
    scale.x = xScaleLabel.innerHTML = parseFloat(this.value);
    render();
  };

  yScaleSlider.oninput = function(e) {
    scale.y = yScaleLabel.innerHTML = parseFloat(this.value);
    render();
  };
}

// Pentagon Class
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


function main() {
  p = new Pentagon(40);
  setupWebGL();
  setupSliders();
}

function render() {
  // clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  // compute matrices
  var translationMatrix = getTranslationMatrix();
  var rotationMatrix = getRotationMatrix();
  var scaleMatrix = getScaleMatrix();
  // multiply the matrices
  var resultMatrix = matrixMultiply(scaleMatrix, rotationMatrix, translationMatrix);
  // set the matrix
  gl.uniformMatrix3fv(program.matrix, false, resultMatrix);
  // draw
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


  // /* Buffer Setup
  // ** ************************ */
  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // throw data into buffer
  setPentagon(0, 0);


  /* Shader Vars
  ** ************************ */
  // atttributes
  program.position = gl.getAttribLocation(program, 'a_position');
  // uniforms
  program.color = gl.getUniformLocation(program, 'color');
  program.resolution = gl.getUniformLocation(program, 'resolution');
  program.matrix = gl.getUniformLocation(program, 'matrix');
  // assign data
  gl.enableVertexAttribArray(program.position);
  gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(program.color, [1, 1, 1, 1.0]);
  gl.uniform2f(program.resolution, canvas.width, canvas.height);


  /* Draw Shit
  ** ************************ */
  // gl.drawArrays(gl.TRIANGLES, 0, 9);
  render();
}

function setPentagon(x, y) {
  // /* Vertices
  // ** ************************ */
  var points = p.calculatePoints(x, y);
  var vertices = new Float32Array([
    // abc
    points.a.x, points.a.y,
    points.b.x, points.b.y,
    points.c.x, points.c.y,
    // abd
    points.a.x, points.a.y,
    points.b.x, points.b.y,
    points.d.x, points.d.y,
    // abe
    points.a.x, points.a.y,
    points.c.x, points.c.y,
    points.e.x, points.e.y
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}
