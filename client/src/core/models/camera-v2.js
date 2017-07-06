let twgl = require('twgl.js'),
  m4 = twgl.m4,
  v3 = twgl.v3;

let glmvec4 = require('gl-matrix').vec4;

let Quat = require('gl-matrix').quat;
let _ = require('underscore');

console.log(Quat);

class Camera {
  constructor(args) {



    this.radius = args.radius ||5.2;
    this.refRadius = this.radius;

    this.zoomFactor = 1.0;

    this.theta = args.theta ||  Math.PI / 3.0;
    this.phi = args.phi ||Math.PI / 3.0;

    this.eye = null; // Will be cached
    this.target = args.target ||v3.create(0, 0, 0);

    this.projectionSettings = args.projectionSettings ||{
      fieldOfViewRadians: Math.PI / 10,
      aspectRatio: 1, // Initial
      zNear: 0.5,
      zFar: 15.0
    };

    this.ROT_SPEED_X = args.ROT_SPEED_X ||3.5;
    this.ROT_SPEED_Y = args.ROT_SPEED_Y ||3.5;

    this.PAN_SPEED_X = args.PAN_SPEED_X ||1.8;
    this.PAN_SPEED_Y = args.PAN_SPEED_Y ||1.8;

    this.ZOOM_SPEED = args.ZOOM_SPEED ||3.5;

    this.projection = null;
    this.view = null;
    this.translationVec = v3.create(0, 0, 0);


    this.mouseCache = {
      isDrag: false,
      mousedown: false,
      mx: -1,
      my: -1,
      uv: null
    }

    this.slaves = {
      rotation: [],
      radius: []
    };

    this.upDir = 1;
    this.mode = "perspective";

    this._updateViewMatrix();
    this.setPerspective({});

  }

  linkTo(master, properties, callback) {
    for (let property of properties)
      master.listen(this, property, callback);
  }

  listen(slave, property, callback) {
    this.slaves[property].push({
      slave: slave,
      callback: callback
    });
  }

  _notifySlaves(property) {
    switch (property) {
      case 'rotation':
        for (let slaveInfo of this.slaves[property]) {
          slaveInfo.slave.theta = this.theta;
          slaveInfo.slave.phi = this.phi;
          slaveInfo.slave.mode = this.mode;
          slaveInfo.slave.upDir = this.upDir;
          slaveInfo.slave._updateViewMatrix();
          slaveInfo.callback();
        }
        break;
      case 'radius':
        for (let slaveInfo of this.slaves[property]) {
          slaveInfo.slave.radius = this.radius;
          slaveInfo.slave._updateViewMatrix();
          slaveInfo.callback();
        }
        break;
      default:
        break;
    }
  }

  killSlaves() {
    this.slaves.rotation = [];
    this.slaves.radius = [];
  }

  rotate(dTheta, dPhi) {
    let dtheta = this.ROT_SPEED_X * dTheta;

    if (this.upDir > 0) {
      this.theta += this.ROT_SPEED_X * dTheta;
    } else {
      this.theta -= this.ROT_SPEED_X * dTheta;
    }

    // Offset Phi as to make it 90 degrees
    this.phi += this.ROT_SPEED_Y * dPhi;

    let _2PI = Math.PI * 2;

    if (this.phi > _2PI)
      this.phi -= _2PI;
    else if (this.phi < -_2PI)
      this.phi += _2PI;

    if ((0 < this.phi && this.phi < Math.PI) ||  (-_2PI < this.phi && this.phi < -Math.PI)) {
      this.upDir = 1;
    } else {
      this.upDir = -1;
    }

    //this.phi = Math.PI/2;

    this._updateViewMatrix();
    this._notifySlaves('rotation');
  }

  zoom(dist) {
    console.log("ZOOM " + dist);
    //this.radius -= dist * this.ZOOM_SPEED;

    this.zoomFactor += dist * this.ZOOM_SPEED;
    this._updateZoom();

    this._updateViewMatrix();

    if(this.mode === 'ortho')
      this.setOrtho();

    this._notifySlaves('radius');
  }

  _updateZoom() {
    // perspective zoom
    this.radius = this.zoomFactor * this.refRadius;
  }

  pan(dx, dy) {
    this.translationVec[0] += dx * this.PAN_SPEED_X;
    this.translationVec[1] -= dy * this.PAN_SPEED_Y;
  }

  tick() {
    // TODO
  }

  getEyePosition() {
    /*
        let x = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        let y = this.radius * Math.cos(this.phi);
        let z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
    */

    let x = this.radius * Math.sin(this.phi + Math.PI/2) * Math.sin(this.theta);
    let y = this.radius * Math.cos(this.phi + Math.PI/2);
    let z = this.radius * Math.sin(this.phi + Math.PI/2) * Math.cos(this.theta);

    this.eye = v3.create(x, y, z);
    return this.eye;
  }

