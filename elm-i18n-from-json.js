
const fs = require('fs');

const flatten = require('flat');
const parse = require('messageformat-parser').parse;
const program = require('commander');
const _ = require('lodash');


function capitalise(word) {
    return word[0].toUpperCase() + word.slice(1);
}


function escape(key) {
    return key === 'type' ? 'type_' : key;
}

function generate(filepath, options) {

    const fileContents = fs.readFileSync(filepath);

    let fileJson = JSON.parse(fileContents);

    if (options.context) {
        fileJson = _(fileJson)
            .toPairs()
            .map(([key, value]) => {
                return [key, value.value];
            })
            .fromPairs()
            .value();
    }

    const flatJson = flatten(fileJson);

    function toToken(key) {
        return "Tr" + key.split('.').map(capitalise).join('');
    }

    function toArgs(value) {
        const parsed = parse(value).filter(entry => typeof entry !== 'string')
        const count = parsed.length;
        return parsed.map(entry => entry.arg);
    }

    const tokens = _.toPairs(flatJson)
        .map(([key, value]) => {
            const rawArgs = toArgs(value);
            let args = '';
            if (rawArgs.length) {
                const defs = rawArgs.map(name => `${name} : String`).join(', ');
                args = ` { ${defs} }`;
            }
            return toToken(key) + args;
        });


    const entries = _.toPairs(flatJson)
        .map(([key, value]) => {
            return escape(key);
        });

    const defaults = _.toPairs(flatJson)
        .map(([key, value]) => {

            return `${escape(key)} = "${key}"`;
        });

    const decodes = _.toPairs(flatJson)
        .map(([key, value]) => {
            return `        |> optional "${key}" string "${key}"`;
        });

    const strings = _.toPairs(flatJson)
        .map(([key, value]) => {
            const token = toToken(key);
            const rawArgs = toArgs(value);
            const method = rawArgs.length ? 'formatWithArgs' : 'format';
            const string = `strings.${escape(key)}`;
            let args = '';
            if (rawArgs.length) {
                args = ' args';
            }

            return `        ${token}${args} ->\n            MessageFormat.${method} strings.code__ ${string}${args}`;
        });

    const moduleName = options.module || 'Translation';

    const output = `module ${moduleName} exposing (..)

import Json.Decode.Pipeline exposing (decode, optional)
import Json.Decode exposing (decodeValue, string)
import Html exposing (Html, text)
import MessageFormat


type Translation
    = ${tokens.join('\n    | ')}


type alias Language =
    { code__ : String
    , ${entries.join(' : String\n    , ') + ' : String'}
    }


translate : Language -> Translation -> String
translate strings token =
    case token of
${strings.join('\n\n')}


decodeLanguage : Json.Decode.Value -> Language
decodeLanguage json =
    decodeValue languageDecoder json |> Result.withDefault defaultLanguage


languageDecoder : Json.Decode.Decoder Language
languageDecoder =
    decode Language
        |> optional "code__" string ""
${decodes.join('\n')}


defaultLanguage : Language
defaultLanguage =
    { code__ = ""
    , ${defaults.join('\n    , ')}
    }


trText : Language -> Translation -> Html msg
trText strings slug =
    text (translate strings slug)
`;

    return output;
}


function generateAction(config, outputPath, options) {
    const output = generate(config, options);
    console.log(`Writing to ${outputPath}`);
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


function validateAction(configPath) {

    const configContents = fs.readFileSync(configPath);

    const configJson = JSON.parse(configContents);

    const pairs = _.toPairs(configJson.languages)
        .map(([language, filename]) => {

            const contents = fs.readFileSync(filename);

            const json = JSON.parse(contents);

            const flatJson = flatten(json);

            const keys = _.keys(flatJson);

            return [filename, keys];
        });

    const firstFilename = pairs[0][0];
    const firstKeys = pairs[0][1];

    const results = _(pairs)
        .drop(1)
        .map(([filename, keys]) => {
            const diffA = keys.filter(key => !_.includes(firstKeys, key));
            const diffB = firstKeys.filter(key => !_.includes(keys, key));

            if (diffA.length) {
                console.log(`The following keys are present in ${filename} and not ${firstFilename}`);
                console.log(diffA.join(', '));
            }

            if (diffB.length) {
                console.log(`The following keys are present in ${firstFilename} and not ${filename}`);
                console.log(diffB.join(', '));
            }

            return diffA.length > 0 || diffB.length > 0;
        })
        .filter(value => value)
        .value();

    if (results.length) {
        process.exit(1);
    }
}


function main(args) {

    program
        .command("generate <file> <output>")
        .option("-s, --settings <name>", "Which config to use")
        .option("-m, --module <name>", "Name of generated module")
        .option("-c, --context", "Uses the 'context' format for strings")
        .action(generateAction);

    program
        .command("diff <config> <output>")
        .option("-s, --settings <name>", "Which config to use")
        .action(diffAction);

    program
        .command("validate <config>")
        .action(validateAction);

    program.parse(args);
}

main(process.argv);
