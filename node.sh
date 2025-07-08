#!/usr/bin/env bash

set -a # Автоэкспорт всех переменных
source .env
set +a

npx hardhat node --fork "https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY" --fork-block-number 22839956