  toCartesian() {
    let eye = this.getEyePosition();
    let look = v3.normalize(eye);

    let worldUp = v3.create(0.0, this.upDir, 0.0);

    let right = v3.normalize(v3.cross(look, worldUp));
    let up = v3.normalize(v3.cross(look, right));

    return {
      eye: eye,
      right: right,
      up: up,
      target: this.target
    }
  }

  setPerspective(args) {
    if(!args)
      args = {};
    else
      this._updateProjectionSettings(args);

    this.projection = m4.perspective(
      args.fieldOfViewRadians ||this.projectionSettings.fieldOfViewRadians,
      args.aspectRatio ||this.projectionSettings.aspectRatio,
      args.zNear ||this.projectionSettings.zNear,
      args.zFar ||this.projectionSettings.zFar
    );
  }

  _updateProjectionSettings(args) {
    for(let key in args) {
      this.projectionSettings[key] = args[key];
    }
  }

  setOrtho(args) {
    // Use near plane

    if(!args)
      args = {};
    else
      this._updateProjectionSettings(args);


    let zNear = args.zNear ||  this.projectionSettings.zNear,
      zFar = args.zFar ||  this.projectionSettings.zFar,
      ar = args.aspectRatio ||this.projectionSettings.aspectRatio,
      fovy = args.fieldOfViewRadians ||  this.projectionSettings.fieldOfViewRadians;


    let zStep = (13 * this.zoomFactor / 50.0); // 1 = use zFar plane, 0 = use zNear

    let near2Far = zFar - zNear,
      orthoPlaneZ = zNear + zStep * near2Far;

    // Use AR to get center2sidesX, ar = w/h => w = ar*h
    let center2sidesY = orthoPlaneZ * Math.tan(fovy / 2),
      center2sidesX = center2sidesY * ar;

    let top = center2sidesY,
      right = center2sidesX,
      bottom = -center2sidesY,
      left = -center2sidesX;

    // use same zNear / far as perspective camera

    this.projection = m4.ortho(left, right, top, bottom, zNear, zFar);
  }

  changeState(args) {
    if(args.mode) {
      if(args.mode === 'ortho') {
        this.setOrtho();
      } else if(args.mode === 'perspective') {
        this.setPerspective();
      } else {
        console.error("Invalid mode " + args.mode);
      }
      this.mode = args.mode;
    }

    if(args.align) {
      // TODO
    }

    if(args.zoom) {
      //TODO!
    }
  }

  _updateViewMatrix() {
    let c = this.toCartesian();

    let rad2deg = (rad) => {
      return rad * 180 / Math.PI;
    }

    console.log("zoom factor = " + this.zoomFactor);
    console.log("PHI = " + rad2deg(this.phi));
    console.log("THETA = " + rad2deg(this.theta));
    console.log("POS = " + '(' +
      c.eye[0] + ', ' + c.eye[1] + ', ' + c.eye[2] + ')');
    console.log("UP = " + c.up[0] + ', ' + c.up[1] + ', ' + c.up[2] + ')');
    console.log("-----------------");
    console.log("-----------------");

    let lookat = m4.lookAt(c.eye, c.target, c.up);

    this.view = m4.inverse(lookat);
    /*
        let zaxis = v3.normalize(v3.subtract(c.eye, c.target)); // The "forward" vector.
        let xaxis = v3.normalize(v3.cross(c.up, zaxis)); // The "right" vector.
        let yaxis = v3.normalize(v3.cross(zaxis, xaxis)); // The "up" vector.

        // Create a 4x4 orientation matrix from the right, up, and forward vectors
        // This is transposed which is equivalent to performing an inverse
        // if the matrix is orthonormalized (in this case, it is).
        let orientation = [
          xaxis[0], yaxis[0], zaxis[0], 0,
          xaxis[1], yaxis[1], zaxis[1], 0,
          xaxis[2], yaxis[2], zaxis[2], 0,
          0, 0, 0, 1
        ];

        // Create a 4x4 translation matrix.
        // The eye position is negated which is equivalent
        // to the inverse of the translation matrix.
        // T(v)^-1 == T(-v)
        let translation = [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          -c.eye[0], -c.eye[1], -c.eye[2], 1
        ];

        this.view = m4.multiply(orientation, translation);*/
  }

  getWorldViewProjectionMatrix(aspectRatio) {
    if (aspectRatio)
      if (this.mode === "perspective")
        this.setPerspective({
          aspectRatio: aspectRatio
        });
      else {
        this.setOrtho({
          aspectRatio: aspectRatio
        })
      }

    // no world matrix, not needed ATM.

    return m4.multiply(m4.translation(this.translationVec), m4.multiply(this.projection, this.view));
  }

