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
const fs = require("fs");
const yaml = require("yamljs");

class Configurator {
    constructor(resolver = null) {
        // Use the resolver(which used to resolve the file path) from the constructor, if not set, will use path.resolve as default
        this.resolver = resolver || path.resolve;

        // Construct the basic macro engine
        this.macro = MacroEngine.basic(resolver);
    }

    load(name) {
        return new Promise((resolve, reject) => {
            // Let's get the name first
            name = this.resolver(name);
            if(fs.existsSync(name)) {
                // This file is really there
                return this.macro.process(fs.readFileSync(name))
                    .then(data => {
                        resolve(yaml.parse(data));
                    }).catch(reject);
            } else {
                reject(new Error(`File ${name} can't be read!`));
            }
        });
    }
}

module.exports = Configurator;
