/**
 *
 * This is a plugin based macro processor, will pipe the file content through the filters
 *
 * @author Jack <jack@thinkingcloud.info>
 * @version 0.0.1
 * @date Fri Jan 26 10:39:04 2018
 */

const FilterBase = require("../models/FilterBase");
const { isString, isArray } = require("lodash");
const { FilterObject } = FilterBase;

/**
 * The const values
 */
const IF_STATE = "if";
const ELSE_STATE = "else";
const IF_PATTERN = /^(\\s)*#if (.+)$/;
const ELSE_PATTERN = /^(\\s)*#else$/;
const END_IF_PATTERN = /^(\\s)*#endif$/;

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
    constructor(seperator = " ") {
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

class IfBlock {
    constructor(expression) {
        this._expression = expression;
        this._state = IF_STATE;
        this._block = [];
        this._alternative = [];
    }

    state(state = ELSE_STATE) {
        this._state = state;
    }

    values() {
        if(this._expression) {
            if(!!eval(`(${this._expression})`)) {
                return this._block.map(b => b instanceof IfBlock? b.values(): b);
            }
        }

        return this._alternative.map(b => b instanceof IfBlock? b.values(): b);
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

/**
 * The filter will support the #if and #else
 */
class IfFilter extends TextFilterBase {
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
                    currentBlock.push(block);
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
                    ret = ret.concat(currentBlock.values());
                    // Then, let's update the current block to null again
                    currentBlock = null;
                }

                // Move to the next line
                continue;
            }

            if(currentBlock) {
                // If there is a block, let's add it into the current block
                currentBlock.add(t);
            } else {
                // This is not any if macro, and there is no block here let's just add it into the ret
                ret.push(t);
            }
        }

        if(stack.length) {
            throw new Error("The text's text didn't have #if and the #endif match, you should check the text!");
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
MacroEngine.IfFilter = IfFilter;
MacroEngine.basicFilters = [
    new IfFilter()
];
MacroEngine.basic = new MacroEngine(MacroEngine.basicFilters);

module.exports = MacroEngine
