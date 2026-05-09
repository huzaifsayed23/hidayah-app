import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  const envStatus = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    JWT_SECRET: !!process.env.JWT_SECRET,
    PUSHER_APP_ID: !!process.env.PUSHER_APP_ID,
    NODE_ENV: process.env.NODE_ENV,
  };

  let dbStatus = 'disconnected';
  try {
    if (process.env.MONGODB_URI) {
      // Don't use the dbConnect helper to avoid cached state issues
      const conn = await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
      dbStatus = 'connected';
      // Close to avoid hanging
      await mongoose.connection.close();
    } else {
      dbStatus = 'missing_uri';
    }
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: envStatus,
    database: dbStatus,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}
