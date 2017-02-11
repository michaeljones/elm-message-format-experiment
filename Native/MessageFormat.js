
const MessageFormat = require('messageformat');


function format(language, msg) {
    const func = new MessageFormat(language).compile(msg);
    return func();
}

function format1(language, msg, a) {
    const func = new MessageFormat(language).compile(msg);
    return func(a);
}

function format2(language, msg, a, b) {
    const func = new MessageFormat(language).compile(msg);
    return func(a, b);
}

function format3(language, msg, a, b, c) {
    const func = new MessageFormat(language).compile(msg);
    return func(a, b, c);
}

function format4(language, msg, a, b, c, d) {
    const func = new MessageFormat(language).compile(msg);
    return func(a, b, c, d);
}

var make = function make(elm) {
    elm.Native = elm.Native || {};
    elm.Native.MessageFormat = elm.Native.MessageFormat || {};

    if (elm.Native.MessageFormat.values) return elm.Native.MessageFormat.values;

    return elm.Native.MessageFormat.values = {
        'format': format,
        'format1': format1,
        'format2': format2,
        'format3': format3,
        'format4': format4,
    };
};
