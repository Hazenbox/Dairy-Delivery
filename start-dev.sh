#!/bin/bash

# Load nvm
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
fi

# Use the correct Node version
nvm use

# Start the development server
npm run dev 