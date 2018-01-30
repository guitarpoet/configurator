const { extend } = require("lodash");
const { ConfigObjectBase } = require("../src/index");

class ConfigTest extends ConfigObjectBase {
    constructor(props = {}) {
        super(props);
    }
}

class AnotherConfigTest extends ConfigObjectBase {
    constructor(props = {}) {
        super(props);
        this.another = 1;
    }
}

ConfigTest.AnotherConfigTest = AnotherConfigTest;

module.exports = ConfigTest;
