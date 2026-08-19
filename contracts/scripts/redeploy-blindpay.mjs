// Redeploy only BlindPay contract with address(0) as trustedForwarder
// Reuses existing token contracts, then sets DAI/USDT and mints test tokens
import { ethers } from "ethers";
import { readFileSync } from "fs";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const PRIVATE_KEY = "0x48c46fea0d5268e5d242e552923fd44591142326f6625fc4a6ca9fb329a7f6d1";

// Existing token contracts (already deployed)
const USDC_ADDRESS = "0xcA9b24A66aBff8A60044C70542e94f89501354E5";
const DAI_ADDRESS = "0xE18C2e51d82F6B51d40717194Cdc1Ab9D3dAF1e5";
const USDT_ADDRESS = "0x2d916cf929Fdcc824ea14b3647CB64ad16f3Dc4f";

// Trusted forwarder = address(0) to disable meta-tx (will set a real relayer later)
const TRUSTED_FORWARDER = "0x0000000000000000000000000000000000000000";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // Load compiled artifact
  const artifact = JSON.parse(
    readFileSync("./artifacts/contracts/BlindPay.sol/BlindPay.json", "utf8")
  );

  // Deploy BlindPay
  console.log("\nDeploying BlindPay...");
  console.log("  USDC:", USDC_ADDRESS);
  console.log("  Trusted Forwarder:", TRUSTED_FORWARDER);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const blindpay = await factory.deploy(USDC_ADDRESS, TRUSTED_FORWARDER);
  console.log("Deploy TX:", blindpay.deploymentTransaction().hash);
  await blindpay.waitForDeployment();
  const blindpayAddress = await blindpay.getAddress();
  console.log("BlindPay deployed to:", blindpayAddress);

  // Set DAI token
  console.log("\nSetting DAI (tokenType=2)...");
  const tx1 = await blindpay.setTokenContract(2, DAI_ADDRESS);
  console.log("TX:", tx1.hash);
  await tx1.wait();
  console.log("DAI set!");

  // Set USDT token
  console.log("\nSetting USDT (tokenType=3)...");
  const tx2 = await blindpay.setTokenContract(3, USDT_ADDRESS);
  console.log("TX:", tx2.hash);
  await tx2.wait();
  console.log("USDT set!");

  console.log("\n--- Copy to frontend/.env ---");
  console.log(`VITE_CONTRACT_ADDRESS=${blindpayAddress}`);
  console.log(`VITE_USDC_ADDRESS=${USDC_ADDRESS}`);
  console.log(`VITE_DAI_ADDRESS=${DAI_ADDRESS}`);
  console.log(`VITE_USDT_ADDRESS=${USDT_ADDRESS}`);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
