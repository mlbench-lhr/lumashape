import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import Cart from '@/lib/models/Cart'
import User from '@/lib/models/User'

const JWT_SECRET = process.env.JWT_SECRET!

// DELETE - Clear entire cart
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const userEmail = decoded.email;

    // Reject if user no longer exists (deleted)
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cart = await Cart.findOne({ userEmail });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    cart.items = []
    await cart.save()

    return NextResponse.json({ 
      success: true, 
      message: 'Cart cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}