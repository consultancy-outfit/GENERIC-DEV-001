#!/usr/bin/env sh
if ! command -v nx &> /dev/null; then
  echo "Nx is not installed globally. Please install it using npm -g install nx"
  exit 1
fi
npm run deploy