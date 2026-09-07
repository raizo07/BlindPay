#!/usr/bin/env bash
# Deploy BlindPayEscrow to Starknet mainnet via sncast.
# Requires Scarb >= 2.20 and sncast >= 0.56 (Blake compiled-class hash on mainnet).
set -euo pipefail

cd "$(dirname "$0")/.."

POOL="${STRK20_POOL_ADDRESS:-0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a}"
PROFILE="${SNCAST_PROFILE:-mainnet}"
ACCOUNT="${SNCAST_ACCOUNT:-oz_deployer}"
NETWORK_FLAG=(--network mainnet)
if [[ -n "${STARKNET_MAINNET_RPC:-}" ]]; then
  NETWORK_FLAG=(--url "$STARKNET_MAINNET_RPC")
fi

echo "==> Declaring on ${PROFILE} (pool=${POOL})..."
DECLARE_OUT=$(sncast --profile "$PROFILE" --account "$ACCOUNT" declare \
  --contract-name BlindPayEscrow "${NETWORK_FLAG[@]}" 2>&1) when installed via asdf (mainnet v0.14.1+ Blake CASM hash).
if [[ -d "$HOME/.asdf/installs/scarb/2.20.1/bin" ]]; then
  export PATH="$HOME/.asdf/installs/scarb/2.20.1/bin:$PATH"
elif [[ -d "$HOME/.asdf/installs/scarb/2.19.4/bin" ]]; then
  export PATH="$HOME/.asdf/installs/scarb/2.19.4/bin:$PATH"
fi
if [[ -d "$HOME/.asdf/installs/starknet-foundry/0.56.0/bin" ]]; then
  export PATH="$HOME/.asdf/installs/starknet-foundry/0.56.0/bin:$PATH"
elif [[ -d "$HOME/.local/bin" ]]; then
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "==> Using $(scarb --version | head -1)"
echo "==> Using $(sncast --version | head -1)"
echo "==> Building BlindPayEscrow..."
scarb build

# Prefer newer toolchain
echo "$DECLARE_OUT"

CLASS_HASH=$(echo "$DECLARE_OUT" | grep -oE '0x[0-9a-fA-F]{64}' | head -1)
if [[ -z "$CLASS_HASH" ]]; then
  echo "Could not parse class hash from declare output."
  exit 1
fi

echo "==> Deploying with constructor calldata [pool]..."
DEPLOY_OUT=$(sncast --profile "$PROFILE" --account "$ACCOUNT" deploy \
  --class-hash "$CLASS_HASH" \
  --constructor-calldata "$POOL" "${NETWORK_FLAG[@]}" 2>&1)
echo "$DEPLOY_OUT"

ESCROW=$(echo "$DEPLOY_OUT" | grep -oE '0x[0-9a-fA-F]{64}' | tail -1)

mkdir -p deployments
cat > deployments/mainnet.json <<EOF
{
  "network": "mainnet",
  "pool_address": "${POOL}",
  "escrow_address": "${ESCROW}",
  "class_hash": "${CLASS_HASH}",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "Deployed BlindPayEscrow: ${ESCROW}"
echo "Saved contracts/deployments/mainnet.json"
echo ""
echo "Add to frontend/.env:"
echo "  VITE_STRK20_ESCROW_ADDRESS_MAINNET=${ESCROW}"
echo "  VITE_STRK20_POOL_ADDRESS_MAINNET=${POOL}"
echo ""
echo "Add escrow to strk20.json:"
echo '  "contracts": ["'${ESCROW}'"]'
