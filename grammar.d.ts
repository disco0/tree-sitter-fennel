export interface Parser {
  parse(input: string | Input, previousTree?: Tree, options?: {bufferSize?: number, includedRanges?: Range[]}): Tree;
  getLanguage(): any;
  setLanguage(language: any): void;
  getLogger(): Logger;
  setLogger(logFunc: Logger): void;
}

export type Point = {
  row: number;
  column: number;
};

export type Range = {
  startIndex: number,
  endIndex: number,
  startPosition: Point,
  endPosition: Point
};

export type Edit = {
  startIndex: number;
  oldEndIndex: number;
  newEndIndex: number;
  startPosition: Point;
  oldEndPosition: Point;
  newEndPosition: Point;
};

export type Logger = (
  message: string,
  params: {[param: string]: string},
  type: "parse" | "lex"
) => void;

export interface Input {
  seek(index: number): void;
  read(): any;
}

interface SyntaxNodeBase {
  tree: Tree;
  type: string;
  isNamed: boolean;
  text: string;
  startPosition: Point;
  endPosition: Point;
  startIndex: number;
  endIndex: number;
  parent: SyntaxNode | null;
  children: Array<SyntaxNode>;
  namedChildren: Array<SyntaxNode>;
  childCount: number;
  namedChildCount: number;
  firstChild: SyntaxNode | null;
  firstNamedChild: SyntaxNode | null;
  lastChild: SyntaxNode | null;
  lastNamedChild: SyntaxNode | null;
  nextSibling: SyntaxNode | null;
  nextNamedSibling: SyntaxNode | null;
  previousSibling: SyntaxNode | null;
  previousNamedSibling: SyntaxNode | null;

  hasChanges(): boolean;
  hasError(): boolean;
  isMissing(): boolean;
  toString(): string;
  child(index: number): SyntaxNode | null;
  namedChild(index: number): SyntaxNode | null;
  firstChildForIndex(index: number): SyntaxNode | null;
  firstNamedChildForIndex(index: number): SyntaxNode | null;

  descendantForIndex(index: number): SyntaxNode;
  descendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
  namedDescendantForIndex(index: number): SyntaxNode;
  namedDescendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
  descendantForPosition(position: Point): SyntaxNode;
  descendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode;
  namedDescendantForPosition(position: Point): SyntaxNode;
  namedDescendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode;
  descendantsOfType<T extends TypeString>(types: T | readonly T[], startPosition?: Point, endPosition?: Point): NodeOfType<T>[];

  closest<T extends SyntaxType>(types: T | readonly T[]): NamedNode<T> | null;
  walk(): TreeCursor;
}

export interface TreeCursor {
  nodeType: string;
  nodeText: string;
  nodeIsNamed: boolean;
  startPosition: Point;
  endPosition: Point;
  startIndex: number;
  endIndex: number;
  readonly currentNode: SyntaxNode

  reset(node: SyntaxNode): void
  gotoParent(): boolean;
  gotoFirstChild(): boolean;
  gotoFirstChildForIndex(index: number): boolean;
  gotoNextSibling(): boolean;
}

export interface Tree {
  readonly rootNode: SyntaxNode;

  edit(delta: Edit): Tree;
  walk(): TreeCursor;
  getChangedRanges(other: Tree): Range[];
  getEditedRange(other: Tree): Range;
}

interface NamedNodeBase extends SyntaxNodeBase {
    isNamed: true;
}

/** An unnamed node with the given type string. */
export interface UnnamedNode<T extends string = string> extends SyntaxNodeBase {
  type: T;
  isNamed: false;
}

type PickNamedType<Node, T extends string> = Node extends { type: T; isNamed: true } ? Node : never;

type PickType<Node, T extends string> = Node extends { type: T } ? Node : never;

/** A named node with the given `type` string. */
export type NamedNode<T extends SyntaxType = SyntaxType> = PickNamedType<SyntaxNode, T>;

/**
 * A node with the given `type` string.
 *
 * Note that this matches both named and unnamed nodes. Use `NamedNode<T>` to pick only named nodes.
 */
