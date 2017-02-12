module Main exposing (main)

import Translation exposing (..)
import Html exposing (text, div)


main =
    div []
        [ div []
            [ text "Translating 'WithArgsSimple' string" ]
        , div
            []
            [ text (translate En_GB (TrWithArgsSimple "much wow")) ]
        ]
