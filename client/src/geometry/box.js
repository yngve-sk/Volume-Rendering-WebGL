 /**
  * Array of the indices of corners of each face of a cube.
  * @type {Array.<number[]>}
  */
 var CUBE_FACE_INDICES = [
  [3, 7, 5, 1], // right
  [6, 2, 0, 4], // left
  [6, 7, 3, 2], // ??
  [0, 1, 5, 4], // ??
  [7, 6, 4, 5], // front
  [2, 3, 1, 0], // back
 ];


/**
  * Add `push` to a typed array. It just keeps a 'cursor'
  * and allows use to `push` values into the array so we
  * don't have to manually compute offsets
  * @param {TypedArray} typedArray TypedArray to augment
  * @param {number} numComponents number of components.
  */
 function augmentTypedArray(typedArray, numComponents) {
  var cursor = 0;
  typedArray.push = function() {
   for (var ii = 0; ii < arguments.length; ++ii) {
    var value = arguments[ii];
    if (value instanceof Array ||(value.buffer && value.buffer instanceof ArrayBuffer)) {
     for (var jj = 0; jj < value.length; ++jj) {
      typedArray[cursor++] = value[jj];
     }
    } else {
     typedArray[cursor++] = value;
    }
   }
  };
  typedArray.reset = function(opt_index) {
   cursor = opt_index ||0;
  };
  typedArray.numComponents = numComponents;
  Object.defineProperty(typedArray, 'numElements', {
   get: function() {
    return this.length / this.numComponents | 0;
   },
  });
  return typedArray;
 }



function createAugmentedTypedArray(numComponents, numElements, opt_type) {
  var Type = opt_type ||Float32Array;
  return augmentTypedArray(new Type(numComponents * numElements), numComponents);
 }


/**
 * Creates the vertices and indices for a cube.
 *
 * The cube is created around the origin. (-size / 2, size / 2).
 *
 * @param {number} [size] width, height and depth of the cube.
 * @return {Object.<string, TypedArray>} The created vertices.
 * @memberOf module:twgl/primitives
 */
function createCuboidVertices(width, height, depth) {
  width = width ||1;
  height = height ||1;
  depth = depth ||1;

  let kx = width / 2,
    ky = height / 2,
    kz = depth / 2;

  var cornerVertices = [
   [-kx, -ky, -kz],
   [+kx, -ky, -kz],
   [-kx, +ky, -kz],
   [+kx, +ky, -kz],
   [-kx, -ky, +kz],
   [+kx, -ky, +kz],
   [-kx, +ky, +kz],
   [+kx, +ky, +kz],
  ];

  var faceNormals = [
   [+1, +0, +0],
   [-1, +0, +0],
   [+0, +1, +0],
   [+0, -1, +0],
   [+0, +0, +1],
   [+0, +0, -1],
  ];

  var uvCoords = [
   [1, 0],
   [0, 0],
   [0, 1],
   [1, 1],
  ];

  var numVertices = 6 * 4;
  var positions = createAugmentedTypedArray(3, numVertices);
  var normals = createAugmentedTypedArray(3, numVertices);
  var texcoords = createAugmentedTypedArray(2, numVertices);
  var indices = createAugmentedTypedArray(3, 6 * 2, Uint16Array);

  for (var f = 0; f < 6; ++f) {
    var faceIndices = CUBE_FACE_INDICES[f];
    for (var v = 0; v < 4; ++v) {
      var position = cornerVertices[faceIndices[v]];
      var normal = faceNormals[f];
      var uv = uvCoords[v];

      // Each face needs all four vertices because the normals and texture
      // coordinates are not all the same.
      positions.push(position);
      normals.push(normal);
      texcoords.push(uv);

    }
    // Two triangles make a square face.
    var offset = 4 * f;
    indices.push(offset + 0, offset + 1, offset + 2);
    indices.push(offset + 0, offset + 2, offset + 3);
  }

  return {
    position: positions,
    normal: normals,
    texcoord: texcoords,
    indices: indices,
  };
}

module.exports = createCuboidVertices;
