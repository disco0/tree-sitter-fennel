;; locals.scm

;;#region Scopes

; Is this needed for top level var/local?
(program) @local.scope

(function_definition) @local.scope
(lambda_definition) @local.scope
(let_definition) @local.scope
(each) @local.scope
(doto_statement) @local.scope
(do_statement) @local.scope
(when_statement) @local.scope
(match_statement) @local.scope
(each_clause "[" . (identifier) @local.scope)

;;#endregion Scopes

;;#region Definitions

(assignment (identifier) @local.definition)

(lambda_definition
  (parameters (identifier) @local.definition))

(function_definition
  (parameters (identifier) @local.definition))

(parameters (identifier) @local.definition)

;;#endregion Definitions

(identifier) @local.reference
