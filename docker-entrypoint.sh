#!/bin/bash
set -e
set -o pipefail
set -x

generate-booking-rules-txt /app/herrenberg-flex-rules.js *.txt | tee booking_rules.txt | wc -l
generate-locations-geojson /app/herrenberg-flex-rules.js *.txt | tee locations.geojson | wc -l
patch-routes-txt /app/herrenberg-flex-rules.js routes.txt | sponge routes.txt
patch-trips-txt /app/herrenberg-flex-rules.js *.txt | sponge trips.txt
patch-stop-times-txt /app/herrenberg-flex-rules.js *.txt | sponge stop_times.txt