export type NodeOfType<T extends string> = PickType<SyntaxNode, T>;

interface TreeCursorOfType<S extends string, T extends SyntaxNodeBase> {
  nodeType: S;
  currentNode: T;
}

type TreeCursorRecord = { [K in TypeString]: TreeCursorOfType<K, NodeOfType<K>> };

/**
 * A tree cursor whose `nodeType` correlates with `currentNode`.
 *
 * The typing becomes invalid once the underlying cursor is mutated.
 *
 * The intention is to cast a `TreeCursor` to `TypedTreeCursor` before
 * switching on `nodeType`.
 *
 * For example:
 * ```ts
 * let cursor = root.walk();
 * while (cursor.gotoNextSibling()) {
 *   const c = cursor as TypedTreeCursor;
 *   switch (c.nodeType) {
 *     case SyntaxType.Foo: {
 *       let node = c.currentNode; // Typed as FooNode.
 *       break;
 *     }
 *   }
 * }
 * ```
 */
export type TypedTreeCursor = TreeCursorRecord[keyof TreeCursorRecord];

export interface ErrorNode extends NamedNodeBase {
    type: SyntaxType.ERROR;
    hasError(): true;
}

export const enum SyntaxType {
  ERROR = "ERROR",
  Assignment = "assignment",
  Assignments = "assignments",
  Boolean = "boolean",
  DoStatement = "do_statement",
  Each = "each",
  EachClause = "each_clause",
  FieldExpression = "field_expression",
  For = "for",
  ForClause = "for_clause",
  FunctionCall = "function_call",
  FunctionDefinition = "function_definition",
  GlobalDefinition = "global_definition",
  HashFunctionDefinition = "hash_function_definition",
  Identifier = "identifier",
  IfStatement = "if_statement",
  LambdaDefinition = "lambda_definition",
  LetDefinition = "let_definition",
  LocalDefinition = "local_definition",
  MatchStatement = "match_statement",
  MultiValueAssignment = "multi_value_assignment",
  Nil = "nil",
  Parameters = "parameters",
  Program = "program",
  QuotedValue = "quoted_value",
  Require = "require",
  SequentialTable = "sequential_table",
  Set = "set",
  String = "string",
  Table = "table",
  TripleString = "triple_string",
  Tset = "tset",
  UnquotedValue = "unquoted_value",
  ValueList = "value_list",
  VarDefinition = "var_definition",
  WhenStatement = "when_statement",
  While = "while",
  Comment = "comment",
  Field = "field",
  Number = "number",
}

export type UnnamedType =
  | "\""
  | "\"\"\""
  | "#"
  | "%"
  | "'"
  | "("
  | ")"
  | "*"
  | "+"
  | ","
  | "-"
  | "->"
  | "->>"
  | "-?>"
  | "-?>>"
  | "."
  | ".."
  | "..."
  | "/"
  | "//"
  | "<"
  | "<="
  | "="
  | ">"
  | ">="
  | "["
  | "]"
  | "^"
  | "_ENV"
  | "_G"
  | "_VERSION"
  | "`"
  | "and"
  | "arg"
  | "assert"
  | "collectgarbage"
  | "coroutine"
  | "debug"
  | "do"
  | "dofile"
  | "doto"
  | SyntaxType.Each // both named and unnamed
  | "error"
  | "eval-compiler"
  | "false"
  | "fn"
  | SyntaxType.For // both named and unnamed
  | "gensym"
  | "getmetatable"
  | "global"
  | "hashfn"
  | "if"
  | "import-macros"
  | "in-scope?"
  | "include"
  | "ipairs"
  | "lambda"
  | "let"
  | "list"
  | "list?"
  | "load"
  | "loadfile"
  | "loadstring"
  | "local"
  | "macro"
  | "macrodebug"
  | "macroexpand"
  | "macros"
  | "match"
  | "multi-sym?"
  | "next"
  | SyntaxType.Nil // both named and unnamed
  | "not"
  | "not="
  | "or"
  | "package"
  | "pairs"
  | "pcall"
  | "print"
  | "rawequal"
  | "rawget"
  | "rawlen"
  | "rawset"
  | SyntaxType.Require // both named and unnamed
  | "require-macros"
  | "select"
  | "sequence?"
  | SyntaxType.Set // both named and unnamed
  | "setmetatable"
  | SyntaxType.String // both named and unnamed
  | "sym"
  | "sym?"
  | SyntaxType.Table // both named and unnamed
  | "table?"
  | "tonumber"
  | "tostring"
  | "true"
  | SyntaxType.Tset // both named and unnamed
  | "type"
  | "unpack"
  | "var"
  | "varg?"
  | "when"
  | SyntaxType.While // both named and unnamed
  | "xpcall"
  | "{"
  | "}"
  | "λ"
  ;

