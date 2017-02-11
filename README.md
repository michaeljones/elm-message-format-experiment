
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

Well, it doesn't work.

- The `Native.MessageFormat` implementation is possible incorrect as I get a runtime error in the
  browser. I followed the instructions on the [eeue56/take-home wiki](https://github.com/eeue56/take-home/wiki/Writing-Native)
  but I may have made a mistake or they might not apply to Elm 0.18.0.

- It doesn't current handle different languages, but hope that'll be relatively simple once it is
  actually working. We'd create different modules or some two level case statement that chooses
  first based on the language and then the string & arguments.


## Workflow

Manage your strings in a json file with nested objects & ICU syntax:

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

Compile these strings to an elm module using the `elm-i18n-from-json` script:

```bash
node elm-i18n-from-json en-GB string.json > Translations.elm
```

Which produces a file with this format:

```elm
module Translations exposing (..)


import MessageFormat


type Translation
    = TrTextSubText
    | TrTextAnotherSubText
    | TrTopLevelString
    | TrWithArgsSimple String


translate : Translation -> String
translate token =
    case token of
        TrTextSubText ->
            MessageFormat.format "Hello, World!"

        TrTextAnotherSubText ->
            MessageFormat.format "Goodbye, World!"

        TrTopLevelString ->
            MessageFormat.format "This string is top level"

        TrWithArgsSimple wow ->
            MessageFormat.format1 "So {wow}"
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
            [ text (translate (TrWithArgsSimple "much wow")) ]
        ]
```
