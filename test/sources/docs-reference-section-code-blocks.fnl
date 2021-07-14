;;#section fn function


(fn pxy [x y]
  (print (+ x y)))

;;#section lambda/λ arity-checked function


(lambda [x ?y z]
  (print (- x (* (or ?y 1) z))))

;;#section Docstrings


(fn pxy [x y]
  "Print the sum of x and y"
  (print (+ x y)))

(λ pxyz [x ?y z]
  "Print the sum of x, y, and z. If y is not provided, defaults to 0."
  (print (+ x (or ?y 0) z)))

;;#section Hash function literal shorthand


(fn [a b] (+ a b))


(hashfn (+ $1 $2))


#(+ $1 $2)


#$3               ; same as (fn [x y z] z)
#[$1 $2 $3]       ; same as (fn [a b c] [a b c])
#$                ; same as (fn [x] x) (aka the identity function)
#val              ; same as (fn [] val)
#[:one :two $...] ; same as (fn [...] ["one" "two" ...])

;;#section partial partial application


(partial (fn [x y] (print (+ x y))) 2)

;;#section pick-values emit exactly n values


(pick-values 2 (func))


(let [(_0_ _1_) (func)] (values _0_ _1_))


(pick-values 0 :a :b :c :d :e) ; => nil
[(pick-values 2 (table.unpack [:a :b :c]))] ;-> ["a" "b"]