export type TypeString = SyntaxType | UnnamedType;

export type SyntaxNode = 
  | AssignmentNode
  | AssignmentsNode
  | BooleanNode
  | DoStatementNode
  | EachNode
  | EachClauseNode
  | FieldExpressionNode
  | ForNode
  | ForClauseNode
  | FunctionCallNode
  | FunctionDefinitionNode
  | GlobalDefinitionNode
  | HashFunctionDefinitionNode
  | IdentifierNode
  | IfStatementNode
  | LambdaDefinitionNode
  | LetDefinitionNode
  | LocalDefinitionNode
  | MatchStatementNode
  | MultiValueAssignmentNode
  | NilNode
  | ParametersNode
  | ProgramNode
  | QuotedValueNode
  | RequireNode
  | SequentialTableNode
  | SetNode
  | StringNode
  | TableNode
  | TripleStringNode
  | TsetNode
  | UnquotedValueNode
  | ValueListNode
  | VarDefinitionNode
  | WhenStatementNode
  | WhileNode
  | UnnamedNode<"\"">
  | UnnamedNode<"\"\"\"">
  | UnnamedNode<"#">
  | UnnamedNode<"%">
  | UnnamedNode<"'">
  | UnnamedNode<"(">
  | UnnamedNode<")">
  | UnnamedNode<"*">
  | UnnamedNode<"+">
  | UnnamedNode<",">
  | UnnamedNode<"-">
  | UnnamedNode<"->">
  | UnnamedNode<"->>">
  | UnnamedNode<"-?>">
  | UnnamedNode<"-?>>">
  | UnnamedNode<".">
  | UnnamedNode<"..">
  | UnnamedNode<"...">
  | UnnamedNode<"/">
  | UnnamedNode<"//">
  | UnnamedNode<"<">
  | UnnamedNode<"<=">
  | UnnamedNode<"=">
  | UnnamedNode<">">
  | UnnamedNode<">=">
  | UnnamedNode<"[">
  | UnnamedNode<"]">
  | UnnamedNode<"^">
  | UnnamedNode<"_ENV">
  | UnnamedNode<"_G">
  | UnnamedNode<"_VERSION">
  | UnnamedNode<"`">
  | UnnamedNode<"and">
  | UnnamedNode<"arg">
  | UnnamedNode<"assert">
  | UnnamedNode<"collectgarbage">
  | CommentNode
  | UnnamedNode<"coroutine">
  | UnnamedNode<"debug">
  | UnnamedNode<"do">
  | UnnamedNode<"dofile">
  | UnnamedNode<"doto">
  | UnnamedNode<SyntaxType.Each>
  | UnnamedNode<"error">
  | UnnamedNode<"eval-compiler">
  | UnnamedNode<"false">
  | FieldNode
  | UnnamedNode<"fn">
  | UnnamedNode<SyntaxType.For>
  | UnnamedNode<"gensym">
  | UnnamedNode<"getmetatable">
  | UnnamedNode<"global">
  | UnnamedNode<"hashfn">
  | UnnamedNode<"if">
  | UnnamedNode<"import-macros">
  | UnnamedNode<"in-scope?">
  | UnnamedNode<"include">
  | UnnamedNode<"ipairs">
  | UnnamedNode<"lambda">
  | UnnamedNode<"let">
  | UnnamedNode<"list">
  | UnnamedNode<"list?">
  | UnnamedNode<"load">
  | UnnamedNode<"loadfile">
  | UnnamedNode<"loadstring">
  | UnnamedNode<"local">
  | UnnamedNode<"macro">
  | UnnamedNode<"macrodebug">
  | UnnamedNode<"macroexpand">
  | UnnamedNode<"macros">
  | UnnamedNode<"match">
  | UnnamedNode<"multi-sym?">
  | UnnamedNode<"next">
  | UnnamedNode<SyntaxType.Nil>
  | UnnamedNode<"not">
  | UnnamedNode<"not=">
  | NumberNode
  | UnnamedNode<"or">
  | UnnamedNode<"package">
  | UnnamedNode<"pairs">
  | UnnamedNode<"pcall">
  | UnnamedNode<"print">
  | UnnamedNode<"rawequal">
  | UnnamedNode<"rawget">
  | UnnamedNode<"rawlen">
  | UnnamedNode<"rawset">
  | UnnamedNode<SyntaxType.Require>
  | UnnamedNode<"require-macros">
  | UnnamedNode<"select">
  | UnnamedNode<"sequence?">
  | UnnamedNode<SyntaxType.Set>
  | UnnamedNode<"setmetatable">
  | UnnamedNode<SyntaxType.String>
  | UnnamedNode<"sym">
  | UnnamedNode<"sym?">
  | UnnamedNode<SyntaxType.Table>
  | UnnamedNode<"table?">
  | UnnamedNode<"tonumber">
  | UnnamedNode<"tostring">
  | UnnamedNode<"true">
  | UnnamedNode<SyntaxType.Tset>
  | UnnamedNode<"type">
  | UnnamedNode<"unpack">
  | UnnamedNode<"var">
  | UnnamedNode<"varg?">
  | UnnamedNode<"when">
  | UnnamedNode<SyntaxType.While>
  | UnnamedNode<"xpcall">
  | UnnamedNode<"{">
  | UnnamedNode<"}">
  | UnnamedNode<"λ">
  | ErrorNode
  ;

