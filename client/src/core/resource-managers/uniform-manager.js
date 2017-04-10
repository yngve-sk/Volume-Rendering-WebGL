/**
 * Manages uniforms, maintains getter functions for all
 * uniforms, both private and shared (subview-wise)
 * @memberof module:Core/Renderer
 */
class UniformManager {
    /**
     * Constructs a new uniform manager
     * @class undefined
     * @constructor
     */
    constructor() {
        // shared = SAME VALUE across all subviews
        this.shared = { // format: {uniformName: () -> value}

        };

        // unique = POSSIBLY DIFFERENT value across subviews
        this.unique = { // format: {uniformName: (subviewID) -> value}

        };

        // Each subview will point to one of the uniform-sets here.
        this.uniforms = { // format: {subviewID: UniformsJSON}

        };
    };

    addShared(name, getter) {
        this.shared[name] = getter;
    }

    addUnique(name, getter) {
        this.unique[name] = getter;
    }

    uniqueUniformDidChange(name, subviewID) {
        // Simply re-fetch it via the getter
        this._setUniform(subviewID, name, this._getUniqueUniform(name, subviewID));
    }

    sharedUniformDidChange(name) {
        let newValue = this._getSharedUniform(name);

        // Refresh it for all subview IDs
        for (let subviewID in this.uniforms)
            this._setUniform(subviewID, name, newValue);
    }

    updateAll() {
        for (let uniformName in this.shared)
            this.sharedUniformDidChange(uniformName);


        for (let uniformName in this.unique)
            for (let subviewID in this.uniforms)
                this.uniqueUniformDidChange(uniformName, subviewID);
    }

    addSubview(subviewID) {
        this._bundleUniformsForSubview(subviewID);
    }

    /**
     * Gets a JSON of uniforms for the given subview ID.
     * This is a JSON so changes made to the uniform will
     * appear in the object fetched via this method.
     *
     * @param {number} subviewID
     */
    getUniformBundle(subviewID) {
        return this.uniforms[subviewID];
    }

    _bundleUniformsForSubview(subviewID) {
        let bundle = {};

        // 1. Inject shared
        for (let uniformName in this.shared)
            bundle[uniformName] = this._getSharedUniform(uniformName);

        // 2. Inject unique
        for (let uniformName in this.unique)
            bundle[uniformName] = this._getUniqueUniform(uniformName, subviewID);

        this.uniforms[subviewID] = bundle;
    }

    _getUniqueUniform(uniformName, subviewID) {
        return this.unique[uniformName](subviewID);
    }

    _getSharedUniform(uniformName) {
        return this.shared[uniformName]();
    }

    _setUniform(subviewID, uniformName, value) {
        this.uniforms[subviewID][uniformName] = value;
    }
}

module.exports = UniformManager;
