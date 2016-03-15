/* GLOBAL VARS
** ******************** */
COLORS = {
  white:      {r: 222/255, g: 222/255, b: 224/255, a: 1},
  red:        {r: 182/255, g:  51/255, b:  32/255, a: 1},
  blue:       {r:  32/255, g:  51/255, b: 136/255, a: 1},
  yellow:     {r: 212/256, g: 199/256, b:  68/255, a: 1},
  black:      {r:  19/255, g:  19/255, b:  19/255, a: 1},
  line_black: {r:  40/255, g:  40/255, b:  40/255, a: 1}
};
COLORS_ARR    = ['red', 'blue', 'yellow', 'black'];
FULL_LINES    = 4;
MIN_LINES     = 2;
MAX_LINES     = 6;
LINE_WIDTH    = 10;
artwork_data  = { lines: [], rectangles: [] };
canvas = null, gl = null, positionLocation = null, resolutionLocation = null, colorLocation = null;


/* GLOBAL HELPERS
** ******************** */
function setupHelpers() {
  // get random int between 0 and range - 1
  randomInt = function(range) {
    return Math.floor(Math.random() * range);
  } ;
  // sample an array
  Object.prototype.sample = function () {
    if (this.length || this.length == 0) {
      return this[randomInt(this.length)];
    }
  };
  // download a png of the current canvas
  downloadCanvas = function(link, canvasId, filename) {
    link.href = document.getElementById(canvasId).toDataURL();
    link.download = filename;
  };
}


/* MAIN
** ******************** */
function main() {
  // Setup helpers
  setupHelpers();

  // Get A WebGL context
  canvas = document.getElementById("canvas");
  gl = canvas.getContext("webgl", {antialias: false, preserveDrawingBuffer: true});

  // setup a GLSL program
  program = gl.createProgram();

  // setup shaders
  setupShaders();
  
  // Lookup where the vertex data needs to go.
  positionLocation = gl.getAttribLocation(program, "a_position");

  // Lookup uniforms
  resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  colorLocation = gl.getUniformLocation(program, "u_color");

  // Set resolution
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  // Bind buffer.
  bindBuffer();
  
  // Set clear color
  gl.clearColor(COLORS.white.r, COLORS.white.g, COLORS.white.b, COLORS.white.a);
  clearCanvas();
  
  // bind click handlers
  // document.getElementById('clear').onclick = function () {
  //   e.preventDefault();
  //   clearCanvas();
  // };
  document.getElementById('random').onclick = function (e) {
    e.preventDefault();
    var overlay = document.getElementById('overlay');
    if (overlay) { overlay.remove(); }
    clearCanvas();
    generateRandom();
  };
  document.getElementById('download').onclick = function (e) {
    downloadCanvas(this, 'canvas', 'make-mondrian.png');
  };

  // generate random mondrian artwork
  generateRandom();
}


/* DRAWING FUNCTIONS
** ******************** */
// Draws a random Mondrian
function generateRandom() {
  // determine number of lines to draw
  var num_lines = MAX_LINES - randomInt(MAX_LINES + 1 - MIN_LINES);
  var num_rects = Math.floor(num_lines / 2 + 1);
  // add full lines
  for (var i = 0; i < FULL_LINES; i++) {
    var x = 10 * randomInt(canvas.width / 10);
    var y = 10 * randomInt(canvas.height / 10);
    var orientation = ['horizontal', 'vertical'][i % 2];
    addFullLine(x, y, orientation);
  }
  // add the lines
  for (var i = 0; i < num_lines; i++) {
    var x = 10 * randomInt(canvas.width / 10);
    var y = 10 * randomInt(canvas.height / 10);
    var orientation = ['horizontal', 'vertical'].sample();
    // var orientation = ['horizontal', 'vertical'][i % 2];
    addLine(x, y, orientation);
  }
  // add the rectangles
  for (var i = 0; i < num_rects; i++) {
    var x = randomInt(canvas.width);
    var y = randomInt(canvas.height);
    addRect(x, y);
  }
  // draw the data
  drawData();
}

// Creates buffer
function bindBuffer() {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
}

function setupShaders() {
  var vShader       = gl.createShader(gl.VERTEX_SHADER);
  var fShader       = gl.createShader(gl.FRAGMENT_SHADER);
  var vShaderSource = document.getElementById("vertex-shader").text;
  var fShaderSource = document.getElementById("fragment-shader").text;

  gl.shaderSource(vShader, vShaderSource);
  gl.compileShader(vShader);
  gl.shaderSource(fShader, fShaderSource);
  gl.compileShader(fShader);
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  gl.useProgram(program);
}

// Clears the artwork
function clearCanvas() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  artwork_data = { lines: [], rectangles: [] };
}

// add a full line
function addFullLine(x, y, orientation) {
  var new_line = {x: null, y: null, orientation: orientation, length: null};
  var _x, _y, _length;
  if (orientation == 'horizontal') {
    _x = 0;
    _y = y;
    _length = canvas.width;
  } else { // vertical
    _x = x;
    _y = 0;
    _length = canvas.height;
  }
  new_line.x = _x, new_line.y = _y, new_line.length = _length;
  // add line to artwork data
  artwork_data.lines.push(new_line); 
}

