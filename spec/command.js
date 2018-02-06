const { custom_start, AppBase } = require("../src/index");

class MyApp extends AppBase {
    test() {
        console.info("Test....");
    }

    hello() {
        console.info("Hello");
    }
}

custom_start(require, { MyApp });
