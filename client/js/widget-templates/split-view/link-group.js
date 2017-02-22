let _ = require('underscore');

class LinkGroup {
    constructor() {
        this.links = [];
    }

    addMemberToGroup(groupIndex, id) {
        this.links[groupIndex].push(id);
    }

    /* Returns the new size, v useful! */
    addNewLinkGroup(initialMember) {
        this.links.push([initialMember]);
        return this.links.length - 1;
    }

    ungroupMember(id) {
        if (!this.isMemberGrouped(id))
            return;

        let index = this.getLinkGroupIndexOfMember(id);
        if (this.links[index].length === 1)
            this.removeLinkGroup(index);
        else
            this.links[index] = _.without(this.links[index], id);
    }

    removeLinkGroup(index) {
        this.links.splice(index, 1);
    }

    getLinkGroupIndexOfMember(id) {
        for (let i = 0; i < this.links.length; i++) {
            if (_.contains(this.links[i], id))
                return i;
        }

        return -1;
    }

    isMemberGrouped(id) {
        return this.getLinkGroupIndexOfMember(id) !== -1;
    }

    printMe() {
        console.log("Link group with " + this.links.length + " groups");
        let i = 0;
        for (let linkGrp of this.links) {
            console.log("GRP: " +
                i++);
            for (let id of linkGrp)
                console.log("   " + id);
            console.log("...")
        }
    }
}

module.exports = LinkGroup;