export interface AssignmentNode extends NamedNodeBase {
  type: SyntaxType.Assignment;
}

export interface AssignmentsNode extends NamedNodeBase {
  type: SyntaxType.Assignments;
}

export interface BooleanNode extends NamedNodeBase {
  type: SyntaxType.Boolean;
}

export interface DoStatementNode extends NamedNodeBase {
  type: SyntaxType.DoStatement;
}

export interface EachNode extends NamedNodeBase {
  type: SyntaxType.Each;
}

export interface EachClauseNode extends NamedNodeBase {
  type: SyntaxType.EachClause;
}

export interface FieldExpressionNode extends NamedNodeBase {
  type: SyntaxType.FieldExpression;
}

export interface ForNode extends NamedNodeBase {
  type: SyntaxType.For;
}

export interface ForClauseNode extends NamedNodeBase {
  type: SyntaxType.ForClause;
}

export interface FunctionCallNode extends NamedNodeBase {
  type: SyntaxType.FunctionCall;
  nameNode: FieldExpressionNode | IdentifierNode;
}

export interface FunctionDefinitionNode extends NamedNodeBase {
  type: SyntaxType.FunctionDefinition;
  bodyNodes: (BooleanNode | CommentNode | DoStatementNode | EachNode | FieldNode | FieldExpressionNode | ForNode | FunctionCallNode | FunctionDefinitionNode | GlobalDefinitionNode | HashFunctionDefinitionNode | IdentifierNode | IfStatementNode | LambdaDefinitionNode | LetDefinitionNode | LocalDefinitionNode | MatchStatementNode | NilNode | NumberNode | QuotedValueNode | RequireNode | SequentialTableNode | SetNode | StringNode | TableNode | TsetNode | UnquotedValueNode | VarDefinitionNode | WhenStatementNode | WhileNode)[];
  doc_stringNode?: StringNode | TripleStringNode;
  nameNode?: IdentifierNode;
}

export interface GlobalDefinitionNode extends NamedNodeBase {
  type: SyntaxType.GlobalDefinition;
}

