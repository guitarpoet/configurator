/**
 * This is the base class for all filter based processing
 *
 * @author Jack <jack@thinkingcloud.info>
 * @version 0.0.1
 * @date Fri Jan 26 10:41:02 2018
 */
const { pipe, debug, log } = require("hot-pepper-jelly");
const { isArray, isFunction } = require("lodash");

/**
 * This is the base filter object, which will provide the object functions into the filter
 */
class FilterObject {
    constructor(name = null) {
        if(name) {
            debug("Constructing filter {{name}}", {name});
        }

        // This will add the name to the filter object
        this.name = name;
    }

    /**
     * Return the type of the filter, this is used for test
     */
    type() {
        return this._type || this.name;
    }

    filter() { }
}

class FilterBase {
    constructor(filters = []) {
        this._filters = filters;
    }

    filters() {
        if(!isArray(this._filters)) {
            this._filters = [];
        }
        return this._filters;
    }

    exists(filter) {
        if(filter) {
            if(filter instanceof FilterObject) {
                // If the filter is FilterObject, let's check the type instead
                return !!this.filters().filter(f => f.type() === filter.type()).length;
            } else {
                // Let's check if it exists
                return !!this.filters().filter(f => f === filter).length;
            }
        }
        return false;
    }

    push(filter) {
        if(!this.exists(filter)) {
            this.filters().push(filter);
        }
        return this;
    }

    unshift(filter) {
        if(!this.exists(filter)) {
            this.filters().unshift(filter);
        }
        return this;
    }

    /**
     * Pipe the object through the filters, you can even filter the filters ;)
     */
    process(obj = {}, filterFilter = null) {
        let filters = this._filters || [];
        if(isFunction(filterFilter)) {
            filters = filters.filter(filterFilter);
        }

        return pipe(obj)(filters.map(filter => filter instanceof FilterObject? filter.filter.bind(filter): filter));
    }
}

FilterBase.FilterObject = FilterObject;

module.exports = FilterBase;
