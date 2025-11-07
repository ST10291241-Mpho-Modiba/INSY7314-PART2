/**
 * Seed Employee Accounts Script
 * Creates pre-configured employee accounts for the employee portal
 */

import mongoose from 'mongoose';
import User from '../Models/user.js';
import dotenv from 'dotenv';
import connectDB from '../db/conn.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: './.env' });

const seedEmployees = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // Wait for connection
    if (mongoose.connection.readyState !== 1) {
      console.log('Waiting for database connection...');
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
        setTimeout(() => {
          if (mongoose.connection.readyState !== 1) {
            console.error('Database connection timeout');
            process.exit(1);
          }
        }, 10000);
      });
    }

    console.log('Database connected. Seeding employee accounts...');

    const employees = [
      {
        username: 'employee1',
        email: 'employee1@bank.com',
        password: 'SecurePass123!',
        role: 'employee'
      },
      {
        username: 'employee2',
        email: 'employee2@bank.com',
        password: 'SecurePass123!',
        role: 'employee'
      },
      {
        username: 'admin',
        email: 'admin@bank.com',
        password: 'AdminPass123!',
        role: 'employee'
      }
    ];

    let created = 0;
    let existing = 0;

    for (const emp of employees) {
      try {
        const existing = await User.findOne({ 
          $or: [{ email: emp.email }, { username: emp.username }] 
        });
        
        if (existing) {
          // Update role if user exists but doesn't have employee role
          if (existing.role !== 'employee') {
            existing.role = 'employee';
            await existing.save();
            console.log(`✓ Updated existing user to employee: ${emp.email}`);
            existing++;
          } else {
            console.log(`- Employee already exists: ${emp.email}`);
            existing++;
          }
        } else {
          // Create new employee
          const user = new User(emp);
          await user.save();
          console.log(`✓ Created employee: ${emp.email} (username: ${emp.username})`);
          created++;
        }
      } catch (error) {
        console.error(`✗ Error creating employee ${emp.email}:`, error.message);
      }
    }

    console.log('\n=== Seeding Summary ===');
    console.log(`Created: ${created} new employees`);
    console.log(`Existing: ${existing} employees already in database`);
    console.log(`Total: ${created + existing} employees available`);
    console.log('\nEmployee login credentials:');
    employees.forEach(emp => {
      console.log(`  Email: ${emp.email}, Password: ${emp.password}`);
    });
    console.log('\n✓ Employee seeding complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding employees:', error);
    process.exit(1);
  }
};

// Run if called directly (cross-platform ESM main check)
try {
  const thisFilePath = fileURLToPath(import.meta.url);
  const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
  const thisResolved = path.resolve(thisFilePath);
  if (invokedPath && thisResolved && invokedPath === thisResolved) {
    seedEmployees();
  }
} catch (e) {
  // Fallback: if detection fails, still attempt to run when directly invoked
  if (process.argv[1] && process.argv[1].includes('seedEmployees.js')) {
    seedEmployees();
  }
}

export default seedEmployees;

