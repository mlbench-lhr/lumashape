"use client";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { cn } from "../../utils/index"; //
import Image from "next/image";

interface InputFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  optional?: boolean;
  required?: boolean;
  showPasswordToggle?: boolean;
  isSearchable?: boolean;
  type?: string;
  className?: string;
}

const InputField = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  disabled = false,
  optional = false,
  readOnly = false,
  required = false,
  showPasswordToggle = false,
  isSearchable = false,
  type = "text",
  className = "",
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="flex flex-col w-full relative">
      <label className="text-sm text-secondary mb-1 font-bold">
        {label}{" "}
        {optional && <span className="text-secondary/50">(optional)</span>}
      </label>
      <input
        name={name}
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        type={inputType}
        className={cn(
          "px-3 py-3 border border-secondary/10 rounded-lg text-sm !text-black pr-10",
          readOnly && "bg-[#F2F3F4]",
          className
        )}
      />
      {isSearchable && (
        <Image className="absolute top-3 left-3" src="/images/icons/magnifer.svg" width={30} height={30} alt="Search"/>
      )}
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 bottom-[7px] transform -translate-y-1/2 text-secondary/50"
          tabIndex={-1}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
  );
};

export default InputField;
