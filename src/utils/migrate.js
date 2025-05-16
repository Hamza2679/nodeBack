// migratePasswords.js
const bcrypt = require('bcryptjs');
const { Pool } = require('pg'); 
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_s9V7lcznhdkj@ep-old-bread-a59ot1q4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require', // Your database URL
  ssl: false // 👈 Explicitly disable SSL
});

async function migratePasswords() {
 const client = await pool.connect();
  try {
    console.log('Starting password migration...');
    
    // Fetch all users with plaintext passwords
    const users = await client.query('SELECT id, password FROM users');
    console.log(`Found ${users.rows.length} users to migrate.`);

    for (const user of users.rows) {
      // Skip already hashed passwords (bcrypt hashes start with "$2a$")
      if (user.password.startsWith('$2a$')) {
        console.log(`Skipping user ${user.id} (already hashed)`);
        continue;
      }

      // Hash the plaintext password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);

      // Update the user record
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
      console.log(`Migrated user ${user.id}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    process.exit(); // Exit the script
  }
}

migratePasswords();
