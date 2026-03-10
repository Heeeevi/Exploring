/**
 * Seed script - adds demo data for ChainFund
 * Run: node server/seed-demo.cjs
 */
const db = require('./db.cjs');
const blockchain = require('./blockchain.cjs');
const { v4: uuidv4 } = require('uuid');

// Get admin user ID
const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!admin) {
  console.error('No admin user found. Run server first to auto-create.');
  process.exit(1);
}

const ADMIN_ID = admin.id;

// Check if demo data already exists
const existingDonors = db.prepare('SELECT COUNT(*) as count FROM donors').get().count;
if (existingDonors > 0) {
  console.log('Demo data already exists. Skipping seed.');
  process.exit(0);
}

console.log('🌱 Seeding demo data...\n');

// === DONORS ===
const donors = [
  { name: 'Ford Foundation', email: 'grants@fordfound.org', organization: 'Ford Foundation', country: 'United States' },
  { name: 'USAID Indonesia', email: 'jakarta@usaid.gov', organization: 'USAID', country: 'United States' },
  { name: 'Yayasan Djarum', email: 'csr@djarum.com', organization: 'Djarum Foundation', country: 'Indonesia' },
  { name: 'Australian DFAT', email: 'indo@dfat.gov.au', organization: 'Dept. Foreign Affairs & Trade', country: 'Australia' },
  { name: 'Tanoto Foundation', email: 'program@tanoto.org', organization: 'Tanoto Foundation', country: 'Indonesia' },
  { name: 'Bill & Melinda Gates Foundation', email: 'info@gatesfoundation.org', organization: 'Gates Foundation', country: 'United States' },
  { name: 'JICA Indonesia', email: 'jica@jica.go.jp', organization: 'Japan International Cooperation Agency', country: 'Japan' },
];

const donorIds = [];
for (const d of donors) {
  const id = uuidv4();
  donorIds.push(id);
  db.prepare('INSERT INTO donors (id, name, email, organization, country) VALUES (?, ?, ?, ?, ?)')
    .run(id, d.name, d.email, d.organization, d.country);
}
console.log(`✅ ${donors.length} donors created`);

// === PROGRAMS ===
const programs = [
  { name: 'Clean Water Initiative', description: 'Providing clean water access to 50 villages in East Java through well drilling and filtration systems.', budget: 125000, start_date: '2025-06-01', end_date: '2026-06-01' },
  { name: 'Digital Literacy for Rural Schools', description: 'Equipping 30 rural schools in NTT with computers and training teachers in digital skills.', budget: 85000, start_date: '2025-09-01', end_date: '2026-09-01' },
  { name: 'Emergency Flood Relief - Kalimantan', description: 'Disaster response providing food, shelter, and medical aid to flood-affected communities.', budget: 50000, start_date: '2025-12-01', end_date: '2026-03-01' },
  { name: 'Women Microenterprise Fund', description: 'Microloan program for women entrepreneurs in underserved communities across Sulawesi.', budget: 200000, start_date: '2025-04-01', end_date: '2027-04-01' },
  { name: 'Mangrove Restoration Project', description: 'Restoring 500 hectares of mangrove forests along Java coastline for climate resilience.', budget: 95000, start_date: '2025-07-01', end_date: '2026-12-01' },
];

