'use client'
import React, { useState, ChangeEvent, FormEvent } from 'react'
import UserButton from '../../ui/Button'
import InputField from '../../ui/InputField'

type FormData = {
  firstName: string
  lastName: string
  email: string
  message: string
}

type Status = {
  success: boolean
  message: string
} | null

const ContactForm: React.FC = () => {
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  })

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setStatus({ success: true, message: data.message })
      setForm({ firstName: '', lastName: '', email: '', message: '' })
    } catch (err: any) {
      setStatus({ success: false, message: err.message || 'Something went wrong.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-8 rounded-lg">
        <div className="w-full mb-4 flex flex-col justify-between sm:flex-row gap-4">
          <div className='w-full'>
            <InputField
              label="First Name"
              name="firstName"
              placeholder="Enter First Name"
              className='rounded-full'
              value={form.firstName}
              onChange={handleChange}
            />
          </div>
          <div className='w-full'>
            <InputField
              label="Last Name"
              name="lastName"
              placeholder="Enter Last Name"
              className='rounded-full'
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-4">
          <InputField
            label="Email Address"
            name="email"
            type='email'
            placeholder="Enter Email Address"
            className='rounded-full'
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
          <textarea
            name="message"
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Write your query.."
            required
            value={form.message}
            onChange={handleChange}
          />
        </div>

        <UserButton
          type="submit"
          variant="primary"
          size="md"
          className="px-12 py-3 w-full mx-auto block rounded-full"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </UserButton>

        {status && (
          <p className={`mt-4 text-center ${status.success ? 'text-green-600' : 'text-red-600'}`}>
            {status.message}
          </p>
        )}
      </form>
    </div>
  )
}

export default ContactForm
