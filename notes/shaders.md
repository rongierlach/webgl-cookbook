From <a href="http://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html">WebGL Fundamentals</a>

Shaders
=======
## Vertex Shaders
A vertex shader's job is generate clipspace coordinates. It always takes the form:  
```
void main() {  
  gl_Position = doMathToMakeClipspaceCoordinates;
}
```  
The shader is called *once per vertex*. Each time it's called you are required to set the special global variable `gl_Position` to some clipspace coordinates.  
### Data
Vertex shaders need data. They can get that data in 3 ways.  

1. Attributes (data pulled from buffers)
2. Uniforms (values that stay the same during for all vertices of a single draw call)
3. Textures (data from pixels/texels)

#### Attributes  
Using buffers and attributes is the most common way.  
Given a shader:  
```
attribute vec4 attribute_name;

void main() {
  gl_Position = attribute_name;
}
```  
Here's how:
```
// create a buffer
var myBuffer = gl.createBuffer();

// put data in the buffer
gl.bindBuffer(gl.ARRAY_BUFFER, myBuffer);
gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

// given a shader program, look up the location of your attribute
var myAttribute = gl.getAttribLocation(program, "attribute_name");

// turn on getting data out of a buffer for this attribute
gl.enableVertexAttribArray(myAttribute);

// tell webgl how to pull data out of those buffers and into the attribute
var numComponents = 3; // (x, y, z)
var type = gl.FLOAT;
var normalize - false; // leave the values as they are
var offset = 0;        // start at the beginning of the buffer
var stride = 0;        // how many bytes to move to the next vertex
                       // 0 = use the correct streid for type and numComponents

gl.vertexAttribPointer(myAttribute, numComponents, type, normalize, stride, offset);
```  
Attributes can use `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, and `mat4` as types.  
  
#### Uniforms
Uniforms are values that stay the same for all vertices in a draw call.  
One example would be adding an offset for the given shader:  
```
attribute vec4 position;
uniform vec4 uniform_name;

void main() {
  gl_Position = position + uniform_Name;
}
```  
Here's how:  
```
// given a shader program, look up the location of your uniform, 
var myUniform = gl.getUniformLocation(program, "uniform_name");

// before drawing, set the uniform to some offset
gl.uniform4fv(my_uniform, [1, 0, 0, 0]); // offsetting to the right half of the screen
```  
Uniforms can be many types. For each type you need to call the corresponding function to set it:  
```
gl.uniform1f (floatUniformLoc, v);                 // for float
gl.uniform1fv(floatUniformLoc, [v]);               // for float or float array
gl.uniform2f (vec2UniformLoc,  v0, v1);            // for vec2
gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // for vec2 or vec2 array
gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // for vec3
gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // for vec3 or vec3 array
gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // for vec4
gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // for vec4 or vec4 array
 
gl.uniformMatrix2fv(mat2UniformLoc, false, [  4x element array ])  // for mat2 or mat2 array
gl.uniformMatrix3fv(mat3UniformLoc, false, [  9x element array ])  // for mat3 or mat3 array
gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16x element array ])  // for mat4 or mat4 array
 
gl.uniform1i (intUniformLoc,   v);                 // for int
gl.uniform1iv(intUniformLoc, [v]);                 // for int or int array
gl.uniform2i (ivec2UniformLoc, v0, v1);            // for ivec2
gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // for ivec2 or ivec2 array
gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // for ivec3
gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // for ivec3 or ivec3 array
gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // for ivec4
gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // for ivec4 or ivec4 array
 
gl.uniform1i (sampler2DUniformLoc,   v);           // for sampler2D (textures)
gl.uniform1iv(sampler2DUniformLoc, [v]);           // for sampler2D or sampler2D array
 
gl.uniform1i (samplerCubeUniformLoc,   v);         // for samplerCube (textures)
gl.uniform1iv(samplerCubeUniformLoc, [v]);         // for samplerCube or samplerCube array
```  
There's also types `bool`, `bvec2`, `bvec3`, and `bvec4`. They use either the `gl.uniform?f?` or `gl.uniform?i?` functions.  

#### Textures
See below...

## Fragment Shader
A fragment shader's job is to provide a color for the current pixel being rasterized. It always takes the form:  
```
void main() {  
  gl_Position = doMathToMakeClipspaceCoordinates;
}
```  
### Data
Fragment shaders need data. They can get that data in 3 ways.

1. Uniforms  (values that stay the same for every pixel of a single draw call)
2. Textures  (data from pixels/texels)
3. Varyings  (data passed from the vertex shader and interpolated)

#### Uniforms
See above...  

#### Textures
Getting a value from a teture in a shader we create a `sampler2D` uniform and use th eGLSL function `texture 2D` to extract a value from it like so:  
```
precision mediump float;
 
uniform sampler2D uniform_name;
 
void main() {
   vec2 texcoord = vec2(0.5, 0.5)  // get a value from the middle of the texture
   gl_FragColor = texture2D(uniform_name, texcoord);
}
```  
What data comes out of the texture is dependent on many settings. At a minimum we need to create and put data in the texture, for example:  
```
var tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
var level = 0;
var width = 2;
var height = 1;
var data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

// look up the uniform location in the shader program
var myUniform = gl.getUniformLocation(program, "uniform_name");

// webgl then requires you to bind it to a texture unit
var unit = 5;  // Pick some texture unit
gl.activeTexture(gl.TEXTURE0 + unit);
gl.bindTexture(gl.TEXTURE_2D, tex);

// and tell the shader which unit you bound the texture to
gl.uniform1i(myUniform, unit);
```  
#### Varyings
A varying is a way to pass a value from a vertex shader to a fragment shader. To use a varying we need to declare matching varyings in both a vertex and fragment shader. We set the varying in the vertex shader with some value per vertex. When WebGL draws pixels it will interpolate between those values and pass them to the corresponding varying in the fragment shader.  
An impractical but valid example:  

```
// Vertex Shader
attribute vec4 a_position;
 
uniform vec4 u_offset;
 
varying vec4 v_positionWithOffset;
 
void main() {
  gl_Position = a_position + u_offset;
  v_positionWithOffset = a_position + u_offset;
}
``` 

```
// Fragment Shader
precision mediump float;
 
varying vec4 v_positionWithOffset;
 
void main() {
  // convert from clipsapce (-1 <-> +1) to color space (0 -> 1).
  vec4 color = v_positionWithOffset * 0.5 + 0.5
  gl_FragColor = color;
}
```  
