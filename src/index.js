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

Configurator.FilterBase = FilterBase;
Configurator.MacroEngine = MacroEngine;

module.exports = Configurator;