// add a line
function addLine(x, y, orientation) {
  var new_line = {x: null, y: null, orientation: orientation, length: null};
  var _x, _y, _length, min_edge, max_edge;
  // determine edges
  for (var i = 0; i < artwork_data.lines.length; i++) {
    var line = artwork_data.lines[i];
    if (orientation == 'horizontal' && line.orientation == 'vertical' && (y > line.y && y < line.y + line.length)) {
      if (!min_edge  && line.x < x)        { min_edge = line.x + LINE_WIDTH; }
      if (!max_edge  && line.x > x)        { max_edge = line.x;              }
      if (line.x < x && line.x > min_edge) { min_edge = line.x + LINE_WIDTH; }
      if (line.x > x && line.x < max_edge) { max_edge = line.x;              }
    }
    if (orientation =='vertical' && line.orientation == 'horizontal' && (x > line.x && x < line.x + line.length)) {
      if (!min_edge  && line.y < y)        { min_edge = line.y + LINE_WIDTH; }
      if (!max_edge  && line.y > y)        { max_edge = line.y;              }
      if (line.y < y && line.y > min_edge) { min_edge = line.y + LINE_WIDTH; }
      if (line.y > y && line.y < max_edge) { max_edge = line.y;              }
    }
  }
  if (orientation == 'horizontal') {
    _x = min_edge ? min_edge : 0;
    _y = y;
    _length = max_edge ? max_edge - _x : canvas.width - _x;
  } else { // vertical
    _x = x;
    _y = min_edge ? min_edge : 0;
    _length = max_edge ? max_edge - _y : canvas.height - _y;
  }
  new_line.x = _x, new_line.y = _y, new_line.length = _length;
  // add line to artwork data
  artwork_data.lines.push(new_line); 
}

function addRect(x, y) {
  var rect = { x: null, y: null, width: null, height: null};
  var _x, _y, _width, _height;
  var min_edge_x, max_edge_x, min_edge_y, max_edge_y;
  for (var i = 0; i < artwork_data.lines.length; i++) {
    var line = artwork_data.lines[i];
    if (line.orientation == 'vertical' && (y > line.y && y < line.y + line.length)) {
      if (!min_edge_x && line.x < x)         { min_edge_x = line.x + LINE_WIDTH; }
      if (!max_edge_x && line.x > x)         { max_edge_x = line.x;              }
      if (line.x < x && line.x > min_edge_x) { min_edge_x = line.x + LINE_WIDTH; }
      if (line.x > x && line.x < max_edge_x) { max_edge_x = line.x;              }
    }
    if (line.orientation == 'horizontal' && (x > line.x && x < line.x + line.length)) {
      if (!min_edge_y && line.y < y)         { min_edge_y = line.y + LINE_WIDTH; }
      if (!max_edge_y && line.y > y)         { max_edge_y = line.y;              }
      if (line.y < y && line.y > min_edge_y) { min_edge_y = line.y + LINE_WIDTH; }
      if (line.y > y && line.y < max_edge_y) { max_edge_y = line.y;              }
    }
  }
  _x = min_edge_x ? min_edge_x : 0;
  _y = min_edge_y ? min_edge_y : 0;
  _width = max_edge_x ? max_edge_x - _x : canvas.width - _x;
  _height = max_edge_y ? max_edge_y - _y : canvas.height - _y;
  rect.x = _x, rect.y = _y, rect.width = _width, rect.height = _height;
  // add rect to artwork data
  artwork_data.rectangles.push(rect); 
}

function drawData() {
  // data
  var lines = artwork_data.lines
  var rectangles = artwork_data.rectangles
  // draw rectangles
  for (var i = 0; i < rectangles.length; i++) {
    var rect = rectangles[i];
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    var color = COLORS[COLORS_ARR.sample()];
    drawRectangle(x, y, width, height, color);
    // console.log("Rect: (" + x + ", " + y + ") " + rect.width + " " + rect.height);
  }
  // draw lines
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var x = line.x; y = line.y, width = null, height = null;
    if (line.orientation == "horizontal") {    
      width = line.length;
      height = LINE_WIDTH;
    } else { // vertical
      width = LINE_WIDTH;
      height = line.length;
    }
    var color = COLORS.line_black;
    drawRectangle(x, y, width, height, color);
    // console.log("Line: (" + x + ", " + y + ") " + line.length + " " + line.orientation);
  }
}

// Draws a rectangle
function drawRectangle(x, y, width, height, color) {
  setRectangle(x, y, width, height);
  gl.uniform4f(colorLocation, color.r, color.g, color.b, color.a);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Fill the buffer with the values that define a rectangle.
function setRectangle(x, y, width, height) {
  var x1 = x, x2 = x + width;
  var y1 = y, y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2]), gl.STATIC_DRAW);
}