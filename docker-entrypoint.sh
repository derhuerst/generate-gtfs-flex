#!/bin/bash
set -e
set -o pipefail

if [ "$1" == '-h' ] || [ "$1" == '--help' ]; then
	1>&2 cat << EOF
usage:
	docker run … [gtfs-directory]
example:
	docker run -v \$PWD/data:/gtfs derhuerst/generate-gtfs-flex
	docker run -v \$PWD/data:/data derhuerst/generate-gtfs-flex /data
EOF
	exit 0
fi

if [ -n "$1" ]; then
	1>&2 echo "running inside $1"
	cd "$1"
fi

set -x

generate-booking-rules-txt /app/herrenberg-flex-rules.js *.txt | tee booking_rules.txt | wc -l
generate-locations-geojson /app/herrenberg-flex-rules.js *.txt | tee locations.geojson | wc -l
patch-routes-txt /app/herrenberg-flex-rules.js routes.txt | sponge routes.txt
patch-trips-txt /app/herrenberg-flex-rules.js *.txt | sponge trips.txt
patch-stop-times-txt /app/herrenberg-flex-rules.js *.txt | sponge stop_times.txt
