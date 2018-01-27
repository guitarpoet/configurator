const notMatchString = `#if 1 > 2
Hello
#if
#else
World
#endif`;

const simpleString = `#if 1 > 2
Hello
#else
World
#endif`;

const complexString = `#if 1 > 2
Hello
#else
World
#endif`;

describe("Macro Engine Test Suite", function() {
	it("Macro Engine Simple Process Test", function() {
		let { Configurator: { MacroEngine: { basic } }} = this;
        basic.process(simpleString).then(txt => expect(txt).toBe("World")).catch(fail);
	});
})
