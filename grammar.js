///<reference path="node_modules/tree-sitter-cli/dsl.d.ts"/>
// @ts-check

module.exports = grammar({
  name: 'fennel',

  word: $ => $._identifier_simple,

  externals: $ => [
    $.field,
    $.colon
  ],

  rules:
  {
    program: $ => seq(
      repeat(choice($._statement)),
      /**
       * @NOTE I added this before deciding that this should be determined via selectors—leaving
       *       in case needed later
       */
      // field('export', choice(prec(4, $.table), prec(1, $._expression)))
    ),

    /** @NOTE Not 100% how identifers will be organized here */

    _identifier_simple: $ => /((?:[_A-Za-z]\w*\.)*[_\?A-Za-z\+][_\?\-A-Za-z0-9\!\+]*)|(\$([1-9])?)/,

    _identifier_special: $ => choice(
        '...',
        // `&` `&ident`
        /&[^\]\[{}()\n\s:\/#]*/,
        // Unused | any
        '_',
        // Generated
        /[^\/\[\]{}()\n\s:#]#/
    ),

    identifier: $ => choice(prec(2, $._identifier_special), $._identifier_simple),

    _statement: $ => choice(
      $.comment,
      $.require,
      $._variable_declaration,
      $.function_call,
      $._function,
      $._expression,
      $._iterator,
      $._conditional,
      $.hash_function_definition,
      $.doto_statement,
      $.do_statement,
    ),

    _function: $ => choice(
      $.function_definition,
      $.lambda_definition,
    ),

    _variable_declaration: $ => choice(
      $.let_definition,
      $.local_definition,
      $.var_definition,
      $.global_definition,
      $.set,
      $.tset
    ),

    _iterator: $ => choice(
      $.each,
      $.for,
      $.while
    ),

    _conditional: $ => choice(
      $.if_statement,
      $.when_statement,
      $.match_statement,
    ),

    require: $ => seq(
      '(',
      'require',
        repeat(choice($.field, $.string)),
      ')'
    ),

    do_statement: $ => seq(
      '(',
      'do',
        repeat($._statement),
      ')'
    ),

    doto_statement: $ => seq(
      '(',
      'doto',
        repeat1($._statement),
      ')'
    ),

    when_statement: $ => seq(
      '(',
      'when',
        repeat($._statement),
      ')'
    ),

    if_statement: $ => seq(
      '(',
      'if',
        repeat($._statement),
      ')'
    ),

    match_statement: $ => seq(
      '(',
        'match',
        repeat($._statement),
      ')',
    ),

    each: $ => seq(
      '(',
      'each',
        $.each_clause,
        repeat($._statement),
      ')'
    ),

    each_clause: $ => seq(
      '[',
        $.identifier,
        $.identifier,
        $.function_call,
        optional($._until_condition),
      ']'
    ),

    _until_condition: $ => seq(':until', $._expression),

    for: $ => seq(
      '(',
        'for',
        $.for_clause,
        repeat($._statement),
      ')'
    ),

    for_clause: $ => seq(
      '[',
        $.identifier,
        $._statement,
        $._statement,
        // Step
        optional($._statement),
        // Step
        optional($._until_condition),
      ']'
    ),

    while: $ => seq(
      '(',
        'while',
        field('condition', $._statement),
        repeat($._statement),
      ')'
    ),

    let_definition: $ => seq(
      '(',
        'let',
        $.assignments,
        repeat($._statement),
      ')'
    ),

    local_definition: $ => seq(
      '(',
        'local',
        choice($.assignment, $.multi_value_assignment),
      ')'
    ),

    var_definition: $ => seq(
      '(',
        'var',
        choice($.assignment, $.multi_value_assignment),
      ')'
    ),

    global_definition: $ => seq(
      '(',
        'global',
        choice($.assignment, $.multi_value_assignment),
      ')'
    ),

    set: $ => seq(
      '(',
        'set',
        choice($.assignment, $.multi_value_assignment),
      ')'
    ),

    tset: $ => seq(
      '(',
        'tset',
        choice($.table, $.identifier),
        choice($._statement),
        choice($._statement),
      ')'
    ),

    assignments: $ => seq('[', repeat(choice($.multi_value_assignment, $.assignment)), ']'),

    assignment: $ => seq(choice($.identifier, $.field_expression), $._statement),

    multi_value_assignment: $ => seq($.value_list, $._statement),

    value_list: $ => seq('(', repeat(choice($.identifier, $.field_expression)), ')'),

    hash_function_definition: $ => choice(
      seq(
        '(',
          'hashfn',
          repeat($._statement),
        ')'
      ),
      seq(
        '#',
        choice(
          $.function_call,
          $.identifier,
          $.sequential_table
        ),
      ),
    ),

    function_definition: $ => seq(
      '(',
        'fn',
        $._function_body,
      ')'
    ),

    lambda_definition: $ => seq(
      '(',
        choice('lambda', 'λ'),
        $._function_body,
      ')'
    ),

    _function_body: $ => seq(
      optional(field('name', $.identifier)),
      $.parameters,
      choice(
        seq(
          field('doc_string', $._doc_string),
          field('body', repeat1($._statement))
        ),
        field('body', repeat($._statement))
      )
    ),

    parameters: $ => seq('[', repeat($._expression), ']'),

    _doc_string: $ => prec(4, choice(
        $.triple_string,
        $.string
    )),

    /**
     * @NOTE Consider integrating various well-defined function call forms (`let`, `doto`, `etc`)
     *       into main function_call rule
     */
    function_call: $ => seq(
      '(',
        field('name', choice(
          $.unquoted_value,
          $.field_expression,
          $.identifier,
          alias($._operator, $.identifier),
          alias($._keyword, $.identifier)
        )),
        repeat($._statement),
      ')'
    ),

    sequential_table: $ => seq(
      '[',
        repeat($._statement),
      ']'
    ),

    table: $ => seq(
      '{',
        repeat(
          seq(
            choice($.string, $.field, $.identifier),
            $._statement
          )
        ),
      '}'
    ),

    _expression: $ => choice(
      $.field_expression,
      $.quoted_value,
      $._identifier_special,
      $.unquoted_value,
      $.number,
      $.field,
      $.identifier,
      $.string,
      $.table,
      $.sequential_table,
      $.boolean,
      $.nil,
      alias($._keyword, $.identifier),
    ),

    escape_character: $ => /(\\n|\\")/,

    string: $ => seq(
      '"',
      repeat(/(\\.)|([^"])/),
      '"'
    ),

    triple_string: $ => seq(
      '"""',
      repeat(/\\"|(.)/),
      '"""'
    ),

    quoted_value: $ => seq(
      choice("'", "`"),
      $._statement
    ),

    unquoted_value: $ => seq(
      choice(','),
      $.identifier
    ),

    field_expression: $ => prec(2, seq(
      choice(
        $.identifier,
        alias($._keyword, $.identifier)
      ),
      choice(
        repeat1(seq(".", $.identifier)),
      ),
    )),

    _operator: $ => choice(
      $._arithmetic_operator,
      $._access_operator,
      $._comparison_operator,
      $._boolean_operator,
      $._concat_operator,
      $._threading_macro,
      alias($.colon, $.identifier)
    ),

    _arithmetic_operator: $ => choice(
      '+', '-', '*', '%', '/', '//', '^'
    ),

    _access_operator: $ => choice(
       '#', 'length', '?.', '.'
    ),

    _comparison_operator: $ => choice(
      '>', '<', '>=', '<=', '=', 'not='
    ),

    _threading_macro: $ => choice(
      '->', '->>', '-?>', '-?>>',
    ),

    _boolean_operator: $ => choice(
      'and', 'or', 'not'
    ),

    _concat_operator: $ => '..',

    boolean: $ => choice('true', 'false'),

    nil: $ => choice('nil'),

    _keyword: $ => choice(
      '_ENV',
      '_G',
      '_VERSION',
      'arg',
      'assert',
      'collectgarbage',
      'coroutine',
      'debug',
      'dofile',
      // 'doto',
      'error',
      'eval-compiler',
      'gensym',
      'getmetatable',
      'import-macros',
      'in-scope?',
      'include',
      'ipairs',
      'list',
      'list?',
      'lua',
      'load',
      'loadfile',
      'loadstring',
      'macro',
      'macrodebug',
      'macroexpand',
      'macros',
      'multi-sym?',
      'next',
      'pairs',
      'package',
      'pcall',
      'print',
      'rawequal',
      'rawget',
      'rawlen',
      'rawset',
      'require-macros',
      'select',
      'sequence?',
      'setmetatable',
      'sym',
      'sym?',
      'table?',
      'tonumber',
      'tostring',
      'type',
      'unpack',
      'varg?',
      'xpcall',
      'string',
      'table'
    ),

    number: $ => /([-])?\d+(\.\d+)?/,

    comment: $ => /;.*/
  }
});
