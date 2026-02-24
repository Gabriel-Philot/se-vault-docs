#define _GNU_SOURCE
#include <stdio.h>
#include <dlfcn.h>
#include <string.h>
#include "malloc_wrapper.h"

static void *(*real_malloc)(size_t) = NULL;
static void (*real_free)(void *) = NULL;
static void *(*real_calloc)(size_t, size_t) = NULL;
static void *(*real_realloc)(void *, size_t) = NULL;
static int initialized = 0;
static int in_hook = 0;

static void init(void) {
    if (initialized) return;
    initialized = 1;
    real_malloc = dlsym(RTLD_NEXT, "malloc");
    real_free = dlsym(RTLD_NEXT, "free");
    real_calloc = dlsym(RTLD_NEXT, "calloc");
    real_realloc = dlsym(RTLD_NEXT, "realloc");
}

void *malloc(size_t size) {
    init();
    void *ptr = real_malloc(size);
    if (!in_hook) {
        in_hook = 1;
        fprintf(stderr, "TRACE:{\"action\":\"malloc\",\"size\":%zu,\"ptr\":\"%p\"}\n", size, ptr);
        in_hook = 0;
    }
    return ptr;
}

void free(void *ptr) {
    init();
    if (!in_hook && ptr != NULL) {
        in_hook = 1;
        fprintf(stderr, "TRACE:{\"action\":\"free\",\"ptr\":\"%p\"}\n", ptr);
        in_hook = 0;
    }
    real_free(ptr);
}

void *calloc(size_t nmemb, size_t size) {
    init();
    if (!real_calloc) {
        static char buf[4096];
        static size_t offset = 0;
        size_t total = nmemb * size;
        void *ptr = buf + offset;
        offset += total;
        memset(ptr, 0, total);
        return ptr;
    }
    void *ptr = real_calloc(nmemb, size);
    if (!in_hook) {
        in_hook = 1;
        fprintf(stderr, "TRACE:{\"action\":\"calloc\",\"nmemb\":%zu,\"size\":%zu,\"ptr\":\"%p\"}\n", nmemb, size, ptr);
        in_hook = 0;
    }
    return ptr;
}

void *realloc(void *old_ptr, size_t size) {
    init();
    void *ptr = real_realloc(old_ptr, size);
    if (!in_hook) {
        in_hook = 1;
        fprintf(stderr, "TRACE:{\"action\":\"realloc\",\"old_ptr\":\"%p\",\"size\":%zu,\"ptr\":\"%p\"}\n", old_ptr, size, ptr);
        in_hook = 0;
    }
    return ptr;
}
