/**
 *
 * This is the configurator which will support the macro based YAML configuration
 *
 * It will use the Basic MacroEngine to process the YAML text first.
 *
 * @author Jack <jack@thinkingcloud.info>
 * @version 0.0.1
 * @date Sat Jan 27 23:55:08 2018
 */

const path = require("path");
const MacroEngine = require("./macro/MacroEngine");
const FilterBase = require("./models/FilterBase");
const fs = require("fs");
const yaml = require("yamljs");
const { isFunction, isString, isObject, isArray, extend, get, set } = require("lodash");
const { FilterObject } = FilterBase;
const ALIAS_PATTERN = /^\~([a-zA-Z_\-]+)/;
const COMPOSITE_PATTERN = /^\^([a-zA-Z_\-\/]+)/;
const { inspect } = require('util')
const ConfigObjectBase = require("./models/ConfigObjectBase");
const { AppBase, App } = require("./models/AppBase");

const overlay = (dest, src) => {
    if(isObject(dest) && isObject(src)) {
        let ret = {};
        // We only process objects
        for(let p in dest) {
            // Let's overlay the value
            ret[p] = overlay(dest[p], src[p]);
        }

        for(let p in src) {
            // Let's overlay the value that is not in the dest
            ret[p] = src[p];
        }
        return ret;
    }
    // Then, if the source has value, copy it, else use the default one
    return src? src: dest;
}

/**
 * The filter that will load the file as the output
 */
class FileFilter extends FilterObject {
    constructor(configurator, name = "file-filter") {
        super(name);
        this.configurator = configurator;
    }

    filter(name) {
        return this.configurator.getContents(name);
    }
}

class MacroFilter extends FilterObject {
    constructor(configurator, name = "macro-filter") {
        super(name);
        this.configurator = configurator;
    }

    filter(name) {
        return this.configurator.macro.process(name);
    }
}

class YamlFilter extends FilterObject {
    constructor(name = "yaml-filter") {
        super(name);
    }

    filter(data) {
        return yaml.parse(data);
    }
}

const processAlias = (data, aliases = null) => {
    if(aliases) {
        // Only process it when there is aliases definitions
        if(isObject(data)) {
            // Data is object, let's process it
            for(let p in data) {
                let v = data[p];
                let m = p.match(ALIAS_PATTERN);
                if(m) {
                    // p is an alias, let's process it
                    let alias = aliases[m[1]];
                    if(alias) {
                        // We get the alias now, let's replace it as the key
                        data[alias] = v;
                        // Then let's remove the old key
                        delete data[p];
                    }
                }
                if(isObject(v) || isArray(v)) {
                    // Let's process the alias in the inner object or array
                    processAlias(v, aliases);
                }
            }
        }

        if(isArray(data)) {
            for(let d of data) {
                if(isObject(d) || isArray(d)) {
                    // Let's process the alias in the inner object or array
                    processAlias(d, aliases);
                }
            }
        }
    }
}

const processBase = (data) => {
    if(isObject(data)) {
        // Let's check if the data itself needs to be overlayed
        let { $base } = data;

        if($base && isObject($base)) {
            // Let's remove the base references
            delete data["$base"];

            // Now overlay it and return it
            data = overlay($base, data);
        }

        // This data is object, let's process its fields
        for(let p in data) {
            data[p] = processBase(data[p]);
        }
    }

    if(isArray(data)) {
        return data.map(processBase);
    }

    return data;
}

/**
 * This is the filter object for including the base configurations
 */
class BaseFilter extends FilterObject {
    constructor(name = "base-filter") {
        super(name);
    }

    filter(data) {
        return processBase(data);
    }
}

/**
 * This is the filter that will replace the alias to the aliased name
 */
class AliasFilter extends FilterObject {
    constructor(name = "alias-filter") {
        super(name);
    }

    filter(data) {
        // Let's process the aliases
        processAlias(data, data.aliases);
        return data;
    }
}

