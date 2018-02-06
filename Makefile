################################################################################
#
# The make file for configurator
#
# @author Jack
# @version 1.0
# @date Fri Jan 26 11:03:25 2018
#
################################################################################


#===============================================================================
#
# Debug
#
#===============================================================================

ifdef DEV
	SILENT := 
else
	SILENT := @
endif

#===============================================================================
#
# Variables
#
#===============================================================================


NINJA := ninja
CAT := cat
CD := cd
ECHO := echo
COMMIT = $(shell $(GIT) rev-parse --short HEAD)
CP := cp
CTAGS := ctags -R
DVIPDF := dvipdf
ECHO := echo
GIT := git
JAR := jar
JAVA := java
JDB := jldb
JSON_PP := json_pp
LATEX := latex
M4 := m4 -I /opt/local/include/ -I m4
MAVEN := mvn
MKDIR := mkdir -p
PHP := php
RM := rm -rf
RSYNC := rsync -avz -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress 
SASS := sass
SCP := scp
MESON := meson
SSH := ssh
SUDO := sudo
UGLIFYJS := uglifyjs
UNZIP := unzip
RELOAD_CHROME := $(SILENT) sh chrome.sh reload
RELOAD_SAFARI := $(SILENT) sh safari.sh reload
XELATEX := xelatex

#===============================================================================
#
# Core Functions
#
#===============================================================================

rwildcard=$(foreach d,$(wildcard $1*),$(call rwildcard,$d/,$2) $(filter $(subst *,%,$2),$d))
uniq = $(if $(1),$(strip $(word 1,$(1)) $(call uniq,$(filter-out $(word 1,$(1)),$(1)))))
ssh_exec = $(shell $(SSH) root@$(1) $(2))

#===============================================================================
#
# Tasks
#
#===============================================================================

test:
	$(SILENT) jasmine
.PHONY: test

command:
	$(SILENT) node ./spec/command.js -a a -b b 
.PHONY: command

