module MessageFormat exposing (..)

import Native.MessageFormat


format : String -> String -> String
format language msg =
    Native.MessageFormat.format language msg


formatWithArgs : String -> String -> a -> String
formatWithArgs language msg a =
    Native.MessageFormat.formatWithArgs language msg a
