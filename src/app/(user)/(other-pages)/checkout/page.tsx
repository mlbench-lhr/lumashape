'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { toast } from 'react-toastify';
import { calculateOrderPricing } from '@/utils/pricing';

type Shipping = {
    name: string;
    phone: string;
    phoneCountryCode: string;
    email: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
};

const COUNTRIES = [
    { code: 'AF', name: 'Afghanistan', phoneCode: '+93' },
    { code: 'AL', name: 'Albania', phoneCode: '+355' },
    { code: 'DZ', name: 'Algeria', phoneCode: '+213' },
    { code: 'AD', name: 'Andorra', phoneCode: '+376' },
    { code: 'AO', name: 'Angola', phoneCode: '+244' },
    { code: 'AG', name: 'Antigua and Barbuda', phoneCode: '+1' },
    { code: 'AR', name: 'Argentina', phoneCode: '+54' },
    { code: 'AM', name: 'Armenia', phoneCode: '+374' },
    { code: 'AU', name: 'Australia', phoneCode: '+61' },
    { code: 'AT', name: 'Austria', phoneCode: '+43' },
    { code: 'AZ', name: 'Azerbaijan', phoneCode: '+994' },
    { code: 'BS', name: 'Bahamas', phoneCode: '+1' },
    { code: 'BH', name: 'Bahrain', phoneCode: '+973' },
    { code: 'BD', name: 'Bangladesh', phoneCode: '+880' },
    { code: 'BB', name: 'Barbados', phoneCode: '+1' },
    { code: 'BY', name: 'Belarus', phoneCode: '+375' },
    { code: 'BE', name: 'Belgium', phoneCode: '+32' },
    { code: 'BZ', name: 'Belize', phoneCode: '+501' },
    { code: 'BJ', name: 'Benin', phoneCode: '+229' },
    { code: 'BT', name: 'Bhutan', phoneCode: '+975' },
    { code: 'BO', name: 'Bolivia', phoneCode: '+591' },
    { code: 'BA', name: 'Bosnia and Herzegovina', phoneCode: '+387' },
    { code: 'BW', name: 'Botswana', phoneCode: '+267' },
    { code: 'BR', name: 'Brazil', phoneCode: '+55' },
    { code: 'BN', name: 'Brunei', phoneCode: '+673' },
    { code: 'BG', name: 'Bulgaria', phoneCode: '+359' },
    { code: 'BF', name: 'Burkina Faso', phoneCode: '+226' },
    { code: 'BI', name: 'Burundi', phoneCode: '+257' },
    { code: 'CV', name: 'Cabo Verde', phoneCode: '+238' },
    { code: 'KH', name: 'Cambodia', phoneCode: '+855' },
    { code: 'CM', name: 'Cameroon', phoneCode: '+237' },
    { code: 'CA', name: 'Canada', phoneCode: '+1' },
    { code: 'CF', name: 'Central African Republic', phoneCode: '+236' },
    { code: 'TD', name: 'Chad', phoneCode: '+235' },
    { code: 'CL', name: 'Chile', phoneCode: '+56' },
    { code: 'CN', name: 'China', phoneCode: '+86' },
    { code: 'CO', name: 'Colombia', phoneCode: '+57' },
    { code: 'KM', name: 'Comoros', phoneCode: '+269' },
    { code: 'CG', name: 'Congo', phoneCode: '+242' },
    { code: 'CD', name: 'Congo (Democratic Republic)', phoneCode: '+243' },
    { code: 'CR', name: 'Costa Rica', phoneCode: '+506' },
    { code: 'HR', name: 'Croatia', phoneCode: '+385' },
    { code: 'CU', name: 'Cuba', phoneCode: '+53' },
    { code: 'CY', name: 'Cyprus', phoneCode: '+357' },
    { code: 'CZ', name: 'Czech Republic', phoneCode: '+420' },
    { code: 'CI', name: "Côte d'Ivoire", phoneCode: '+225' },
    { code: 'DK', name: 'Denmark', phoneCode: '+45' },
    { code: 'DJ', name: 'Djibouti', phoneCode: '+253' },
    { code: 'DM', name: 'Dominica', phoneCode: '+1' },
    { code: 'DO', name: 'Dominican Republic', phoneCode: '+1' },
    { code: 'EC', name: 'Ecuador', phoneCode: '+593' },
    { code: 'EG', name: 'Egypt', phoneCode: '+20' },
    { code: 'SV', name: 'El Salvador', phoneCode: '+503' },
    { code: 'GQ', name: 'Equatorial Guinea', phoneCode: '+240' },
    { code: 'ER', name: 'Eritrea', phoneCode: '+291' },
    { code: 'EE', name: 'Estonia', phoneCode: '+372' },
    { code: 'SZ', name: 'Eswatini', phoneCode: '+268' },
    { code: 'ET', name: 'Ethiopia', phoneCode: '+251' },
    { code: 'FJ', name: 'Fiji', phoneCode: '+679' },
    { code: 'FI', name: 'Finland', phoneCode: '+358' },
    { code: 'FR', name: 'France', phoneCode: '+33' },
    { code: 'GA', name: 'Gabon', phoneCode: '+241' },
    { code: 'GM', name: 'Gambia', phoneCode: '+220' },
    { code: 'GE', name: 'Georgia', phoneCode: '+995' },
    { code: 'DE', name: 'Germany', phoneCode: '+49' },
    { code: 'GH', name: 'Ghana', phoneCode: '+233' },
    { code: 'GR', name: 'Greece', phoneCode: '+30' },
    { code: 'GD', name: 'Grenada', phoneCode: '+1' },
    { code: 'GT', name: 'Guatemala', phoneCode: '+502' },
    { code: 'GN', name: 'Guinea', phoneCode: '+224' },
    { code: 'GW', name: 'Guinea-Bissau', phoneCode: '+245' },
    { code: 'GY', name: 'Guyana', phoneCode: '+592' },
    { code: 'HT', name: 'Haiti', phoneCode: '+509' },
    { code: 'HN', name: 'Honduras', phoneCode: '+504' },
    { code: 'HU', name: 'Hungary', phoneCode: '+36' },
    { code: 'IS', name: 'Iceland', phoneCode: '+354' },
    { code: 'IN', name: 'India', phoneCode: '+91' },
    { code: 'ID', name: 'Indonesia', phoneCode: '+62' },
    { code: 'IR', name: 'Iran', phoneCode: '+98' },
    { code: 'IQ', name: 'Iraq', phoneCode: '+964' },
    { code: 'IE', name: 'Ireland', phoneCode: '+353' },
    { code: 'IL', name: 'Israel', phoneCode: '+972' },
    { code: 'IT', name: 'Italy', phoneCode: '+39' },
    { code: 'JM', name: 'Jamaica', phoneCode: '+1' },
    { code: 'JP', name: 'Japan', phoneCode: '+81' },
    { code: 'JO', name: 'Jordan', phoneCode: '+962' },
    { code: 'KZ', name: 'Kazakhstan', phoneCode: '+7' },
    { code: 'KE', name: 'Kenya', phoneCode: '+254' },
    { code: 'KI', name: 'Kiribati', phoneCode: '+686' },
    { code: 'KP', name: 'Korea (North)', phoneCode: '+850' },
    { code: 'KR', name: 'Korea (South)', phoneCode: '+82' },
    { code: 'KW', name: 'Kuwait', phoneCode: '+965' },
    { code: 'KG', name: 'Kyrgyzstan', phoneCode: '+996' },
    { code: 'LA', name: 'Laos', phoneCode: '+856' },
    { code: 'LV', name: 'Latvia', phoneCode: '+371' },
    { code: 'LB', name: 'Lebanon', phoneCode: '+961' },
    { code: 'LS', name: 'Lesotho', phoneCode: '+266' },
    { code: 'LR', name: 'Liberia', phoneCode: '+231' },
    { code: 'LY', name: 'Libya', phoneCode: '+218' },
    { code: 'LI', name: 'Liechtenstein', phoneCode: '+423' },
    { code: 'LT', name: 'Lithuania', phoneCode: '+370' },
    { code: 'LU', name: 'Luxembourg', phoneCode: '+352' },
    { code: 'MG', name: 'Madagascar', phoneCode: '+261' },
    { code: 'MW', name: 'Malawi', phoneCode: '+265' },
    { code: 'MY', name: 'Malaysia', phoneCode: '+60' },
    { code: 'MV', name: 'Maldives', phoneCode: '+960' },
    { code: 'ML', name: 'Mali', phoneCode: '+223' },
    { code: 'MT', name: 'Malta', phoneCode: '+356' },
    { code: 'MH', name: 'Marshall Islands', phoneCode: '+692' },
    { code: 'MR', name: 'Mauritania', phoneCode: '+222' },
    { code: 'MU', name: 'Mauritius', phoneCode: '+230' },
    { code: 'MX', name: 'Mexico', phoneCode: '+52' },
    { code: 'FM', name: 'Micronesia', phoneCode: '+691' },
    { code: 'MD', name: 'Moldova', phoneCode: '+373' },
    { code: 'MC', name: 'Monaco', phoneCode: '+377' },
    { code: 'MN', name: 'Mongolia', phoneCode: '+976' },
    { code: 'ME', name: 'Montenegro', phoneCode: '+382' },
    { code: 'MA', name: 'Morocco', phoneCode: '+212' },
    { code: 'MZ', name: 'Mozambique', phoneCode: '+258' },
    { code: 'MM', name: 'Myanmar', phoneCode: '+95' },
    { code: 'NA', name: 'Namibia', phoneCode: '+264' },
    { code: 'NR', name: 'Nauru', phoneCode: '+674' },
    { code: 'NP', name: 'Nepal', phoneCode: '+977' },
    { code: 'NL', name: 'Netherlands', phoneCode: '+31' },
    { code: 'NZ', name: 'New Zealand', phoneCode: '+64' },
    { code: 'NI', name: 'Nicaragua', phoneCode: '+505' },
    { code: 'NE', name: 'Niger', phoneCode: '+227' },
    { code: 'NG', name: 'Nigeria', phoneCode: '+234' },
    { code: 'MK', name: 'North Macedonia', phoneCode: '+389' },
    { code: 'NO', name: 'Norway', phoneCode: '+47' },
    { code: 'OM', name: 'Oman', phoneCode: '+968' },
    { code: 'PK', name: 'Pakistan', phoneCode: '+92' },
    { code: 'PW', name: 'Palau', phoneCode: '+680' },
    { code: 'PS', name: 'Palestine', phoneCode: '+970' },
    { code: 'PA', name: 'Panama', phoneCode: '+507' },
    { code: 'PG', name: 'Papua New Guinea', phoneCode: '+675' },
    { code: 'PY', name: 'Paraguay', phoneCode: '+595' },
    { code: 'PE', name: 'Peru', phoneCode: '+51' },
    { code: 'PH', name: 'Philippines', phoneCode: '+63' },
    { code: 'PL', name: 'Poland', phoneCode: '+48' },
    { code: 'PT', name: 'Portugal', phoneCode: '+351' },
    { code: 'QA', name: 'Qatar', phoneCode: '+974' },
    { code: 'RO', name: 'Romania', phoneCode: '+40' },
    { code: 'RU', name: 'Russia', phoneCode: '+7' },
    { code: 'RW', name: 'Rwanda', phoneCode: '+250' },
    { code: 'KN', name: 'Saint Kitts and Nevis', phoneCode: '+1' },
    { code: 'LC', name: 'Saint Lucia', phoneCode: '+1' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines', phoneCode: '+1' },
    { code: 'WS', name: 'Samoa', phoneCode: '+685' },
    { code: 'SM', name: 'San Marino', phoneCode: '+378' },
    { code: 'ST', name: 'Sao Tome and Principe', phoneCode: '+239' },
    { code: 'SA', name: 'Saudi Arabia', phoneCode: '+966' },
    { code: 'SN', name: 'Senegal', phoneCode: '+221' },
    { code: 'RS', name: 'Serbia', phoneCode: '+381' },
    { code: 'SC', name: 'Seychelles', phoneCode: '+248' },
    { code: 'SL', name: 'Sierra Leone', phoneCode: '+232' },
    { code: 'SG', name: 'Singapore', phoneCode: '+65' },
    { code: 'SK', name: 'Slovakia', phoneCode: '+421' },
    { code: 'SI', name: 'Slovenia', phoneCode: '+386' },
    { code: 'SB', name: 'Solomon Islands', phoneCode: '+677' },
    { code: 'SO', name: 'Somalia', phoneCode: '+252' },
    { code: 'ZA', name: 'South Africa', phoneCode: '+27' },
    { code: 'SS', name: 'South Sudan', phoneCode: '+211' },
    { code: 'ES', name: 'Spain', phoneCode: '+34' },
    { code: 'LK', name: 'Sri Lanka', phoneCode: '+94' },
    { code: 'SD', name: 'Sudan', phoneCode: '+249' },
    { code: 'SR', name: 'Suriname', phoneCode: '+597' },
    { code: 'SE', name: 'Sweden', phoneCode: '+46' },
    { code: 'CH', name: 'Switzerland', phoneCode: '+41' },
    { code: 'SY', name: 'Syria', phoneCode: '+963' },
    { code: 'TJ', name: 'Tajikistan', phoneCode: '+992' },
    { code: 'TZ', name: 'Tanzania', phoneCode: '+255' },
    { code: 'TH', name: 'Thailand', phoneCode: '+66' },
    { code: 'TL', name: 'Timor-Leste', phoneCode: '+670' },
    { code: 'TG', name: 'Togo', phoneCode: '+228' },
    { code: 'TO', name: 'Tonga', phoneCode: '+676' },
    { code: 'TT', name: 'Trinidad and Tobago', phoneCode: '+1' },
    { code: 'TN', name: 'Tunisia', phoneCode: '+216' },
    { code: 'TR', name: 'Turkey', phoneCode: '+90' },
    { code: 'TM', name: 'Turkmenistan', phoneCode: '+993' },
    { code: 'TV', name: 'Tuvalu', phoneCode: '+688' },
    { code: 'UG', name: 'Uganda', phoneCode: '+256' },
    { code: 'UA', name: 'Ukraine', phoneCode: '+380' },
    { code: 'AE', name: 'United Arab Emirates', phoneCode: '+971' },
    { code: 'GB', name: 'United Kingdom', phoneCode: '+44' },
    { code: 'US', name: 'United States', phoneCode: '+1' },
    { code: 'UY', name: 'Uruguay', phoneCode: '+598' },
    { code: 'UZ', name: 'Uzbekistan', phoneCode: '+998' },
    { code: 'VU', name: 'Vanuatu', phoneCode: '+678' },
    { code: 'VA', name: 'Vatican City', phoneCode: '+39' },
    { code: 'VE', name: 'Venezuela', phoneCode: '+58' },
    { code: 'VN', name: 'Vietnam', phoneCode: '+84' },
    { code: 'YE', name: 'Yemen', phoneCode: '+967' },
    { code: 'ZM', name: 'Zambia', phoneCode: '+260' },
    { code: 'ZW', name: 'Zimbabwe', phoneCode: '+263' }
];

const phoneCodeToNumber = (phoneCode: string) => Number(phoneCode.replace('+', '')) || 0;

const PHONE_CODES = Array.from(new Set(COUNTRIES.map(c => c.phoneCode))).sort(
    (a, b) => phoneCodeToNumber(a) - phoneCodeToNumber(b)
);

function CheckoutContent() {
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
        phoneCountryCode: '+1',
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
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 6 && cleaned.length <= 15;
    };

    const validateZipCode = (zip: string): boolean => {
        return zip.trim().length >= 3 && zip.trim().length <= 10;
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
            newErrors.phone = 'Please enter a valid phone number (6-15 digits)';
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
            newErrors.postalCode = 'Postal code is required';
        } else if (!validateZipCode(shipping.postalCode)) {
            newErrors.postalCode = 'Please enter a valid postal code';
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
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Information</h2>
                            <p className="text-sm text-gray-600 mb-6">{`We'll use this information to send order updates`}</p>

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
                                    <div className="flex gap-2">
                                        <select
                                            className="w-32 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all bg-white"
                                            value={shipping.phoneCountryCode}
                                            onChange={(e) => {
                                                const nextPhoneCode = e.target.value;
                                                const currentCountry = COUNTRIES.find(c => c.code === shipping.country);
                                                const nextCountry =
                                                    currentCountry?.phoneCode === nextPhoneCode
                                                        ? shipping.country
                                                        : (COUNTRIES.find(c => c.phoneCode === nextPhoneCode && c.code === 'US') ||
                                                            COUNTRIES.find(c => c.phoneCode === nextPhoneCode))?.code ||
                                                        shipping.country;

                                                setShipping(prev => ({
                                                    ...prev,
                                                    phoneCountryCode: nextPhoneCode,
                                                    country: nextCountry,
                                                }));
                                            }}
                                        >
                                            {PHONE_CODES.map(phoneCode => (
                                                <option key={phoneCode} value={phoneCode}>
                                                    {phoneCode}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="tel"
                                            className={`flex-1 border rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="1234567890"
                                            value={shipping.phone}
                                            onChange={(e) => update('phone', e.target.value)}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                    <p className="text-xs text-gray-500 mt-1">For delivery notifications and updates</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Shipping Address</h2>
                            <p className="text-sm text-gray-600 mb-6">Enter your complete shipping address</p>

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
                                            State / Province <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all ${errors.state ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="State or Province"
                                            value={shipping.state}
                                            onChange={(e) => update('state', e.target.value)}
                                        />
                                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Postal Code <span className="text-red-500">*</span>
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
                                            Country <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2E6C99] focus:border-transparent outline-none transition-all bg-white"
                                            value={shipping.country}
                                            onChange={(e) => {
                                                const nextCountry = e.target.value;
                                                const nextPhoneCode =
                                                    COUNTRIES.find(c => c.code === nextCountry)?.phoneCode || shipping.phoneCountryCode;

                                                setShipping(prev => ({
                                                    ...prev,
                                                    country: nextCountry,
                                                    phoneCountryCode: nextPhoneCode,
                                                }));
                                            }}
                                        >
                                            {COUNTRIES.map(country => (
                                                <option key={country.code} value={country.code}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                                        {`Size: ${item.containerSize} x ${item.layoutData?.canvas.thickness}"`}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {`Color: ${item.layoutData?.canvas.materialColor || 'Not specified'}`}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">${pricing.totals.customerSubtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="text-gray-900">-${pricing.totals.discountAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="text-gray-900">${pricing.totals.shippingCost.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-2">
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

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="container mx-auto py-8 px-4"><h1 className="text-2xl font-bold mb-8">Checkout</h1><div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div><p className="text-gray-600">Loading checkout...</p></div></div>}>
            <CheckoutContent />
        </Suspense>
    )
}