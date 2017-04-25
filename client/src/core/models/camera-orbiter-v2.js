let twgl = require('twgl.js'),
    m4 = twgl.m4,
    v3 = twgl.v3;

let glmvec4 = require('gl-matrix').vec4;

let Quat = require('gl-matrix').quat;

console.log(Quat);

class Camera {
    constructor(args) {
        this.radius = args.radius || 1.0;

        this.theta = args.theta  ||  Math.PI / 2;
        this.phi = args.phi || Math.PI / 2;

        this.target = args.target || v3.create(0, 0, 0);

        this.projectionSettings = args.projectionSettings || {
            fieldOfViewRadians: Math.PI / 10,
            aspectRatio: 1, // Initial
            zNear: 1.0,
            zFar: 15.0
        };

        this.ROT_SPEED_X = args.ROT_SPEED_X || 2;
        this.ROT_SPEED_Y = args.ROT_SPEED_Y || 2;

        this.projection = null;
        this.view = null;

        this._updateViewMatrix();
        this.setPerspective({});

        this.mouseCache = {
            isDrag: false,
            mousedown: false,
            mx: -1,
            my: -1,
            uv: null
        }

        this.upDir = 1;
    }


    rotate(dTheta, dPhi) {
        if (this.upDir > 0) {
            this.theta += this.ROT_SPEED_X * dTheta;
        } else {
            this.theta -= this.ROT_SPEED_X * dTheta;
        }

        this.phi += this.ROT_SPEED_Y * dPhi;

        let _2PI = Math.PI * 2;

        if (this.phi > _2PI)
            this.phi -= _2PI;
        else if (this.phi < -_2PI)
            this.phi += _2PI;

        if ((0 < this.phi && this.phi < Math.PI) ||  (-_2PI < this.phi && this.phi < -Math.PI)) {
            this.upDir = 1;
        } else {
            this.upDir = -1;
        }

        this._updateViewMatrix();
    }

    zoom(dist) {
        this.radius -= dist;
        this._updateViewMatrix();
    }

    pan(dx, dy) {

    }

    tick() {
        // TODO
    }

    getEyePosition() {
        let x = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        let y = this.radius * Math.cos(this.phi);
        let z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);

        return v3.create(x, y, z);
    }

    toCartesian() {
        let eye = this.getEyePosition();
        let look = v3.normalize(eye);

        let worldUp = v3.create(0.0, this.upDir, 0.0);

        let right = v3.cross(look, worldUp);
        let up = v3.cross(look, right);

        return {
            eye: eye,
            right: right,
            up: up,
            target: this.target
        }
    }

    setPerspective(args) {
        this.projection = m4.perspective(
            args.fieldOfViewRadians || this.projectionSettings.fieldOfViewRadians,
            args.aspectRatio || this.projectionSettings.aspectRatio,
            args.zNear || this.projectionSettings.zNear,
            args.zFar || this.projectionSettings.zFar
        );
    }

    _updateViewMatrix() {
        let c = this.toCartesian();
        this.view = m4.inverse(m4.lookAt(c.eye, c.target, c.up));
    }

    getWorldViewProjectionMatrix(aspectRatio) {
        if (aspectRatio)
            this.setPerspective({
                aspectRatio: aspectRatio
            });

        // no world matrix, not needed ATM.

        return m4.multiply(this.projection, this.view);
    }

    __unproject(devX, devY, devZ) {

        let inverseVP = m4.inverse(m4.multiply(this.projection, this.view));

        let homogenous = glmvec4.fromValues(devX, devY, devZ, 1.0);
        let p = glmvec4.transformMat4(homogenous, homogenous, inverseVP),
            w = p[3];

        // Divide by w also
        return v3.create(p[0]/w, p[1]/w, p[2]/w);
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

        return new Ray(this.getEyePosition(), rayV2);
        //return new Ray(p0, rayV2);

        //return {
        //    eye: this.getEyePosition(),
        //    ray: rayFromEyeWORLD
        //};
    }

    /*  click(event) {
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
                     //                    this.modelTransformation.rotateXY(-1*dy, dx);
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
    constructor(eye, dir) {
        this.eye = eye; // float32array[3]
        this.dir = dir;
    }

    intersectsLine(p0, p1, threshold) {
        let eye1 = this.eye,
            eye2 = v3.add(this.eye, this.dir);

        let dist1 = this._closestDistanceBetweenLines(eye1, eye2, p0, p1),
            dist2 = this._closestDistanceBetweenLines(eye1, eye2, p1, p0); // Check both ways to stay on the line

        let doesIntersect = Math.abs(dist1) === Math.abs(dist2) &&
                dist1 <= threshold;


    }

    intersectsQuad(p0, p1, p2, p3) {

    }

    _closestDistanceBetweenLines(a0, a1, b0, b1, settings) {
/*
        let clampA0 = settings.clampA0 || false,
            clampA1 = settings.clampA1 || false,
            clampB0 = settings.clampB0 || false,
            clampB1 = settings.clampB1 || false;
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