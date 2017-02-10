
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

const tokens = Object.entries(flatJson)
    .map(([key, value]) => {
        return toToken(key);
    });

const strings = Object.entries(flatJson)
    .map(([key, value]) => {
        const token = toToken(key);
        const parsed = parse(value).filter(entry => typeof entry !== 'string')
        const count = parsed.length;
        const rawArgs = parsed.map(entry => entry.arg).join(' ');
        const args = rawArgs.length ? ' ' + rawArgs : '';

        return `        ${token}${args} ->\n            "${value}"`;
    });

const output = `module Translations exposing (..)

type Translation
    = ${tokens.join('\n    | ')}

translate : Translation -> String
translate token =
    case token of
${strings.join('\n\n')}

`;

console.log(output);
