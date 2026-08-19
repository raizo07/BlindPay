import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy MockDAI
  const MockDAI = await ethers.getContractFactory("MockDAI");
  const dai = await MockDAI.deploy();
  await dai.waitForDeployment();
  const daiAddress = await dai.getAddress();
  console.log("MockDAI deployed to:", daiAddress);

  // Deploy MockUSDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  // Deploy BlindPay
  // IMPORTANT: trustedForwarder must NOT be the deployer/owner address!
  // ERC2771Context strips last 20 bytes of calldata when msg.sender == trustedForwarder,
  // which breaks direct calls from the owner if owner == forwarder.
  // Use a dedicated relayer address, or address(0) to disable meta-tx initially.
  const trustedForwarder = process.env.TRUSTED_FORWARDER || "0x0000000000000000000000000000000000000000";
  const BlindPay = await ethers.getContractFactory("BlindPay");
  const blindpay = await BlindPay.deploy(usdcAddress, trustedForwarder);
  await blindpay.waitForDeployment();
  const blindpayAddress = await blindpay.getAddress();
  console.log("BlindPay deployed to:", blindpayAddress);
  console.log("Trusted forwarder:", trustedForwarder);

  // Set DAI and USDT token contracts on BlindPay
  const setDaiTx = await blindpay.setTokenContract(2, daiAddress);
  await setDaiTx.wait();
  console.log("Set DAI (tokenType=2) on BlindPay");

  const setUsdtTx = await blindpay.setTokenContract(3, usdtAddress);
  await setUsdtTx.wait();
  console.log("Set USDT (tokenType=3) on BlindPay");

  // Mint test tokens to deployer
  const mintUsdc = await usdc.mint(deployer.address, 1_000_000_000_000n); // 1M USDC (6 decimals)
  await mintUsdc.wait();
  console.log("Minted 1M USDC to deployer");

  const mintDai = await dai.mint(deployer.address, ethers.parseEther("1000000")); // 1M DAI (18 decimals)
  await mintDai.wait();
  console.log("Minted 1M DAI to deployer");

  const mintUsdt = await usdt.mint(deployer.address, 1_000_000_000_000n); // 1M USDT (6 decimals)
  await mintUsdt.wait();
  console.log("Minted 1M USDT to deployer");

  console.log("\n--- Copy to frontend/.env ---");
  console.log(`VITE_CONTRACT_ADDRESS=${blindpayAddress}`);
  console.log(`VITE_USDC_ADDRESS=${usdcAddress}`);
  console.log(`VITE_DAI_ADDRESS=${daiAddress}`);
  console.log(`VITE_USDT_ADDRESS=${usdtAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
