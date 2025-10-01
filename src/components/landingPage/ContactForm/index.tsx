"use client";
import React, { useState, ChangeEvent, FormEvent } from "react";
import UserButton from "../../ui/Button";
import InputField from "../../ui/InputField";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

type Status = {
  success: boolean;
  message: string;
} | null;

const ContactForm: React.FC = () => {
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setStatus({ success: true, message: data.message });
      setForm({ firstName: "", lastName: "", email: "", message: "" });
    } catch (err: unknown) {
      let errorMessage = "Something went wrong.";
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }
      setStatus({
        success: false,
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mx-auto p-8 rounded-lg max-w-2xl"
      >
        <div className="flex sm:flex-row flex-col justify-between gap-4 mb-4 w-full">
          <div className="w-full">
            <InputField
              label="First Name"
              name="firstName"
              placeholder="Enter First Name"
              className="rounded-full"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="w-full">
            <InputField
              label="Last Name"
              name="lastName"
              placeholder="Enter Last Name"
              className="rounded-full"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-4">
          <InputField
            label="Email Address"
            name="email"
            type="email"
            placeholder="Enter Email Address"
            className="rounded-full"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-bold text-gray-700 text-sm">
            Message
          </label>
          <textarea
            name="message"
            rows={6}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary w-full"
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
          className="block mx-auto px-12 py-3 rounded-full w-full"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Message"}
        </UserButton>

        {status && (
          <p
            className={`mt-4 text-center ${
              status.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {status.message}
          </p>
        )}
      </form>
    </div>
  );
};

export default ContactForm;
