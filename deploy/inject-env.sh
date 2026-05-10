#!/bin/sh

API_URL=${API_URL:-https://gpt-agent.cc}

# Vite embeds env values at build time; replace the placeholder so one image can use runtime API_URL.
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__API_URL_PLACEHOLDER__|$API_URL|g" {} +

exec "$@"
