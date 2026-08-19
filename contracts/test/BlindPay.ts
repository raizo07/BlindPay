import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "ethers";
import * as hre from "hardhat";

async function deployFixture() {
    const [owner, alice, bob] = await hre.ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.connect(owner).deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();

    // Deploy BlindPay
    const BlindPay = await hre.ethers.getContractFactory("BlindPay");
    const blindpay = await BlindPay.connect(owner).deploy(usdcAddress);
    await blindpay.waitForDeployment();
    const blindpayAddress = await blindpay.getAddress();

    // Mint USDC to alice and bob for testing
    await (await usdc.mint(alice.address, 1_000_000_000n)).wait(); // 1000 USDC
    await (await usdc.mint(bob.address, 1_000_000_000n)).wait();

    return { blindpay, usdc, owner, alice, bob, blindpayAddress, usdcAddress };
}

// Helper: encrypt a uint64 amount
async function encryptAmount(contractAddress: string, signer: HardhatEthersSigner, amount: bigint) {
    const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
    input.add64(amount);
    const encrypted = await input.encrypt();
    return { handle: encrypted.handles[0], proof: encrypted.inputProof };
}

// Helper: encrypt an address
async function encryptAddr(contractAddress: string, signer: HardhatEthersSigner, addr: string) {
    const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
    input.addAddress(addr);
    const encrypted = await input.encrypt();
    return { handle: encrypted.handles[0], proof: encrypted.inputProof };
}

// Helper: compute claimHash = keccak256(abi.encodePacked(merchant, salt, claimSecret))
function computeClaimHash(merchant: string, salt: string, claimSecret: string): string {
    return hre.ethers.solidityPackedKeccak256(
        ["address", "bytes32", "bytes32"],
        [merchant, salt, claimSecret]
    );
}

// Helper: generate random bytes32
function randomBytes32(): string {
    return hre.ethers.hexlify(hre.ethers.randomBytes(32));
}

