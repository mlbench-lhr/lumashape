"use client";

import Image from "next/image";
import { useState } from "react";
import Text from "./Text";

interface ModalProps {
  isOpen: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen }) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col justify-center items-center bg-white w-[560px] h-[404px] py-[70px]">
            <div className="flex justify-start items-start">
              <div className="w-[195px] h-[130px] relative">
                <Image
                  src="/images/icons/processing.svg"
                  fill
                  style={{ objectFit: "contain" }}
                  alt="processing...."
                />
              </div>
            </div>
            <div className="flex flex-col items-center mt-[45px]">
              <Text className="font-semibold" as="h3">
                Processing...
              </Text>
              <Text className="font-medium text-[#999999] mt-[15px]" as="p1">
                Detecting tool contours… this usually takes just a few seconds.
              </Text>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
