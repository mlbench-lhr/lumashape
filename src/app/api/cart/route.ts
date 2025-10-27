import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import Cart, { ICartItem } from '@/lib/models/Cart'
import User from '@/lib/models/User'
import Tool from '@/lib/models/Tool'

interface CvDimensions {
  depth_inches?: number
}

interface CvResponse {
  dimensions?: CvDimensions
}

interface ToolDocument {
  _id: string
  depth?: number
  unit?: 'mm' | 'inches'
  cvResponse?: CvResponse
}

interface ToolShape {
  id?: string
  originalId?: string
  unit?: 'mm' | 'inches'
  depth?: number
  rotation?: number
  flipHorizontal?: boolean
  flipVertical?: boolean
  opacity?: number
  smooth?: number
  image?: string
  groupId?: string | null
}


const JWT_SECRET = process.env.JWT_SECRET!

// Unit helpers
const mmToInches = (mm: number) => mm / 25.4
const inchesToMm = (inches: number) => inches * 25.4

// Ensure each tool has a valid depth; hydrate from Tool DB when missing
async function ensureToolDepths(tools: ToolShape[]): Promise<ToolShape[]> {
  return Promise.all(
    (tools || []).map(async (t) => {
      let depth = t?.depth

      if (typeof depth !== 'number' || depth <= 0 || Number.isNaN(depth)) {
        let depthInches: number | null = null

        try {
          const rawId = String(t?.originalId || t?.id || '')
          const toolId = rawId.split('-').slice(0, -1).join('-') || rawId

          if (toolId) {
            const dbTool = (await Tool.findById(toolId).lean()) as ToolDocument | null
            const cvDepth = dbTool?.cvResponse?.dimensions?.depth_inches

            if (typeof cvDepth === 'number' && cvDepth > 0) {
              depthInches = Number(cvDepth.toFixed(3))
            } else if (typeof dbTool?.depth === 'number' && dbTool.depth > 0) {
              const unit = dbTool?.unit
              const inches = unit === 'mm' ? mmToInches(dbTool.depth) : dbTool.depth
              depthInches = Number(inches.toFixed(3))
            }
          }
        } catch {
          // ignore cast/fetch errors, fall back
        }

        if (!depthInches || !(depthInches > 0)) {
          depthInches = 0.2 // conservative fallback
        }

        depth = t?.unit === 'mm' ? Number(inchesToMm(depthInches).toFixed(3)) : Number(depthInches.toFixed(3))
      }

      // Fill other required defaults defensively for older items
      return {
        ...t,
        depth,
        rotation: typeof t.rotation === 'number' ? t.rotation : 0,
        flipHorizontal: typeof t.flipHorizontal === 'boolean' ? t.flipHorizontal : false,
        flipVertical: typeof t.flipVertical === 'boolean' ? t.flipVertical : false,
        opacity: typeof t.opacity === 'number' ? t.opacity : 100,
        smooth: typeof t.smooth === 'number' ? t.smooth : 0,
        image: typeof t.image === 'string' ? t.image : '',
        groupId: typeof t.groupId === 'string' ? t.groupId : (t.groupId ?? null),
      }
    })
  )
}

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

    // Repair pre-existing items missing depths to avoid validation failures
    if (Array.isArray(cart.items) && cart.items.length) {
      for (const existing of cart.items) {
        if (existing?.layoutData?.tools && Array.isArray(existing.layoutData.tools)) {
          const missing = existing.layoutData.tools.some((t: ToolShape) => typeof t?.depth !== 'number' || Number.isNaN(t.depth))
          if (missing) {
            itemData.layoutData.tools = await ensureToolDepths(itemData.layoutData.tools as ToolShape[])
          }
        }
      }
    }

    // Ensure incoming item tools have depth populated
    if (itemData?.layoutData?.tools && Array.isArray(itemData.layoutData.tools)) {
      itemData.layoutData.tools = await ensureToolDepths(itemData.layoutData.tools)
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(item => item.id === itemData.id)

    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity += 1
      cart.items[existingItemIndex].updatedAt = new Date()
    } else {
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