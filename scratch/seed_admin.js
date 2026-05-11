const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = "mongodb+srv://hidayah-admin:huzaif123@hidayah-cluster.lpqyq.mongodb.net/hidayah-app?retryWrites=true&w=majority";

async function seedAdmin() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const UserSchema = new mongoose.Schema({
    email: String,
    password: { type: String, select: false },
    username: String,
    acceptedTerms: { type: Boolean, default: false }
  });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const email = 'huzaifsayed454@gmail.com';
  const password = 'adminhuzaif123456789';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log("User exists, updating password...");
    existingUser.password = hashedPassword;
    existingUser.acceptedTerms = true;
    await existingUser.save();
    console.log("Updated!");
  } else {
    console.log("Creating new admin user...");
    await User.create({
      email,
      password: hashedPassword,
      username: 'admin',
      acceptedTerms: true
    });
    console.log("Created!");
  }

  process.exit(0);
}

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
