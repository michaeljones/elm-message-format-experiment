module MessageFormat exposing (..)

import Native.MessageFormat


format : String -> String -> String
format language msg =
    Native.MessageFormat.format language msg


format1 : String -> String -> String -> String
format1 language msg a =
    Native.MessageFormat.format1 language msg a


format2 : String -> String -> String -> String -> String
format2 language msg a b =
    Native.MessageFormat.format2 language msg a b


format3 : String -> String -> String -> String -> String -> String
format3 language msg a b c =
    Native.MessageFormat.format3 language msg a b c


format4 : String -> String -> String -> String -> String -> String -> String
format4 language msg a b c d =
    Native.MessageFormat.format4 language msg a b c d
