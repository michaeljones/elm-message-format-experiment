
const MessageFormat = require('messageformat');


var _michaeljones$elm_message_format$Native_MessageFormat = function() {

    function format(language, msg) {
        const func = new MessageFormat(language).compile(msg);
        return func();
    }

    function format1(language, msg, a) {
        const func = new MessageFormat(language).compile(msg);
        console.log(a, func(a));
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

    return {
        'format': F2(format),
        'format1': F3(format1),
        'format2': F4(format2),
        'format3': F5(format3),
        'format4': F6(format4)
    };
}();
