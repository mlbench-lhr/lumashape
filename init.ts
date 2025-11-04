// app/init.ts
import dbConnect from '@/utils/dbConnect'
import Tool from '@/lib/models/Tool'

(async () => {
  try {
    await dbConnect()
    console.log('✅ MongoDB connected on app start')
    // Best-effort index sync for UI-rendered paths (API route also calls Tool.init)
    try {
      await Tool.syncIndexes()
      console.log('✅ Tool indexes synced')
    } catch (e) {
      console.error('⚠️ Tool index sync failed:', e)
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed on app start:', error)
  }
})()
