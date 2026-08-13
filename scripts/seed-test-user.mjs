import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-prompt-library";
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "password123";
const TEST_USER_NAME = "testuser";

async function seed() {
  try {
    console.log("Connecting to MongoDB:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);

    const UserSchema = new mongoose.Schema(
      {
        email: { type: String, required: true, unique: true },
        username: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        status: { type: String, required: true, default: "active" },
      },
      { timestamps: true }
    );

    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, salt);

    let user = await User.findOne({ email: TEST_USER_EMAIL });
    if (user) {
      user.passwordHash = passwordHash;
      user.status = "active";
      await user.save();
      console.log(`🎉 Updated existing test user (${TEST_USER_EMAIL}) password to match "${TEST_USER_PASSWORD}"!`);
    } else {
      user = await User.create({
        email: TEST_USER_EMAIL,
        username: TEST_USER_NAME,
        passwordHash,
        status: "active",
      });
      console.log(`🎉 Successfully created test user (${TEST_USER_EMAIL}) in database!`);
    }
  } catch (err) {
    console.error("❌ Error seeding test user:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
