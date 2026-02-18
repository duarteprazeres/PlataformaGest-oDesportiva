#!/bin/sh
echo "Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy
echo "Starting NestJS..."
node dist/src/main
