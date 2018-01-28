describe("Configurator", function() {
	it("Simple Load Test", function() {
		let { Configurator } = this;
        delete process.env.TEST;
        let c = new Configurator(require.resolve);
        c.load("./test.yaml").then(data => expect(data.no_test).toBeTruthy()).catch(console.error);
    });
	it("Simple Load Test", function() {
		let { Configurator } = this;
        process.env.TEST = true;
        let c = new Configurator(require.resolve);
        c.load("./test.yaml").then(data => expect(data.test).toBeTruthy()).catch(console.error);
    });

	it("Sample Load Test", function() {
		let { Configurator } = this;
        let c = new Configurator(require.resolve);
        //c.load("./sample.yaml").then(console.info).catch(console.error);
    });
});
