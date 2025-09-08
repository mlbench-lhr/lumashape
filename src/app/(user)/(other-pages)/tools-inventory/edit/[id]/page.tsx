"use client";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Modal from "@/components/ui/Modal";
import Text from "@/components/ui/Text";
import { Listbox } from "@headlessui/react";
import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  _id: string;
  background_img: string;
  paper_type: string;
  brand: string;
  tool_type: string;
  description: string;
  purchase_link: string;
};

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

const EditTool = () => {
  const params = useParams();
  const router = useRouter();
  const toolId = params.id as string;

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [toolOptions, setToolOptions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [validation, setValidation] = useState({ isValid: true, message: "" });
  const [touched, setTouched] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [toolData, setToolData] = useState<ToolData>({
    _id: "",
    background_img: "",
    paper_type: "",
    brand: "",
    tool_type: "",
    description: "",
    purchase_link: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing tool data
  useEffect(() => {
    const fetchToolData = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        if (!token) {
          router.push("/tools-inventory");
          return;
        }

        const res = await fetch(`/api/user/tool/getTool?toolId=${toolId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch tool data");

        const data = await res.json();
        const tool = data.tool;

        console.log("Fetched tool data:", tool); // Debug log

        setToolData({
          _id: tool._id,
          background_img: tool.backgroundImg || "",
          paper_type: tool.paperType,
          brand: tool.brand,
          tool_type: tool.toolType,
          description: tool.description || "",
          purchase_link: tool.purchaseLink || "",
        });

        // Set background image if exists - FIXED: Use the correct property
        if (tool.backgroundImg) {
          console.log("Setting background URL:", tool.backgroundImg); // Debug log
          setBackgroundUrl(tool.backgroundImg);
          setToolOptions(true);
        }

        // Set selected paper
        const paper = PAPERS.find(p => p.type === tool.paperType);
        if (paper) setSelectedPaper(paper);

        // Set selected tool
        const toolType = Tools.find(t => t.type === tool.toolType);
        if (toolType) setSelectedTool(toolType);

        setIsDataLoading(false);
      } catch (error) {
        console.error("Error fetching tool data:", error);
        toast.error("Failed to load tool data", { position: "top-center" });
        router.push("/tools-inventory");
      }
    };

    if (toolId) {
      fetchToolData();
    }
  }, [toolId, router]);

  useEffect(() => {
    if (pendingUrl) {
      setShowModal(true);
      setModalTitle("Processing...");
      setModalDescription(
        "Detecting tool contours… this usually takes just a few seconds."
      );

      const timer = setTimeout(() => {
        setBackgroundUrl(pendingUrl);
        // FIXED: Also update the toolData state
        setToolData(prev => ({ ...prev, background_img: pendingUrl }));
        setShowModal(false);
        setToolOptions(true);
        setPendingUrl(null);
        setModalTitle("");
        setModalDescription("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [pendingUrl]);

  const handlePreviewOpen = () => {
    if (!backgroundUrl) {
      toast.error("Background image must be selected", { position: "top-center" });
      setIsLoading(false);
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

    // FIXED: Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file", { position: "top-center" });
      return;
    }

    // FIXED: Check file size (optional - 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB", { position: "top-center" });
      return;
    }

    const url = URL.createObjectURL(file);
    console.log("Created object URL:", url); // Debug log
    setPendingUrl(url);
    setShowModal(true);

    console.log("Selected file:", file);
  };

  const handleRemoveImage = () => {
    // FIXED: Clean up object URL to prevent memory leaks
    if (backgroundUrl && backgroundUrl.startsWith('blob:')) {
      URL.revokeObjectURL(backgroundUrl);
    }
    
    setBackgroundUrl(null); // FIXED: Use null instead of empty string
    setToolOptions(false);
    setToolData({ ...toolData, background_img: "" });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    // FIXED: Validate file type for drag and drop too
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file", { position: "top-center" });
      return;
    }

    const url = URL.createObjectURL(file);
    setPendingUrl(url);
    setShowModal(true);

    console.log("Dropped file:", file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpdateTool = async () => {
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
      setShowModal(true);
      setModalTitle("Updating...");
      setModalDescription("Updating your tool information...");

      const token = localStorage.getItem("auth-token");
      if (!token) throw new Error("No auth token");

      let finalImageUrl = toolData.background_img;

      // If a new image was selected, upload it
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const formData = new FormData();
        const fileName = `${Date.now()}_${file.name}`;
        formData.append("file", file);
        formData.append("fileName", fileName);

        const uploadRes = await fetch("/api/user/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        const { url: uploadedUrl } = await uploadRes.json();
        finalImageUrl = uploadedUrl;
      }

      // Update tool data
      const updateData = {
        toolId: toolData._id,
        paperType: toolData.paper_type,
        brand: toolData.brand,
        toolType: toolData.tool_type,
        description: toolData.description,
        purchaseLink: toolData.purchase_link,
        backgroundImg: finalImageUrl,
      };

      const res = await fetch("/api/user/tool/updateTool", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Failed to update tool");

      setShowModal(false);
      toast.success("Tool updated successfully!", { position: "top-center" });
      
      // Redirect back to inventory after a short delay
      setTimeout(() => {
        router.push("/tools-inventory");
      }, 1500);

    } catch (err) {
      console.error(err);
      toast.error("Failed to update tool", { position: "top-center" });
      setShowModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const validateURLWithRegex = (url: string) => {
    if (!url.trim()) return { isValid: true, message: "" };

    const urlRegex =
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

    if (urlRegex.test(url)) {
      return { isValid: true, message: "" };
    } else {
      return {
        isValid: false,
        message: "Please enter a valid URL (e.g., https://example.com)",
      };
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading tool data...</div>
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <Modal
          isOpen={showModal}
          title={modalTitle}
          description={modalDescription}
        />
      )}
      <ToastContainer />
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
            Edit Tool Info
          </Text>
        </div>
        <div className="mt-[15px]">
          <Text as="p1" className="text-[#808080]">
            Update your tool information. You can change the image, brand, type, description, and purchase link.
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
                  setToolData({ ...toolData, paper_type: paper.type });
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
                
                {/* FIXED: Improved image display logic */}
                <div
                  className="flex items-center justify-center h-[376px] bg-cover bg-center border-b-0 rounded-t-[21px] border-transparent overflow-hidden relative"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {backgroundUrl ? (
                    <Image
                      src={backgroundUrl}
                      alt="Tool background"
                      fill
                      className="object-cover rounded-t-[21px]"
                      onError={(e) => {
                        console.error("Image failed to load:", backgroundUrl);
                        // Optionally set a fallback or clear the backgroundUrl
                        setBackgroundUrl(null);
                      }}
                      onLoad={() => {
                        console.log("Image loaded successfully:", backgroundUrl);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="p-[15px]">
                        <Image
                          src="/images/icons/upload.svg"
                          width={30}
                          height={30}
                          alt="upload"
                          className="cursor-pointer"
                          onClick={handleImageUpload}
                        />
                      </div>
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
                    </div>
                  )}
                </div>

                {isPreviewOpen && backgroundUrl && (
                  <div
                    className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
                    onClick={handlePreviewClose}
                  >
                    <div className="relative max-w-[90vw] max-h-[90vh]">
                      <Image
                        src={backgroundUrl}
                        alt="Full Preview"
                        width={800}
                        height={800}
                        className="object-contain max-h-full max-w-full"
                      />
                    </div>
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

              {(toolOptions || backgroundUrl) && (
                <div className="flex flex-col w-full sm:w-[431px] sm:h-[428px]">
                  <Text className="font-bold" as="p1">
                    Brand
                  </Text>
                  <div className="flex justify-start mt-[20px] gap-[3px]">
                    <div className={`w-[91px] h-[65px] relative border-2 ${toolData.brand === "Bosch" ? "border-blue-500" : "border-transparent"} bg-[#d9d9d9]`}>
                      <Image
                        className="cursor-pointer"
                        src="/images/icons/workspace/Bosch.svg"
                        alt="bosch"
                        fill
                        style={{ objectFit: "contain" }}
                        onClick={() => {
                          setToolData({ ...toolData, brand: "Bosch" });
                        }}
                      />
                    </div>
                    <div className={`w-[91px] h-[65px] relative border-2 ${toolData.brand === "Milwaukee" ? "border-blue-500" : "border-transparent"}`}>
                      <Image
                        className="cursor-pointer"
                        src="/images/icons/workspace/Milwaukee.svg"
                        fill
                        alt="milwaukee"
                        style={{ objectFit: "contain" }}
                        onClick={() => {
                          // FIXED: Corrected brand name
                          setToolData({ ...toolData, brand: "Milwaukee" });
                        }}
                      />
                    </div>
                    <div className={`w-[91px] h-[65px] relative border-2 ${toolData.brand === "Makita" ? "border-blue-500" : "border-transparent"}`}>
                      <Image
                        className="cursor-pointer"
                        src="/images/icons/workspace/Makita.svg"
                        fill
                        alt="makita"
                        style={{ objectFit: "contain" }}
                        onClick={() => {
                          // FIXED: Corrected brand name
                          setToolData({ ...toolData, brand: "Makita" });
                        }}
                      />
                    </div>
                  </div>

                  {toolData.brand && (
                    <span className="text-blue-600 text-[14px] font-medium mt-2">
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
                                `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                  active
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
                        placeholder="Custom"
                        value={toolData.description}
                        onChange={(
                          e: React.ChangeEvent<HTMLTextAreaElement>
                        ) => {
                          setToolData({
                            ...toolData,
                            description: e.target.value,
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(toolOptions || backgroundUrl) && (
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
                    className={`w-full ${
                      !validation.isValid && touched ? "border-red-500" : ""
                    }`}
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
            )}

            <div className="mt-[60px]">
              <Button
                className="px-[3.5rem] py-[1rem] text-[18px] font-bold"
                variant="primary"
                size="lg"
                onClick={handleUpdateTool}
                disabled={isLoading}
              >
                <span className="text-[18px] font-semibold">
                  {isLoading ? "Updating..." : "Update Tool"}
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

export default EditTool;