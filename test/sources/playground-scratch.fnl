(local view (require :fennelview))
(local varargs [])
(each [i v (ipairs [e])]
 (do
  (tset varargs (+ (# varargs) 1)
        (if (= (type v) "table")
            (view v)
            v))
  (print (string.format text (table.unpack varargs)))))

(local pprint (λ [data] (-> data (view) (print))))

;;#endregion Output

;;#region Common

(λ ++ [number ?inc]
 "Alias for (+ i 1) with optional alternate increment amount"
 (+ number (or ?inc 1)))

(fn last-in [indexed]
  """
  Get item at last index of parameter `indexed` (of `string` or `table` type.).
  """
  (match (type indexed)
    :table  (. indexed (length indexed))
    :string (string.sub indexed (length indexed))
    other-type (error (string.format
                "[last-in] Fallthrough type matching for parameter `indexed`\n  indexed: %s => %s"
                (other-type)
                    (view indexed)))))

;;#endregion Common

;;#region Exported

(tset util :inspect   view)
(tset util :printf    f-print)
(tset util :pprint    pprint)
(tset util :plus-plus ++)

;;#endregion Exported

;;#endregion Util

;;#region Helper Functions

(fn peek-last-char [results]
  """
    Get last char in last (current) span, returns empty string if span is empty.
  """
  (let [last (. results (# results))]
    (string.sub last (# last))))

;;#endregion Helper Functions

;;#region Token Operations

;; Functions that take in at least the `results` object first argument, and return `results`.

(fn next-item [results]
  """
    Unless last (current) span in `results` is of zero length, append a new (current) span
  """
  (let [last        (last-in results)
        last-empty? (= last "")]
    (if last-empty?
      ;; Log warning about attemping to create a new span with current span empty
      (util.printf "[next-item] Current span is empty, skipping creation of new span.")
      ;; Else log span being committed, and add new span
      (do (util.printf "<next-item> => Committing span %q" last)
          (tset results (++ (# results )) "")))
    results))

(fn add-char [results char]
  (assert (= (type results) "table") "`results` parameter is not a table.")
  ; (print (.. "  => " char))
  (let [last (. results (# results))]
    (doto results
      (tset (# results) (.. last char))))

(fn add-escaped-char [results char i]
  """
    Consume a backslash _and_ escaped char
  """
  (let [last (. results (# results))]
    (doto results
      (tset (# results) (.. last char))))

(fn add-whitespace [results char i]
  """
    Append whitespace character conditionally—appends to current span if last char of current span
    is empty or whitespace, else create a new span and append new whitespace char.
  """
  (assert (and (> (# char) 0)
               (char:match "^%s+$"))
          "[add-whitespace] char parameter must be a whitespace string.")
  (let [lastchar (peek-last-char results)]
    (if (not (or (= lastchar "") (lastchar:match "^%s+$")))
         (do (print "<add-whitespace> => <next-item>")
            (next-item results))
        ; else
        (print "<add-whitespace> -/-> next-item")
    (add-char results char))))

(fn peek-char [str i]
  "Get current char in `str` at current position `i`"
  (string.sub str i i))

(fn peek-next-char [str i]
  "Get next char (or chars) in `str` given current position `i`."
  (string.sub str (++ i) (++ i)))

(fn whitespace? [byte]
  """
    From fennel source—checks if byte is a whitespace character.
  """
  (let [b (if (= (type byte) "string")
                (byte:byte 1)
              byte)]
    (or (= b 32) (and (>= b 9) (<= b 13)))))

;;#region Unused

(fn trim-trailing-space [results]
  "[unused, from original fennel cookbook example]"
  (let [last (last-in results)]
    (tset results (# results) (last:gsub "%s+$" ""))
    (when (= (last-in results) "")
      (table.remove results
        (# results) ;; ????
      ))))

;;#endregion Unused

;;#endregion Token Operations

;;#region Parser Debugging

(var print-parser-conf
{
    :force-full             true
    :longest-passed-section 15
    :enable                 true
})

(fn fmt-quote-or-quoted [text]
 """
 Quote `text` with string.format unless `text` is quote character.
 """
 (assert (= (type text) "string"))
 ; (if )
 )

(fn print-parser [results section i ?verbose]
 """
 Logs calls to parsers with varying verbosity.
 """
 ; Exit early if disabled
 (when print-parser-conf.enable
  (assert (and (not= nil results)
               (> (# results) 0))
          "`results` parameter is nil or zero length.")
  (let [  ;; config table alias (replace destructuring if possible)
          conf        print-parser-conf
          ;; config keys
        { :force-full always-verbose } print-parser-conf

          ;; Last character in current text span
          last    (or (last-in results) "")
          ;; Last character in output format (quoted, or quote char)
          lastfmt (if (= last "\"")
                      (string.format "<%s>" last)
                      ; else
                      (string.format "%q"   last)) ]
        ;; Update longest parser name length if current is new max
        (tset conf :longest-passed-section
                   (math.max (# section) conf.longest-passed-section))

        (if (= (or ?verbose always-verbose) true)
              (util.printf "<%s:%04i>%s%s"
                section
                i
                (string.rep " " (++ (- (math.max 1 (. conf :longest-passed-section)) (# section))))
                lastfmt)
         (let [prefix (if (> (# last) 0) "  " (.. "<" section "> "))]
           (util.printf "  %s" lastfmt))))))

;;#endregion Parser Debugging

;;#region Macros

(macro push-char! [parser matched]
  "Standard single char push operation, does not start a new token"
  `(,parser str
    (+  i (or (length ,matched) 1))
    (-> results (add-char ,matched))))

(macro next-char! [str i ?ei]
  "Generate expression to get next character of `str` given current position `i`, or optionally a different length to ending index `ei`."
  (assert (>= i (or ?ei i))
   (string.format "Optional end integer index `ei` must be equal to or greater than starting index integer `i` (i: %q, ei: %q)"
      i (or ?ei i) ))
  `(string.sub ,str ,i (or ?ei i)))

(macro with-next-char! [str i next-bound-expr]
  "Create `next-char` value for `next-bound-expr`"
  `(let [next-char (peek-char ,str ,i)]
    (,next-bound-expr)))

;;#endregion Macros

;;#region Parsers

(local parsers { :stack [] :dquoted { :in-quote false } })
(local P       parsers)

(λ parsers.terminate [str i results]
  """
    Ending state. Checks if position is actually at the end, that no remaining parse stack state
    remains (e.g. reached end expecting a closing quote) (@TODO), and trims the final results table
    entry if its empty.
  """
  (print-parser results "END" i)
  (assert (= (type results) "table" )  "Missing table type results parameter.")
  (assert (= (type str)     "string") "Missing string type str parameter.")
  (assert (>= i (# str))
    (string.format "Reached termination at non-final character in input (%s / %i)" i (# str)))
  (when (= "" (. results (# results)))
    (table.remove results (# results)))
  (assert (= 0 (# (. parsers :stack))) "Reached termination parser with unresolved stack states.")
  results)


;; @TODO Add parsers.whitespace

(λ parsers.base [str i results]
  (print-parser results "base" i)
  (match (string.sub str i i)
    ""   (parsers.terminate     str i       results)
    " "  (parsers.base          str (++ i) (add-whitespace results " " (++ i)));  (next-item results))
    "\"" (parsers.dquoted.begin str i results)
    (where "\\" (> 1 (length (string.sub str i))))
         (parsers.base      str (+ i 2) (add-char results (string.sub str i (+ i 1)))) ; Not sure if needed here yet
    "$"  (parsers.dollar    str (++ i) (-> results (next-item) (add-char "$")))
    char (push-char! parsers.base char)))

(λ parsers.dollar [str i results]
  "Parse dollar character possibly beginning a parameter expansion"
  (print-parser results "dollar" i)
  (match (string.sub str i i)
    ""   (parsers.terminate str i results)
    (where "\\" (> 1 (# (string.sub str i))))
         (parsers.base      str (+ i 2) (add-char results (string.sub str i (+ i 1)))) ; Not sure if needed here yet
    "\"" (parsers.dquoted   str (+ i 1) (-> results (next-item) (add-char "\"")  (print-parser "dquoted" (+ i 1)) (next-item)))
    "{"  (parsers.paramexpn str (+ i 1) (-> results (add-char "{") (next-item) ))
    char (push-char! parsers.base char)))

(λ parsers.paramexpn [str i results]
  (print-parser results "paramexpn" i)
  (match (string.sub str i i)
    "}"  (parsers.base str (+ i 1) (-> results (next-item) (add-char "}") (next-item)))
    ;; Only match escape prefix if another token available
    (where "\\" (> 1 (# (string.sub str i))))
         (parsers.paramexpn str (+ i 2) (add-char results (string.sub str i (+ i 1))))
    char (push-char! parsers.paramexpn char)))

;;#region Double Quoted

;;#region Macros

(macro assert-dquot-bound! [str i ?context]
  "Build assertion that char at given position is a '\"'"
  `(let [curr-char# (peek-char ,str ,i)]
    (assert (= curr-char# "\"")
      (string.format "Parser%s with incorrect next character—expected %s, got %q."
       (if (or false ,?context) (.. " for quotation " (tostring ,?context) " boundary") "")
       "\""
       curr-char#))))

;;#endregion Macros

(fn parsers.dquoted.begin [str i results]
  (print-parser results "dquoted-begin" i)
  (assert-dquot-bound! str i "beginning")
  (tset parsers.dquoted :in-quote true)
  (-> results (next-item) (add-char "\"") (next-item))
  (let [i (+ i 1)]
   (parsers.dquoted.body str i results)))
  ; (let [i-next (+ i 1)]
    ; (parsers.dquoted.body (string.sub str i-next i-next) (+ i-next 1) results)))

  ; (match (string.sub str i i)
  ;   (where char (= char "\""))
  ;         (parsers.dquoted.body char (+ i 1) (-> results (next-item) (add-char char)))
    ; (where char (not= char "\""))
    ;       (error
    ;        (string.format
    ;         "Parser parsers.dquoted.end called with incorrect next character—expected %s, got %q."
    ;           "'\"'"
    ;           char ))))

(fn parsers.dquoted.end [str i results]
  (print-parser results "dquote-end" i)
  (assert-dquot-bound! str i "ending")
  (tset parsers.dquoted :in-quote false)
  (-> results (next-item) (add-char "\"") (next-item))
  (let [i-next (+ i 1)]
    (parsers.base (string.sub str i-next i-next) (+ i-next 1) results)))

(fn parsers.dquoted.body [str i results]
  (print-parser results "dquote-body" i)
  (assert (= (. parsers.dquoted :in-quote) true) "Entered parsers.dquoted.body parser while :in-quote state false.")
  (match (string.sub str i i)
    ;; Disabled while getting dquoted parsers working
    ; "$"  (parsers.dollar  str (+ i 1) (add-char results "$"))
    "\"" (parsers.dquoted.end str i results)
    ;; Only match escape prefix if another token available
    (where "\\" (> 1 (# (string.sub str i))))
         (parsers.dquoted.body str (+ i 2) (add-char results (string.sub str i (+ i 1))))
    char (parsers.dquoted.body str (+ i 1) (add-char results char))))
    ; char (push-char! parsers.dquoted.body char)))
    ; char (parsers.dquoted.body str (+ i 1) (-> results (next-item) (add-char char)))))
    ; char (parsers.dquoted.body str (+ i 1) (add-char results char))))
        ;; (push-char! parsers.dquoted.body char)))))

;;#endregion Double Quoted

(fn parsers.begin [str i results]
  "Entry point for input parsing"
  (f-print "<begin:%04i> Parsing => %q" i str)
  (match (string.sub str i i)
    ;; This originally had some utility, but since we're preserving whitespace this is literally
    ;; just an entry point to push immedately into the base context now
    char (parsers.base str i results)))

    ; " "  (parsers.base str (+ i 1) (add-whitespace results  " " i))
    ; (where "\\" (> 1 (length (string str i))))
    ;      (parsers.base  str (+ i 2) (add-char results (string.sub str i (+ i 1))))
    ; char (push-char! parsers.base char)))

;;#region Unused

(fn parsers.pound [str i results]
  "[unused, from original fennel cookbook example]"
  (match (string.sub str i i)
    ""   (parsers.terminate str i       results)
    "{"  (parsers.curly     str (+ i 1) (add-char results "{"))
    " "  (parsers.begin     str (+ i 1) (next-item results))
    char (push-char! parsers.pound char)))

(fn parsers.curly [str i results]
  "[unused, from original fennel cookbook example]"
  (match (string.sub str i i)
    "}"  (parsers.begin str (+ i 1) (-> results (add-char "}") (next-item)))
    "{"  (error "Curly braces may not nest.")
    ""   (error "Incomplete curly!")
    char (push-char! parsers.curly char)))

;;#endregion Unused

;;#endregion Parsers

;;#region Main parser function

{ :module :exports }
