#!/bin/bash
export DISPLAY=:99.0
# sh -e /etc/init.d/xvfb start
xvfb-run npm start
