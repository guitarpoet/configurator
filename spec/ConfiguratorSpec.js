describe("Configurator", function() {
	it("Simple Load Test", function() {
		let { Configurator } = this;
        delete process.env.TEST;
        let c = new Configurator(require.resolve);
        c.process("./test.yaml").then(data => expect(data.no_test).toBeTruthy()).catch(console.error);
    });
	it("Simple Load Test", function() {
		let { Configurator } = this;
        process.env.TEST = true;
        let c = new Configurator(require.resolve);
        c.process("./test.yaml").then(data => expect(data.test).toBeTruthy()).catch(console.error);
    });

	it("Sample Load Test", function() {
		let { Configurator } = this;
        process.env.DEV = true;
        let c = new Configurator(require.resolve);
        c.process("./sample.yaml").then(console.info).catch(console.error);

        console.time("process");
        c.process("./sample.yaml").then(() => console.timeEnd("process")).catch(console.error);
    });
});
