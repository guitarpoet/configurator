/**
 * @author Jack <jack@thinkingcloud.info>
 * @version 0.0.1
 * @date Wed Feb  7 13:18:52 2018
 */

const log4js = require('log4js');
const { global_registry } = require("hot-pepper-jelly");
const { extend } = require("lodash");
const ConfigObjectBase = require("./ConfigObjectBase");


class LogConfig extends ConfigObjectBase {
    _init() {
        let sinks = global_registry("sinks") || {};
        if(sinks.default) {
            // If it already has the default
            return;
        }

        // Let's init the logging
        log4js.configure(this);

        let loggerName = this.get("name", "dev-logger");
        let logger = log4js.getLogger(loggerName);
        this.logger = logger;

        const logging = {
            DEBUG: logger.debug.bind(logger),
            INFO: logger.info.bind(logger),
            ERROR: logger.error.bind(logger)
        }

        // Let's direct the default sink to log4js
        global_registry("sinks", extend(sinks, {
            default(message, level = "INFO", tag = null) {
                let f = logging[level.toUpperCase()];
                if(f) {
                    f(message);
                } else {
                    // Use the info for default
                    logger.info(message);
                }
            }
        }));
    }

    $logger() {
        return this.logger;
    }
}

module.exports = LogConfig;
