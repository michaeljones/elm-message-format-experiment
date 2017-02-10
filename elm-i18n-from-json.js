
const fs = require('fs');
const flatten = require('flat');
const parse = require('messageformat-parser').parse;

const language = process.argv[2];
const contents = fs.readFileSync(process.argv[3]);

const json = JSON.parse(contents);

const flatJson = flatten(json);

function capitalise(word) {
    return word[0].toUpperCase() + word.slice(1);
}

function toToken(key) {
    return "Tr" + key.split('.').map(capitalise).join('');
}

function toArgs(value) {
    const parsed = parse(value).filter(entry => typeof entry !== 'string')
    const count = parsed.length;
    return parsed.map(entry => entry.arg);
}

const tokens = Object.entries(flatJson)
    .map(([key, value]) => {
        const rawArgs = toArgs(value);
        const args = rawArgs.length ? ' ' + rawArgs.map(() => 'String').join(' ') : '';
        return toToken(key) + args;
    });


const strings = Object.entries(flatJson)
    .map(([key, value]) => {
        const token = toToken(key);
        const rawArgs = toArgs(value);
        const count = rawArgs.length ? rawArgs.length : '';
        const args = rawArgs.length ? ' ' + rawArgs.join(' ') : '';

        return `        ${token}${args} ->\n            MessageFormat.format${count} "${value}"${args}`;
    });

const output = `module Translations exposing (..)

import MessageFormat


type Translation
    = ${tokens.join('\n    | ')}


translate : Translation -> String
translate token =
    case token of
${strings.join('\n\n')}

`;

console.log(output);
