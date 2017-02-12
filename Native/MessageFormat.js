
const MessageFormat = require('messageformat');


var _michaeljones$elm_message_format$Native_MessageFormat = function() {

    function format(language, msg) {
        const func = new MessageFormat(language).compile(msg);
        return func();
    }

    function formatWithArgs(language, msg, a) {
        const func = new MessageFormat(language).compile(msg);
        console.log(a, func(a));
        return func(a);
    }

    return {
        'format': F2(format),
        'formatWithArgs': F3(formatWithArgs),
    };
}();
