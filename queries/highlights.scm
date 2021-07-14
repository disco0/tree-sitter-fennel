; highlights.scm

(comment)+ @comment

[
  "λ"
] @keyword

(string) @string

(local_definition (assignment (identifier) @variable))

(function_definition
  "fn" @keyword
  name: (identifier) @function.declaration
  (parameters (identifier) @variable.parameter))

(function_definition
  "fn" @keyword
  (parameters (identifier) @variable.parameter))

(lambda_definition
  ["λ" "lambda"] @keyword
  name: (identifier) @function.declaration
  (parameters (identifier) @variable.parameter))

(lambda_definition
  ["λ" "lambda"] @keyword
  (parameters (identifier) @variable.parameter))

[
  "assert"
  "collectgarbage"
  "coroutine"
  "debug"
  "dofile"
  "doto"
  "error"
  "eval-compiler"
  "gensym"
  "getmetatable"
  "import-macros"
  "in-scope?"
  "include"
  "ipairs"
  "list"
  "list?"
  "lua"
  "load"
  "loadfile"
  "loadstring"
  "macro"
  "macrodebug"
  "macroexpand"
  "macros"
  "multi-sym?"
  "next"
  "pairs"
  "pcall"
  "print"
  "rawequal"
  "rawget"
  "rawlen"
  "rawset"
  "require-macros"
  "select"
  "sequence?"
  "setmetatable"
  "sym?"
  "table?"
  "tonumber"
  "tostring"
  "type"
  "unpack"
  "varg?"
  "xpcall"
] @function.builtin

[
  "sym"
  "package"
  "string"
  "table"
  "_ENV"
  "_G"
  "_VERSION"
  "arg"
] @variable.builtin
