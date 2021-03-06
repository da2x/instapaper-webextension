MAKEFLAGS += -j --output-sync

SOURCES  = manifest.json browserAction.html
SOURCES += $(shell find icons   -name '*.svg')
SOURCES += $(shell find scripts -name '*.js')
SOURCES += $(shell find styles  -name '*.css')
SOURCES += COPYING

all: build

build: webextension.zip

webextension.zip: $(SOURCES)
	@rm -f $@
	zip -9 $@ $(SOURCES)

clean:
	rm -f webextension.zip
