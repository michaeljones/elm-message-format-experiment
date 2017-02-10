module MessageFormat exposing (..)

import Native.MessageFormat


format : String -> String
format msg =
    Native.MessageFormat.format msg


format1 : String -> String -> String
format1 msg a =
    Native.MessageFormat.format1 msg a


format2 : String -> String -> String -> String
format2 msg a b =
    Native.MessageFormat.format2 msg a b


format3 : String -> String -> String -> String -> String
format3 msg a b c =
    Native.MessageFormat.format3 msg a b c


format4 : String -> String -> String -> String -> String -> String
format4 msg a b c d =
    Native.MessageFormat.format4 msg a b c d
