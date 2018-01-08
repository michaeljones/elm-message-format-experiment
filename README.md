
# Elm Message Format Experiment

This is an experiment to try to get a workflow for i18n strings in Elm.

The [elm-i18n](https://github.com/lukewestby/elm-i18n) project has given way to the approach
described in the [Elm i18n and Type Safety](http://www.gizra.com/content/elm-i18n-type-safety/) blog
post, but that seems to involve hand rolling modules with manual string concatenation.

This experiment attempts to provide a workflow for keeping your strings in a JSON file, compiling
them to an elm module and then handling arguments & variations with a Native module that uses the
established npm 'messageformat' module for processing.

Relying on Native modules isn't ideal, hence this being described as an experiment.

I am not an experience elm developer. Perhaps there is a much better solution to all of this.

## Status

It seems to work but I'm no expert so tread carefully. I'd love feedback and guidance though.

- Currently each message is individually compiled by the `messageformat` package every time you use
  it. It would be worth caching these in the javascript of the native module.


## Workflow

Manage your strings in json files with nested objects & ICU syntax, one file per language:

```json
{
    "text" : {
        "subText": "Hello, World!",
        "anotherSubText": "Goodbye, World!"
    },
    "topLevelString": "This string is top level",
    "withArgs": {
        "simple": "So {wow}"
    }
}
```

Compile these strings to an elm module using the `elm-i18n-from-json` script. For example, if the
json above was saved into a file called `strings.json` then you would run:

```bash
node elm-i18n-from-json generate strings.json Translations.elm
```

Which produces a file with this format:

```elm
module Translation exposing (..)

import MessageFormat


type Translation
    = TrTextSubText
    | TrTextAnotherSubText
    | TrTopLevelString
    | TrWithArgsSimple { wow : String }


type Language
    = En_gb
    | En_us


languageCode : Language -> String
languageCode language =
    case language of
        En_gb ->
            "en-gb"

        En_us ->
            "en-us"


translate : Language -> Translation -> String
translate language token =
    case language of
        En_gb ->
            case token of
                TrTextSubText ->
                    MessageFormat.format "en-gb" "Hello, World!"

                TrTextAnotherSubText ->
                    MessageFormat.format "en-gb" "Goodbye, World!"

                TrTopLevelString ->
                    MessageFormat.format "en-gb" "This string is top level"

                TrWithArgsSimple args ->
                    MessageFormat.formatWithArgs "en-gb" "So {wow}" args

        En_us ->
            case token of
                TrTextSubText ->
                    MessageFormat.format "en-us" "Hello, World!"

                TrTextAnotherSubText ->
                    MessageFormat.format "en-us" "Goodbye, World!"

                TrTopLevelString ->
                    MessageFormat.format "en-us" "This string is top level"

                TrWithArgsSimple args ->
                    MessageFormat.formatWithArgs "en-us" "So {wow}" args
```

This relies on the `MessageFormat` module that relies on `Native.MessageFormat` which uses the npm
`messageformat` package to process the translations.

Import & use your translations with all the support of the type system:

```elm
module Main exposing (main)

import Translation exposing (..)
import Html exposing (text, div)


main =
    div []
        [ div []
            [ text "Translating 'WithArgsSimple' string" ]
        , div
            []
            [ text (translate En_gb (TrWithArgsSimple "much wow")) ]
        ]
```

## Other Actions

The `elm-i18n-from-json` also provides the following commands:

- `diff <config> <elm file>`: compares the output generated from the config file with the current
  contents of the elm file and reports on whether they differ. This could be a useful addition to a
  test suite to help check that all files are up to date. Though ideally it would be exposed via a
  module with an API.

- `validate <config>`: Checks that all files referenced by the config file have the same keys in
  them to help prevent drift between languages. Again, ideally implemented as a test suite. Could be
  taken further to also compile the messages and check that the number of arguments is consistent
  across languages as well.
