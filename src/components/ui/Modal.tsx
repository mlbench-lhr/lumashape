"use client";

import Image from "next/image";
import { useState } from "react";
import Text from "./Text";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, description }) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col justify-center items-center bg-white sm:w-[560px] sm:h-[404px] w-[90%] max-w-[400px] h-auto py-[20px] px-4 sm:px-[20px]">
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
