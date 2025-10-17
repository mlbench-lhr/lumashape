import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import Cart, { ICartItem } from '@/lib/models/Cart'
import User from '@/lib/models/User'

const JWT_SECRET = process.env.JWT_SECRET!

// GET - Fetch user's cart
export async function GET(req: NextRequest) {
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

    let cart = await Cart.findOne({ userEmail });
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = new Cart({ userEmail, items: [] })
      await cart.save()
    }

    return NextResponse.json({ 
      success: true, 
      cart: {
        items: cart.items,
        totalPrice: cart.items.reduce((sum, item) => 
          item.selected ? sum + (item.price * item.quantity) : sum, 0
        )
      }
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST - Add item to cart
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const userEmail = decoded.email

    const itemData = await req.json()

    let cart = await Cart.findOne({ userEmail })
    
    if (!cart) {
      cart = new Cart({ userEmail, items: [] })
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(item => item.id === itemData.id)
    
    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += 1
      cart.items[existingItemIndex].updatedAt = new Date()
    } else {
      // Add new item
      const newItem: ICartItem = {
        ...itemData,
        quantity: 1,
        selected: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      cart.items.push(newItem)
    }

    await cart.save()

    return NextResponse.json({ 
      success: true, 
      message: 'Item added to cart successfully' 
    })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// PUT - Update cart item
export async function PUT(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const userEmail = decoded.email

    const { itemId, updates } = await req.json()

    const cart = await Cart.findOne({ userEmail })
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    const itemIndex = cart.items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Update the item
    Object.assign(cart.items[itemIndex], updates, { updatedAt: new Date() })
    await cart.save()

    return NextResponse.json({ 
      success: true, 
      message: 'Cart item updated successfully' 
    })
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from cart
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

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const cart = await Cart.findOne({ userEmail })
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    cart.items = cart.items.filter(item => item.id !== itemId)
    await cart.save()

    return NextResponse.json({ 
      success: true, 
      message: 'Item removed from cart successfully' 
    })
  } catch (error) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}