window.onload = loadImg;
// globals
var pentagon, canvas, gl, program, buffer, textureBuffer;

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

// Runtime functions
function loadImg() {
  var img = new Image();
  img.src = "./image.png";
  img.onload = function() { main(img); }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  // compute matrices
  var projectionMatrix = getProjectionMatrix();
  // set the matrix
  gl.uniformMatrix3fv(program.matrix, false, projectionMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function main(img) {
  pentagon = new Pentagon(100);

  /* Canvas & Context
  ** ************************ */
  canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  document.body.appendChild(canvas);
  gl = canvas.getContext("webgl");

  /* Clear Color
  ** ************************ */
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  /* Shader Setup
  ** ************************ */
  // Compile Vertex Shader
  var v_shader = gl.createShader(gl.VERTEX_SHADER);
  var v_shader_source = document.getElementById("vertex-shader").text;
  gl.shaderSource(v_shader, v_shader_source);
  gl.compileShader(v_shader);
  // Compile Fragment Shader
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
  program.texture_coordinate = gl.getAttribLocation(program, 'a_texture_coordinate');
  // uniforms
  program.matrix = gl.getUniformLocation(program, 'u_matrix');

  /* Buffer Setup
  ** ************************ */
  // texture buffer
  textureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(program.texture_coordinate);
  gl.vertexAttribPointer(program.texture_coordinate, 2, gl.FLOAT, false, 0, 0);
  setTexture(img);
  // geometry buffer
  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(program.position);
  gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);
  setPentagon(canvas.width/2, canvas.height/2);

  /* Draw Shit
  ** ************************ */
  render();
}

function setTexture(image) {
  // Create a texture
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

/* Helper Functions
** ************************ */
// math
function sq(n) { return n * n; }
function sqrt(n) { return Math.sqrt(n); }
function degToRad(deg) { return deg * Math.PI / 180; }

// matrices
function getProjectionMatrix() {
  return [
    2 / canvas.width, 0, 0,
    0, -2 / canvas.height, 0,
    -1, 1, 1
  ];
}

function matrixMultiply(/* args */) {
  // *arguments* does not inherit prototypical Array methods,
  // javascript is weird like this...
  var args = [].slice.call(arguments);
  if (args.length > 1) {
    var a = args[0];
    var b = args[1];
    // https://en.wikibooks.org/wiki/GLSL_Programming/Vector_and_Matrix_Operations
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
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  } else { return args[0]; }
}

// pentagon
function setPentagon(x, y) {
  // /* Vertices
  // ** ************************ */
  var points = pentagon.calculatePoints(x, y);
  var vertices = new Float32Array([
    // abc
    // points.a.x, points.a.y,
    // points.b.x, points.b.y,
    // points.c.x, points.c.y,
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
