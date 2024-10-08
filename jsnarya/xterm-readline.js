(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityHighlighter = void 0;
class IdentityHighlighter {
    highlight(line, pos) {
        return line;
    }
    highlightPrompt(prompt) {
        return prompt;
    }
    highlightChar(line, pos) {
        return false;
    }
}
exports.IdentityHighlighter = IdentityHighlighter;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
class History {
    constructor(maxEntries) {
        this.entries = [];
        this.cursor = -1;
        this.maxEntries = maxEntries;
    }
    saveToLocalStorage() {
        const localStorage = window === null || window === void 0 ? void 0 : window.localStorage;
        if (localStorage !== undefined) {
            localStorage.setItem("history", JSON.stringify(this.entries));
        }
    }
    restoreFromLocalStorage() {
        const localStorage = window === null || window === void 0 ? void 0 : window.localStorage;
        if (localStorage !== undefined) {
            const historyJson = localStorage.getItem("history");
            if (historyJson === undefined || historyJson === null) {
                return;
            }
            try {
                const historyEntries = JSON.parse(historyJson);
                if (!Array.isArray(historyEntries) ||
                    historyEntries.find((it) => typeof it !== "string") !== undefined) {
                    this.entries = [];
                    localStorage.setItem("history", "[]");
                }
                else {
                    this.entries = historyEntries;
                }
            }
            catch (e) {
                this.entries = [];
                localStorage.setItem("history", "[]");
            }
        }
    }
    append(text) {
        this.resetCursor();
        if (!this.entries.includes(text)) {
            this.entries.unshift(text);
        }
        else {
            this.entries.splice(this.entries.indexOf(text), 1);
            this.entries.unshift(text);
        }
        if (this.entries.length > this.maxEntries) {
            this.entries.pop();
        }
        this.saveToLocalStorage();
    }
    resetCursor() {
        this.cursor = -1;
    }
    next() {
        if (this.cursor === -1) {
            return undefined;
        }
        else {
            this.cursor -= 1;
        }
        return this.entries[this.cursor];
    }
    prev() {
        if (this.cursor + 1 >= this.entries.length) {
            return undefined;
        }
        else {
            this.cursor += 1;
        }
        return this.entries[this.cursor];
    }
}
exports.History = History;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInput = exports.InputType = void 0;
var InputType;
(function (InputType) {
    InputType[InputType["Text"] = 0] = "Text";
    InputType[InputType["AltEnter"] = 1] = "AltEnter";
    InputType[InputType["ArrowUp"] = 2] = "ArrowUp";
    InputType[InputType["ArrowDown"] = 3] = "ArrowDown";
    InputType[InputType["ArrowLeft"] = 4] = "ArrowLeft";
    InputType[InputType["ArrowRight"] = 5] = "ArrowRight";
    InputType[InputType["Delete"] = 6] = "Delete";
    InputType[InputType["Backspace"] = 7] = "Backspace";
    InputType[InputType["CtrlA"] = 8] = "CtrlA";
    InputType[InputType["CtrlC"] = 9] = "CtrlC";
    InputType[InputType["CtrlD"] = 10] = "CtrlD";
    InputType[InputType["CtrlE"] = 11] = "CtrlE";
    InputType[InputType["CtrlK"] = 12] = "CtrlK";
    InputType[InputType["CtrlL"] = 13] = "CtrlL";
    InputType[InputType["CtrlQ"] = 14] = "CtrlQ";
    InputType[InputType["CtrlS"] = 15] = "CtrlS";
    InputType[InputType["CtrlU"] = 16] = "CtrlU";
    InputType[InputType["End"] = 17] = "End";
    InputType[InputType["Enter"] = 18] = "Enter";
    InputType[InputType["Home"] = 19] = "Home";
    InputType[InputType["ShiftEnter"] = 20] = "ShiftEnter";
    InputType[InputType["UnsupportedControlChar"] = 21] = "UnsupportedControlChar";
    InputType[InputType["UnsupportedEscape"] = 22] = "UnsupportedEscape";
})(InputType = exports.InputType || (exports.InputType = {}));
function parseInput(data) {
    return Array.from(splitInput(data));
}
exports.parseInput = parseInput;
function* splitInput(data) {
    let text = [];
    const it = data[Symbol.iterator]();
    for (let next = it.next(); !next.done; next = it.next()) {
        const c = next.value;
        if (c.length > 1) {
            text.push(c);
            continue;
        }
        const val = c.charCodeAt(0);
        if (text.length > 0 && (val < 0x20 || val === 0x7f)) {
            yield {
                inputType: InputType.Text,
                data: text,
            };
            text = [];
        }
        if (val === 0x1b) {
            const seq2 = it.next();
            if (seq2.done) {
                text.push("\x1b");
                continue;
            }
            // Console
            let inputType = InputType.UnsupportedEscape;
            if (seq2.value !== "[") {
                switch (seq2.value) {
                    case "\r":
                        inputType = InputType.AltEnter;
                        break;
                }
                yield {
                    inputType,
                    data: ["\x1b", seq2.value],
                };
                continue;
            }
            // Ansi Escape
            const seq3 = it.next();
            if (seq3.done) {
                continue;
            }
            // vt sequence
            if (seq3.value >= "0" && seq3.value <= "9") {
                let digit = seq3.value;
                const nextDigit = it.next();
                if (nextDigit.done) {
                    return;
                }
                if (nextDigit.value >= "0" && nextDigit.value <= "9") {
                    digit += nextDigit.value;
                }
                else if (nextDigit.value !== "~") {
                    continue;
                }
                switch (digit) {
                    case "3":
                        inputType = InputType.Delete;
                        break;
                }
                yield {
                    inputType,
                    data: ["\x1b", "[", digit, "~"],
                };
                continue;
            }
            switch (seq3.value) {
                case "A":
                    inputType = InputType.ArrowUp;
                    break;
                case "B":
                    inputType = InputType.ArrowDown;
                    break;
                case "C":
                    inputType = InputType.ArrowRight;
                    break;
                case "D":
                    inputType = InputType.ArrowLeft;
                    break;
                case "F":
                    inputType = InputType.End;
                    break;
                case "H":
                    inputType = InputType.Home;
                    break;
                case "\r":
                    inputType = InputType.AltEnter;
                    break;
            }
            yield {
                inputType,
                data: ["\x1b", "[", seq3.value],
            };
            continue;
        }
        if (val < 0x20 || val === 0x7f) {
            let inputType = InputType.UnsupportedControlChar;
            switch (val) {
                case 0x1:
                    inputType = InputType.CtrlA;
                    break;
                case 0x3:
                    inputType = InputType.CtrlC;
                    break;
                case 0x4:
                    inputType = InputType.CtrlD;
                    break;
                case 0x5:
                    inputType = InputType.CtrlE;
                    break;
                case 0xb:
                    inputType = InputType.CtrlK;
                    break;
                case 0x11:
                    inputType = InputType.CtrlQ;
                    break;
                case 0x13:
                    inputType = InputType.CtrlS;
                    break;
                case 0x15:
                    inputType = InputType.CtrlU;
                    break;
                case 0xd:
                    inputType = InputType.Enter;
                    break;
                case 0x7f:
                    inputType = InputType.Backspace;
                    break;
                case 0xc:
                    inputType = InputType.CtrlL;
                    break;
            }
            yield {
                inputType,
                data: [c],
            };
            continue;
        }
        // else this is text
        text.push(c);
    }
    if (text.length > 0) {
        yield {
            inputType: InputType.Text,
            data: text,
        };
    }
}

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineBuffer = void 0;
class LineBuffer {
    constructor() {
        this.buf = "";
        this.pos = 0;
    }
    buffer() {
        return this.buf;
    }
    pos_buffer() {
        return this.buf.slice(0, this.pos);
    }
    // Return length of buffer in bytes
    length() {
        return this.buf.length;
    }
    // Return length of buffer in characters
    char_length() {
        return [...this.buf].length;
    }
    // Set text and position
    update(text, pos) {
        this.buf = text;
        this.pos = pos;
    }
    insert(text) {
        const shift = text.length;
        const push = this.pos === this.buf.length;
        if (push) {
            this.buf = this.buf + text;
        }
        else {
            this.buf = this.buf.slice(0, this.pos) + text + this.buf.slice(this.pos);
        }
        this.pos += shift;
        return push;
    }
    moveBack(n) {
        const pos = this.prevPos(n);
        if (pos !== undefined) {
            this.pos = pos;
            return true;
        }
        else {
            return false;
        }
    }
    moveForward(n) {
        const pos = this.nextPos(n);
        if (pos !== undefined) {
            this.pos = pos;
            return true;
        }
        else {
            return false;
        }
    }
    moveHome() {
        const start = this.startOfLine();
        if (this.pos > start) {
            this.pos = start;
            return true;
        }
        return false;
    }
    moveEnd() {
        const end = this.endOfLine();
        if (this.pos === end) {
            return false;
        }
        this.pos = end;
        return true;
    }
    startOfLine() {
        const start = this.buf.slice(0, this.pos).lastIndexOf("\n");
        if (start !== -1) {
            return start + 1;
        }
        else {
            return 0;
        }
    }
    endOfLine() {
        const end = this.buf.slice(this.pos).indexOf("\n");
        if (end !== -1) {
            return this.pos + end;
        }
        else {
            return this.buf.length;
        }
    }
    moveLineUp(n) {
        const off = this.buf.slice(0, this.pos).lastIndexOf("\n");
        if (off === -1) {
            return false;
        }
        const column = [...this.buf.slice(off + 1, this.pos)].length;
        let destStart = this.buf.slice(0, off).lastIndexOf("\n");
        if (destStart === -1) {
            destStart = 0;
        }
        else {
            destStart = destStart + 1;
        }
        let destEnd = off;
        for (let i = 1; i < n; i++) {
            if (destStart === 0) {
                break;
            }
            destEnd = destStart - 1;
            destStart = this.buf.slice(0, destEnd).lastIndexOf("\n");
            if (destStart === -1) {
                destStart = 0;
            }
            else {
                destStart = destStart + 1;
            }
        }
        const slice = [...this.buf.slice(destStart, destEnd)].slice(0, column);
        let gIdx = off;
        if (slice.length > 0) {
            gIdx = slice.map((c) => c.length).reduce((acc, m) => acc + m, 0);
            gIdx = destStart + gIdx;
        }
        this.pos = gIdx;
        return true;
    }
    moveLineDown(n) {
        const off = this.buf.slice(this.pos).indexOf("\n");
        if (off === -1) {
            return false;
        }
        let lineStart = this.buf.slice(0, this.pos).lastIndexOf("\n");
        if (lineStart === -1) {
            lineStart = 0;
        }
        else {
            lineStart += 1;
        }
        const column = [...this.buf.slice(lineStart, this.pos)].length;
        let destStart = this.pos + off + 1;
        let destEnd = this.buf.slice(destStart).indexOf("\n");
        if (destEnd === -1) {
            destEnd = this.buf.length;
        }
        else {
            destEnd = destStart + destEnd;
        }
        for (let i = 1; i < n; i++) {
            if (destEnd === this.buf.length) {
                break;
            }
            destStart = destEnd + 1;
            destEnd = this.buf.slice(destStart).indexOf("\n");
            if (destEnd === -1) {
                destEnd = this.buf.length;
            }
            else {
                destEnd = destStart + destEnd;
            }
        }
        const slice = [...this.buf.slice(destStart, destEnd)];
        if (column < slice.length) {
            this.pos =
                slice
                    .slice(0, column)
                    .map((c) => c.length)
                    .reduce((acc, m) => acc + m, 0) + destStart;
        }
        else {
            this.pos = destEnd;
        }
        return true;
    }
    // Set position of cursor
    set_pos(pos) {
        this.pos = pos;
    }
    // Return the position of the character preceding
    // pos
    prevPos(n) {
        if (this.pos === 0) {
            return undefined;
        }
        const buf = this.buf.slice(0, this.pos);
        return (this.pos -
            [...buf]
                .slice(-n)
                .map((c) => c.length)
                .reduce((acc, m) => acc + m, 0));
    }
    // Return the position of the character following the
    // current pos
    nextPos(n) {
        if (this.pos === this.buf.length) {
            return undefined;
        }
        const buf = this.buf.slice(this.pos);
        return (this.pos +
            [...buf]
                .slice(0, n)
                .map((c) => c.length)
                .reduce((acc, m) => acc + m, 0));
    }
    backspace(n) {
        const newPos = this.prevPos(n);
        if (newPos === undefined) {
            return false;
        }
        this.buf = this.buf.slice(0, newPos) + this.buf.slice(this.pos);
        this.pos = newPos;
        return true;
    }
    delete(n) {
        const nextChar = this.nextPos(n);
        if (nextChar !== undefined) {
            this.buf = this.buf.slice(0, this.pos) + this.buf.slice(nextChar);
            return true;
        }
        else {
            return false;
        }
    }
    deleteEndOfLine() {
        if (this.buf.length == 0 || this.pos == this.buf.length) {
            return false;
        }
        const start = this.pos;
        const end = this.endOfLine();
        if (start == end) {
            this.delete(1);
        }
        else {
            this.buf = this.buf.slice(0, start) + this.buf.slice(end);
        }
        return true;
    }
}
exports.LineBuffer = LineBuffer;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Readline = void 0;
const keymap_1 = require("./keymap");
const state_1 = require("./state");
const history_1 = require("./history");
const tty_1 = require("./tty");
const highlight_1 = require("./highlight");
class Readline {
    constructor() {
        this.highlighter = new highlight_1.IdentityHighlighter();
        this.history = new history_1.History(50);
        this.disposables = [];
        this.watermark = 0;
        this.highWatermark = 10000;
        this.lowWatermark = 1000;
        this.highWater = false;
        this.state = new state_1.State(">", this.tty(), this.highlighter, this.history);
        this.checkHandler = () => true;
        this.ctrlCHandler = () => {
            return;
        };
        this.pauseHandler = (resume) => {
            return;
        };
        this.history.restoreFromLocalStorage();
    }
    /**
     * Activate this addon - this function is called by xterm's
     * loadAddon().
     *
     * @param term - The terminal this readline is attached to.
     */
    activate(term) {
        this.term = term;
        this.term.onData(this.readData.bind(this));
        this.term.attachCustomKeyEventHandler(this.handleKeyEvent.bind(this));
    }
    /**
     * Dispose
     *
     */
    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
    /**
     * Manually append a line to the top of the readline's history.
     *
     * @param text - The text to append to history.
     */
    appendHistory(text) {
        this.history.append(text);
    }
    /**
     * Set the highlighter handler for this readline. This is used to
     * create custom highlighting functionality (e.g. for syntax highlighting
     * or bracket matching).
     *
     * @param highlighter - A handler to handle all highlight callbacks.
     */
    setHighlighter(highlighter) {
        this.highlighter = highlighter;
    }
    /**
     * Set the check callback. This callback is used by readline to determine if input
     * requires additiona lines when the user presses 'enter'.
     *
     * @param fn - A function (string) -> boolean that should return true if the input
     *             is complete, and false if a line (\n) should be added to the input.
     */
    setCheckHandler(fn) {
        this.checkHandler = fn;
    }
    /**
     * Set the ctrl-c handler. This function will be called if ctrl-c is encountered
     * between readline reads. This may be used in circumstances where input from the
     * user may result in a long running task that can be cancelled.
     *
     * @param fn - The ctrl-c handler.
     */
    setCtrlCHandler(fn) {
        this.ctrlCHandler = fn;
    }
    /**
     * Set the callback to be called when the user presses ctrl-s/ctrl-q.
     *
     * @param fn - The pause handler
     */
    setPauseHandler(fn) {
        this.pauseHandler = fn;
    }
    /**
     * writeReady() may be used to implement basic output flow control. This function
     * will return false if the writes to the terminal initiated by Readline have
     * reached a highwater mark.
     *
     * @returns true if this terminal is accepting more input.
     */
    writeReady() {
        return !this.highWater;
    }
    /**
     * Write text to the terminal.
     *
     * @param text - The text to write to the terminal.
     */
    write(text) {
        if (text === "\n") {
            text = "\r\n";
        }
        else {
            text = text.replace(/^\n/, "\r\n");
            text = text.replace(/([^\r])\n/g, "$1\r\n");
        }
        const outputLength = text.length;
        this.watermark += outputLength;
        if (this.watermark > this.highWatermark) {
            this.highWater = true;
        }
        if (this.term) {
            this.term.write(text, () => {
                this.watermark = Math.max(this.watermark - outputLength, 0);
                if (this.highWater && this.watermark < this.lowWatermark) {
                    this.highWater = false;
                }
            });
        }
    }
    /**
     * Write text to the terminal.
     *
     * @param text - The text to write to the terminal
     */
    print(text) {
        return this.write(text);
    }
    /**
     * Write text to the terminal and append with "\r\n".
     *
     * @param text - The text to write to the terminal./
     * @returns
     */
    println(text) {
        return this.write(text + "\r\n");
    }
    /**
     * Obtain an output interface to this terminal.
     *
     * @returns Output
     */
    output() {
        return this;
    }
    /**
     * Obtain a tty interface to this terminal.
     *
     * @returns A tty
     */
    tty() {
        var _a, _b;
        if (((_b = (_a = this.term) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.tabStopWidth) !== undefined) {
            return new tty_1.Tty(this.term.cols, this.term.rows, this.term.options.tabStopWidth, this.output());
        }
        else {
            return new tty_1.Tty(0, 0, 8, this.output());
        }
    }
    /**
     * Display the given prompt and wait for one line of input from the
     * terminal. The returned promise will be executed when a line has been
     * read from the terminal.
     *
     * @param prompt The prompt to use.
     * @returns A promise to be called when the input has been read.
     */
    read(prompt) {
        return new Promise((resolve, reject) => {
            if (this.term === undefined) {
                reject("addon is not active");
                return;
            }
            this.state = new state_1.State(prompt, this.tty(), this.highlighter, this.history);
            this.state.refresh();
            this.activeRead = { prompt, resolve, reject };
        });
    }
    handleKeyEvent(event) {
        if (event.key === "Enter" && event.shiftKey) {
            if (event.type === "keydown") {
                this.readKey({
                    inputType: keymap_1.InputType.ShiftEnter,
                    data: ["\r"],
                });
            }
            return false;
        }
        return true;
    }
    readData(data) {
        const input = (0, keymap_1.parseInput)(data);
        if (input.length > 1 ||
            (input[0].inputType === keymap_1.InputType.Text && input[0].data.length > 1)) {
            this.readPaste(input);
            return;
        }
        this.readKey(input[0]);
    }
    readPaste(input) {
        const mappedInput = input.map((it) => {
            if (it.inputType === keymap_1.InputType.Enter) {
                return { inputType: keymap_1.InputType.Text, data: ["\n"] };
            }
            return it;
        });
        for (const it of mappedInput) {
            if (it.inputType === keymap_1.InputType.Text) {
                this.state.editInsert(it.data.join(""));
            }
            else {
                this.readKey(it);
            }
        }
    }
    readKey(input) {
        var _a, _b, _c;
        if (this.activeRead === undefined) {
            switch (input.inputType) {
                case keymap_1.InputType.CtrlC:
                    this.ctrlCHandler();
                    break;
                case keymap_1.InputType.CtrlL:
                    this.write("\x1b[H\x1b[2J");
                    break;
            }
            return;
        }
        switch (input.inputType) {
            case keymap_1.InputType.Text:
                this.state.editInsert(input.data.join(""));
                break;
            case keymap_1.InputType.AltEnter:
            case keymap_1.InputType.ShiftEnter:
                this.state.editInsert("\n");
                break;
            case keymap_1.InputType.Enter:
                if (this.checkHandler(this.state.buffer())) {
                    this.state.moveCursorToEnd();
                    (_a = this.term) === null || _a === void 0 ? void 0 : _a.write("\r\n");
                    this.history.append(this.state.buffer());
                    (_b = this.activeRead) === null || _b === void 0 ? void 0 : _b.resolve(this.state.buffer());
                    this.activeRead = undefined;
                }
                else {
                    this.state.editInsert("\n");
                }
                break;
            case keymap_1.InputType.CtrlC:
                this.state.moveCursorToEnd();
                (_c = this.term) === null || _c === void 0 ? void 0 : _c.write("^C\r\n");
                this.state = new state_1.State(this.activeRead.prompt, this.tty(), this.highlighter, this.history);
                this.state.refresh();
                break;
            case keymap_1.InputType.CtrlS:
                this.pauseHandler(false);
                break;
            case keymap_1.InputType.CtrlU:
                this.state.update("");
                break;
            case keymap_1.InputType.CtrlK:
                this.state.editDeleteEndOfLine();
                break;
            case keymap_1.InputType.CtrlQ:
                this.pauseHandler(true);
                break;
            case keymap_1.InputType.CtrlL:
                this.state.clearScreen();
                break;
            case keymap_1.InputType.Home:
            case keymap_1.InputType.CtrlA:
                this.state.moveCursorHome();
                break;
            case keymap_1.InputType.End:
            case keymap_1.InputType.CtrlE:
                this.state.moveCursorEnd();
                break;
            case keymap_1.InputType.Backspace:
                this.state.editBackspace(1);
                break;
            case keymap_1.InputType.Delete:
            case keymap_1.InputType.CtrlD:
                this.state.editDelete(1);
                break;
            case keymap_1.InputType.ArrowLeft:
                this.state.moveCursorBack(1);
                break;
            case keymap_1.InputType.ArrowRight:
                this.state.moveCursorForward(1);
                break;
            case keymap_1.InputType.ArrowUp:
                this.state.moveCursorUp(1);
                break;
            case keymap_1.InputType.ArrowDown:
                this.state.moveCursorDown(1);
                break;
            case keymap_1.InputType.UnsupportedControlChar:
            case keymap_1.InputType.UnsupportedEscape:
                break;
        }
    }
}
exports.Readline = Readline;
window.Readline = Readline;

},{"./highlight":1,"./history":2,"./keymap":3,"./state":6,"./tty":7}],6:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = exports.Layout = exports.Position = void 0;
/* tslint:disable:max-classes-per-file */
const line_1 = require("./line");
const string_width_1 = __importDefault(require("string-width"));
class Position {
    constructor(rows, cols) {
        if (rows !== undefined) {
            this.row = rows;
        }
        else {
            this.row = 0;
        }
        if (cols !== undefined) {
            this.col = cols;
        }
        else {
            this.col = 0;
        }
    }
}
exports.Position = Position;
class Layout {
    constructor(promptSize) {
        this.promptSize = promptSize;
        this.cursor = new Position();
        this.end = new Position();
    }
}
exports.Layout = Layout;
class State {
    constructor(prompt, tty, highlighter, history) {
        this.line = new line_1.LineBuffer();
        this.highlighting = false;
        this.prompt = prompt;
        this.tty = tty;
        this.highlighter = highlighter;
        this.history = history;
        this.promptSize = tty.calculatePosition(prompt, new Position());
        this.layout = new Layout(this.promptSize);
    }
    buffer() {
        return this.line.buffer();
    }
    shouldHighlight() {
        const highlighting = this.highlighter.highlightChar(this.line.buf, this.line.pos);
        if (highlighting) {
            this.highlighting = true;
            return true;
        }
        else if (this.highlighting) {
            this.highlighting = false;
            return true;
        }
        else {
            return false;
        }
    }
    clearScreen() {
        this.tty.clearScreen();
        this.layout.cursor = new Position();
        this.layout.end = new Position();
        this.refresh();
    }
    editInsert(text) {
        const push = this.line.insert(text);
        const multiline = text.includes("\n");
        if (push && !multiline) {
            const width = (0, string_width_1.default)(text);
            if (width > 0 &&
                this.layout.cursor.col + width < this.tty.col &&
                !this.shouldHighlight()) {
                this.layout.cursor.col += width;
                this.layout.end.col += width;
                this.tty.write(text);
            }
            else {
                this.refresh();
            }
        }
        else {
            this.refresh();
        }
    }
    update(text) {
        this.line.update(text, text.length);
        this.refresh();
    }
    editBackspace(n) {
        if (this.line.backspace(n)) {
            this.refresh();
        }
    }
    editDelete(n) {
        if (this.line.delete(n)) {
            this.refresh();
        }
    }
    editDeleteEndOfLine() {
        if (this.line.deleteEndOfLine()) {
            this.refresh();
        }
    }
    refresh() {
        const newLayout = this.tty.computeLayout(this.promptSize, this.line);
        this.tty.refreshLine(this.prompt, this.line, this.layout, newLayout, this.highlighter);
        this.layout = newLayout;
    }
    moveCursorBack(n) {
        if (this.line.moveBack(n)) {
            this.moveCursor();
        }
    }
    moveCursorForward(n) {
        if (this.line.moveForward(n)) {
            this.moveCursor();
        }
    }
    moveCursorUp(n) {
        if (this.line.moveLineUp(n)) {
            this.moveCursor();
        }
        else {
            this.previousHistory();
        }
    }
    moveCursorDown(n) {
        if (this.line.moveLineDown(n)) {
            this.moveCursor();
        }
        else {
            this.nextHistory();
        }
    }
    moveCursorHome() {
        if (this.line.moveHome()) {
            this.moveCursor();
        }
    }
    moveCursorEnd() {
        if (this.line.moveEnd()) {
            this.moveCursor();
        }
    }
    moveCursorToEnd() {
        if (this.layout.cursor === this.layout.end) {
            return;
        }
        this.tty.moveCursor(this.layout.cursor, this.layout.end);
        this.layout.cursor = Object.assign({}, this.layout.end);
    }
    previousHistory() {
        if (this.history.cursor === -1 && this.line.length() > 0) {
            return;
        }
        const prev = this.history.prev();
        if (prev !== undefined) {
            this.update(prev);
        }
    }
    nextHistory() {
        if (this.history.cursor === -1) {
            return;
        }
        const next = this.history.next();
        if (next !== undefined) {
            this.update(next);
        }
        else {
            this.update("");
        }
    }
    moveCursor() {
        const cursor = this.tty.calculatePosition(this.line.pos_buffer(), this.promptSize);
        if (cursor === this.layout.cursor) {
            return;
        }
        if (this.shouldHighlight()) {
            this.refresh();
        }
        else {
            this.tty.moveCursor(this.layout.cursor, cursor);
            this.layout.promptSize = Object.assign({}, this.promptSize);
            this.layout.cursor = Object.assign({}, cursor);
        }
    }
}
exports.State = State;

},{"./line":4,"string-width":11}],7:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tty = void 0;
const string_width_1 = __importDefault(require("string-width"));
class Tty {
    constructor(col, row, tabWidth, out) {
        this.tabWidth = tabWidth;
        this.col = col;
        this.row = row;
        this.out = out;
    }
    write(text) {
        return this.out.write(text);
    }
    print(text) {
        return this.out.print(text);
    }
    println(text) {
        return this.out.println(text);
    }
    clearScreen() {
        this.out.write("\x1b[H\x1b[2J");
    }
    // Calculate the number of colums and rows required to print
    // text on a this.cols wide terminal starting at orig
    calculatePosition(text, orig) {
        const pos = Object.assign({}, orig);
        let escSeq = 0;
        [...text].forEach((c) => {
            if (c === "\n") {
                pos.row += 1;
                pos.col = 0;
                return;
            }
            let cw = 0;
            if (c === "\t") {
                cw = this.tabWidth - (pos.col % this.tabWidth);
            }
            else {
                let size;
                [size, escSeq] = width(c, escSeq);
                cw = size;
            }
            pos.col += cw;
            if (pos.col > this.col) {
                pos.row += 1;
                pos.col = cw;
            }
        });
        if (pos.col === this.col) {
            pos.col = 0;
            pos.row += 1;
        }
        return pos;
    }
    computeLayout(promptSize, line) {
        const newPromptSize = Object.assign({}, promptSize);
        const pos = line.pos;
        const cursor = this.calculatePosition(line.buf.slice(0, line.pos), promptSize);
        const end = pos === line.buf.length
            ? Object.assign({}, cursor) : this.calculatePosition(line.buf.slice(pos), cursor);
        const newLayout = {
            promptSize: newPromptSize,
            cursor,
            end,
        };
        return newLayout;
    }
    refreshLine(prompt, line, oldLayout, newLayout, highlighter) {
        const cursor = newLayout.cursor;
        const endPos = newLayout.end;
        this.clearOldRows(oldLayout);
        this.write(highlighter.highlightPrompt(prompt));
        this.write(highlighter.highlight(line.buf, line.pos));
        if (endPos.col === 0 &&
            endPos.row > 0 &&
            line.buf[line.buf.length - 1] !== "\n") {
            this.write("\n");
        }
        const newCursorRowMovement = endPos.row - cursor.row;
        if (newCursorRowMovement > 0) {
            this.write(`\x1b[${newCursorRowMovement}A`);
        }
        if (cursor.col > 0) {
            this.write(`\r\x1b[${cursor.col}C`);
        }
        else {
            this.write("\r");
        }
    }
    clearOldRows(layout) {
        const currentRow = layout.cursor.row;
        const oldRows = layout.end.row;
        const cursorRowMovement = Math.max(oldRows - currentRow, 0);
        if (cursorRowMovement > 0) {
            this.write(`\x1b[${cursorRowMovement}B`);
        }
        for (let i = 0; i < oldRows; i++) {
            this.write("\r\x1b[0K\x1b[A");
        }
        this.write("\r\x1b[0K");
    }
    moveCursor(oldCursor, newCursor) {
        if (newCursor.row > oldCursor.row) {
            // Move Down
            const rowShift = newCursor.row - oldCursor.row;
            if (rowShift === 1) {
                this.write("\x1b[B");
            }
            else {
                this.write(`\x1b[${rowShift}B`);
            }
        }
        else if (newCursor.row < oldCursor.row) {
            // Move Up
            const rowShift = oldCursor.row - newCursor.row;
            if (rowShift === 1) {
                this.write("\x1b[A");
            }
            else {
                this.write(`\x1b[${rowShift}A`);
            }
        }
        if (newCursor.col > oldCursor.col) {
            // Move Right
            const colShift = newCursor.col - oldCursor.col;
            if (colShift === 1) {
                this.write("\x1b[C");
            }
            else {
                this.write(`\x1b[${colShift}C`);
            }
        }
        else if (newCursor.col < oldCursor.col) {
            const colShift = oldCursor.col - newCursor.col;
            if (colShift === 1) {
                this.write("\x1b[D");
            }
            else {
                this.write(`\x1b[${colShift}D`);
            }
        }
        return;
    }
}
exports.Tty = Tty;
// Return the column width of text when printed
function width(text, escSeq) {
    if (escSeq === 1) {
        if (text === "[") {
            return [0, 2];
        }
        else {
            return [0, 0];
        }
    }
    else if (escSeq === 2) {
        if (!(text === ";" || (text[0] >= "0" && text[0] <= "9"))) {
            // unsupported
            return [0, 0];
        }
        return [0, escSeq];
    }
    else if (text === "\x1b") {
        return [0, 1];
    }
    else if (text === "\n") {
        return [0, escSeq];
    }
    else {
        return [(0, string_width_1.default)(text), escSeq];
    }
}

},{"string-width":11}],8:[function(require,module,exports){
'use strict';

module.exports = ({onlyFirst = false} = {}) => {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
};

},{}],9:[function(require,module,exports){
"use strict";

module.exports = function () {
  // https://mths.be/emoji
  return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
};

},{}],10:[function(require,module,exports){
/* eslint-disable yoda */
'use strict';

const isFullwidthCodePoint = codePoint => {
	if (Number.isNaN(codePoint)) {
		return false;
	}

	// Code points are derived from:
	// http://www.unix.org/Public/UNIDATA/EastAsianWidth.txt
	if (
		codePoint >= 0x1100 && (
			codePoint <= 0x115F || // Hangul Jamo
			codePoint === 0x2329 || // LEFT-POINTING ANGLE BRACKET
			codePoint === 0x232A || // RIGHT-POINTING ANGLE BRACKET
			// CJK Radicals Supplement .. Enclosed CJK Letters and Months
			(0x2E80 <= codePoint && codePoint <= 0x3247 && codePoint !== 0x303F) ||
			// Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
			(0x3250 <= codePoint && codePoint <= 0x4DBF) ||
			// CJK Unified Ideographs .. Yi Radicals
			(0x4E00 <= codePoint && codePoint <= 0xA4C6) ||
			// Hangul Jamo Extended-A
			(0xA960 <= codePoint && codePoint <= 0xA97C) ||
			// Hangul Syllables
			(0xAC00 <= codePoint && codePoint <= 0xD7A3) ||
			// CJK Compatibility Ideographs
			(0xF900 <= codePoint && codePoint <= 0xFAFF) ||
			// Vertical Forms
			(0xFE10 <= codePoint && codePoint <= 0xFE19) ||
			// CJK Compatibility Forms .. Small Form Variants
			(0xFE30 <= codePoint && codePoint <= 0xFE6B) ||
			// Halfwidth and Fullwidth Forms
			(0xFF01 <= codePoint && codePoint <= 0xFF60) ||
			(0xFFE0 <= codePoint && codePoint <= 0xFFE6) ||
			// Kana Supplement
			(0x1B000 <= codePoint && codePoint <= 0x1B001) ||
			// Enclosed Ideographic Supplement
			(0x1F200 <= codePoint && codePoint <= 0x1F251) ||
			// CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
			(0x20000 <= codePoint && codePoint <= 0x3FFFD)
		)
	) {
		return true;
	}

	return false;
};

module.exports = isFullwidthCodePoint;
module.exports.default = isFullwidthCodePoint;

},{}],11:[function(require,module,exports){
'use strict';
const stripAnsi = require('strip-ansi');
const isFullwidthCodePoint = require('is-fullwidth-code-point');
const emojiRegex = require('emoji-regex');

const stringWidth = string => {
	if (typeof string !== 'string' || string.length === 0) {
		return 0;
	}

	string = stripAnsi(string);

	if (string.length === 0) {
		return 0;
	}

	string = string.replace(emojiRegex(), '  ');

	let width = 0;

	for (let i = 0; i < string.length; i++) {
		const code = string.codePointAt(i);

		// Ignore control characters
		if (code <= 0x1F || (code >= 0x7F && code <= 0x9F)) {
			continue;
		}

		// Ignore combining characters
		if (code >= 0x300 && code <= 0x36F) {
			continue;
		}

		// Surrogates
		if (code > 0xFFFF) {
			i++;
		}

		width += isFullwidthCodePoint(code) ? 2 : 1;
	}

	return width;
};

module.exports = stringWidth;
// TODO: remove this in the next major version
module.exports.default = stringWidth;

},{"emoji-regex":9,"is-fullwidth-code-point":10,"strip-ansi":12}],12:[function(require,module,exports){
'use strict';
const ansiRegex = require('ansi-regex');

module.exports = string => typeof string === 'string' ? string.replace(ansiRegex(), '') : string;

},{"ansi-regex":8}]},{},[5]);
