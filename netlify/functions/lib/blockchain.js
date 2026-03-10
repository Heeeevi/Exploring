/**
 * ChainFund — Blockchain (SHA-256 Hash Chain) layer using Supabase
 */
const crypto = require('crypto');
const { supabase } = require('./supabase.js');

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

class BlockchainLayer {
    hashTransaction(txData, prevHash) {
        const payload = JSON.stringify({
            ...txData,
            prevHash,
            timestamp: new Date().toISOString()
        });
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    async getLastHash() {
        const { data } = await supabase
            .from('ledger_entries')
            .select('hash')
            .order('id', { ascending: false })
            .limit(1)
            .single();
        return data ? data.hash : GENESIS_HASH;
    }

    async recordToLedger(transaction) {
        const prevHash = await this.getLastHash();

        const dataSnapshot = {
            txId: transaction.id,
            type: transaction.type,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.description,
            category: transaction.category,
            donorId: transaction.donor_id,
            programId: transaction.program_id,
            createdBy: transaction.created_by,
            referenceNumber: transaction.reference_number,
            createdAt: transaction.created_at
        };

        const snapshotStr = JSON.stringify(dataSnapshot);
        const hash = this.hashTransaction(dataSnapshot, prevHash);

        await supabase.from('ledger_entries').insert({
            tx_id: transaction.id,
            hash,
            prev_hash: prevHash,
            data_snapshot: snapshotStr,
            timestamp: new Date().toISOString()
        });

        return { hash, prevHash };
    }

    async verifyChain() {
        const { data: entries } = await supabase
            .from('ledger_entries')
            .select('*')
            .order('id', { ascending: true });

        if (!entries || entries.length === 0) {
            return { valid: true, totalEntries: 0, message: 'Empty chain' };
        }

        let expectedPrevHash = GENESIS_HASH;
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].prev_hash !== expectedPrevHash) {
                return {
                    valid: false,
                    totalEntries: entries.length,
                    brokenAt: i + 1,
                    message: `Chain broken at entry ${i + 1}: prev_hash mismatch`
                };
            }
            expectedPrevHash = entries[i].hash;
        }

        return {
            valid: true,
            totalEntries: entries.length,
            firstHash: entries[0].hash,
            lastHash: entries[entries.length - 1].hash,
            message: `Chain intact: ${entries.length} entries verified`
        };
    }

    async verifyTransaction(txId) {
        const { data: entry } = await supabase
            .from('ledger_entries')
            .select('*')
            .eq('tx_id', txId)
            .single();

        if (!entry) {
            return { found: false, message: 'Transaction not found in ledger' };
        }

        const { data: prevEntry } = await supabase
            .from('ledger_entries')
            .select('*')
            .eq('hash', entry.prev_hash)
            .single();

        const { data: nextEntry } = await supabase
            .from('ledger_entries')
            .select('*')
            .eq('prev_hash', entry.hash)
            .single();

        return {
            found: true,
            hash: entry.hash,
            prevHash: entry.prev_hash,
            timestamp: entry.timestamp,
            dataSnapshot: JSON.parse(entry.data_snapshot),
            chainContext: {
                hasPrevious: !!prevEntry || entry.prev_hash === GENESIS_HASH,
                hasNext: !!nextEntry,
                isGenesisLinked: entry.prev_hash === GENESIS_HASH
            }
        };
    }

    async getChainStats() {
        const { count: totalEntries } = await supabase
            .from('ledger_entries')
            .select('*', { count: 'exact', head: true });

        const { data: lastEntry } = await supabase
            .from('ledger_entries')
            .select('*')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        const { data: firstEntry } = await supabase
            .from('ledger_entries')
            .select('*')
            .order('id', { ascending: true })
            .limit(1)
            .single();

        const { data: txData } = await supabase.rpc('get_transaction_totals');
        const totalIncome = txData?.[0]?.total_income || 0;
        const totalExpense = txData?.[0]?.total_expense || 0;

        return {
            totalEntries: totalEntries || 0,
            lastHash: lastEntry ? lastEntry.hash : null,
            firstHash: firstEntry ? firstEntry.hash : null,
            lastTimestamp: lastEntry ? lastEntry.timestamp : null,
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense
        };
    }

    async getPublicLedger(page = 1, limit = 20, search = '') {
        const offset = (page - 1) * limit;

        let query = supabase
            .from('ledger_entries_view')
            .select('*', { count: 'exact' })
            .order('id', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(`description.ilike.%${search}%,hash.ilike.%${search}%,category.ilike.%${search}%`);
        }

        const { data: entries, count: total } = await query;

        return {
            entries: entries || [],
            pagination: {
                page,
                limit,
                total: total || 0,
                totalPages: Math.ceil((total || 0) / limit)
            }
        };
    }
}

module.exports = new BlockchainLayer();
