#!/bin/bash
set -e

PORT=8080 pnpm --filter @workspace/api-server run dev &
PORT=18138 BASE_PATH=/ pnpm --filter @workspace/noor-ai run dev &
wait
