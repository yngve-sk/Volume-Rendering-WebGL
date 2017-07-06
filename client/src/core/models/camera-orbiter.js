let twgl = require('twgl.js'),
  m4 = require('twgl.js').m4,
  v3 = require('twgl.js').v3;

let Transformations = require('./transformations');
let InitialProjectionSettings = null; // TODO define in ext file, possibly settings!

/**
 * Simple wrapper around twgl.js m4 functionality,
 * camera that can toggle between ortho and perspective.
 * @memberof module:Core/Models
 */
class OrbiterCamera {
  constructor(eye, projectionSettings) {
    this.eye = eye ||v3.create(1, 2, -2);

    // Center of the unit sphere with radius 1
    this.target = v3.create(0, 0, 0);
    this.baseTarget = v3.create(0, 0, 0);

    this.up = v3.create(0, 1, 0);

    // {
    //   fieldOfViewRadians
    //   aspectRatio
    //   zNear
    //   zFar
    // }
    this.projectionSettings = projectionSettings ||{
      fieldOfViewRadians: Math.PI / 6,
      aspectRatio: 1, // Initial
      zNear: 0.5,
      zFar: 7
    };

    this.zoom = 1.0;
    this.projection = null; // Must be set so it takes into account width/height
    //this.setPerspective();
    this.modelTransformation = new Transformations();
    this.setPerspective();

    this.mouseCache = {
      isDrag: false,
      mx: -1,
      my: -1,
      uv: null
    }
  }

  mouse(event) {
    //console.log("Camera received event!");
    //console.log(event);

    let ROT_SPEED = 5;
    let TRANS_SPEED = 5;

    if (event.type === 'mousedown') {
      this.mouseCache.isDrag = true;

      this.mouseCache.mx = event.pos.x;
      this.mouseCache.my = event.pos.y;

      return;
    } else if (event.type === 'mouseup') {
      this.mouseCache.isDrag = false;
      return;
    }

    if (this.mouseCache.isDrag) {
      let dx = event.pos.x - this.mouseCache.mx;
      let dy = event.pos.y - this.mouseCache.my;

      this.mouseCache.mx = event.pos.x;
      this.mouseCache.my = event.pos.y;

      dx *= ROT_SPEED * 2.5;
      dy *= ROT_SPEED;

      let fwd = v3.subtract(this.target, this.eye);
      let sideways = v3.cross(fwd, this.up);
      let sidewaysN = v3.normalize(sideways);

      let length = v3.length(fwd);

      let moveSideways = v3.mulScalar(sidewaysN, -dx),
        moveVertically = v3.mulScalar(this.up, dy);

      switch (event.button) {
        case 0: // left -> rotate
          //          this.modelTransformation.rotateXY(-1*dy, dx);
          v3.add(this.eye, moveVertically, this.eye);
          v3.add(this.eye, moveSideways, this.eye);

          let newLen = v3.length(v3.subtract(this.target, this.eye));
          let diff = length - newLen;
          v3.subtract(this.eye, v3.mulScalar(v3.normalize(fwd), diff), this.eye);

          let newFWD = v3.subtract(this.target, this.eye);

          // update UP
          this.up = v3.negate(v3.normalize(v3.cross(newFWD, sideways)));

          break;
        case 1: // middle -> zoom


          v3.add(this.eye, moveVertically, this.eye);
          v3.add(this.eye, moveSideways, this.eye);

          v3.add(this.target, moveVertically, this.target);
          v3.add(this.target, moveSideways, this.target);

          break;
        case 2: // right
          break;
        default:
          break;
      }
    }
  }

  setAspectRatio(aspectRatio) {
    this.setPerspective(aspectRatio);
  }

  setPerspective(aspectRatio) {
    this.projection = m4.perspective(
      this.projectionSettings.fieldOfViewRadians,
      (aspectRatio ||this.projectionSettings.aspectRatio),
      this.projectionSettings.zNear,
      this.projectionSettings.zFar
    );
  }

  getPerspectiveMatrix() {
    return this.projection;
  }

  getLookAt() {
    return m4.lookAt(this.eye, this.target, this.up);
  }

  getViewMatrix() {
    return m4.inverse(this.getLookAt());
  }

  getViewInverseMatrix() {
    return this.getLookAt();
  }

  getWorldMatrix() {
    return this.modelTransformation.getTransformation();
  }

  getViewProjectionMatrix() {
    return m4.multiply(this.getPerspectiveMatrix(), this.getViewMatrix());
  }

  getWorldInverseTranspose() {
    return m4.transpose(m4.inverse(this.getWorldMatrix()));
  }

  getWorldViewProjectionMatrix(aspectRatio) {
    if (aspectRatio)
      this.setPerspective(aspectRatio);

    let modelToWorld = this.modelTransformation.getTransformation();
    let worldToProjection = this.getViewProjectionMatrix();
    return m4.multiply(worldToProjection, modelToWorld);
  }

  getModelTransformation() {
    return this.modelTransformation;
  }
}

module.exports = OrbiterCamera;
