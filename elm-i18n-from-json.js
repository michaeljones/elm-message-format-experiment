
const fs = require('fs');
const flatten = require('flat');
const parse = require('messageformat-parser').parse;

function capitalise(word) {
    return word[0].toUpperCase() + word.slice(1);
}


function generate(configPath) {

    const configContents = fs.readFileSync(configPath);

    const configJson = JSON.parse(configContents);

    const languages = Object.entries(configJson.languages)
        .map(([language, filename]) => {

            const contents = fs.readFileSync(filename);

            const json = JSON.parse(contents);

            const flatJson = flatten(json);

            return [language, flatJson];
        });

    const languageCodes = Object.keys(configJson.languages);

    const languagePairs = languageCodes
        .map(code => {
            return [code, capitalise(code).replace('-', '_')];
        });


    const languageTypes = languagePairs.map(entry => entry[1]);

    const languageCases = languagePairs
        .map(([code, type]) => {
            return `        ${type} ->\n            "${code}"`;
        });

    function toToken(key) {
        return "Tr" + key.split('.').map(capitalise).join('');
    }

    function toArgs(value) {
        const parsed = parse(value).filter(entry => typeof entry !== 'string')
        const count = parsed.length;
        return parsed.map(entry => entry.arg);
    }

    const tokens = Object.entries(languages[0][1])
        .map(([key, value]) => {
            const rawArgs = toArgs(value);
            let args = '';
            if (rawArgs.length) {
                const defs = rawArgs.map(name => `${name} : String`).join(', ');
                args = ` { ${defs} }`;
            }
            return toToken(key) + args;
        });


    const strings = languages
        .map(([code, json]) => {

            const languageStrings = Object.entries(json)
                .map(([key, value]) => {
                    const token = toToken(key);
                    const rawArgs = toArgs(value);
                    const method = rawArgs.length ? 'formatWithArgs' : 'format';
                    let args = '';
                    if (rawArgs.length) {
                        args = ' args';
                    }

                    return `                ${token}${args} ->\n                    MessageFormat.${method} "${code}" "${value}"${args}`;
                });

            const languageType = capitalise(code).replace('-', '_');

            return (
`        ${languageType} ->
            case token of
${languageStrings.join('\n\n')}`);
        });

    const output = `module Translation exposing (..)

import MessageFormat


type Translation
    = ${tokens.join('\n    | ')}


type Language
    = ${languageTypes.join('\n    | ')}


languageCode : Language -> String
languageCode language =
    case language of
${languageCases.join('\n\n')}


translate : Language -> Translation -> String
translate language token =
    case language of
${strings.join('\n\n')}
`;

    return output;
}

function generateAction(args) {
    if (args.length !== 3) {
        console.error('Usage: elm-i18n-from-json generate <config> <output>');
        process.exit(1);
    }
    const config = args[1];
    const outputPath = args[2];
    const output = generate(config);
    fs.writeFileSync(outputPath, output);
}

function diffAction(args) {
    if (args.length !== 3) {
        console.error('Usage: elm-i18n-from-json diff <config> <output>');
        process.exit(1);
    }
    const configPath = args[1];
    const output = generate(configPath);

    const resultPath = args[2];
    const resultContent = fs.readFileSync(resultPath, 'utf8');

    if (output !== resultContent) {
        console.error('Differences detected');
        process.exit(1);
    }

    process.exit(0);
}

function main(args) {

    if (args.length === 0) {
        console.error('Usage: elm-i18n-from-json <action> [args...]');
        process.exit(1);
    }

    const action = args[0];

    switch (action) {
        case 'generate':
            generateAction(args);
            break;

        case 'diff':
            diffAction(args);
            break;

        default:
            console.error('Unrecognised action: ' + action);
            process.exit(1);
    }
}

main(process.argv.splice(2));
