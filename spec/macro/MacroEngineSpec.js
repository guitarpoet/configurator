const notMatchString = `#if 1 > 2
Hello
#if 1 < 2
#else
World
#endif`;

const simpleString = `#if 1 > 2
Hello
#else
World
#endif`;

const complexString = `#if global.DEBUG
#if global.ANOTHER_INT > 20
DEBUG 20
#else
DEBUG 0
#endif
#else
NO DEBUG
#endif`;

const complexStringWithIfDef = `#if global.DEBUG
#ifdef global.TEST
TEST
#else
NOT TEST
#endif
#else
NO DEBUG
#endif`;

const simpleDefineString = `
#define TEST 1
`

const complexDefineString = `#if global.DEBUG
#define MY_DEBUG
#undefine NO_DEBUG
#else
#define NO_DEBUG
#undefine MY_DEBUG
#endif
#ifenv MY_DEBUG
DEBUG
#endif
#ifenv NO_DEBUG
NO DEBUG
#endif`;


global.DEBUG = 1;
global.ANOTHER_INT = 23;

describe("MacroEngine", function() {
	it("Simple Process Test", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        basic.process(simpleString).then(txt => expect(txt).toBe("World")).catch(fail);
	});

    it("Not Match Test", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        basic.process(notMatchString).then(() => fail("Didn't get error thrown!")).catch(e => expect(e).toBeTruthy());
    });

    it("Complex Process Test", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        basic.process(complexString).then(txt => expect(txt).toBe("DEBUG 20")).catch(fail);
    });

    it("Complex Process Test For Branch", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        global.ANOTHER_INT = 1;
        basic.process(complexString).then(txt => expect(txt).toBe("DEBUG 0")).catch(fail);
    });

    it("Complex Process Test For If Defined", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        global.DEBUG = 1;
        basic.process(complexStringWithIfDef).then(txt => expect(txt).toBe("NOT TEST")).catch(fail);
    });

    it("Complex Process Test For If Defined 2", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        global.DEBUG = 1;
        global.TEST = 1;
        basic.process(complexStringWithIfDef).then(txt => expect(txt).toBe("TEST")).catch(fail);
    });

    it("Complex Process Test For Global Branch", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        global.DEBUG = 0;
        basic.process(complexString).then(txt => expect(txt).toBe("NO DEBUG")).catch(fail);
    });

    it("Define Test", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        basic.process(simpleDefineString).then(() => expect(process.env.TEST).toBe("1")).catch(fail);
    });

    it("Define Complex Test 1", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        global.DEBUG = 0;
        basic.process(complexDefineString).then(txt => {
            expect(process.env.MY_DEBUG).toBeFalsy();
            expect(txt).toBe("NO DEBUG");
        }).catch(fail);
    });

    it("Define Complex Test 1", function() {
		let { Configurator: { MacroEngine: { basic } } } = this;
        global.DEBUG = 1;
        basic.process(complexDefineString).then(txt => {
            expect(process.env.MY_DEBUG).toBeTruthy();
            expect(txt).toBe("DEBUG");
        }).catch(fail);
    });
})
