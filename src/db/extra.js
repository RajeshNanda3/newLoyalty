const mongoose = require('mongoose');

// Example User and Account schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  balance: Number
});

const accountSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  accountType: String,
  balance: Number
});

const User = mongoose.model('User', userSchema);
const Account = mongoose.model('Account', accountSchema);

async function transferMoney(fromUserId, toUserId, amount) {
  // Start a new session
  const session = await mongoose.startSession();
  
  try {
    // Start transaction
    session.startTransaction();
    
    // Fetch both users within the transaction
    const fromUser = await User.findById(fromUserId).session(session);
    const toUser = await User.findById(toUserId).session(session);
    
    if (!fromUser || !toUser) {
      throw new Error('One or both users not found');
    }
    
    if (fromUser.balance < amount) {
      throw new Error('Insufficient funds');
    }
    
    // Perform the transfer
    await User.findByIdAndUpdate(
      fromUserId,
      { $inc: { balance: -amount } },
      { session }
    );
    
    await User.findByIdAndUpdate(
      toUserId,
      { $inc: { balance: amount } },
      { session }
    );
    
    // Create transaction records
    await Account.create([{
      userId: fromUserId,
      accountType: 'debit',
      balance: -amount
    }, {
      userId: toUserId,
      accountType: 'credit',
      balance: amount
    }], { session });
    
    // Commit the transaction
    await session.commitTransaction();
    
    return { success: true, message: 'Transfer completed successfully' };
    
  } catch (error) {
    // If anything fails, abort the transaction and roll back changes
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
}

// Example usage
async function example() {
  try {
    await mongoose.connect('mongodb://localhost:27017/your_database');
    
    const result = await transferMoney(
      '507f1f77bcf86cd799439011', // from user
      '507f1f77bcf86cd799439012', // to user
      100 // amount
    );
    
    console.log(result);
  } catch (error) {
    console.error('Transaction failed:', error);
  }
}