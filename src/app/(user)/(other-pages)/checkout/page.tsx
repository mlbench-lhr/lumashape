'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { toast } from 'react-toastify';
import { calculateOrderPricing } from '@/utils/pricing';

type Shipping = {
    name: string;
    phone: string;
    email: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
};

const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
];

export default function CheckoutPage() {
    const search = useSearchParams();
    const { cartItems } = useCart();
    const { user } = useUser();
    const [submitting, setSubmitting] = useState(false);

    const selectedIds = useMemo(() => {
        const raw = search.get('items') || '';
        const decoded = decodeURIComponent(raw);
        return decoded.split(',').map(s => s.trim()).filter(Boolean);
    }, [search]);

    const selectedItems = useMemo(() => {
        const ids = new Set(selectedIds);
        return cartItems.filter(i => ids.has(i.id));
    }, [cartItems, selectedIds]);

    const [shipping, setShipping] = useState<Shipping>({
        name: user ? `${user.name || ''}`.trim() || user.username || '' : '',
        phone: '',
        email: user?.email || '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof Shipping, string>>>({});

    const itemsForPricing = useMemo(() => {
        return selectedItems.map(i => {
            const canvas = i.layoutData?.canvas
                ? {
                    width: i.layoutData.canvas.width,
                    height: i.layoutData.canvas.height,
                    unit: i.layoutData.canvas.unit,
                    thickness: i.layoutData.canvas.thickness,
                    materialColor: i.layoutData.canvas.materialColor,
                }
                : undefined;
            const toolsMini = Array.isArray(i.layoutData?.tools)
                ? i.layoutData!.tools!.map(t => ({
                    isText:
                        t.name === 'TEXT' ||
                        t.name.toLowerCase() === 'text' ||
                        t.toolBrand === 'TEXT' ||
                        t.toolType === 'text'
                }))
                : undefined;
            return canvas
                ? { id: i.id, name: i.name, quantity: i.quantity, layoutData: { canvas, tools: toolsMini } }
                : { id: i.id, name: i.name, quantity: i.quantity };
        });
    }, [selectedItems]);

    const pricing = useMemo(() => calculateOrderPricing(itemsForPricing), [itemsForPricing]);
    const actualTotal = pricing.totals.customerTotal;

    const update = (field: keyof Shipping, value: string) => {
        setShipping(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        // US phone format: (XXX) XXX-XXXX or XXX-XXX-XXXX or XXXXXXXXXX
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10;
    };

    const validateZipCode = (zip: string): boolean => {
        // US ZIP code: XXXXX or XXXXX-XXXX
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return zipRegex.test(zip);
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof Shipping, string>> = {};

        if (!shipping.name?.trim()) {
            newErrors.name = 'Full name is required';
        }

        if (!shipping.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(shipping.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!shipping.phone?.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!validatePhone(shipping.phone)) {
            newErrors.phone = 'Please enter a valid 10-digit US phone number';
        }

        if (!shipping.address1?.trim()) {
            newErrors.address1 = 'Street address is required';
        }

        if (!shipping.city?.trim()) {
            newErrors.city = 'City is required';
        }

        if (!shipping.state?.trim()) {
            newErrors.state = 'State is required';
        }

        if (!shipping.postalCode?.trim()) {
            newErrors.postalCode = 'ZIP code is required';
        } else if (!validateZipCode(shipping.postalCode)) {
            newErrors.postalCode = 'Please enter a valid US ZIP code (e.g., 12345 or 12345-6789)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const placeOrder = async () => {
        if (selectedIds.length === 0) {
            toast.error('No items selected for checkout');
            return;
        }
        if (!validate()) {
            toast.error('Please correct the errors in the form');
            return;
        }
        try {
            setSubmitting(true);
            const token = localStorage.getItem('auth-token');
            const res = await fetch('/api/cart/checkout', {
                method: 'POST',
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ selectedItemIds: selectedIds, shipping }),
            });
            const data = await res.json();
            if (!res.ok || !data?.url) {
                throw new Error(data?.error || 'Failed to start checkout');
            }
            window.location.href = data.url;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Checkout failed';
            toast.error(msg);
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                        <p className="text-sm text-gray-600 mt-1">Complete your order details</p>
                    </div>
                    <button
                        className="text-[#2E6C99] hover:text-[#235478] font-medium flex items-center gap-2 transition-colors"
                        onClick={() => window.location.href = '/cart'}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Cart
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column - Forms */}
                    <div className="flex-1 space-y-6">
                        {/* Contact Information */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Information</h2>
                            <p className="text-sm text-gray-600 mb-6">We'll use this information to send order updates</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="John Doe"
                                        value={shipping.name}
                                        onChange={(e) => update('name', e.target.value)}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="john.doe@example.com"
                                        value={shipping.email}
                                        onChange={(e) => update('email', e.target.value)}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="(555) 123-4567"
                                        value={shipping.phone}
                                        onChange={(e) => update('phone', e.target.value)}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                    <p className="text-xs text-gray-500 mt-1">For delivery notifications and updates</p>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Shipping Address</h2>
                            <p className="text-sm text-gray-600 mb-6">US addresses only</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Street Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all ${errors.address1 ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="123 Main Street"
                                        value={shipping.address1}
                                        onChange={(e) => update('address1', e.target.value)}
                                    />
                                    {errors.address1 && <p className="text-red-500 text-xs mt-1">{errors.address1}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Apartment, Suite, etc. (Optional)
                                    </label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all"
                                        placeholder="Apt 4B"
                                        value={shipping.address2 || ''}
                                        onChange={(e) => update('address2', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all ${errors.city ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="New York"
                                            value={shipping.city}
                                            onChange={(e) => update('city', e.target.value)}
                                        />
                                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all bg-white ${errors.state ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            value={shipping.state}
                                            onChange={(e) => update('state', e.target.value)}
                                        >
                                            <option value="">Select State</option>
                                            {US_STATES.map(state => (
                                                <option key={state.code} value={state.code}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ZIP Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all ${errors.postalCode ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="10001"
                                            value={shipping.postalCode}
                                            onChange={(e) => update('postalCode', e.target.value)}
                                        />
                                        {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Country
                                        </label>
                                        <input
                                            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100 cursor-not-allowed"
                                            value="United States"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:w-[420px]">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                            </div>

                            <div className="p-6 max-h-[400px] overflow-y-auto">
                                {selectedItems.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600">No items selected</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedItems.map(item => (
                                            <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                                                <div className="relative w-20 h-20 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0">
                                                    {item.snapshotUrl ? (
                                                        <Image src={item.snapshotUrl} alt={item.name} fill className="object-contain rounded-lg" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <Image src="/images/icons/workspace/noLayouts.svg" alt="Layout" width={32} height={32} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Size: {item.containerSize} x {item.layoutData?.canvas.thickness}"
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        Color: {item.layoutData?.canvas.materialColor}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                                                        <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">${actualTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 rounded-b-lg">
                                <button
                                    className="w-full bg-[#2E6C99] hover:bg-[#235478] text-white py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2E6C99]"
                                    onClick={placeOrder}
                                    disabled={submitting || selectedItems.length === 0}
                                >
                                    {submitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        'Complete Order'
                                    )}
                                </button>

                                {selectedItems.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center mt-3">
                                        Please add items to continue
                                    </p>
                                )}

                                <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Secure Checkout
                                    </div>
                                    <span>•</span>
                                    <span>SSL Encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}