(fn add [x y ...] (let [sum (+ (or x 0) (or y 0))]
                        (if (= (select :# ...) 0) sum (add sum ...))))

(add (pick-values 2 10 10 10 10)) ; => 20
(->> [1 2 3 4 5] (table.unpack) (pick-values 3) (add)) ; => 6


(select :# (pick-values 5 "one" "two")) ; => 5
[(pick-values 5 "one" "two")]           ; => ["one" "two"]

;;#section pick-args create a function of fixed arity

;;#section let scoped locals


(let [x 89]
  (print (+ x 12)) ; => 101


(let [(x y z) (unpack [10 9 8])]
  (+ x y z)) ; => 27


(let [[a b c] [1 2 3]]
  (+ a b c)) ; => 6


(let [{:msg message : val} {:msg "hello there" :val 19}]
  (print message)
  val) ; prints "hello there" and returns 19


(let [[a b & c] [1 2 3 4 5 6]]
  (table.concat c ",")) ; => "3,4,5,6"


(let [{:a a :b b &as all} {:a 1 :b 2 :c 3 :d 4}]
  (+ a b all.c all.d)) ; => 10

;;#section with-open bind and auto-close file handles


;; Basic usage
(with-open [fout (io.open :output.txt :w) fin (io.open :input.txt)]
  (fout:write "Here is some text!\n")
  ((fin:lines))) ; => first line of input.txt

;; This demonstrates that the file will also be closed upon error.
(var fh nil)
(local (ok err)
  (pcall #(with-open [file (io.open :test.txt :w)]
            (set fh file) ; you would normally never do this
            (error :whoops!))))
(io.type fh) ; => "closed file"
[ok err]     ; => [false "<error message and stacktrace>"]

;;#section local declare local


(local tau-approx 6.28318)

;;#section match pattern matching


(match mytable
  59      :will-never-match-hopefully
  [9 q 5] (print :q q)
  [1 a b] (+ a b))


(match mytable
  {:subtable [a b ?c] :depth depth} (* b depth)
  _ :unknown)


(match (io.open "/some/file")
  (nil msg) (report-error msg)
  f (read-file f))


(let [x 95]
 (match [52 85 95]
   [b a a] :no ; because a=85 and a=95
   [x y z] :no ; because x=95 and x=52
   [a b x] :yes)) ; a and b are fresh values while x=95 and x=95


(match [91 12 53]
  (where [a b c] (= 5 a)) :will-not-match
  (where [a b c] (= 0 (math.fmod (+ a b c) 2)) (= 91 a)) c) ; -> 53


(match [5 1 2]
  (where (or [a 3 9] [a 1 2]) (= 5 a)) "Will match either [5 3 9] or [5 1 2]"
  _ "will match anything else")


(match [5 1 2]
  (where [a 3 9] (= 5 a)) "Will match either [5 3 9] or [5 1 2]"
  (where [a 1 2] (= 5 a)) "Will match either [5 3 9] or [5 1 2]"
  _ "will match anything else")


;; bad
(match [1 2 3]
  ;; Will throw an error because `b' is nil for the first
  ;; pattern but the guard still uses it.
  (where (or [a 1 2] [a b 3]) (> a 0) (> b 1))
  :body)

;; ok
(match [1 2 3]
  (where (or [a b 2] [a b 3]) (> a 0) (>= b 1))
  :body)


(match [1 2 3]
  (where [a 2 3] (> a 0)) "new guard syntax"
  ([a 2 3] ? (> a 0)) "obsolete guard syntax")

;;#section global set global variable


(global prettyprint (fn [x] (print (fennel.view x))))

;;#section var declare local variable


(var x 83)

;;#section set set local variable or table field


(set x (+ x 91))


(let [t {:a 4 :b 8}]
  (set t.a 2) t) ; => {:a 2 :b 8}

;;#section tset set table field


(let [tbl {:d 32} field :d]
  (tset tbl field 19) tbl) ; => {:d 19}

;;#section multiple value binding


(let [x (values 1 2 3)]
  x) ; => 1


(let [(file-handle message code) (io.open "foo.blah")]
  message) ; => "foo.blah: No such file or directory"


(global (x-m x-e) (math.frexp 21)), {:m x-m :e m-e} ;  => {:e 5 :m 0.65625}


(do (local (_ _ z) (unpack [:a :b :c :d :e])) z)  => c

;;#section if conditional


(let [x (math.random 64)]
  (if (= 0 (% x 10))
      "multiple of ten"
      (= 0 (% x 2))
      "even"
      "I dunno, something else"))

;;#section when single side-effecting conditional


(when launch-missiles?
  (power-on)
  (open-doors)
  (fire))

;;#section each general iteration


(each [key value (pairs mytbl)]
  (print key (f value)))


(local out [])
(each [_ value (pairs tbl) :until (< max-len (length out))]
  (table.insert out value))

;;#section for numeric loop


(for [i 1 10 2]
  (print i))


(var x 0)
(for [i 1 128 :until (maxed-out? x)]
  (set x (+ x i)))

;;#section while good old while loop


(var done? false)
(while (not done?)
  (print :not-done)
  (when (> (math.random) 0.95)
    (set done? true)))

;;#section do evaluate multiple forms returning last value


(if launch-missiles?
    (do
      (power-on)
      (open-doors)
      (fire))
    false-alarm?
    (promote lt-petrov))

;;#section operators

;;#section .. string concatenation


(.. "Hello" " " "world" 7 "!!!") ; => "Hello world7!!!"

;;#section length string or table length


(+ (length [1 2 3 nil 8]) (length "abc")) ; => 6 or 8

;;#section . table lookup


(. mytbl myfield)


(let [t {:a [2 3 4]}] (. t :a 2)) ; => 3

;;#section Nil-safe ?. table lookup


(?. mytbl myfield)


(let [t {:a [2 3 4]}] (?. t :a 4 :b)) ; => nil
(let [t {:a [2 3 4 {:b 42}]}] (?. t :a 4 :b)) ; => 42

;;#section collect, icollect table comprehension macros


(collect [k v (pairs {:apple "red" :orange "orange"})]
  (values (.. "color-" v) k))
;; -> {:color-orange "orange" :color-red "apple"}

;; equivalent to:
(let [tbl {}]
  (each [k v (pairs {:apple "red" :orange "orange"})]
    (match (values (.. "color-" v) k)
      (key value) (tset tbl key value)))
  tbl)


(icollect [_ v (ipairs [1 2 3 4 5 6])]
  (when (> v 2) (* v v)))
;; -> [9 16 25 36]

;; equivalent to:
(let [tbl []]
  (each [_ v (ipairs [1 2 3 4 5 6])]
    (tset tbl (+ (length tbl) 1) (when (> v 2) (* v v))))
  tbl)

;;#section values multi-valued return


(fn [filename]
  (if (valid-file-name? filename)
      (open-file filename)
      (values nil (.. "Invalid filename: " filename))))

;;#section : method call


(let [f (assert (io.open "hello" "w"))]
  (f:write "world")
  (f:close))


(let [f (assert (io.open "hello" "w"))
      method1 :write
      method2 :close]
  (: f method1 "world")
  (: f method2))


(let [f (assert (io.open "hello" "w"))]
  (f.write f "world")
  (f.close f))

;;#section ->, ->>, -?> and -?>> threading macros


(-> 52
    (+ 91 2) ; (+ 52 91 2)
    (- 8)    ; (- (+ 52 91 2) 8)
    (print "is the answer")) ; (print (- (+ 52 91 2) 8) "is the answer")


(-?> {:a {:b {:c 42}}}
     (. :a)
     (. :missing)
     (. :c)) ; -> nil
(-?>> :a
      (. {:a :b})
      (. {:b :missing})
      (. {:c 42})) ; -> nil

;;#section doto


(doto (io.open "/tmp/err.log")
  (: :write contents)
  (: :close))

;; equivalent to:
(let [x (io.open "/tmp/err.log")]
  (: x :write contents)
  (: x :close)
  x)

;;#section include


(include :my.embedded.module)

;;#section import-macros load macros from a separate module


(fn when2 [condition body1 ...]
  (assert body1 "expected body")
  `(if ,condition
     (do ,body1 ,...)))

{:when2 when2}


(import-macros {: when2} :my-macros)

(when2 (= 3 (+ 2 a))
  (print "yes")
  (finish-calculation))


(if (= 3 (+ 2 a))
  (do
    (print "yes")
    (finish-calculation)))


(import-macros mine :my-macros)

(mine.when2 (= 3 (+ 2 a))
  (print "yes")
  (finish-calculation))


(local (module-name file-name) ...)
(import-macros mymacros (.. module-name ".macros"))


(import-macros mymacros (.. ... ".macros"))

;;#section require-macros load macros with less flexibility

;;#section Macro module searching


(local fennel (require :fennel))

(fn my-searcher [module-name]
  (let [filename (.. "src/" module-name ".fnl")]
    (match (find-in-archive filename)
      code (values (partial fennel.eval code {:env :_COMPILER})
                   filename))))

(table.insert fennel.macro-searchers my-searcher)

;;#section macros define several macros


(macros {:my-max (fn [x y]
                   `(let [x# ,x y# ,y]
                      (if (< x# y#) y# x#)))})

(print (my-max 10 20))
(print (my-max 20 10))
(print (my-max 20 20))

;;#section macro define a single macro


(macro my-max [x y]
  `(let [x# ,x y# ,y]
     (if (< x# y#) y# x#)))

;;#section macrodebug print the expansion of a macro


(macrodebug (-> abc
                (+ 99)
                (> 0)
                (when (os.exit))))
; -> (if (> (+ abc 99) 0) (do (os.exit)))

;;#section Macro gotchas


(var v 1)
(macros {:my-max (fn [x y]
                   `(if (< ,x ,y) ,y ,x))})

(fn f [] (set v (+ v 1)) v)

(print (my-max (f) 2)) ; -> 3 since (f) is called twice in the macro body above


(macros {:my-max (fn [x y]
                   `(let [x2 ,x y2 ,y]
                      (if (< x2 y2) y2 x2)))})

(print (my-max 10 20))
; Compile error in 'x2' unknown:?: macro tried to bind x2 without gensym; try x2# instead


(fn my-fn [] (print "hi!"))

(macros {:my-max (fn [x y]
                   (my-fn)
                   `(let [x# ,x y# ,y]
                      (if (< x# y#) y# x#)))})
; Compile error in 'my-max': attempt to call global '__fnl_global__my_2dfn' (a nil value)

;;#section eval-compiler


(eval-compiler
  (each [name (pairs _G)]
    (print name)))

;;#section Compiler Environment


(fn find [tbl pred]
  (each [key val (pairs tbl)]
    (when (pred val)
      (lua "return key"))))