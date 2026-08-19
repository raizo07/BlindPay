// Standalone script to set DAI and USDT token contracts on BlindPay
// Bypasses Hardhat's fhEVM plugin which causes errors on Sepolia
import { ethers } from "ethers";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const PRIVATE_KEY = "0x48c46fea0d5268e5d242e552923fd44591142326f6625fc4a6ca9fb329a7f6d1";

const BLINDPAY_ADDRESS = "0x56c6996eE11CBd4d5a32E34d58C019d27f03EbeA";
const DAI_ADDRESS = "0xE18C2e51d82F6B51d40717194Cdc1Ab9D3dAF1e5";
const USDT_ADDRESS = "0x2d916cf929Fdcc824ea14b3647CB64ad16f3Dc4f";

// Just the setTokenContract ABI
const ABI = [
  "function setTokenContract(uint8 tokenType, address tokenAddress) external",
  "function owner() view returns (address)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const blindpay = new ethers.Contract(BLINDPAY_ADDRESS, ABI, wallet);

  console.log("Wallet:", wallet.address);

  // Check owner
  const owner = await blindpay.owner();
  console.log("Contract owner:", owner);

  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    console.error("ERROR: Wallet is not the contract owner!");
    process.exit(1);
  }

  console.log("\nSetting DAI (tokenType=2)...");
  const tx1 = await blindpay.setTokenContract(2, DAI_ADDRESS);
  console.log("TX:", tx1.hash);
  await tx1.wait();
  console.log("DAI set!");

  console.log("\nSetting USDT (tokenType=3)...");
  const tx2 = await blindpay.setTokenContract(3, USDT_ADDRESS);
  console.log("TX:", tx2.hash);
  await tx2.wait();
  console.log("USDT set!");

  console.log("\nDone! Both tokens configured on BlindPay.");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
