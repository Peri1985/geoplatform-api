#!/bin/bash
# Imports the places from the Nominatim database once, then serves them.
# The compose file starts Photon only after Nominatim has finished its import (healthy).
# To re-import, delete the photon-data volume.
set -e

if [ ! -d /photon/data/photon_data ]; then
  echo "Importing from Nominatim..."
  java $JAVA_OPTS -jar photon.jar import \
    -host nominatim -port 5432 -database nominatim \
    -user nominatim -password "$NOMINATIM_PASSWORD" \
    -languages "$PHOTON_LANGUAGES" \
    -data-dir /photon/data
fi

exec java $JAVA_OPTS -jar photon.jar serve -data-dir /photon/data -listen-ip 0.0.0.0
