#!/bin/sh
HERE=`dirname $0`
rm -f $HERE/../ChangeLog.txt
git log > $HERE/../ChangeLog.txt
