const ConfigTest = require("./Sample.js");
const { get } = require("lodash");

describe("Configurator", function() {
	it("Simple Load Test", function() {
		let { Configurator } = this;
        delete process.env.TEST;
        let c = new Configurator(require);
        c.process("./test.yaml").then(data => expect(data.no_test).toBeTruthy()).catch(console.error);
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

        c.process("./sample.yaml").then(data => expect(data).toBeTruthy()).catch(console.error);
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

	it("Class Load Test", function() {
		let { Configurator } = this;
        process.env.DEV = true;
        let c = new Configurator(require);

        c.process("./test.yaml").then(data => { 
            let r = data.arr[1];
            expect(r instanceof Configurator.ConfigObjectBase).toBeTruthy();
            expect(get(data, "arr[1].h.i")).toBe(1);
            expect(get(data, "arr[1].k.another")).toBe(1);
        }).catch(console.error);
    });
});
