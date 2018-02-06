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
const Configurator = require("./Configurator");
const { extend } = require("lodash");
const { pipe } = require("hot-pepper-jelly");

const config = (require) => {
	return (file) => {
		let c = new Configurator(require);
		return c.process(file);
	}
}

const get_app = (data) => {
    return data.app;
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

const normal_start = (require, obj, error_handler = null) => {
	error_handler = error_handler || handle_app_error;
	pipe("./app.yaml")([config(require), get_app, init_app, wrap_app_with(obj)])
		.then(start_app).catch(handle_app_error);
}

const custom_start = (require, classes, error_handler = null) => {
	// Extend the configurator using the App classes
	extend(Configurator, classes);

	error_handler = error_handler || handle_app_error;
	pipe("./app.yaml")([config(require), get_app, init_app])
		.then(start_app).catch(handle_app_error);
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
	custom_start
});

module.exports = Configurator;
