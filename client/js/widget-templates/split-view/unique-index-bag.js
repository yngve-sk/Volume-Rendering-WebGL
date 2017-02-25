let _ = require('underscore');

class UniqueIndexBag {
    constructor(size) {
        this.indices = [];
        for (let i = size - 1; i >= 0; i--) {
            this.indices.push(i);
        }
    }

    getIndex() {
        return this.indices.pop();
    }

    peekAtNextIndex() {
        let next = this.getIndex();
        this.indices.push(next);
        console.log("peekAtNextIndex() returning " + next);
        return next;
    }

    returnIndex(i) {
        this.indices.push(i);
        this.indices.sort((i1, i2) => {
            return i1 < i2
        });
    }

}

module.exports = UniqueIndexBag;
