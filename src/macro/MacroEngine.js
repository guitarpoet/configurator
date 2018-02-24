/**
 *
 * This is a plugin based macro processor, will pipe the file content through the filters
 *
 * @author Jack <jack@thinkingcloud.info>
 * @version 0.0.1
 * @date Fri Jan 26 10:39:04 2018
 */

const FilterBase = require("../models/FilterBase");
const { flatten, isArray, get, isString } = require("lodash");
const { FilterObject } = FilterBase;
const fs = require("fs");
const path = require("path");
const { enable_features, global_registry } = require("hot-pepper-jelly");

/**
 * The const values
 */
const IF_STATE = "if";
const ELSE_STATE = "else";
const IF_PATTERN = /^([ \t])*#if (.+)$/;
const IF_DEF_PATTERN = /^([ \t])*#ifdef (.+)$/;
const IF_ENV_PATTERN = /^([ \t])*#ifenv (.+)$/;
const ELSE_PATTERN = /^([ \t])*#else$/;
const END_IF_PATTERN = /^([ \t])*#endif$/;
const DEFINE_PATTERN = /^([ \t])*#define ([a-z\\.A-Z_]+)( (.+))?/;
const UNDEFINE_PATTERN = /^([ \t])*#undefine ([a-z\\.A-Z_]+)/;
const INCLUDE_PATTERN = /^([ \t])*#include ([a-zA-Z0-9\\._\/]+)/;
const EXPR_PATTERN = /^([ \t])*#expr (.+)$/;
const PLACE_HOLDER_PATTERN = /\$\([a-zA-Z0-9\\._]+\)/g;
const JSON_PATTERN = /([ \t])*#json ([a-zA-Z0-9\\._\/]+)$/; // Yes, sorry, we don't support blank in the file name
const ENABLE_PATTERN = /^([ \t])*#enable (([a-z\\.A-Z_]+)([ \t]*,[ \t]*[a-z\\.A-Z_]+)*)$/;

const evaluate = (expr) => (eval(`(${expr})`))

class TextFilterBase extends FilterObject {
    constructor(name) {
        super(name);
    }

    filter(text) {
        return text;
    }
}

class BreakLinesFilter extends FilterObject {
    constructor(seperator = "\n") {
        super("break-lines-filter");
        this.seperator = seperator;
    }

    filter(text) {
        if(!text) {
            // Null guard
            return [];
        }

        if(isArray(text)) {
            // If it is already array, just convert all of the contents to string, and return the array
            return text.map(o => new String(o));
        }

        return new String(text).split(this.seperator);
    }
}

class JoinLinesFilter extends FilterObject {
    constructor(seperator = "\n") {
        super("join-lines-filter");
        this.seperator = seperator;
    }

    filter(text) {
        if(!text) {
            // Null guard
            return "";
        }

        if(isArray(text)) {
            return text.join(this.seperator);
        }

        return new String(text);
    }
}

/**
 * The base class for all blocks
 */
class Block {
    /**
     * Let the block process the value of its own
     */
    process() {
    }
}

class EnableBlock extends Block {
    constructor(features) {
        super();
        this.features = features;
    }

    process() {
        let { features } = this;
        if(features && isString(features)) {
            let f = {};
            features.split(",").map(s => {
                f[s.trim()] = true;
            });
            enable_features(f);
        }
    }
}

class DefineBlock extends Block {
    constructor(variable, value = true) {
        super();
        this.variable = variable;
        this.value = value;
    }

    process() {
        process.env[this.variable] = this.value;
    }
}

class UndefineBlock extends Block {
    constructor(variable) {
        super();
        this.variable = variable;
    }

    process() {
        if(this.variable &&
            typeof process.env[this.variable] !== "undefined") {
            delete process.env[this.variable];
        }
    }
}

class ExprBlock extends Block {
    constructor(expression) {
        super();
        this.expression = expression;
    }

    process() {
        if(this.expression) {
            // Let's evaluate the expression
            return evaluate(this.expression);
        }
    }
}

class IfBlock extends Block {
    constructor(expression) {
        super();
        this._expression = expression;
        this._state = IF_STATE;
        this._block = [];
        this._alternative = [];
    }

    state(state = ELSE_STATE) {
        this._state = state;
    }

    expr() {
        return evaluate(this._expression);
    }