describe("BlindPay V2", function () {
    let blindpay: any;
    let usdc: any;
    let owner: HardhatEthersSigner;
    let alice: HardhatEthersSigner; // merchant
    let bob: HardhatEthersSigner;   // payer
    let blindpayAddress: string;
    let usdcAddress: string;

    before(async function () {
        const fixture = await deployFixture();
        blindpay = fixture.blindpay;
        usdc = fixture.usdc;
        owner = fixture.owner;
        alice = fixture.alice;
        bob = fixture.bob;
        blindpayAddress = fixture.blindpayAddress;
        usdcAddress = fixture.usdcAddress;

        await hre.fhevm.assertCoprocessorInitialized(blindpay, "BlindPay");
    });

    // =========================================================================
    //  INVOICE CREATION
    // =========================================================================
    describe("createInvoice", function () {
        it("should create an ETH invoice with encrypted amount and merchant", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 1_000_000n; // 1 ETH in 6-decimal

            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);

            const tx = await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash,
                0, // standard
                0  // ETH
            );
            const receipt = await tx.wait();

            // Check event emitted
            const event = receipt.logs.find((l: any) => {
                try {
                    return blindpay.interface.parseLog(l)?.name === "InvoiceCreated";
                } catch { return false; }
            });
            expect(event).to.not.be.undefined;

            // Check on-chain state
            const inv = await blindpay.getInvoice(salt);
            expect(inv.tokenType).to.equal(0);
            expect(inv.invoiceType).to.equal(0);
            expect(inv.paymentCount).to.equal(0n);
            expect(inv.hasBeenCreated).to.equal(true);

            // Check invoice count incremented
            expect(await blindpay.invoiceCount(alice.address)).to.equal(1n);
        });

        it("should create a USDC multipay invoice", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 50_000_000n; // 50 USDC

            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);

            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash,
                1, // multipay
                1  // USDC
            )).wait();

            const inv = await blindpay.getInvoice(salt);
            expect(inv.tokenType).to.equal(1);
            expect(inv.invoiceType).to.equal(1);
            expect(inv.hasBeenCreated).to.equal(true);
        });

        it("should create a donation invoice", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);

            const encAmt = await encryptAmount(blindpayAddress, alice, 0n);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);

            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash,
                2, // donation
                0  // ETH
            )).wait();

            const inv = await blindpay.getInvoice(salt);
            expect(inv.invoiceType).to.equal(2);
            expect(inv.hasBeenCreated).to.equal(true);
        });

        it("should reject duplicate salt", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);

            const encAmt = await encryptAmount(blindpayAddress, alice, 1_000_000n);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);

            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            // Try to create again with same salt
            const encAmt2 = await encryptAmount(blindpayAddress, alice, 1_000_000n);
            const encMerch2 = await encryptAddr(blindpayAddress, alice, alice.address);

            await expect(
                blindpay.connect(alice).createInvoice(
                    encAmt2.handle, encAmt2.proof,
                    encMerch2.handle, encMerch2.proof,
                    salt, claimHash, 0, 0
                )
            ).to.be.revertedWith("Salt already used");
        });

        it("should reject invalid token type", async function () {
            const salt = randomBytes32();
            const claimHash = randomBytes32();

            const encAmt = await encryptAmount(blindpayAddress, alice, 1_000_000n);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);

            await expect(
                blindpay.connect(alice).createInvoice(
                    encAmt.handle, encAmt.proof,
                    encMerch.handle, encMerch.proof,
                    salt, claimHash, 0, 2 // invalid tokenType
                )
            ).to.be.revertedWith("Invalid token type");
        });

        it("should reject invalid invoice type", async function () {
            const salt = randomBytes32();
            const claimHash = randomBytes32();

            const encAmt = await encryptAmount(blindpayAddress, alice, 1_000_000n);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);

            await expect(
                blindpay.connect(alice).createInvoice(
                    encAmt.handle, encAmt.proof,
                    encMerch.handle, encMerch.proof,
                    salt, claimHash, 3, 0 // invalid invoiceType
                )
            ).to.be.revertedWith("Invalid invoice type");
        });
    });

    // =========================================================================
    //  PAYMENT (ETH)
    // =========================================================================
    describe("payInvoice (ETH)", function () {
        it("should accept ETH payment and hold funds in contract", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 1_000_000n; // 1 ETH in 6-dec

            // Create invoice
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            // Pay invoice (1 ETH in 6-dec = 1e18 wei)
            const ethValue = amount * 1_000_000_000_000n; // 6-dec to 18-dec
            const encPay = await encryptAmount(blindpayAddress, bob, amount);

            const contractBalBefore = await hre.ethers.provider.getBalance(blindpayAddress);

            const tx = await blindpay.connect(bob).payInvoice(
                salt,
                encPay.handle,
                encPay.proof,
                0n, // usdcAmount (ignored for ETH)
                { value: ethValue }
            );
            const receipt = await tx.wait();

            // Contract holds the ETH
            const contractBalAfter = await hre.ethers.provider.getBalance(blindpayAddress);
            expect(contractBalAfter - contractBalBefore).to.equal(ethValue);

            // PaymentMade event emitted
            const event = receipt.logs.find((l: any) => {
                try {
                    return blindpay.interface.parseLog(l)?.name === "PaymentMade";
                } catch { return false; }
            });
            expect(event).to.not.be.undefined;

            // Invoice shows paymentCount = 1
            const inv = await blindpay.getInvoice(salt);
            expect(inv.paymentCount).to.equal(1n);
        });

        it("should reject payment for non-existent invoice", async function () {
            const fakeSalt = randomBytes32();
            const encPay = await encryptAmount(blindpayAddress, bob, 1_000_000n);

            await expect(
                blindpay.connect(bob).payInvoice(
                    fakeSalt, encPay.handle, encPay.proof, 0n,
                    { value: 1_000_000_000_000_000_000n }
                )
            ).to.be.revertedWith("Invoice not found");
        });

        it("should reject double payment for standard invoice", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 500_000n;

            // Create
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            // First payment
            const ethValue = amount * 1_000_000_000_000n;
            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, 0n,
                { value: ethValue }
            )).wait();

            // Second payment should fail
            const encPay2 = await encryptAmount(blindpayAddress, bob, amount);
            await expect(
                blindpay.connect(bob).payInvoice(
                    salt, encPay2.handle, encPay2.proof, 0n,
                    { value: ethValue }
                )
            ).to.be.revertedWith("Invoice already paid");
        });

        it("should allow multiple payments for multipay invoice", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 100_000n;

            // Create multipay invoice
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 1, 0 // multipay, ETH
            )).wait();

            const ethValue = amount * 1_000_000_000_000n;

            // First payment
            const encPay1 = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay1.handle, encPay1.proof, 0n,
                { value: ethValue }
            )).wait();

            // Second payment
            const encPay2 = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay2.handle, encPay2.proof, 0n,
                { value: ethValue }
            )).wait();

            const inv = await blindpay.getInvoice(salt);
            expect(inv.paymentCount).to.equal(2n);
        });

        it("should reject ETH payment with zero value", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);

            const encAmt = await encryptAmount(blindpayAddress, alice, 1_000_000n);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            const encPay = await encryptAmount(blindpayAddress, bob, 1_000_000n);
            await expect(
                blindpay.connect(bob).payInvoice(
                    salt, encPay.handle, encPay.proof, 0n,
                    { value: 0n }
                )
            ).to.be.revertedWith("Must send ETH");
        });
    });

    // =========================================================================
    //  PAYMENT (USDC)
    // =========================================================================
    describe("payInvoice (USDC)", function () {
        it("should accept USDC payment and hold tokens in contract", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 100_000_000n; // 100 USDC

            // Create USDC invoice
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 1 // standard, USDC
            )).wait();

            // Approve contract to spend USDC
            await (await usdc.connect(bob).approve(blindpayAddress, amount)).wait();

            const contractBalBefore = await usdc.balanceOf(blindpayAddress);

            // Pay with USDC
            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, amount,
                { value: 0n }
            )).wait();

            // Contract holds the USDC
            const contractBalAfter = await usdc.balanceOf(blindpayAddress);
            expect(contractBalAfter - contractBalBefore).to.equal(amount);

            const inv = await blindpay.getInvoice(salt);
            expect(inv.paymentCount).to.equal(1n);
        });

        it("should reject USDC payment with ETH attached", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);

            const encAmt = await encryptAmount(blindpayAddress, alice, 1_000_000n);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 1
            )).wait();

            const encPay = await encryptAmount(blindpayAddress, bob, 1_000_000n);
            await expect(
                blindpay.connect(bob).payInvoice(
                    salt, encPay.handle, encPay.proof, 1_000_000n,
                    { value: 1_000_000_000_000_000_000n }
                )
            ).to.be.revertedWith("Do not send ETH for USDC payment");
        });

        it("should reject USDC payment with zero usdcAmount", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);

            const encAmt = await encryptAmount(blindpayAddress, alice, 1_000_000n);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 1
            )).wait();

            const encPay = await encryptAmount(blindpayAddress, bob, 1_000_000n);
            await expect(
                blindpay.connect(bob).payInvoice(
                    salt, encPay.handle, encPay.proof, 0n
                )
            ).to.be.revertedWith("USDC amount must be > 0");
        });
    });

    // =========================================================================
    //  CLAIM FUNDS
    // =========================================================================
    describe("claimFunds", function () {
        it("should let merchant claim ETH funds with correct secret", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 2_000_000n; // 2 ETH in 6-dec
            const ethValue = amount * 1_000_000_000_000n;

            // Create & pay
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, 0n,
                { value: ethValue }
            )).wait();

            // Claim funds
            const aliceBalBefore = await hre.ethers.provider.getBalance(alice.address);

            const tx = await blindpay.connect(alice).claimFunds(salt, claimSecret);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const aliceBalAfter = await hre.ethers.provider.getBalance(alice.address);
            expect(aliceBalAfter - aliceBalBefore + BigInt(gasUsed)).to.equal(ethValue);

            // FundsClaimed event
            const event = receipt.logs.find((l: any) => {
                try {
                    return blindpay.interface.parseLog(l)?.name === "FundsClaimed";
                } catch { return false; }
            });
            expect(event).to.not.be.undefined;
        });

        it("should let merchant claim USDC funds", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 50_000_000n; // 50 USDC

            // Create USDC invoice & pay
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 1
            )).wait();

            await (await usdc.connect(bob).approve(blindpayAddress, amount)).wait();
            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, amount
            )).wait();

            // Claim USDC
            const aliceUsdcBefore = await usdc.balanceOf(alice.address);
            await (await blindpay.connect(alice).claimFunds(salt, claimSecret)).wait();
            const aliceUsdcAfter = await usdc.balanceOf(alice.address);
            expect(aliceUsdcAfter - aliceUsdcBefore).to.equal(amount);
        });

        it("should reject claim with wrong secret", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const wrongSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 1_000_000n;
            const ethValue = amount * 1_000_000_000_000n;

            // Create & pay
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, 0n,
                { value: ethValue }
            )).wait();

            // Claim with wrong secret
            await expect(
                blindpay.connect(alice).claimFunds(salt, wrongSecret)
            ).to.be.revertedWith("Invalid claim");
        });

        it("should reject claim by wrong address", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 1_000_000n;
            const ethValue = amount * 1_000_000_000_000n;

            // Create & pay
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, 0n,
                { value: ethValue }
            )).wait();

            // Bob tries to claim (not the merchant)
            await expect(
                blindpay.connect(bob).claimFunds(salt, claimSecret)
            ).to.be.revertedWith("Invalid claim");
        });

        it("should reject claim when no payments made", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);

            // Create but don't pay
            const encAmt = await encryptAmount(blindpayAddress, alice, 1_000_000n);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            await expect(
                blindpay.connect(alice).claimFunds(salt, claimSecret)
            ).to.be.revertedWith("No payments to claim");
        });

        it("should reject double claim (no funds left)", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 1_000_000n;
            const ethValue = amount * 1_000_000_000_000n;

            // Create, pay, claim
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, 0n,
                { value: ethValue }
            )).wait();

            await (await blindpay.connect(alice).claimFunds(salt, claimSecret)).wait();

            // Second claim should fail
            await expect(
                blindpay.connect(alice).claimFunds(salt, claimSecret)
            ).to.be.revertedWith("No funds to claim");
        });
    });

    // =========================================================================
    //  RECEIPTS & VIEW FUNCTIONS
    // =========================================================================
    describe("receipts and view functions", function () {
        it("should generate valid receipt hash on payment", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 1_000_000n;
            const ethValue = amount * 1_000_000_000_000n;

            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            const tx = await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, 0n,
                { value: ethValue }
            );
            const receipt = await tx.wait();

            // Extract receiptHash from PaymentMade event
            const event = receipt.logs.find((l: any) => {
                try {
                    return blindpay.interface.parseLog(l)?.name === "PaymentMade";
                } catch { return false; }
            });
            const parsed = blindpay.interface.parseLog(event);
            const receiptHash = parsed.args.receiptHash;

            // Verify receipt exists
            expect(await blindpay.verifyReceipt(receiptHash)).to.equal(true);

            // Random hash doesn't exist
            expect(await blindpay.verifyReceipt(randomBytes32())).to.equal(false);
        });

        it("getInvoice should return false for non-existent invoice", async function () {
            const inv = await blindpay.getInvoice(randomBytes32());
            expect(inv.hasBeenCreated).to.equal(false);
            expect(inv.paymentCount).to.equal(0n);
        });
    });

    // =========================================================================
    //  PRIVACY CHECKS
    // =========================================================================
    describe("privacy guarantees", function () {
        it("events should NOT contain addresses or amounts", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 1_000_000n;
            const ethValue = amount * 1_000_000_000_000n;

            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            const createTx = await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            );
            const createReceipt = await createTx.wait();

            // InvoiceCreated should only have salt
            const createEvent = createReceipt.logs.find((l: any) => {
                try {
                    return blindpay.interface.parseLog(l)?.name === "InvoiceCreated";
                } catch { return false; }
            });
            const createParsed = blindpay.interface.parseLog(createEvent);
            expect(createParsed.args.length).to.equal(1); // only salt
            expect(createParsed.args.salt).to.equal(salt);

            // PaymentMade should only have salt + receiptHash
            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            const payTx = await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, 0n,
                { value: ethValue }
            );
            const payReceipt = await payTx.wait();

            const payEvent = payReceipt.logs.find((l: any) => {
                try {
                    return blindpay.interface.parseLog(l)?.name === "PaymentMade";
                } catch { return false; }
            });
            const payParsed = blindpay.interface.parseLog(payEvent);
            expect(payParsed.args.length).to.equal(2); // salt + receiptHash
        });

        it("getInvoice should NOT expose merchant address or amount", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);

            const encAmt = await encryptAmount(blindpayAddress, alice, 5_000_000n);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            // getInvoice returns only [tokenType, invoiceType, paymentCount, hasBeenCreated]
            const inv = await blindpay.getInvoice(salt);
            // Should be a tuple of 4 elements, none of which are addresses
            expect(inv.length).to.equal(4);
            expect(typeof inv.tokenType).to.equal("bigint");
            expect(typeof inv.invoiceType).to.equal("bigint");
            expect(typeof inv.paymentCount).to.equal("bigint");
            expect(typeof inv.hasBeenCreated).to.equal("boolean");
        });
    });

    // =========================================================================
    //  ADMIN
    // =========================================================================
    describe("admin functions", function () {
        it("should allow owner to update USDC address", async function () {
            const newUsdc = "0x0000000000000000000000000000000000000001";
            await (await blindpay.connect(owner).updateUsdcToken(newUsdc)).wait();
            expect(await blindpay.usdcToken()).to.equal(newUsdc);

            // Restore
            await (await blindpay.connect(owner).updateUsdcToken(usdcAddress)).wait();
        });

        it("should reject non-owner from updating USDC address", async function () {
            await expect(
                blindpay.connect(alice).updateUsdcToken(alice.address)
            ).to.be.revertedWithCustomError(blindpay, "OwnableUnauthorizedAccount");
        });

        it("should reject zero address for USDC update", async function () {
            await expect(
                blindpay.connect(owner).updateUsdcToken(hre.ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });
    });

    // =========================================================================
    //  FULL FLOW (E2E)
    // =========================================================================
    describe("full flow E2E", function () {
        it("ETH: create -> pay -> verify receipt -> claim", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 3_000_000n; // 3 ETH in 6-dec
            const ethValue = amount * 1_000_000_000_000n;

            // 1. Create invoice
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 0
            )).wait();

            let inv = await blindpay.getInvoice(salt);
            expect(inv.hasBeenCreated).to.equal(true);
            expect(inv.paymentCount).to.equal(0n);

            // 2. Pay invoice
            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            const payTx = await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, 0n,
                { value: ethValue }
            );
            const payReceipt = await payTx.wait();

            inv = await blindpay.getInvoice(salt);
            expect(inv.paymentCount).to.equal(1n);

            // 3. Verify receipt
            const payEvent = payReceipt.logs.find((l: any) => {
                try { return blindpay.interface.parseLog(l)?.name === "PaymentMade"; }
                catch { return false; }
            });
            const receiptHash = blindpay.interface.parseLog(payEvent).args.receiptHash;
            expect(await blindpay.verifyReceipt(receiptHash)).to.equal(true);

            // 4. Claim funds
            const aliceBefore = await hre.ethers.provider.getBalance(alice.address);
            const claimTx = await blindpay.connect(alice).claimFunds(salt, claimSecret);
            const claimReceipt = await claimTx.wait();
            const gas = claimReceipt.gasUsed * claimReceipt.gasPrice;
            const aliceAfter = await hre.ethers.provider.getBalance(alice.address);

            expect(aliceAfter - aliceBefore + BigInt(gas)).to.equal(ethValue);
        });

        it("USDC: create -> pay -> claim", async function () {
            const salt = randomBytes32();
            const claimSecret = randomBytes32();
            const claimHash = computeClaimHash(alice.address, salt, claimSecret);
            const amount = 25_000_000n; // 25 USDC

            // 1. Create
            const encAmt = await encryptAmount(blindpayAddress, alice, amount);
            const encMerch = await encryptAddr(blindpayAddress, alice, alice.address);
            await (await blindpay.connect(alice).createInvoice(
                encAmt.handle, encAmt.proof,
                encMerch.handle, encMerch.proof,
                salt, claimHash, 0, 1
            )).wait();

            // 2. Pay
            await (await usdc.connect(bob).approve(blindpayAddress, amount)).wait();
            const encPay = await encryptAmount(blindpayAddress, bob, amount);
            await (await blindpay.connect(bob).payInvoice(
                salt, encPay.handle, encPay.proof, amount
            )).wait();

            // 3. Claim
            const before = await usdc.balanceOf(alice.address);
            await (await blindpay.connect(alice).claimFunds(salt, claimSecret)).wait();
            const after = await usdc.balanceOf(alice.address);
            expect(after - before).to.equal(amount);
        });
    });

    // =========================================================================
    //  RECEIVE FUNCTION
    // =========================================================================
    describe("receive()", function () {
        it("should accept direct ETH transfers", async function () {
            const balBefore = await hre.ethers.provider.getBalance(blindpayAddress);
            await (await bob.sendTransaction({
                to: blindpayAddress,
                value: hre.ethers.parseEther("0.1")
            })).wait();
            const balAfter = await hre.ethers.provider.getBalance(blindpayAddress);
            expect(balAfter - balBefore).to.equal(hre.ethers.parseEther("0.1"));
        });
    });
});
