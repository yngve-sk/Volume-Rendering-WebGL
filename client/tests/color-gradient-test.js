let ColorGradient = require('../src/gui-widgets/transfer-function/color-gradient');
let assert = require('chai').assert;
let mocha = require('mocha');


describe("Color gradient", function () {
    describe('Inserting', function () {
        it('Finds the right insertion index', function () {
            let cg = new ColorGradient();

            let expect0 = cg._findInsertionIndexForOffset(0);
            assert.equal(expect0, 0);

            assert.equal(cg.addControlPoint('red', 10), 0); // i = 0
            assert.equal(cg.addControlPoint('red', 10), 1);
            assert.equal(cg.addControlPoint('red', 21), 2);
            assert.equal(cg.addControlPoint('red', 30), 3);
            assert.equal(cg.addControlPoint('red', 50), 4);

            let index = cg._findInsertionIndexForOffset(20);
            assert.equal(cg.gradient.length, 5);

            assert.equal(index, 2);
        });
        it('Adds one point and gets index 0 in return', function() {
            let cg = new ColorGradient();
            let index = cg.addControlPoint('red', 10);
        });
    });
    describe('Adding & moving control points', function () {
        let ROUNDS = 100;
        let cg = new ColorGradient();
        it('Adds 100 control points descending order, expects it to keep it ascending, and expects insertion index to always be 0', function () {
            for (let i = ROUNDS; i > 0; i--)
                assert.equal(cg.addControlPoint('red', i), 0);

            assert.equal(cg.gradient.length, ROUNDS);

            for (let i = 1; i < ROUNDS; i++) {
                let prev = cg.gradient[i - 1];
                let curr = cg.gradient[i];

                assert.isBelow(prev.offset, curr.offset);
            }
        });
        it('Appends one control point @ end and moves it to start gradually', function () {
            cg.removeControlPoint(ROUNDS);
            let index = cg.addControlPoint('blue', ROUNDS);
            assert.equal(cg.gradient[index].color, 'blue');

            for (let i = 0; i < ROUNDS; i++) {
                index = cg.moveControlPoint(index, ROUNDS - i);
                assert.equal(cg.gradient[index].color, 'blue');
            }
        });
    });
});
