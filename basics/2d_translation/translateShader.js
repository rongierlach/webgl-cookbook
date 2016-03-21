window.onload = main;

// Variables to hold the translation
var canvas, gl, p, side_length;
var px = 200, py = 150;
var translation = {x: 0, y: 0};

// Helper functions
function sq(n) {
  return n * n;
}

function sqrt(n) {
  return Math.sqrt(n);
}

function setupSliders() {
  var xSlider = document.getElementById("x-slider")
  var ySlider = document.getElementById("y-slider")

  var xLabel = document.getElementById("x-value")
  var yLabel = document.getElementById("y-value")

  xSlider.oninput = function(e) {
    translation.x = xLabel.innerHTML = parseInt(this.value);
    render();
  };

  ySlider.oninput = function(e) {
    translation.y = yLabel.innerHTML = parseInt(this.value);
    render();
  }
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
  // set translation
  // Set the translation
  gl.uniform2f(program.translation, translation.x, translation.y);
  // gl.uniform2fv(program.translation, [translation.x, translation.y]);
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
  setPentagon(canvas.width / 2, canvas.height / 2);


  /* Shader Vars
  ** ************************ */
  // atttributes
  program.position = gl.getAttribLocation(program, 'a_position');
  // uniforms
  program.color = gl.getUniformLocation(program, 'color');
  program.resolution = gl.getUniformLocation(program, 'resolution');
  program.translation = gl.getUniformLocation(program, 'translation');
  // assign data
  gl.enableVertexAttribArray(program.position);
  gl.uniform2f(program.resolution, canvas.width, canvas.height);


  /* Draw Shit
  ** ************************ */
  gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(program.color, [1, 1, 1, 1.0]);
  gl.drawArrays(gl.TRIANGLES, 0, 9);
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
