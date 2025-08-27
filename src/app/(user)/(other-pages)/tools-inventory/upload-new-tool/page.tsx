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

const UploadNewTool = () => {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [toolOptions, setToolOptions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const router = useRouter();
  const [validation, setValidation] = useState({ isValid: true, message: "" });
  const [touched, setTouched] = useState(false);

  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    if (pendingUrl) {
      setShowModal(true);
      setModalTitle("Processing...");
      setModalDescription(
        "Detecting tool contours… this usually takes just a few seconds."
      );

      const timer = setTimeout(() => {
        setBackgroundUrl(pendingUrl); // apply as background after modal
        setShowModal(false);
        setToolOptions(true);
        setPendingUrl(null);
        setModalTitle("");
        setModalDescription("");
      }, 2000); // show modal for 2s before background updates

      return () => clearTimeout(timer);
    }
  }, [pendingUrl]);

  const handleImageUpload = () => {
    fileInputRef.current?.click(); // trigger file picker
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPendingUrl(url);
    setShowModal(true);

    // Do something with the file, e.g., upload to server or preview
    console.log("Selected file:", file);
  };

  const handleRemoveImage = () => {
    setBackgroundUrl("");
    setToolOptions(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // reset the input so selecting the same file triggers onChange
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPendingUrl(url);
    setShowModal(true);

    console.log("Dropped file:", file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // necessary to allow drop
  };

  const handleImageOutline = () => {
    if (!toolData.paper_type) {
      toast.error("Paper type must be selected", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    }

    if (!backgroundUrl) {
      toast.error("An image must be selected", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    }

    if (!toolData.brand) {
      toast.error("Brand must be selected", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    }

    if (!toolData.tool_type) {
      toast.error("Tool type must be selected", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    }

    if (!toolData.description) {
      toast.error("Description must be added", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    }

    if (toolData.purchase_link.trim()) {
      const urlRegex =
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

      if (!urlRegex.test(toolData.purchase_link)) {
        toast.error(
          "Purchase link must be a valid URL (e.g. https://example.com)",
          { position: "top-center", autoClose: 5000 }
        );
        setIsLoading(false);
        return;
      }
    }

    if (!toolData.purchase_link) setShowModal(true);
    setModalTitle("Please hold on....");
    setModalDescription(
      "We’re analyzing the image and creating your DXF file. This may take up to 3 minutes."
    );

    setTimeout(() => {
      setShowModal(false);
      setModalTitle("");
      router.push(
        `/tools-inventory/tool-detected?paper=${toolData.paper_type}&brand=${toolData.brand}&type=${toolData.tool_type}`
      );
    }, 2000);
  };

  const validateURLWithRegex = (url: string) => {
    if (!url.trim()) return { isValid: true, message: "" }; // Optional field

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

  return (
    <>
      {showModal && (
        <Modal
          isOpen={showModal}
          title={modalTitle}
          description={modalDescription}
        />
      )}
      <div className="w-full mx-auto my-[45px]">
        <div className="flex gap-[13px]">
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
            Enter Tool Info
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
                    <div className="p-[5px]">
                      <Image
                        src="/images/icons/clipboard.svg"
                        alt="clipboard"
                        width={25}
                        height={25}
                        className="cursor-pointer"
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

              {toolOptions && (
                <div className="flex flex-col w-full sm:w-[431px] sm:h-[428px]">
                  <Text className="font-bold" as="p1">
                    Brand
                  </Text>
                  <div className="flex justify-start mt-[20px] gap-[3px]">
                    <div className="w-[91px] h-[65px] bg-[#d9d9d9] relative">
                      <Image
                        className="cursor-pointer"
                        src="/images/icons/workspace/Bosch.svg"
                        alt="bosch"
                        fill
                        style={{ objectFit: "contain" }} // or "cover" if you want it to fill fully
                        onClick={(e: React.MouseEvent<HTMLImageElement>) => {
                          const src = (e.target as HTMLImageElement).src
                            .split("/")
                            .pop()
                            ?.split(".")[0]; // e.target.src
                          setToolData({ ...toolData, brand: src as string });
                        }}
                      />
                    </div>
                    <div className="w-[91px] h-[65px] relative">
                      <Image
                        className="cursor-pointer"
                        src="/images/icons/workspace/Milwakee.svg"
                        fill
                        alt="bosch"
                        style={{ objectFit: "contain" }}
                        onClick={(e: React.MouseEvent<HTMLImageElement>) => {
                          const src = (e.target as HTMLImageElement).src
                            .split("/")
                            .pop()
                            ?.split(".")[0]; // e.target.src
                          setToolData({ ...toolData, brand: src as string });
                        }}
                      />
                    </div>
                    <div className="w-[91px] h-[65px] relative">
                      <Image
                        className="cursor-pointer"
                        src="/images/icons/workspace/Dewalt.svg"
                        fill
                        alt="bosch"
                        style={{ objectFit: "contain" }}
                        onClick={(e: React.MouseEvent<HTMLImageElement>) => {
                          const src = (e.target as HTMLImageElement).src
                            .split("/")
                            .pop()
                            ?.split(".")[0]; // e.target.src
                          setToolData({ ...toolData, brand: src as string });
                        }}
                      />
                    </div>
                  </div>

                  {toolData.brand && (
                    <span className="text-red-600 text-[14px]">
                      {toolData.brand}
                    </span>
                  )}
                  {toolOptions && (
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
                  )}

                  {toolOptions && (
                    <div>
                      <Text className="font-bold" as="p1">
                        Description
                      </Text>
                      <div className="mt-[16px]">
                        <textarea
                          name="description"
                          className="w-full h-[132px] p-4 border border-gray-300 rounded-md resize-none" // Styling for the textarea
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
                  )}
                </div>
              )}
            </div>

            {toolOptions && (
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
                onClick={handleImageOutline}
              >
                <span className="text-[18px] font-semibold">Next</span>
              </Button>
            </div>
          </div>
          <div className="hidden sm:flex-[1]"></div>
        </div>
      </div>
    </>
  );
};

export default UploadNewTool;