const processComposites = (data) => {
    if(isObject(data)) {
        // Data is object, let's process it
        for(let p in data) {
            let v = data[p];
            let m = p.match(COMPOSITE_PATTERN);
            if(m) {
                // p is an composite, let's process it
                let name = m[1];
                if(name) {
                    name = name.split("/");
                    // Let's remove the old key
                    delete data[p];

                    let obj = v;
                    v = {};
                    while(name.length > 1) {
                        let n = name.pop();
                        v[n] = obj;
                        obj = v;
                        v = {};
                    }

                    data[name[0]] = obj;
                }
            }
            if(isObject(v) || isArray(v)) {
                // Let's process the alias in the inner object or array
                processComposites(v);
            }
        }
    }

    if(isArray(data)) {
        for(let d of data) {
            if(isObject(d) || isArray(d)) {
                processComposites(d);
            }
        }
    }
}

class CompositeFilter extends FilterObject {
    constructor(name = "composite-filter") {
        super(name);
    }

    filter(data) {
        // Let's process the composites
        processComposites(data);
        return data;
    }
}

const constructObj = (module, name, data, configurator) => {
    let m = module;
    if(m) {
        let $name = name;
        let func = m;
        if($name) {
            // Let's use the property instead
            func = m[$name];
        }
        if(func && isFunction(func)) {
            let obj = new func(data);
            if(obj instanceof ConfigObjectBase) {
                // This is config object base, let's add the metadata to it too
                obj.meta(configurator, configurator.require);
            }
            return obj;
        }
    }
}

const processObject = (data, configurator) => {
    if(isArray(data)) {
        // If this is an array, let's process all values in it
        return data.map(d => processObject(d, configurator));
    }

    if(isObject(data)) {
        // This is an object, let's process its fields first
        for(let p in data) {
            let v = data[p];
            if(isObject(v) || isArray(v)) {
                // This value is already object or array, let's process it now
                v = processObject(v, configurator);
                data[p] = v;
            }
        }
        // Let's check if this data needs to be update too
        if(data.$type) {
            // Yes, we have the type inforamtion here
            switch(data.$type) {
                case "module": // We only support module type for now
                    let { $module, $name } = data;
                    let m = null;
                    if(isString($module)) {
                        m = configurator.require($module);
                    } else {
                        // No module set, let's try it ourself
                        m = all;
                    }

                    // Only process that if the module information is string
                    let obj = constructObj(m, $name, data, configurator);
                    if(obj) {
                        return obj;
                    }
                    return data;
            }
        }
    }

    // Return the data
    return data;
}

/**
 * This is the object filter that will turn the values into objects using the
 * module require functions
 */
class ObjectFilter extends FilterObject {
    constructor(configurator, name = "object-filter") {
        super(name);
        this.configurator = configurator;
    }

    filter(data) {
        return processObject(data, this.configurator);
    }
}

/**
 * This is filter will construct the result into JSON
 */
class JsonFilter extends FilterObject {
    constructor(name = "json-filter") {
        super(name);
    }

    filter(data) {
        return JSON.stringify(data);
    }
}

class Configurator extends FilterBase {
    constructor(theRequire = null, filters = []) {
        super(filters);

        if(theRequire) {
            // We have the require passed in, so we can use the require of theirs
            this.require = theRequire;
            this.resolver = this.require.resolve;
        } else {
            // We don't have the require set, let's just use ours, mostly useless, :(
            this.require = require;
            this.resolver = path.resolve;
        }

        // Construct the basic macro engine
        this.macro = MacroEngine.simple(this.require);

        // Let's add the filters
        this.processFilters();
    }

    processFilters() {
        // Let's add the Yaml parse filter to parse the result to the JavaScript Object
        this.unshift(new YamlFilter());
        // Let's add the macro filter
        this.unshift(new MacroFilter(this));
        // Let's add the read file filter to the top most
        this.unshift(new FileFilter(this));

        // Let's process the base first
        this.push(new BaseFilter());
        // Let's add the aliases filter
        this.push(new AliasFilter());
        // Let's add the composite filter
        this.push(new CompositeFilter());
        // Let's add the object filter now
        this.push(new ObjectFilter(this));
    }

    /**
     * This will add the json filter into the filter chain.
     */
    json() {
        this.push(new JsonFilter());
        return this;
    }

    getContents(name) {
        return new Promise((resolve, reject) => {
            // Let's get the name first
            name = this.resolver(name);
            if(fs.existsSync(name)) {
                // This file is really there
                resolve(fs.readFileSync(name));
            } else {
                reject(new Error(`File ${name} can't be read!`));
            }
        });
    }
}

let all = extend(Configurator, {
    ConfigObjectBase,
    AppBase,
    App,
    overlay
});

module.exports = all;
