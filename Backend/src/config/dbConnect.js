import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI);

    console.log(
      `✅ Database Connected: ${connect.connection.host}, ${connect.connection.name}`,
    );
  } catch (err) {
    console.error("❌Database connection failed", err);
    process.exit(1);
  }
};

export default dbConnect;
