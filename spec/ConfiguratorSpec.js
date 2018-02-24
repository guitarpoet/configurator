const ConfigTest = require("./Sample.js");
const { get, isRegExp } = require("lodash");
const { feature_enabled, enabled_features } = require("hot-pepper-jelly");

describe("Configurator", function() {
    it("Simple Load Test", function() {
        let { Configurator } = this;
        delete process.env.TEST;
        let c = new Configurator(require);
        c.process("./test.yaml").then(data => {
            expect(data.no_test).toBeTruthy();
            expect(feature_enabled("hello")).toBeTruthy();
        }).catch(console.error);
    });
    it("Simple Load Test", function() {
        let { Configurator } = this;
        process.env.TEST = true;
        let c = new Configurator(require);
        c.process("./test.yaml").then(data => expect(data.test).toBeTruthy()).catch(console.error);
    });

    it("Sample Load Test", function() {
        let { Configurator } = this;
        process.env.DEV = true;
        let c = new Configurator(require);

        c.process("./sample.yaml").then(data =>  {
            expect(data).toBeTruthy();
            expect(isRegExp(data.regex)).toBeTruthy();
            expect("a.jsx".match(data.regex)).toBeTruthy();
            expect("aajsx".match(data.regex)).toBeFalsy();
            expect(get(data, "arr.test[0].a.b.c")).toEqual(1);
        }).catch(console.error);
    });

    it("Overlay test", function() {
        let { Configurator: {overlay} } = this;
        let a = {
            b: {
                c: {
                    d: 1
                }
            }
        }

        let e = {
            b: {
                c: {
                    d: 2
                }
            },
            f: {
                g: {
                    h: 1
                }
            }
        }

        let o = overlay(a, e)
        expect(get(o, "b.c.d")).toBe(2);
        expect(get(o, "f.g.h")).toBe(1);
    });

    it("Process Base Test", function() {
        let { Configurator: {BaseFilter} } = this;
        let f = new BaseFilter();

        let data = {
            a: {
                "$base": {
                    b: 1,
                    "$base": {
                        c: 2,
                        d: [1,2,3,4],
                        "$base": {
                            e: 3
                        }
                    }
                }
            }
        }

        data = f.filter(data);
        expect(data.a.d).toEqual([1,2,3,4]);
        expect(data.a.e).toEqual(3);
    });

    it("Class Load Test", function() {
        let { Configurator } = this;
        process.env.DEV = true;
        let c = new Configurator(require);

        c.process("./test.yaml").then(data => {
            let r = data.arr[1];
            expect(r instanceof Configurator.ConfigObjectBase).toBeTruthy();
            expect(get(data, "arr[1].h.i")).toBe(1);
            expect(get(data, "arr[1].k.another")).toBe(1);
            expect(get(data, "arr[1].n.o")).toBe(1);
        }).catch(console.error);
    });
});
