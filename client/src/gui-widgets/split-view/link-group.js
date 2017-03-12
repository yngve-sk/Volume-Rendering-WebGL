let _ = require('underscore');
let UniqueIndexBag = require('./unique-index-bag');

class LinkGrouper {
    constructor(maxGroups) {
        this.links = [];
        for (let i = 0; i < maxGroups; i++)
            this.links[i] = [];

        this.groupIndices = new UniqueIndexBag(maxGroups);
    }

    /*
        Returns all link groups, format:

        [[id1, id2, ..., idN],...]
    */
    getLinks() {
        let theLinks = [];
        for (let link of this.links)
            if (link.length !== 0)
                theLinks.push(link);

        return theLinks;
    }

    addMemberToGroup(groupIndex, id) {
        this.links[groupIndex].push(id);
    }

    /* Returns the new size, v useful! */
    addNewLinkGroup(initialMember) {
        let index = this.groupIndices.getIndex();
        this.links[index] = [initialMember];
        return index;
    }

    getNextGroupIndex() {
        return this.groupIndices.peekAtNextIndex();
    }


    ungroupMember(id) {
        if (!this.isMemberGrouped(id) || id === -1)
            return;

        let index = this.getLinkGroupIndexOfMember(id);
        if (this.links[index].length === 2)
            this.removeLinkGroup(index);
        else
            this.links[index] = _.without(this.links[index], id);
    }

    addGroupIfDoesntExistForMemberWithId(id) {
        if (!this.isMemberGrouped(id))
            return this.addNewLinkGroup(id);
        return -1;
    }

    removeLinkGroup(index) {
        this.links[index] = [];
        this.groupIndices.returnIndex(index);
    }

    removeIfContainsOnlyOneMember(memberID) {
        let index = this.getLinkGroupIndexOfMember(memberID);
        if (this.links[index].length === 1) {
            this.removeLinkGroup(index);
        }
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

    isMembersInSameGroup(id1, id2) {
        return this.isMemberGrouped(id1) &&
            (this.getLinkGroupIndexOfMember(id1) === this.getLinkGroupIndexOfMember(id2));
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

module.exports = LinkGrouper;
