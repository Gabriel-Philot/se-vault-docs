.PHONY: all clean

all: lib/malloc_wrapper.so

lib/malloc_wrapper.so: src/malloc_wrapper.c src/malloc_wrapper.h
	mkdir -p lib
	gcc -shared -fPIC -o lib/malloc_wrapper.so src/malloc_wrapper.c -ldl

clean:
	rm -rf lib/
