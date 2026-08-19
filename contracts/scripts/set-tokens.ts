import { ethers } from "hardhat";

async function main() {
  const blindpayAddress = "0x56c6996eE11CBd4d82F6B51d40717194Cdc1Ab9D3dAF1e5";
  const daiAddress = "0xE18C2e51d82F6B51d40717194Cdc1Ab9D3dAF1e5";
  const usdtAddress = "0x2d916cf929Fdcc824ea14b3647CB64ad16f3Dc4f";

  const blindpay = await ethers.getContractAt("BlindPay", blindpayAddress);

  console.log("Setting DAI token contract...");
  const tx1 = await blindpay.setTokenContract(2, daiAddress);
  await tx1.wait();
  console.log("DAI set");

  console.log("Setting USDT token contract...");
  const tx2 = await blindpay.setTokenContract(3, usdtAddress);
  await tx2.wait();
  console.log("USDT set");

  console.log("Done!");
}

main().catch(console.error);
