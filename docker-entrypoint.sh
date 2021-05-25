#!/bin/bash
set -e
set -o pipefail
set -x

generate-booking-rules-txt /app/herrenberg-flex-rules.js *.txt | tee booking_rules.txt | wc -l
generate-locations-geojson /app/herrenberg-flex-rules.js *.txt | tee locations.geojson | wc -l
generate-location-groups-txt /app/herrenberg-flex-rules.js *.txt | tee location_groups.txt | wc -l
patch-stop-times-txt /app/herrenberg-flex-rules.js *.txt | sponge stop_times.txt