    process() {
        if(this._expression) {
            if(!!this.expr()) {
                return flatten(this._block.map(b => b instanceof Block? b.process(): b).filter(i=>!!i));
            }
        }

        return flatten(this._alternative.map(b => b instanceof Block? b.process(): b).filter(i=>!!i));
    }

    add(line) {
        if(line) {
            switch(this._state) {
                case IF_STATE:
                    this._block.push(line);
                    break;
                case ELSE_STATE:
                    this._alternative.push(line);
                    break;
            }
        }
    }
}

class IfDefBlock extends IfBlock {
    constructor(variable) {
        super(`typeof ${variable} !== "undefined"`);
    }
}

class IfEnvBlock extends IfBlock {
    constructor(variable) {
        super(`typeof process.env.${variable} !== "undefined"`);
    }
}

const replace = (str, search, replacemen) => {
    return str.split(search).join(replacemen);
}

/**
 * This filter will check for #json and include that json as a placeholder configuration
 * and replace all values in $() to the value
 */
class JsonFilter extends TextFilterBase {
    constructor(name, $require) {
        super(name);
        this.$require = $require;
    }

    filter(text = []) {
        let json = null;
        let ret = [];
        for(let t of text) {
            let m = t.match(JSON_PATTERN);
            if(m) {
                // Yes, it is json definition, let's parse it
                let name = m[2];
                json = this.$require(name);
            } else {
                m = t.match(PLACE_HOLDER_PATTERN);
                if(m) {
                    // We don't have json here, let's check if it is __file and __dir
                    let f = global_registry("macro-file");
                    if(f) {
                        t = replace(t, "$(__file)", f);
                        t = replace(t, "$(__dir)", path.dirname(f));
                    }

                    if(json) {
                        // Yes, it appears that the line is matching the place holder, let's calculate the place holders
                        let hash = {};
                        for(let d of m) {
                            // Let's remove the $( and ) from the name
                            let n = d.substr(2, d.length - 3);
                            hash[d] = get(json, n);
                        }

                        // We have calculated the value, let's replace it with place holder
                        for(let p in hash) {
                            let v = hash[p];
                            if(isArray(v)) {
                                // Only a simple array support
                                v = "[" + v.join(",") + "]";
                            }
                            t = replace(t, p, v);
                        }
                    }
                }
                ret.push(t);
            }
        }
        return ret;
    }
}

class DefineFilter extends TextFilterBase {
    constructor(name) {
        super(name);
    }

    filter(text = []) {
        let ret = [];
        for(let t of text) {
            let m = t.match(DEFINE_PATTERN);
            if(m) {
                let name = m[2];
                let value = m[4] || true;
                // OK, let's set the value to the global
                if(name) {
                    process.env[name] = value;
                }
            } else {
                // This is simple text, let's skip it
                ret.push(t);
            }
        }
        return ret;
    }
}

const handleDefine = (t) => {
    let m = t.match(DEFINE_PATTERN);
    if(m) {
        // This is a define operation
        let name = m[2];
        let value = m[4] || true;
        // OK, let's set the value to the process.env only
        if(name) {
            return new DefineBlock(name, value);
        }
    }

    m = t.match(ENABLE_PATTERN);
    if(m) {
        let features = m[2];
        if(features) {
            return new EnableBlock(features);
        }
    }

    m = t.match(EXPR_PATTERN);
    if(m) {
        // This is the expression block
        let expr = m[2];
        if(expr) {
            return new ExprBlock(expr);
        }
    }

    m = t.match(UNDEFINE_PATTERN);
    if(m) {
        // This is a undefine operation
        let name = m[2];
        if(name) {
            return new UndefineBlock(name);
        }
    }

    return t;
}

class IncludeFilter extends TextFilterBase {
    constructor(name, resolver = null) {
        super(name);
        this.resolver = resolver;
    }

    filter(text = []) {
        let ret = [];
        for(let t of text) {
            let m = t.match(INCLUDE_PATTERN);
            if(m) {
                // This is a file include, let's get the file
                let name = m[2];
                if(this.resolver) {
                    name = this.resolver(name);
                } else {
                    name = path.resolve(name);
                }
                if(fs.existsSync(name)) {
                    let content = fs.readFileSync(name, "utf-8");
                    // TODO: Maybe filter out the blank lines is not a good idea?
                    ret = ret.concat(content.split("\n").filter(i=>!!i));
                } else {
                    throw new Error(`Can't find file for name ${m[2]}`);
                }
            } else {
                ret.push(t);
            }
        }
        return ret;
    }
}

