/**
 * This is the base class for all commandline apps, and it can be use directly too.
 *
 * @author Jack <jack@thinkingcloud.info>
 * @version 0.0.1
 * @date Mon Feb  5 17:22:03 2018
 */

const ConfigObjectBase = require("./ConfigObjectBase");
const { ArgumentParser } = require("argparse");
const { get, extend, isFunction } = require("lodash");
const { pipe, debug, log } = require("hot-pepper-jelly");

const buildParser = (app) => {
    app.parser = new ArgumentParser(app.get("metadata", {}));
    let options = app.get("options");
    for(let o of options) {
        app.parser.addArgument(o.option, o);
    }
    return app;
}

const parseArgs = (app) => {
    app.args = app.parser.parseArgs();
    return app;
}

class AppBase extends ConfigObjectBase {
    init(filters = []) {
        filters.unshift(parseArgs);
        filters.unshift(buildParser);
        return pipe(this)(filters);
    }

    config(path = null, defaultValue = null) {
        if(!path) {
            return this.$config;
        }
        return this.$config? get(this.$config, path, defaultValue): defaultValue;
    }

    /**
     * Wrap object to this, just copy all methods into this
     */
    wrap(obj = {}) {
        extend(this, obj);
        return this;
    }

    start() {
        if(this.args && this.args.command) {
            // OK, we get the command, let's check if the command exists;
            let func = this[this.args.command];
            if(func && isFunction(func)) {
                func.apply(this);
                return;
            }
        }
        log("No command found!");
    }
}

/**
 * The app alias for the app base
 */
class App extends AppBase {
}


module.exports = {
    AppBase, App
}