const programIds = [];
for (const p of programs) {
  const id = uuidv4();
  programIds.push(id);
  db.prepare('INSERT INTO programs (id, name, description, budget, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, p.name, p.description, p.budget, p.start_date, p.end_date);
}
console.log(`✅ ${programs.length} programs created`);

// === TRANSACTIONS ===
const transactions = [
  // Incomes (donations)
  { type: 'income', amount: 50000, description: 'Grant disbursement for Clean Water Initiative - Phase 1', category: 'Grant', donor_idx: 0, program_idx: 0 },
  { type: 'income', amount: 35000, description: 'USAID quarterly funding for Digital Literacy program', category: 'Grant', donor_idx: 1, program_idx: 1 },
  { type: 'income', amount: 25000, description: 'Emergency relief fund from Djarum Foundation', category: 'Emergency Fund', donor_idx: 2, program_idx: 2 },
  { type: 'income', amount: 75000, description: 'Women Microenterprise Fund - initial capital from Tanoto Foundation', category: 'Grant', donor_idx: 4, program_idx: 3 },
  { type: 'income', amount: 40000, description: 'DFAT grant for mangrove restoration project', category: 'Environmental Grant', donor_idx: 3, program_idx: 4 },
  { type: 'income', amount: 100000, description: 'Gates Foundation annual grant for water & sanitation programs', category: 'Grant', donor_idx: 5, program_idx: 0 },
  { type: 'income', amount: 30000, description: 'JICA technical assistance fund for digital literacy', category: 'Technical Aid', donor_idx: 6, program_idx: 1 },
  { type: 'income', amount: 15000, description: 'Corporate donation from Djarum CSR program', category: 'Corporate Donation', donor_idx: 2, program_idx: 4 },
  { type: 'income', amount: 50000, description: 'Second tranche - Women Microenterprise Fund', category: 'Grant', donor_idx: 4, program_idx: 3 },
  { type: 'income', amount: 20000, description: 'USAID supplemental funding for flood relief', category: 'Emergency Fund', donor_idx: 1, program_idx: 2 },

  // Expenses
  { type: 'expense', amount: 28000, description: 'Drilling equipment procurement - 10 water wells', category: 'Equipment', donor_idx: null, program_idx: 0 },
  { type: 'expense', amount: 12000, description: 'Teacher training workshops (3 batches, 90 teachers)', category: 'Training', donor_idx: null, program_idx: 1 },
  { type: 'expense', amount: 18000, description: 'Emergency food packages (2,000 families)', category: 'Relief Supplies', donor_idx: null, program_idx: 2 },
  { type: 'expense', amount: 8500, description: 'Laptop procurement - 30 units for rural schools', category: 'Equipment', donor_idx: null, program_idx: 1 },
  { type: 'expense', amount: 45000, description: 'Microloan disbursement - first batch (50 women)', category: 'Loan Disbursement', donor_idx: null, program_idx: 3 },
  { type: 'expense', amount: 15000, description: 'Mangrove seedlings + planting labor (200 hectares)', category: 'Materials & Labor', donor_idx: null, program_idx: 4 },
  { type: 'expense', amount: 5000, description: 'Water quality testing lab fees', category: 'Lab & Testing', donor_idx: null, program_idx: 0 },
  { type: 'expense', amount: 22000, description: 'Temporary shelters construction (150 units)', category: 'Construction', donor_idx: null, program_idx: 2 },
  { type: 'expense', amount: 7500, description: 'Program monitoring & evaluation consultant', category: 'Consulting', donor_idx: null, program_idx: 3 },
  { type: 'expense', amount: 9800, description: 'Solar-powered water filtration systems (5 units)', category: 'Equipment', donor_idx: null, program_idx: 0 },
  { type: 'expense', amount: 3500, description: 'Internet connectivity setup for 15 schools', category: 'Infrastructure', donor_idx: null, program_idx: 1 },
  { type: 'expense', amount: 6000, description: 'Community nursery construction for mangrove seedlings', category: 'Construction', donor_idx: null, program_idx: 4 },
  { type: 'expense', amount: 25000, description: 'Microloan disbursement - second batch (40 women)', category: 'Loan Disbursement', donor_idx: null, program_idx: 3 },
  { type: 'expense', amount: 4200, description: 'Medical supplies for flood-affected areas', category: 'Medical', donor_idx: null, program_idx: 2 },
  { type: 'expense', amount: 11000, description: 'Well drilling team wages (Phase 1 completion)', category: 'Labor', donor_idx: null, program_idx: 0 },
];

// Use a transaction for faster insertion
const insertMany = db.transaction(() => {
  // Create dates spread over last 90 days
  const now = Date.now();

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const id = uuidv4();
    const daysAgo = Math.floor((transactions.length - i) * (90 / transactions.length));
    const createdAt = new Date(now - daysAgo * 86400000).toISOString();
    const donorId = tx.donor_idx !== null ? donorIds[tx.donor_idx] : null;
    const programId = tx.program_idx !== null ? programIds[tx.program_idx] : null;

    db.prepare(`
      INSERT INTO transactions (id, type, amount, currency, description, category, donor_id, program_id, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, tx.type, tx.amount, 'USD', tx.description, tx.category, donorId, programId, ADMIN_ID, createdAt);

    // Update program spent/donor total
    if (tx.type === 'expense' && programId) {
      db.prepare('UPDATE programs SET spent = spent + ?, updated_at = datetime(\'now\') WHERE id = ?').run(tx.amount, programId);
    }
    if (tx.type === 'income' && donorId) {
      db.prepare('UPDATE donors SET total_donated = total_donated + ?, updated_at = datetime(\'now\') WHERE id = ?').run(tx.amount, donorId);
    }

    // Record to blockchain ledger
    const txRecord = {
      id, type: tx.type, amount: tx.amount, currency: 'USD',
      description: tx.description, category: tx.category,
      donor_id: donorId, program_id: programId,
      created_by: ADMIN_ID, reference_number: null,
      created_at: createdAt
    };
    blockchain.recordToLedger(txRecord);
  }
});

insertMany();

console.log(`✅ ${transactions.length} transactions created (with blockchain hashes)`);

// Print summary
const stats = db.prepare(`
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
    COUNT(*) as totalTransactions
  FROM transactions
`).get();

const chainStats = blockchain.getChainStats();

console.log(`\n📊 Summary:`);
console.log(`   Total Income:  $${stats.totalIncome.toLocaleString()}`);
console.log(`   Total Expense: $${stats.totalExpense.toLocaleString()}`);
console.log(`   Net Balance:   $${(stats.totalIncome - stats.totalExpense).toLocaleString()}`);
console.log(`   Transactions:  ${stats.totalTransactions}`);
console.log(`   Chain Entries:  ${chainStats.totalEntries}`);
console.log(`   Chain Valid:    ✅`);
console.log(`\n🎉 Demo data seeded successfully!\n`);
