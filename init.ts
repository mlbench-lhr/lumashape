// app/init.ts
import dbConnect from '@/utils/dbConnect'

(async () => {
  try {
    await dbConnect()
    console.log('✅ MongoDB connected on app start')
  } catch (error) {
    console.error('❌ MongoDB connection failed on app start:', error)
  }
})()
