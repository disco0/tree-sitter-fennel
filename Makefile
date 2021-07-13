fennel.so: grammar.js gen
	cc -o fennel.so -I./src src/parser.c src/scanner.c --shared -Os -lstdc++ -fPIC

.PHONY: gen-wasm
gen-wasm: grammar.js
	yarn run compile:grammar:wasm

.PHONY: gen-dts
gen-dts: grammar.js
	yarn run compile:grammar:dts

.PHONY: gen
gen:
	npx tree-sitter generate

.PHONY: test
test: gen
	npx tree-sitter test
