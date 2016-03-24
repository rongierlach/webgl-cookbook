From <a href="http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html">WebGL Fundamentals</a>

Matrices
========
## Transformations
Each transformation (translation, rotation, scale) requires changes to the shader.  
Instead of holding each transformation in a uniform and applying them in order on the shader,  
we can use matrix math to do all the same things and apply the result matrix only once.  

## Matrices
For 2D we use a 3x3 matrix. A 3x3 matrix is like a grid with 9 boxes:
```
1.0 | 2.0 | 4.0
---------------
4.0 | 5.0 | 6.0
---------------
7.0 | 8.0 | 9.0
```  

## Matrix-wise Operation
To do the math we multiply the position down the columns of the matrix and add up the results.
Our positions only have 2 values, x and y, but to do this math we need 3 values so we'll use 1 for the third value.
Say we want to translate, to do the math we would make a matrix like this:
```
1.0 | 0.0 | 0.0
---------------
0.0 | 1.0 | 0.0
---------------
 tx |  ty | 1.0

```  
And now, we can do our math like so:  
```
translated_x = x * | 1.0 | +
                   -------
               y * | 0.0 | +
                   -------
               1 * |  tx |

// or more succintly...
translated_x = x * 1.0 + y * 0.0 + 1.0 * tx
translated_x = x + tx
```
