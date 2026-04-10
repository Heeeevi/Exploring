/**
 * FundNProof — Solana Anchor Service (Netlify Functions version)
 * 
 * Adapted for serverless: uses SOLANA_KEYPAIR env var (JSON array) instead of file.
 */
const {
    Connection,
    Keypair,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
    PublicKey,
    LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const crypto = require('crypto');

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const SOLANA_RPC = {
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com',
    mainnet: 'https://api.mainnet-beta.solana.com',
}[SOLANA_NETWORK];

class SolanaAnchor {
    constructor() {
        this.connection = new Connection(SOLANA_RPC, 'confirmed');
        this.keypair = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Load keypair from environment variable (JSON array of secret key bytes)
            const keypairJson = process.env.SOLANA_KEYPAIR;
            if (keypairJson) {
                const secretKey = JSON.parse(keypairJson);
                this.keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
                console.log(`🔑 Solana wallet loaded: ${this.keypair.publicKey.toBase58()}`);
            } else {
                console.warn('⚠️  SOLANA_KEYPAIR env var not set. Solana anchoring disabled.');
            }

            this.initialized = true;
        } catch (err) {
            console.error('❌ Solana init error:', err.message);
            this.initialized = false;
        }
    }

    computeMerkleRoot(hashes) {
        if (hashes.length === 0) return null;
        if (hashes.length === 1) return hashes[0];

        let level = hashes.map(h => h);
        while (level.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < level.length; i += 2) {
                const left = level[i];
                const right = i + 1 < level.length ? level[i + 1] : left;
                const combined = crypto.createHash('sha256').update(left + right).digest('hex');
                nextLevel.push(combined);
            }
            level = nextLevel;
        }
        return level[0];
    }

    async anchorToSolana(merkleRoot, entryCount, blockStart, blockEnd) {
        await this.init();
        if (!this.keypair) throw new Error('Solana keypair not initialized. Set SOLANA_KEYPAIR env var.');

        const memoData = JSON.stringify({
            app: 'FundNProof',
            v: '1.0',
            merkle_root: merkleRoot,
            entries: entryCount,
            range: `${blockStart}-${blockEnd}`,
            ts: new Date().toISOString(),
        });

        const instruction = new TransactionInstruction({
            keys: [{ pubkey: this.keypair.publicKey, isSigner: true, isWritable: true }],
            programId: MEMO_PROGRAM_ID,
            data: Buffer.from(memoData, 'utf-8'),
        });

        const transaction = new Transaction().add(instruction);

        try {
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.keypair],
                { commitment: 'confirmed' }
            );

            return {
                success: true,
                signature,
                network: SOLANA_NETWORK,
                explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_NETWORK}`,
                merkleRoot,
                entryCount,
                blockRange: `${blockStart}-${blockEnd}`,
                timestamp: new Date().toISOString(),
                wallet: this.keypair.publicKey.toBase58(),
            };
        } catch (err) {
            return { success: false, error: err.message, merkleRoot, entryCount };
        }
    }

    async verifyAnchor(signature) {
        try {
            const tx = await this.connection.getTransaction(signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0,
            });

            if (!tx) return { verified: false, message: 'Transaction not found on Solana' };

            const logs = tx.meta?.logMessages || [];
            const memoLog = logs.find(l => l.includes('FundNProof') || l.includes('TransparentERP'));

            let memoData = null;
            if (memoLog) {
                try {
                    const jsonStr = memoLog.match(/\{.*\}/)?.[0];
                    if (jsonStr) memoData = JSON.parse(jsonStr);
                } catch (e) { /* parsing failed */ }
            }

            return {
                verified: true,
                signature,
                network: SOLANA_NETWORK,
                blockTime: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
                slot: tx.slot,
                fee: tx.meta?.fee,
                memoData,
                explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_NETWORK}`,
            };
        } catch (err) {
            return { verified: false, error: err.message };
        }
    }

    async getWalletInfo() {
        await this.init();
        if (!this.keypair) return null;

        const balance = await this.connection.getBalance(this.keypair.publicKey);
        return {
            publicKey: this.keypair.publicKey.toBase58(),
            balance: balance / LAMPORTS_PER_SOL,
            network: SOLANA_NETWORK,
            rpc: SOLANA_RPC,
        };
    }
}

module.exports = new SolanaAnchor();