/**
 * The filter will support the #if and #else, and since ifdef will need define
 * and undefine, so, the define patterns will be handle in this filter too
 */
class CoreFilter extends TextFilterBase {
    constructor(name) {
        super(name);
    }

    filter(text = []) {
        // The stack for if else blocks
        let stack = [];
        let currentBlock = null;
        let ret = [];

        let lineNumber = 0;
        for(let t of text) {
            // Increment the line number
            lineNumber++;

            let m = t.match(IF_PATTERN);
            if(m) {
                let block = new IfBlock(m[2]);

                if(currentBlock) {
                    // Push the old block into the stack first
                    stack.push(currentBlock);

                    // Then add the block into the current block
                    currentBlock.add(block);
                }

                // Update the current block using the new one
                currentBlock = block;

                // Then move to next line
                continue;
            }

            m = t.match(IF_DEF_PATTERN);
            if(m) {
                let block = new IfDefBlock(m[2]);

                if(currentBlock) {
                    // Push the old block into the stack first
                    stack.push(currentBlock);

                    // Then add the block into the current block
                    currentBlock.add(block);
                }

                // Update the current block using the new one
                currentBlock = block;

                // Then move to next line
                continue;
            }

            m = t.match(IF_ENV_PATTERN);
            if(m) {
                let block = new IfEnvBlock(m[2]);

                if(currentBlock) {
                    // Push the old block into the stack first
                    stack.push(currentBlock);

                    // Then add the block into the current block
                    currentBlock.add(block);
                }

                // Update the current block using the new one
                currentBlock = block;

                // Then move to next line
                continue;
            }

            if(t.match(ELSE_PATTERN)) {
                // This is an else line, let's update the current block
                if(!currentBlock) {
                    // We got an error here!
                    throw new Error("You can't use #else if there is no according #if! line: " + lineNumber);
                }

                // Let's update the state for current block to else
                currentBlock.state(ELSE_STATE);

                // Move to the next line
                continue;
            }

            if(t.match(END_IF_PATTERN)) {
                // This is an end if line, let's finish the current block
                if(stack.length) {
                    // We have the block in the stack, this means this block is a nested block, let's just update the current block
                    currentBlock = stack.pop();
                } else {
                    // We don't have any blocks in the stack, this means this block is the topmost block, let's add its values to the result
                    ret = ret.concat(currentBlock.process());
                    // Then, let's update the current block to null again
                    currentBlock = null;
                }

                // Move to the next line
                continue;
            }

            let b = handleDefine(t);

            if(currentBlock) {
                // If there is a block, let's add it into the current block
                currentBlock.add(b);
            } else {
                if(b instanceof Block) {
                    // If this is a block, let's process it
                    t = b.process();
                    if(!t) {
                        // If there is nothing, let's move to next line
                        continue;
                    }

                    if(isArray(t)) {
                        // If the result is an array, let's put them all together into the return
                        ret = ret.concat(t);
                        // Move to next line
                        continue;
                    }

                    if(!isString(t)) {
                        t = new String(t);
                    }
                }

                // This is not any if macro, and there is no block here let's just add it into the ret
                ret.push(t);
            }
        }

        if(stack.length || !!currentBlock) {
            throw new Error("The text didn't have #if and the #endif match, you should check the text!");
        }
        return ret;
    }
}

class MacroEngine extends FilterBase {
    constructor(filters = []) {
        super(filters);
        this.unshift(this.breakLines()). // Add the break filter at the begining
            push(this.joinResult()); // Add the join filter to the end
    }

    breakLines() {
        return new BreakLinesFilter();
    }

    joinResult() {
        return new JoinLinesFilter();
    }
}

MacroEngine.TextFilterBase = TextFilterBase;
MacroEngine.CoreFilter = CoreFilter;

MacroEngine.basicFilters = (resolver = null) => ([
    new IncludeFilter("include-filter", resolver),
    new CoreFilter("core-filter")
])

MacroEngine.simpleFilters = (require = null) => ([
    new IncludeFilter("include-filter", require.resolve),
    new CoreFilter("core-filter"),
    new JsonFilter("json-filter", require)
])

MacroEngine.basic = (resolver) => new MacroEngine(MacroEngine.basicFilters(resolver));
MacroEngine.simple = (require) => new MacroEngine(MacroEngine.simpleFilters(require));

module.exports = MacroEngine
