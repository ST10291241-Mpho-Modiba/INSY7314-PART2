// MongoDB initialization script for banking application
db = db.getSiblingDB('banking');

// Create collections
db.createCollection('users');
db.createCollection('payments');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.payments.createIndex({ "userId": 1 });
db.payments.createIndex({ "transactionId": 1 }, { unique: true });
db.payments.createIndex({ "createdAt": 1 });
db.payments.createIndex({ "status": 1 });

// Create application user with limited privileges
db.createUser({
  user: "bankingapp",
  pwd: "bankingapp123",
  roles: [
    {
      role: "readWrite",
      db: "banking"
    }
  ]
});

print("MongoDB initialization completed for banking application");
print("Created collections: users, payments");
print("Created indexes for performance optimization");
print("Created application user: bankingapp");