export interface HashFunctionDefinitionNode extends NamedNodeBase {
  type: SyntaxType.HashFunctionDefinition;
}

export interface IdentifierNode extends NamedNodeBase {
  type: SyntaxType.Identifier;
}

export interface IfStatementNode extends NamedNodeBase {
  type: SyntaxType.IfStatement;
}

export interface LambdaDefinitionNode extends NamedNodeBase {
  type: SyntaxType.LambdaDefinition;
  bodyNodes: (BooleanNode | CommentNode | DoStatementNode | EachNode | FieldNode | FieldExpressionNode | ForNode | FunctionCallNode | FunctionDefinitionNode | GlobalDefinitionNode | HashFunctionDefinitionNode | IdentifierNode | IfStatementNode | LambdaDefinitionNode | LetDefinitionNode | LocalDefinitionNode | MatchStatementNode | NilNode | NumberNode | QuotedValueNode | RequireNode | SequentialTableNode | SetNode | StringNode | TableNode | TsetNode | UnquotedValueNode | VarDefinitionNode | WhenStatementNode | WhileNode)[];
  doc_stringNode?: StringNode | TripleStringNode;
  nameNode?: IdentifierNode;
}

export interface LetDefinitionNode extends NamedNodeBase {
  type: SyntaxType.LetDefinition;
}

export interface LocalDefinitionNode extends NamedNodeBase {
  type: SyntaxType.LocalDefinition;
}

export interface MatchStatementNode extends NamedNodeBase {
  type: SyntaxType.MatchStatement;
}

export interface MultiValueAssignmentNode extends NamedNodeBase {
  type: SyntaxType.MultiValueAssignment;
}

export interface NilNode extends NamedNodeBase {
  type: SyntaxType.Nil;
}

export interface ParametersNode extends NamedNodeBase {
  type: SyntaxType.Parameters;
}

export interface ProgramNode extends NamedNodeBase {
  type: SyntaxType.Program;
}

export interface QuotedValueNode extends NamedNodeBase {
  type: SyntaxType.QuotedValue;
}

export interface RequireNode extends NamedNodeBase {
  type: SyntaxType.Require;
}

export interface SequentialTableNode extends NamedNodeBase {
  type: SyntaxType.SequentialTable;
}

export interface SetNode extends NamedNodeBase {
  type: SyntaxType.Set;
}

export interface StringNode extends NamedNodeBase {
  type: SyntaxType.String;
}

export interface TableNode extends NamedNodeBase {
  type: SyntaxType.Table;
}

export interface TripleStringNode extends NamedNodeBase {
  type: SyntaxType.TripleString;
}

export interface TsetNode extends NamedNodeBase {
  type: SyntaxType.Tset;
}

export interface UnquotedValueNode extends NamedNodeBase {
  type: SyntaxType.UnquotedValue;
}

export interface ValueListNode extends NamedNodeBase {
  type: SyntaxType.ValueList;
}

export interface VarDefinitionNode extends NamedNodeBase {
  type: SyntaxType.VarDefinition;
}

export interface WhenStatementNode extends NamedNodeBase {
  type: SyntaxType.WhenStatement;
}

export interface WhileNode extends NamedNodeBase {
  type: SyntaxType.While;
  conditionNode: BooleanNode | CommentNode | DoStatementNode | EachNode | FieldNode | FieldExpressionNode | ForNode | FunctionCallNode | FunctionDefinitionNode | GlobalDefinitionNode | HashFunctionDefinitionNode | IdentifierNode | IfStatementNode | LambdaDefinitionNode | LetDefinitionNode | LocalDefinitionNode | MatchStatementNode | NilNode | NumberNode | QuotedValueNode | RequireNode | SequentialTableNode | SetNode | StringNode | TableNode | TsetNode | UnquotedValueNode | VarDefinitionNode | WhenStatementNode | WhileNode;
}

export interface CommentNode extends NamedNodeBase {
  type: SyntaxType.Comment;
}

export interface FieldNode extends NamedNodeBase {
  type: SyntaxType.Field;
}

export interface NumberNode extends NamedNodeBase {
  type: SyntaxType.Number;
}

