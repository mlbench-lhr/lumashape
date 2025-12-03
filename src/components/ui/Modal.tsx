"use client";

import Image from "next/image";
import Text from "./Text";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  hideImage?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, description, onConfirm, onCancel, confirmText, cancelText, hideImage }) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col justify-center items-center bg-white sm:w-[560px] w-[90%] max-w-[500px] h-auto py-[20px] px-4 sm:px-[20px]">
            {!hideImage && (
              <div className="flex justify-center items-center w-full">
                <div className="w-[120px] sm:w-[195px] h-[120px] sm:h-[130px] relative">
                  <Image
                    src="/images/icons/processing.svg"
                    fill
                    style={{ objectFit: "contain" }}
                    alt="processing...."
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center mt-[20px] sm:mt-[30px]">
              <Text
                className="font-semibold text-center text-lg sm:text-xl"
                as="h3"
              >
                {title}
              </Text>
              <Text
                className="font-medium text-[#999999] mt-[15px] text-center text-sm sm:text-base"
                as="p1"
              >
                {description}
              </Text>
              {(onCancel || onConfirm) && (
                <div className="flex items-center gap-3 mt-6">
                  {onCancel && (
                    <button
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={onCancel}
                    >
                      {cancelText ?? 'Cancel'}
                    </button>
                  )}
                  {onConfirm && (
                    <button
                      className="px-4 py-2 rounded-lg bg-[#2E6C99] text-white hover:bg-[#235478]"
                      onClick={onConfirm}
                    >
                      {confirmText ?? 'Continue'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
