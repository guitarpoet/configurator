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
const { isObject, isArray } = require("lodash");
const { FilterObject } = FilterBase;
const ALIAS_PATTERN = /^\~([a-zA-Z_\-]+)/;
const COMPOSITE_PATTERN = /^\^([a-zA-Z_\-\/]+)/;

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
    constructor(resolver = null, filters = []) {
        super(filters);
        // Let's add the Yaml parse filter to parse the result to the JavaScript Object
        this.unshift(new YamlFilter());
        // Let's add the macro filter
        this.unshift(new MacroFilter(this));
        // Let's add the read file filter to the top most
        this.unshift(new FileFilter(this));

        // Let's add the aliases filter
        this.push(new AliasFilter());

        // Let's add the composite filter
        this.push(new CompositeFilter());

        // Use the resolver(which used to resolve the file path) from the constructor, if not set, will use path.resolve as default
        this.resolver = resolver || path.resolve;

        // Construct the basic macro engine
        this.macro = MacroEngine.basic(resolver);
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

module.exports = Configurator;
