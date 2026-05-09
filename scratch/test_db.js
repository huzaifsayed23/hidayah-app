const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://hidayah:hidayahhuzaif@cluster0.ckvybdc.mongodb.net/hidayah?appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db("hidayah");
    const users = await db.collection("users").countDocuments();
    console.log(`Found ${users} users`);
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await client.close();
  }
}
run();
