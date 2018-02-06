test:
	$(SILENT) jasmine
.PHONY: test

command:
	$(SILENT) node ./spec/command.js -a a -b b 
.PHONY: command
