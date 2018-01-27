describe("Filter Base Test Suite", function() {
    it("Filter Base Simple Process Test", function() {
        const { Configurator: { FilterBase } } = this;

        class TestFilter extends FilterBase.FilterObject {
            constructor(name = "test") {
                super(name);
            }

            filter(text) {
                return text + " " + this.name;
            }
        }

        let f = new FilterBase([ (text) => (text + " world"), new TestFilter() ]);

        f.process("hello").then((text) => {
            expect(text).toBe("hello world test");
        })
    });

    it("Filter Base Exists Push and Unshift Test", function() {
        const { Configurator: { FilterBase } } = this;

        class A extends FilterBase.FilterObject {
            constructor(name = "a") {
                super(name);
            }

            filter(text) {
                return text + " " + this.name;
            }
        }

        class B extends FilterBase.FilterObject {
            constructor(name = "b") {
                super(name);
            }

            filter(text) {
                return text + " " + this.name;
            }
        }

        let f = new FilterBase([ new A() ]);

        f.process("hello").then((text) => {
            expect(text).toBe("hello a");
        })

        f.push(new A());

        f.process("hello").then((text) => {
            expect(text).toBe("hello a");
        })

        // Since we already have a, this won't affect anything
        expect(f.filters().length).toBe(1);

        f.unshift(new B());

        f.process("hello").then((text) => {
            expect(text).toBe("hello b a");
        })

        expect(f.filters().length).toBe(2);

        // Let's push a simple function into it
        f.push(t => t + " c");

        expect(f.filters().length).toBe(3);

        f.process("hello").then((text) => {
            expect(text).toBe("hello b a c");
        })
    });
});