  __unproject(devX, devY, devZ) {

    let inverseVP = m4.inverse(m4.multiply(this.projection, this.view));

    let homogenous = glmvec4.fromValues(devX, devY, devZ, 1.0);
    let p = glmvec4.transformMat4(homogenous, homogenous, inverseVP),
      w = p[3];

    // Divide by w also
    return v3.create(p[0] / w, p[1] / w, p[2] / w);
  }

  getRayFromMouseClick(vp01) {

    // [0,1] -> [-1,1]
    let device = {
      x: vp01.x * 2.0 - 1.0,
      y: -(vp01.y * 2.0 - 1.0) // Flip y
    };

    let p0 = this.__unproject(device.x, device.y, -1);
    let p1 = this.__unproject(device.x, device.y, 1);

    let homogenous = glmvec4.fromValues(device.x, device.y, -1.0, 1.0);

    let inverseView = m4.inverse(this.view),
      inverseP = m4.inverse(this.projection);

    let rayFromEye = glmvec4.transformMat4(glmvec4.create(), homogenous, inverseP);
    rayFromEye[2] = -1; // z
    rayFromEye[3] = 1; // w

    let rayFromEyeWORLD = glmvec4.transformMat4(glmvec4.create(), rayFromEye, inverseView);
    rayFromEyeWORLD = v3.negate(v3.normalize(v3.create(rayFromEyeWORLD[0], rayFromEyeWORLD[1], rayFromEyeWORLD[2])));

    let rayV2 = v3.normalize(v3.subtract(p1, p0));

    return new Ray(this.getEyePosition(), rayV2, this.size);
    //return new Ray(p0, rayV2);

    //return {
    //  eye: this.getEyePosition(),
    //  ray: rayFromEyeWORLD
    //};
  }

  /* click(event) {
    console.log("CLICK!");
    console.log(event);
    return rayInfo = this.getRayFromMouseClick(event.pos);
  }
*/
  /* mouse(event) {
     //console.log("Camera received event!");
     //console.log(event);

     let ROT_SPEED = 5;
     let TRANS_SPEED = 5;

     if (event.type === 'mousedown') {
       this.mouseCache.mousedown = true;

       this.mouseCache.mx = event.pos.x;
       this.mouseCache.my = event.pos.y;

       return;
     } else if (event.type === 'mouseup') {
       if (!this.mouseCache.isDrag)
         return this.click(event);

       this.mouseCache.mousedown = false;
       this.mouseCache.isDrag = false;
       return;
     } else if (event.type === 'mousemove') {
       if (!this.mouseCache.mousedown) {
         return {this.getRayFromMouseClick(event.pos)};
       }

       let dx = event.pos.x - this.mouseCache.mx;
       let dy = event.pos.y - this.mouseCache.my;

       this.mouseCache.isDrag = true;

       this.mouseCache.mx = event.pos.x;
       this.mouseCache.my = event.pos.y;

       dx *= ROT_SPEED;
       dy *= ROT_SPEED;

       switch (event.button) {
         case 0: // left -> rotate
           //          this.modelTransformation.rotateYZ(-1*dy, dx);
           this.rotate(dx, dy);
           this._updateViewMatrix();
           break;
         case 1: // middle -> zoom

           this.zoom(dx + dy);
           this._updateViewMatrix();
           break;
         case 2: // right
           break;
         default:
           break;
       }
     }
   }*/
}
module.exports = Camera;


class Ray {
  constructor(eye, dir, bbSize) {
    this.eye = eye; // float32array[3]
    this.dir = dir;
    this.bbSize = bbSize;
  }

  intersectsLine(p0, p1, threshold) {
    let eye1 = this.eye,
      eye2 = v3.add(this.eye, this.dir);

    let dist1 = this._closestDistanceBetweenLines(eye1, eye2, p0, p1),
      dist2 = this._closestDistanceBetweenLines(eye1, eye2, p1, p0); // Check both ways to stay on the line

    let doesIntersect = Math.abs(dist1) === Math.abs(dist2) &&
      dist1 <= threshold;


  }

  intersectsPlaneV2(p0, n) {
    // (p - p0) * n = 0
    // this line is this.eye + d*this.dir

    // d*this.dir dot n + (this.eye - p0) dot n = 0

    let p0_minus_eye = v3.subtract(p0, this.eye);

    let top = v3.dot(p0_minus_eye, n);
    let dir_dot_n = v3.dot(v3.normalize(this.dir), n);

    if (dir_dot_n === 0) // parallel {
      return null;
    else {
      let distance = top / dir_dot_n;
      let intersectPoint = v3.add(this.eye, v3.mulScalar(v3.normalize(this.dir), distance));
      return {
        distance: distance,
        point: intersectPoint
      };
    }

  }




