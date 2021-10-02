TARGET_DIR = /usr/share/node-discovery
SYSTEMD_DIR = /lib/systemd/system/

NPM = $(shell which npm)

 ifeq (, $(shell which node))
 	$(error "NodeJS not in $(PATH), consider doing apt-get install nodejs")
 endif

install:
	$(NPM) install
	
	mkdir -p $(TARGET_DIR)
	cp -r . $(TARGET_DIR)
	cp node-discovery.service $(SYSTEMD_DIR)
