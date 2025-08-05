// utils/dbConnect.ts
import mongoose, { Mongoose } from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

interface GlobalMongoose {
  conn: Mongoose | null
  promise: Promise<Mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: GlobalMongoose | undefined
}

const cached: GlobalMongoose = global.mongoose || { conn: null, promise: null }

global.mongoose = cached

async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB')
      return mongoose
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