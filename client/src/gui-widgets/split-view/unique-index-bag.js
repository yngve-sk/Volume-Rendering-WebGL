let _ = require('underscore');

class UniqueIndexBag {
    constructor(size) {
        this.indices = [];
        this.size = size;
        for (let i = size - 1; i >= 0; i--) {
            this.indices.push(i);
        }
    }

    getIndicesInUse() {
        let inUse = [];
        for (let i = 0; i < this.size; i++)
            if (!_.contains(this.indices, i))
                inUse.push(i);

        return inUse;
    }

    getIndex() {
        return this.indices.pop();
    }

    peekAtNextIndex() {
        let next = this.getIndex();
        this.indices.push(next);
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
