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

const { FilterObject } = FilterBase;

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

class Configurator extends FilterBase {
    constructor(resolver = null, filters = []) {
        super(filters);
        // Let's add the Yaml parse filter to parse the result to the JavaScript Object
        this.unshift(new YamlFilter()); 
        // Let's add the macro filter
        this.unshift(new MacroFilter(this)); 
        // Let's add the read file filter to the top most
        this.unshift(new FileFilter(this)); 

        // Use the resolver(which used to resolve the file path) from the constructor, if not set, will use path.resolve as default
        this.resolver = resolver || path.resolve;

        // Construct the basic macro engine
        this.macro = MacroEngine.basic(resolver);
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
