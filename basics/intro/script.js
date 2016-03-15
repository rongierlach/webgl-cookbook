window.onload = main

function main() {
  render()
}

function render() {
  /* Canvas & Context
  ** ************************ */
  var canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  var gl = canvas.getContext("webgl");

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
  var program = gl.createProgram();
  gl.attachShader(program, v_shader);
  gl.attachShader(program, f_shader);
  gl.linkProgram(program);
  gl.useProgram(program);


  /* Vertices
  ** ************************ */
  var rect_vertices = new Float32Array([
    0.25, -0.5,
    0.25, 0.5,
    0.75, 0.5,
    0.25, -0.5,
    0.75, 0.5,
    0.75, -0.5
  ]);

  var tri_vertices = new Float32Array([
    -0.75, -0.5,
    -0.5, 0.5,
    -0.25, -0.5
  ]);


  /* Buffer Setup
  ** ************************ */
  rect_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, rect_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, rect_vertices, gl.STATIC_DRAW);

  tri_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tri_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, tri_vertices, gl.STATIC_DRAW);


  /* Shader Vars
  ** ************************ */
  program.position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(program.position)
  program.color = gl.getUniformLocation(program, 'color');


  /* Draw Shit
  ** ************************ */
  // rectangle
  gl.bindBuffer(gl.ARRAY_BUFFER, rect_buffer);
  gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0)
  gl.uniform4fv(program.color, [1, 1, 1, 1.0])
  gl.drawArrays(gl.TRIANGLES, 0, 6)
  // triangle
  gl.bindBuffer(gl.ARRAY_BUFFER, tri_buffer);
  gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0)
  gl.uniform4fv(program.color, [0.5, 0.5, 0.5, 1.0])
  gl.drawArrays(gl.TRIANGLES, 0, 3)


}
