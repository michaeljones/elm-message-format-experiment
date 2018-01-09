
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

I am using this approach at work but this project is still a bit rough. If something doesn't work as
expected please get in touch.


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

import Json.Decode.Pipeline exposing (decode, optional, optionalAt)
import Json.Decode exposing (decodeValue, string)
import Html exposing (Html, text)
import MessageFormat


type Translation
    = TrTextSubText
    | TrTextAnotherSubText
    | TrTopLevelString
    | TrWithArgsSimple { wow : String }


type alias Language =
    { code__ : String
    , textSubText : String
    , textAnotherSubText : String
    , topLevelString : String
    , withArgsSimple : String
    }


translate : Language -> Translation -> String
translate strings token =
    case token of
        TrTextSubText ->
            MessageFormat.format strings.code__ strings.textSubText

        TrTextAnotherSubText ->
            MessageFormat.format strings.code__ strings.textAnotherSubText

        TrTopLevelString ->
            MessageFormat.format strings.code__ strings.topLevelString

        TrWithArgsSimple args ->
            MessageFormat.formatWithArgs strings.code__ strings.withArgsSimple args


decodeLanguage : Json.Decode.Value -> Language
decodeLanguage json =
    decodeValue languageDecoder json |> Result.withDefault defaultLanguage


languageDecoder : Json.Decode.Decoder Language
languageDecoder =
    decode Language
        |> optional "code__" string ""
        |> optionalAt ["text", "subText"] string "text.subText"
        |> optionalAt ["text", "anotherSubText"] string "text.anotherSubText"
        |> optional "topLevelString" string "topLevelString"
        |> optionalAt ["withArgs", "simple"] string "withArgs.simple"


languageLookup =
    { textSubText = TrTextSubText
    , textAnotherSubText = TrTextAnotherSubText
    , topLevelString = TrTopLevelString
    , withArgsSimple = TrWithArgsSimple
    }


defaultLanguage : Language
defaultLanguage =
    { code__ = ""
    , textSubText = "text.subText"
    , textAnotherSubText = "text.anotherSubText"
    , topLevelString = "topLevelString"
    , withArgsSimple = "withArgs.simple"
    }


trText : Language -> Translation -> Html msg
trText strings slug =
    text (translate strings slug)
```

This relies on the `MessageFormat` module that relies on `Native.MessageFormat` which uses the npm
`messageformat` package to process the translations.

You can use the `languageDecode` above to decode the json language data that should be passed into
your Elm app at run this. This allows your server to decide which language the current user is
expecting and to send just that language.

Once the language json has been decoded and stored in your model as `model.language` than you can
import & use your translations with all the support of the type system:

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
            [ text <| translate model.language (TrWithArgsSimple "much wow")) ]
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
