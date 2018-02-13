/**
 *
 * This is the entry point for all the functions and objects, and only work for that
 *
 * @author Jack <jack@thinkingcloud.info>
 * @version 0.0.1
 * @date Fri Jan 26 10:28:36 2018
 */

const FilterBase = require("./models/FilterBase");
const MacroEngine = require("./macro/MacroEngine");
const { load, pipe } = require("hot-pepper-jelly");
const Configurator = require("./Configurator");
const { extend, isArray, isObject } = require("lodash");
const Module = require("module");

const config = (require) => {
    return (file) => {
        let c = new Configurator(require);
        return c.process(file);
    }
}

const get_app = (data) => {
    let { app } = data;
    if(app) {
        app.$config = data;
    }
    return app || {};
}

const init_app = (app) => {
    return app.init();
}

const start_app = (app) => {
    app.start();
}

const wrap_app_with = (obj) => {
    return (app) => (app.wrap(obj))
}

const handle_app_error = (error) => {
    console.error("Getting error", error);
}

const normal_start = (require, obj, appConfig = "./app.yaml", filters = null, error_handler = null) => {
    error_handler = error_handler || handle_app_error;
    // This is the default filters
    let defaultFilters = [config(require), get_app, init_app, wrap_app_with(obj)];
    if(filters) {
        // We get filters settings
        let before = null;
        let after = null;

        if(isObject(filters)) {
            before = filters.before;
            after = filters.after;
        }

        if(isArray(filters)) {
            // Only after
            after = filters;
        }

        if(before) {
            filters = before.concat(defaultFilters);
        } else {
            filters = defaultFilters;
        }

        if(after) {
            filters = filters.concat(after);
        }
    } else {
        filters = defaultFilters;
    }
    pipe(appConfig)(filters)
        .then(start_app).catch(handle_app_error);
}

const custom_start = (require, classes, appConfig = "./app.yaml", filters = null, error_handler = null) => {
    // Extend the configurator using the App classes
    extend(Configurator, classes);

    error_handler = error_handler || handle_app_error;
    pipe(appConfig)([config(require), get_app, init_app])
        .then(start_app).catch(handle_app_error);
}

const configure = (filters, configFile = "./config.yaml") => {
    // Let's get the top most module first
    let m = module;
    while(m.parent) {
        m = m.parent;
    }

    let r = (request) => {
        // Call the load function to load the module
        return Module._load(request, m, false);
    }

    r.resolve = (request, options) => {
        return Module._resolveFilename(request, m, false, options);
    }

    // Add the configurator into the filters
    filters.unshift(config(r));
    return pipe(configFile)(filters);
}

extend(Configurator, {
    FilterBase,
    MacroEngine,
    config,
    get_app,
    init_app,
    start_app,
    wrap_app_with,
    handle_app_error,
    normal_start,
    custom_start,
    configure
});

module.exports = Configurator;