  intersectsPlane(p0, dx, dy, dz) {
    let planeNormal = v3.normalize(v3.create(dx, dy, dz));
    let dirN = v3.normalize(this.dir);
    let dist = -v3.dot(planeNormal, p0);

    let dotproduct = v3.dot(dirN, planeNormal);
    let normalDotOrigin = v3.dot(this.eye, planeNormal);

    if (dotproduct !== 0) {
      var k = -(normalDotOrigin + dist) / dotproduct;
      if (k < 0)
        return null;
      let v0 = v3.mulScalar(dirN, k);
      return v3.add(this.eye, v0);
    } else if (normalDotOrigin + dist === 0) {
      return v3.copy(this.eye) // Origin is on plane
    } else {
      return null;
    }
  }

  /**
   * Gets the distance between a point x0 and a line x1x2 in 3D space
   *
   * @param {twgl.v3} x0 - Point to measure distance from
   * @param {twgl.v3} x1 - First point of the line
   * @param {twgl.v3} x2 - Second point of the line
   */
  getDistanceFromPointToLine(x0, x1, x2) {
    let x0_x1 = v3.subtract(x0, x1),
      x0_x2 = v3.subtract(x0, x2),
      x2_x1 = v3.subtract(x2, x1);

    return v3.length(v3.cross(x0_x1, x0_x2)) / v3.length(x2_x1);
  }


  intersectsLinePlanes(p0, direction, bbSize) {
    let halfSize = bbSize / 2;

    let clampminmax = (i) => { // clamp to -size/2, size/2
      return i < -halfSize ? -halfSize : (i > halfSize ? halfSize : i);
    }

    let to01 = (i) => {
      let i1 = clampminmax(i); // clamp to size first
      return (i1 + halfSize) / bbSize;
    }

    let getClosestIntersection = (p, n1, n2, lineDir) => {
      let getOffsetCoordIndexFromNormal = (planeNormal, lineDirection) => {
        let w1 = v3.create(1, 1, 1); // avoid namespace collision with v3
        let w2 = v3.subtract(w1, planeNormal);
        let w3 = v3.subtract(w2, lineDirection);

        // Index of value=1 is the coord index
        let index = _.indexOf(w3, 1);
        return index;
      }

      let intersect1 = this.intersectsPlaneV2(p, n1),
        intersect2 = this.intersectsPlaneV2(p, n2);

      let lx0 = p,
        lx1 = v3.add(p, lineDir);

      let dist1 = this.getDistanceFromPointToLine(intersect1.point, lx0, lx1),
        dist2 = this.getDistanceFromPointToLine(intersect2.point, lx0, lx1);

      if (dist1 < dist2) {
        let coordIndex = getOffsetCoordIndexFromNormal(n1, lineDir);
        return {
          distance: intersect1.distance,
          intersectOffset: to01(intersect1.point[coordIndex]),
          point: intersect1.point
        };
      } else {
        let coordIndex = getOffsetCoordIndexFromNormal(n2, lineDir);
        return {
          distance: intersect2.distance,
          intersectOffset: to01(intersect2.point[coordIndex]),
          point: intersect2.point
        };

      }
    }

    switch (direction) {
      case 'X': // Project & Intersect with XY and XZ planes

        return getClosestIntersection(
          p0,
          v3.create(0, 0, 1),
          v3.create(0, 1, 0),
          v3.create(1, 0, 0)
        );

        break;
      case 'Y': // XY and YZ
        return getClosestIntersection(
          p0,
          v3.create(0, 0, 1),
          v3.create(1, 0, 0),
          v3.create(0, 1, 0)
        );

        break;
      case 'Z': // XZ and YZ
        return getClosestIntersection(
          p0,
          v3.create(0, 1, 0),
          v3.create(1, 0, 0),
          v3.create(0, 0, 1)
        );

        break;
      default:
        console.error("Direction not supported");
        break;
    }
  }

  intersectsQuad(p0, p1, p2, p3) {

  }

  _closestDistanceBetweenLines(a0, a1, b0, b1, settings) {
    /*
        let clampA0 = settings.clampA0 ||false,
          clampA1 = settings.clampA1 ||false,
          clampB0 = settings.clampB0 ||false,
          clampB1 = settings.clampB1 ||false;
    */

    let v1 = v3.normalize(v3.subtract(a1, a0)),
      v2 = v3.normalize(v3.subtract(b1, b0));

    let v1Xv2 = v3.cross(v1, v2);

    // Check if parallel
    if (v3.length(v1Xv2) === 0) // Parallel
      return Infinity;

    // Check if intersect
    let a0_b0 = v3.subtract(a0, b0);
    let v1Xv2_dot_a0_b0 = v3.dot(v1Xv2, a0_b0);

    if (v1Xv2_dot_a0_b0 === 0)
      return 0; // Hit!


    // Return distance between lines (no intersect)
    return v1Xv2_dot_a0_b0 /
      v3.length(v1Xv2);
  }
}
