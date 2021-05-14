#!/bin/bash
set -e
set -o pipefail
set -x

generate-booking-rules-txt /app/herrenberg-flex-rules.js routes.txt | tee booking_rules.txt | wc -l
generate-locations-geojson /app/herrenberg-flex-rules.js {routes,trips,stops,stop_times}.txt | tee locations.geojson | wc -l
patch-stop-times-txt /app/herrenberg-flex-rules.js {routes,trips,stop_times}.txt | sponge stop_times.txt
