/**
 * ChainFund — Solana Anchor Service
 * 
 * Anchors batches of transaction hashes (Merkle Root) to Solana blockchain.
 * This provides an immutable, publicly verifiable proof on a global blockchain
 * that the local hash-chain data has not been tampered with.
 * 
 * Architecture:
 * - Local DB has ledger_entries with hash chain
 * - Periodically, we compute a Merkle Root of recent entries
 * - We send that Merkle Root as a "memo" transaction to Solana devnet/testnet
 * - The Solana tx signature becomes proof that the data existed at that time
 * - Anyone can verify: local Merkle Root matches what's on Solana
 * 
 * Network: Solana Devnet (free, no real SOL needed)
 * Cost: ~0.000005 SOL per anchor (~$0.001) — effectively free on devnet
 */

const {
    Connection,
    Keypair,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
    PublicKey,
    SystemProgram,
    LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Solana Memo Program ID (official)
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// Config
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const SOLANA_RPC = {
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com',
    mainnet: 'https://api.mainnet-beta.solana.com',
}[SOLANA_NETWORK];

const KEYPAIR_PATH = path.join(__dirname, 'keypair.json');

class SolanaAnchor {
    constructor() {
        this.connection = new Connection(SOLANA_RPC, 'confirmed');
        this.keypair = null;
        this.initialized = false;
    }

    /**
     * Initialize the Solana keypair
     * Auto-generates a new keypair if one doesn't exist
     */
    async init() {
        if (this.initialized) return;

        try {
            if (fs.existsSync(KEYPAIR_PATH)) {
                const secretKey = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8'));
                this.keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
                console.log(`🔑 Solana wallet loaded: ${this.keypair.publicKey.toBase58()}`);
            } else {
                this.keypair = Keypair.generate();
                fs.writeFileSync(KEYPAIR_PATH, JSON.stringify(Array.from(this.keypair.secretKey)));
                console.log(`🔑 New Solana wallet generated: ${this.keypair.publicKey.toBase58()}`);
                console.log(`   Fund it with: solana airdrop 2 ${this.keypair.publicKey.toBase58()} --url devnet`);
            }

            // Check balance
            const balance = await this.connection.getBalance(this.keypair.publicKey);
            console.log(`💰 Solana balance: ${balance / LAMPORTS_PER_SOL} SOL (${SOLANA_NETWORK})`);

            if (balance === 0 && SOLANA_NETWORK === 'devnet') {
                console.log('📡 Requesting airdrop on devnet...');
                try {
                    const sig = await this.connection.requestAirdrop(this.keypair.publicKey, 2 * LAMPORTS_PER_SOL);
                    await this.connection.confirmTransaction(sig);
                    const newBalance = await this.connection.getBalance(this.keypair.publicKey);
                    console.log(`✅ Airdrop received! New balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
                } catch (e) {
                    console.warn('⚠️  Airdrop failed (rate limited?). Fund manually or try again later.');
                }
            }

            this.initialized = true;
        } catch (err) {
            console.error('❌ Solana init error:', err.message);
            this.initialized = false;
        }
    }

    /**
     * Compute Merkle Root from an array of hashes
     */
    computeMerkleRoot(hashes) {
        if (hashes.length === 0) return null;
        if (hashes.length === 1) return hashes[0];

        let level = hashes.map(h => h);

        while (level.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < level.length; i += 2) {
                const left = level[i];
                const right = i + 1 < level.length ? level[i + 1] : left; // duplicate if odd
                const combined = crypto.createHash('sha256')
                    .update(left + right)
                    .digest('hex');
                nextLevel.push(combined);
            }
            level = nextLevel;
        }

        return level[0];
    }

    /**
     * Anchor a Merkle Root to Solana as a Memo transaction
     * 
     * The memo contains a JSON string:
     * {
     *   "app": "ChainFund",
     *   "version": "1.0",
     *   "merkle_root": "abc123...",
     *   "entries": 25,
     *   "range": "1-25",
     *   "timestamp": "2026-03-09T..."
     * }
     */
    async anchorToSolana(merkleRoot, entryCount, blockStart, blockEnd) {
        await this.init();

        if (!this.keypair) {
            throw new Error('Solana keypair not initialized');
        }

        const memoData = JSON.stringify({
            app: 'ChainFund',
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

            console.log(`⚓ Anchored to Solana! TX: ${signature}`);
            console.log(`   Explorer: https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_NETWORK}`);

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
            console.error('❌ Solana anchor failed:', err.message);
            return {
                success: false,
                error: err.message,
                merkleRoot,
                entryCount,
            };
        }
    }

    /**
     * Verify a Solana anchor transaction
     */
    async verifyAnchor(signature) {
        try {
            const tx = await this.connection.getTransaction(signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0,
            });

            if (!tx) {
                return { verified: false, message: 'Transaction not found on Solana' };
            }

            // Extract memo data from log messages (check both names for backward compat)
            const logs = tx.meta?.logMessages || [];
            const memoLog = logs.find(l => l.includes('ChainFund') || l.includes('TransparentERP'));
            
            let memoData = null;
            if (memoLog) {
                try {
                    const jsonStr = memoLog.match(/\{.*\}/)?.[0];
                    if (jsonStr) memoData = JSON.parse(jsonStr);
                } catch (e) {
                    // memo parsing failed, still valid tx
                }
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

    /**
     * Get wallet info
     */
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
