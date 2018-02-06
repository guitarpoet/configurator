/**
 *
 * The base class for the config object
 *
 * @author Jack <jack@thinkingcloud.info>
 * @version 0.0.1
 * @date Mon Feb  5 17:28:19 2018
 */

const { inspect } = require("util")
const { extend, isFunction, get, set } = require("lodash");

class ConfigObjectBase {

    constructor(props = {}) {
        extend(this, props);
        if(this._init && isFunction(this._init)) {
            // Call the init function if there is one
            this._init();
        }
    }

    /**
     * This will set and get the metadata information
     */
    meta(configurator = null, require = null) {
        this.$configurator = configurator;
        this.$require = require;
    }

    get(path = null, defaultValue = null) {
        if(path) {
            return get(this, path, defaultValue);
        }
        return this;
    }

    set(path, value = null) {
        set(this, path, value);
    }

    [inspect.custom]() {
        let ret = {};
        for(let p in this) {
            if(["$require", "$configurator"].indexOf(p) === -1) {
                ret[p] = this[p];
            }
        }
        ret.constructor = this.constructor;
        return ret;
    }
}

module.exports = ConfigObjectBase;
