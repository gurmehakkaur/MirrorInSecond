#!/bin/sh
echo "Starting MirrorInSeconds..."

# Express backend on internal port 4000
PORT=4000 node /app/server/index.js &

# Next.js frontend on public port 8080 (proxies /api/* → localhost:4000)
PORT=8080 HOSTNAME=0.0.0.0 exec node /app/frontend/server.js
