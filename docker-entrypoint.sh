#!/bin/bash
set -e
set -o pipefail

usage="$(
	cat << EOF
usage:
	docker run … <rules-file> [gtfs-directory]
example:
	docker run -v \$PWD/data:/gtfs derhuerst/generate-gtfs-flex stadtnavi-herrenberg-rules.js
	docker run -v \$PWD/cfg:/cfg -v \$PWD/data:/data derhuerst/generate-gtfs-flex /cfg/rules.js /data
EOF
)"
if [ "$1" == '-h' ] || [ "$1" == '--help' ]; then
	1>&2 echo "$usage"
	exit 0
fi

pushd .
cd "$(dirname $0)"
rules_file="$1"
if [ -z "$rules_file" ]; then
	1>&2 echo -e "missing/empty 1st argument: rules-file\n"
	1>&2 echo "$usage"
	exit 1
fi
rules_file="$(realpath "$1")"
popd

if [ -n "$2" ]; then
	1>&2 echo "running inside $(realpath "$2")"
	cd "$2"
fi

set -x

generate-booking-rules-txt "$rules_file" *.txt | tee booking_rules.txt | wc -l
generate-locations-geojson "$rules_file" *.txt | tee locations.geojson | wc -l
patch-routes-txt "$rules_file" routes.txt | sponge routes.txt
patch-trips-txt "$rules_file" *.txt | sponge trips.txt
patch-stop-times-txt "$rules_file" *.txt | sponge stop_times.txt
