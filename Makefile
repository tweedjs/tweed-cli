.PHONY: all
all: test build

.PHONY: test
test:
	standard

.PHONY: build
build: babel

.PHONY: babel
babel:
	babel src \
		--out-dir dist
