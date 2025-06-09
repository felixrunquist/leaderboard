#! /bin/bash
STANDALONE=1 yarn build
node scripts/copy-node-modules.mjs