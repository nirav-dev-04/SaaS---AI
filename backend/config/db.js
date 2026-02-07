import mongoose from 'mongoose'; // Change require to import
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // It is safer to use process.env.MONGO_URI here later
    await mongoose.connect('mongodb+srv://niravmathukiya8_db_user:invoice123@invoice.x594ion.mongodb.net/InvoiceAi');
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Stop the server if the database fails
  }
};

export default connectDB;