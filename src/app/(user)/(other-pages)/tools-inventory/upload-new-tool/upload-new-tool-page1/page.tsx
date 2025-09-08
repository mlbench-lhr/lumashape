"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Text from "@/components/ui/Text";
import { Listbox } from "@headlessui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Paper = {
  id: number;
  type: string;
};

const PAPERS: Paper[] = [
  { id: 0, type: "A3" },
  { id: 1, type: "A4" },
  { id: 2, type: "US Letter" },
];

// ✅ Extend window type properly
declare global {
  interface Window {
    toolUploadData?: {
      paperType: string;
      imageUrl: string;
      file: File;
    };
  }
}

const UploadNewToolPage1 = () => {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePreviewOpen = () => {
    if (!backgroundUrl) {
      toast.error("Background image must be selected", { position: "top-center" });
      setIsPreviewOpen(false);
      return;
    }
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setBackgroundUrl(url); // Set the image immediately without processing modal

    console.log("Selected file:", file);
  };

  const handleRemoveImage = () => {
    setBackgroundUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setBackgroundUrl(url); // Set the image immediately without processing modal

    console.log("Dropped file:", file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleNext = () => {
    // Validation
    if (!selectedPaper) {
      toast.error("Paper type must be selected", { position: "top-center" });
      return;
    }
    if (!backgroundUrl) {
      toast.error("An image must be selected", { position: "top-center" });
      return;
    }

    // Get the actual file from the input
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("No file selected", { position: "top-center" });
      return;
    }

    // Show processing modal when Continue is clicked
    setIsProcessing(true);
    setShowModal(true);
    setModalTitle("Processing...");
    setModalDescription(
      "Detecting tool contours… this usually takes just a few seconds."
    );

    // Simulate processing time
    const timer = setTimeout(() => {
      // ✅ No any — now strongly typed
      if (typeof window !== "undefined") {
        window.toolUploadData = {
          paperType: selectedPaper.type,
          imageUrl: backgroundUrl,
          file: file
        };
      }

      // Hide modal and navigate to page 2
      setShowModal(false);
      setIsProcessing(false);
      setModalTitle("");
      setModalDescription("");
      router.push("/tools-inventory/upload-new-tool/upload-new-tool-page2");
    }, 2000);

    return () => clearTimeout(timer);
  };

  return (
    <>
      <ToastContainer />
      {showModal && (
        <Modal
          isOpen={showModal}
          title={modalTitle}
          description={modalDescription}
        />
      )}
      <div className="w-full mx-auto my-[45px]">
        <div className="flex items-center gap-[13px] sm:gap-[13px]">
          <div className="py-[13px] px-[11px]">
            <Image
              className="cursor-pointer"
              src="/images/icons/back.svg"
              width={24}
              height={22}
              alt="back"
              onClick={() => router.push("/tools-inventory")}
            />
          </div>
          <Text as="h3" className="grow">
            Upload New Tool
          </Text>
        </div>
        <div className="mt-[15px]">
          <Text as="p1" className="text-[#808080]">
            Upload a top-down photo of a single tool placed on paper. Make sure
            the full tool is visible and not overlapping other objects.
          </Text>
        </div>
        <div className="flex w-full mt-[43px]">
          <div className="flex-[2.3]">
            <div className="w-full">
              <Text as="h5" className="inline-block font-bold">
                Paper Type
              </Text>
            </div>
            <div className="mt-[18px]">
              <Listbox
                value={selectedPaper}
                onChange={(paper: Paper) => {
                  setSelectedPaper(paper);
                }}
              >
                <div className="relative w-full">
                  <Listbox.Button className="relative w-full h-[50px] p-2 border rounded-lg border-[#e6e6e6] text-left focus:outline-none">
                    <span className="flex items-center gap-2">
                      {selectedPaper ? (
                        <span className="text-sm">{selectedPaper.type}</span>
                      ) : (
                        <span className="text-gray-400">All Paper Types</span>
                      )}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                      <Image
                        src="/images/icons/arrow_down.svg"
                        width={20}
                        height={20}
                        alt="chevron down"
                      />
                    </span>
                  </Listbox.Button>

                  <Listbox.Options className="absolute mt-1 z-[10] max-h-60 w-[245px] right-5 top-[50px] overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
                    {PAPERS.map((paper) => (
                      <Listbox.Option
                        key={paper.id}
                        value={paper}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                            active ? "text-blue-900" : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              readOnly
                              checked={selected}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{paper.type}</span>
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>

            <div className="flex flex-col sm:flex-row mt-[30px] mb-[25px] gap-[36px]">
              <div className="relative w-full sm:w-[430px] h-[433px] border border-b-0 rounded-[21px] bg-[#f9fcff] border-dotted border-gray-400">
                <div className="absolute px-[12px] py-[8.5px] right-0 w-[88px] h-[41px] rounded-tr-[21px] bg-[#ebebeb]">
                  <div className="flex justify-center items-center gap-[12px]">
                    <div className="p-[7px]">
                      <Image
                        onClick={handlePreviewOpen}
                        src="/images/icons/scan.svg"
                        width={45}
                        height={45}
                        alt="scan"
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="p-[7px]">
                      <Image
                        src="/images/icons/cross.svg"
                        width={45}
                        height={45}
                        alt="cross"
                        className="cursor-pointer"
                        onClick={handleRemoveImage}
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-center h-[376px] bg-cover bg-center border-b-0 rounded-t-[21px] border-transparent overflow-hidden"
                  style={{
                    backgroundImage: backgroundUrl
                      ? `url(${backgroundUrl})`
                      : undefined,
                    backgroundRepeat: "no-repeat",
                  }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="flex flex-col items-center">
                    <div className="p-[15px]">
                      {!backgroundUrl && (
                        <Image
                          src="/images/icons/upload.svg"
                          width={30}
                          height={30}
                          alt="upload"
                          className="cursor-pointer"
                          onClick={handleImageUpload}
                        />
                      )}
                    </div>
                    {!backgroundUrl && (
                      <>
                        <p className="mt-[15px] text-[16px] leading-[18px] font-semibold text-center">
                          Drag & Drop the image or <br />
                          <span
                            className="text-blue-500 underline cursor-pointer"
                            onClick={handleImageUpload}
                          >
                            Click
                          </span>{" "}
                          to upload
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Fullscreen Preview */}
                {isPreviewOpen && (
                  <div
                    className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
                    onClick={handlePreviewClose}
                  >
                    <Image
                      src={backgroundUrl as string}
                      alt="Full Preview"
                      width={800}
                      height={800}
                      className="object-contain max-h-full max-w-full"
                    />
                  </div>
                )}

                <div className="flex justify-center items-center h-[57px] border-b border-dotted bg-[#ebebeb] rounded-b-[21px]">
                  <div className="flex justify-center gap-[10px]">
                    <div className="p-[5px]">
                      <Image
                        src="/images/icons/upload.svg"
                        alt="upload"
                        width={20}
                        height={20}
                        className="cursor-pointer"
                        onClick={handleImageUpload}
                      />
                    </div>
                  </div>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="mt-[60px]">
              <Button
                className="px-[3.5rem] py-[1rem] text-[18px] font-bold"
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={isProcessing}
              >
                <span className="text-[18px] font-semibold">
                  {isProcessing ? "Processing..." : "Continue"}
                </span>
              </Button>
            </div>
          </div>
          <div className="hidden sm:flex-[1]"></div>
        </div>
      </div>
    </>
  );
};

export default UploadNewToolPage1;