"use client";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Modal from "@/components/ui/Modal";
import Text from "@/components/ui/Text";
import { Listbox } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Paper = {
  id: number;
  type: string;
};

type Tool = {
  id: number;
  type: string;
};

type ToolData = {
  id: number;
  background_img: string;
  paper_type: string;
  brand: string;
  tool_type: string;
  description: string;
  purchase_link: string;
};

type CvProcessingResponse = {
  annotated_link: string;
  diagonal_inches: number;
  dxf_link: string;
  mask_link: string;
  outlines_link: string;
  scale_info: string;
  success: boolean;
};


declare global {
  interface Window {
    toolUploadData?: {
      paperType: string;
      imageUrl: string;
      file: File;
      serverResponse: CvProcessingResponse;
    };
  }
}


const Tools: Tool[] = [
  { id: 0, type: "Custom" },
  { id: 1, type: "Wrench" },
  { id: 2, type: "Pliers" },
  { id: 3, type: "Hammer" },
];

const PAPERS: Paper[] = [
  { id: 0, type: "A3" },
  { id: 1, type: "A4" },
  { id: 2, type: "US Letter" },
];

const UploadNewToolPage2 = () => {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const router = useRouter();
  const [validation, setValidation] = useState({ isValid: true, message: "" });
  const [touched, setTouched] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [annotatedImageUrl, setAnnotatedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [serverResponse, setServerResponse] = useState<CvProcessingResponse | null>(null);

  const [toolData, setToolData] = useState<ToolData>({
    id: 0,
    background_img: "",
    paper_type: "",
    brand: "",
    tool_type: "",
    description: "",
    purchase_link: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveImage = () => {
    setBackgroundUrl(null);
    setAnnotatedImageUrl(null);
    setUploadFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("toolUploadData");
      if (window.toolUploadData) {
        delete window.toolUploadData;
      }
    }

    router.push('/tools-inventory/upload-new-tool/upload-new-tool-page1');
  };

  // Load data from previous page
  useEffect(() => {
    if (typeof window !== "undefined") {
      let data = window.toolUploadData;

      if (!data) {
        const savedData = localStorage.getItem("toolUploadData");
        if (savedData) {
          try {
            data = JSON.parse(savedData);
          } catch (error) {
            console.error("Error parsing localStorage data:", error);
          }
        }
      }

      if (data && data.paperType && data.imageUrl) {
        const paper = PAPERS.find((p) => p.type === data.paperType);
        if (paper) {
          setSelectedPaper(paper);
          setToolData((prev) => ({ ...prev, paper_type: data.paperType }));
        }

        // Set the original background image
        setBackgroundUrl(data.imageUrl);

        // Set server response data
        if (data.serverResponse) {
          setServerResponse(data.serverResponse);

          // Show annotated image if available
          if (data.serverResponse.annotated_link) {
            setAnnotatedImageUrl(data.serverResponse.annotated_link);
          }
        }

        setUploadFile(data.file || null);

        // Save to localStorage for reload persistence
        localStorage.setItem("toolUploadData", JSON.stringify({
          paperType: data.paperType,
          imageUrl: data.imageUrl,
          serverResponse: data.serverResponse
        }));
      } else {
        console.log("No upload data found, redirecting to page 1");
        router.push("/tools-inventory/upload-new-tool/upload-new-tool-page1");
      }
    }
  }, [router]);

  const handlePreviewOpen = () => {
    // Use annotated image if available, otherwise use original
    const previewImage = annotatedImageUrl || backgroundUrl;
    if (!previewImage) {
      toast.error("Background image must be selected", { position: "top-center" });
      setIsPreviewOpen(false);
      return;
    }
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
  };

  const handleImageOutline = async () => {
    setIsLoading(true);

    // Validation
    if (!toolData.paper_type) {
      toast.error("Paper type must be selected", { position: "top-center" });
      setIsLoading(false);
      return;
    }
    if (!backgroundUrl) {
      toast.error("An image must be selected", { position: "top-center" });
      setIsLoading(false);
      return;
    }
    if (!toolData.brand) {
      toast.error("Brand must be selected", { position: "top-center" });
      setIsLoading(false);
      return;
    }
    if (!toolData.tool_type) {
      toast.error("Tool type must be selected", { position: "top-center" });
      setIsLoading(false);
      return;
    }
    if (!toolData.description) {
      toast.error("Description must be added", { position: "top-center" });
      setIsLoading(false);
      return;
    }

    if (toolData.purchase_link.trim()) {
      const urlRegex =
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

      if (!urlRegex.test(toolData.purchase_link)) {
        toast.error("Purchase link must be a valid URL", {
          position: "top-center",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      // Build URL with all parameters including the server response data
      const params = new URLSearchParams({
        paper: toolData.paper_type,
        brand: toolData.brand,
        type: toolData.tool_type,
        imageUrl: backgroundUrl, // Original image
        annotatedImageUrl: annotatedImageUrl || '', // Annotated image
        outlinesImageUrl: serverResponse?.outlines_link || '', // Outlines image
        description: toolData.description,
        serverResponse: JSON.stringify(serverResponse || {}),
        ...(toolData.purchase_link.trim() && { purchaseLink: toolData.purchase_link })
      });

      // Clear the temporary data
      if (typeof window !== "undefined") {
        localStorage.removeItem("toolUploadData");
        if (window.toolUploadData) {
          delete window.toolUploadData;
        }
      }

      router.push(`/tools-inventory/tool-detected?${params.toString()}`);
    } catch (err) {
      console.error("Navigation error:", err);
      toast.error(`Failed to proceed: ${err instanceof Error ? err.message : 'Unknown error'}`, {
        position: "top-center"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/tools-inventory/upload-new-tool/upload-new-tool-page1');
  };

  // Get the display image (prefer annotated over original)
  const displayImageUrl = annotatedImageUrl || backgroundUrl;

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
              onClick={handleBack}
            />
          </div>
          <Text as="h3" className="grow">
            Upload New Tool
          </Text>
        </div>
        <div className="mt-[15px]">
          <Text as="p1" className="text-[#808080]">
            Complete the tool details to finish uploading your tool.
          </Text>
        </div>
        <div className="flex w-full mt-[43px]">
          <div className="flex-[2.3]">
            {/* Paper Type - Display Only */}
            <div className="w-full">
              <Text as="h5" className="inline-block font-bold">
                Paper Type
              </Text>
            </div>
            <div className="mt-[18px]">
              <div className="relative w-full h-[50px] p-2 border rounded-lg border-[#e6e6e6] bg-gray-50">
                <span className="flex items-center gap-2 h-full">
                  <span className="text-sm">{selectedPaper?.type || 'Loading...'}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row mt-[30px] mb-[25px] gap-[36px]">
              {/* Image Display - Now showing annotated image with badge */}
              <div className="relative w-full sm:w-[430px] h-[433px] border border-b-0 rounded-[21px] bg-[#f9fcff] border-dotted border-gray-400">

                <div className="absolute px-[12px] py-[8.5px] right-0 w-[88px] h-[41px] rounded-tr-[21px] bg-[#ebebeb] z-10">
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

                {/* Image Container */}
                <div className="flex items-center justify-center h-[376px] border-b-0 rounded-t-[21px] overflow-hidden bg-white">
                  {displayImageUrl ? (
                    <Image
                      src={displayImageUrl}
                      alt="tool-preview"
                      width={600}
                      height={376}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <Image src="/images/icons/upload.svg" width={30} height={30} alt="upload" />
                      <p className="mt-2 text-sm">No image selected</p>
                    </div>
                  )}
                </div>

                {!displayImageUrl && (
                  <div className="flex flex-col items-center text-gray-500">
                    <Image
                      src="/images/icons/upload.svg"
                      width={30}
                      height={30}
                      alt="upload"
                    />
                    <p className="mt-2 text-sm">No image selected</p>
                  </div>
                )}
              </div>

              {/* Bottom section */}
              <div className="flex justify-center items-center h-[57px] border-b border-dotted bg-[#ebebeb] rounded-b-[21px]">
                <div className="flex justify-center gap-[10px]">
                  <div className="p-[5px]">
                    <Image
                      src="/images/icons/upload.svg"
                      alt="upload"
                      width={20}
                      height={20}
                      className="cursor-pointer opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Fullscreen Preview */}
              {isPreviewOpen && displayImageUrl && (
                <div
                  className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
                  onClick={handlePreviewClose}
                >
                  <div className="relative max-w-[90vw] max-h-[90vh]">
                    <Image
                      src={displayImageUrl}
                      alt="Full Preview"
                      width={800}
                      height={800}
                      className="object-contain max-h-full max-w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tool Options */}
            <div className="flex flex-col w-full sm:w-[431px] sm:h-[428px]">
              <Text className="font-bold" as="p1">
                Brand
              </Text>
              <div className="flex justify-start mt-[20px] gap-[3px]">
                <div
                  className={`w-[91px] h-[65px] bg-[#d9d9d9] relative cursor-pointer border-2 ${toolData.brand === 'Bosch' ? 'border-blue-500' : 'border-transparent'
                    }`}
                  onClick={() => setToolData({ ...toolData, brand: 'Bosch' })}
                >
                  <Image
                    src="/images/icons/workspace/Bosch.svg"
                    alt="bosch"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <div
                  className={`w-[91px] h-[65px] relative cursor-pointer border-2 ${toolData.brand === 'Milwaukee' ? 'border-blue-500' : 'border-transparent'
                    }`}
                  onClick={() => setToolData({ ...toolData, brand: 'Milwaukee' })}
                >
                  <Image
                    src="/images/icons/workspace/Milwaukee.svg"
                    fill
                    alt="milwaukee"
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <div
                  className={`w-[91px] h-[65px] relative cursor-pointer border-2 ${toolData.brand === 'Makita' ? 'border-blue-500' : 'border-transparent'
                    }`}
                  onClick={() => setToolData({ ...toolData, brand: 'Makita' })}
                >
                  <Image
                    src="/images/icons/workspace/Makita.svg"
                    fill
                    alt="makita"
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </div>

              {toolData.brand && (
                <span className="text-green-600 text-[14px] mt-2">
                  Selected: {toolData.brand}
                </span>
              )}

              <div className="my-[30px]">
                <Text className="font-bold" as="p1">
                  Tool Type
                </Text>
                <Listbox
                  value={selectedTool}
                  onChange={(tool: Tool) => {
                    setSelectedTool(tool);
                    setToolData({ ...toolData, tool_type: tool.type });
                  }}
                >
                  <div className="relative w-full mt-[16px]">
                    <Listbox.Button className="relative w-full h-[50px] p-2 border rounded-lg border-[#e6e6e6] text-left focus:outline-none">
                      <span className="flex items-center gap-2">
                        {selectedTool ? (
                          <span className="text-sm">
                            {selectedTool.type}
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            Select a Tool
                          </span>
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

                    <Listbox.Options className="absolute z-[10] mt-1 max-h-60 w-full left-0 top-[50px] overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
                      {Tools.map((tool) => (
                        <Listbox.Option
                          key={tool.id}
                          value={tool}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-3 pr-9 ${active
                              ? "bg-blue-100 text-blue-900"
                              : "text-gray-900"
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
                              <span className="text-sm">{tool.type}</span>
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>

              <div>
                <Text className="font-bold" as="p1">
                  Description
                </Text>
                <div className="mt-[16px]">
                  <textarea
                    name="description"
                    className="w-full h-[132px] p-4 border border-gray-300 rounded-md resize-none"
                    placeholder="Enter tool description..."
                    value={toolData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setToolData({
                        ...toolData,
                        description: e.target.value,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Purchasing Link */}
          <div>
            <Text className="font-bold text-[16px]" as="h5">
              Purchasing Link{" "}
              <span className="font-medium text-[16px] text-[#808080]">
                (Optional)
              </span>
            </Text>
            <div className="mt-[18px] w-full sm:w-[897px]">
              <InputField
                label=""
                name="purchase_link"
                className={`w-full ${!validation.isValid && touched ? "border-red-500" : ""}`}
                placeholder="Please add purchasing link"
                value={toolData.purchase_link}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setToolData({
                    ...toolData,
                    purchase_link: e.target.value,
                  });
                }}
              />
            </div>
          </div>

          <div className="mt-[60px]">
            <Button
              className="px-[3.5rem] py-[1rem] text-[18px] font-bold"
              variant="primary"
              size="lg"
              onClick={handleImageOutline}
              disabled={isLoading}
            >
              <span className="text-[18px] font-semibold">
                {isLoading ? 'Processing...' : 'Next'}
              </span>
            </Button>
          </div>
        </div>
        <div className="hidden sm:flex-[1]"></div>
      </div>
    </>
  );
};

export default UploadNewToolPage2;