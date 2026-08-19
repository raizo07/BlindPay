const { ethers } = require('ethers');

class Relayer {
    constructor() {
        const rpcUrl = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        if (process.env.RELAYER_PRIVATE_KEY) {
            this.wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, this.provider);
        }
    }

    isConfigured() {
        return !!this.wallet;
    }

    async getBalance() {
        if (!this.wallet) return '0';
        const balance = await this.provider.getBalance(this.wallet.address);
        return ethers.formatEther(balance);
    }

    async relayTransaction(to, data, value = '0') {
        if (!this.wallet) throw new Error('Relayer not configured');
        const tx = await this.wallet.sendTransaction({
            to,
            data,
            value: ethers.parseEther(value),
        });
        const receipt = await tx.wait();
        return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
    }
}

module.exports = new Relayer();
