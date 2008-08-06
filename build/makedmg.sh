#!/bin/sh
HERE=`dirname $0`
ROOT=$HERE/..
DESTDIR=$ROOT/dist

VERSION=`/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" $ROOT/Pingboard.wdgt/Info.plist`
DSTFILE=$DESTDIR/Pingboard-$VERSION.dmg

FILES="Pingboard.wdgt CHANGES.txt ChangeLog.txt"

die() {
  echo $1 >&2
  exit 1
}

# automator -D root=$HERE/.. $HERE/make-dmg.workflow

dir=$TMP/pingboarddmg.$$
mkdir -p $dir || die "Cannot create tmp dir $dir"

for file in $FILES
do
  cp -r $file $dir/$file
done

hdiutil create -srcfolder $dir -volname "Pingboard $VERSION" $DSTFILE || die "Couldn't create image"

rm -rf "$dir"

echo "Success"
