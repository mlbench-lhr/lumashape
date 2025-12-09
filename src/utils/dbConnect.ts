// utils/dbConnect.ts
import mongoose, { ConnectOptions } from 'mongoose'

declare global {
  var mongoose: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  } | undefined
}

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env')
}

mongoose.set('bufferCommands', false)

const globalForMongoose = globalThis as unknown as {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

globalForMongoose.mongoose = globalForMongoose.mongoose || { conn: null, promise: null }

const cached = globalForMongoose.mongoose!

async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      maxPoolSize: 3,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000,
      maxConnecting: 1,
      retryWrites: false,
      readPreference: 'primary',
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts as ConnectOptions).then((mongoose) => {
      console.log('✅ Connected to MongoDB')
      return mongoose
    }).catch((error) => {
      console.error('❌ MongoDB error:', error.message)
      cached.promise = null
      throw error
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default dbConnect