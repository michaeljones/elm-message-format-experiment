
const fs = require('fs');

const flatten = require('flat');
const parse = require('messageformat-parser').parse;
const program = require('commander');
const _ = require('lodash');


function capitalise(word) {
    return word[0].toUpperCase() + word.slice(1);
}


function generate(configPath, options) {

    const configContents = fs.readFileSync(configPath);

    const configJson = JSON.parse(configContents);

    const languages = _.toPairs(configJson.languages)
        .map(([language, filename]) => {

            const contents = fs.readFileSync(filename);

            const json = JSON.parse(contents);

            const flatJson = flatten(json);

            let filtered = flatJson;
            if (options.settings) {

                const filters = configJson.settings[options.settings].filters;

                filtered = _(filtered)
                    .toPairs()
                    .filter((key, value) => {
                        return filters.some(filter => _.startsWith(key, filter));
                    })
                    .fromPairs()
                    .value();
            }

            return [language, filtered];
        });

    const languageCodes = _.keys(configJson.languages);

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

    const tokens = _.toPairs(languages[0][1])
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

            const languageStrings = _.toPairs(json)
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

function generateAction(config, outputPath, options) {
    const output = generate(config, options);
    fs.writeFileSync(outputPath, output);
}

function diffAction(configPath, resultPath, options) {
    const output = generate(configPath, options);
    const resultContent = fs.readFileSync(resultPath, 'utf8');

    if (output !== resultContent) {
        console.error('Differences detected');
        process.exit(1);
    }

    process.exit(0);
}

function main(args) {

    program
        .command("generate <config> <output>")
        .option("-s, --settings <name>", "Which config to use")
        .action(generateAction);

    program
        .command("diff <config> <output>")
        .option("-s, --settings <name>", "Which config to use")
        .action(diffAction);

    program.parse(args);
}

main(process.argv);
