"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Plus, MoreVertical, Edit, Trash2, Share } from "lucide-react";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Text from "@/components/ui/Text";
import { Listbox } from "@headlessui/react";
import InputField from "@/components/ui/InputField";

type Brand = {
  id: number;
  brand_logo: string;
};

type Tool = {
  userEmail: string;
  paperType: string;
  brand: string;
  toolType: string;
  description?: string;
  purchaseLink?: string;
  backgroundImg?: string;
};

const BRANDS_DESKTOP: Brand[] = [
  { id: 0, brand_logo: "Custom" },
  { id: 1, brand_logo: "/images/icons/milwaukee.svg" },
  { id: 2, brand_logo: "/images/icons/bosch.svg" },
  { id: 3, brand_logo: "/images/icons/makita.svg" },
];

const BRANDS_MOBILE: Brand[] = [
  { id: 0, brand_logo: "Custom" },
  { id: 1, brand_logo: "/images/icons/milwaukee_mobile.svg" },
  { id: 2, brand_logo: "/images/icons/bosch_mobile.svg" },
  { id: 3, brand_logo: "/images/icons/makita_mobile.svg" },
];

const MobileToolsInventory = () => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Function to check if the device is mobile or desktop
  const checkDeviceType = () => {
    const width = window.innerWidth;
    setIsMobile(width <= 768); // Adjust breakpoint if needed
  };

  // Rerender the component when the window is resized
  useEffect(() => {
    const handleResize = () => {
      checkDeviceType();
    };

    // Initial check
    checkDeviceType();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchTools = async () => {
      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const res = await fetch("/api/user/tool/getAllTools", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch tools");

      const data = await res.json();
      return data.tools;
    };

    const initialize = async () => {
      try {
        const tools = await fetchTools();
        setTools(tools);
        // Handle the fetched tools
      } catch (error) {
        console.error("Error fetching tools:", error);
      }
    };

    initialize();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = (action: string) => {
    console.log(`${action} clicked`);
    setOpenDropdown(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="px-0 md:px-4 py-6 flex-1">
        {/* Title and Notification */}
        <div className="mx-auto w-full max-w-[343px] sm:max-w-[1250px]">
          {/* Top flex: header */}
          <div className="flex items-center justify-between w-full h-full sm:h-[64px]">
            <h1 className="text-2xl font-bold text-gray-900">Tool Inventory</h1>
            <div className="flex sm:flex hidden">
              <Button
                onClick={() => router.push("/tools-inventory/upload-new-tool")}
                variant="primary"
                size="lg"
              >
                <Image
                  src="/images/icons/mdi_add.svg"
                  width={24}
                  height={24}
                  alt="add"
                />
                Upload New Tool
              </Button>
              <div className="flex text-[#bababa] rounded-[14px] border justify-center px-2 mx-2">
                <Image
                  src="/images/icons/bell.svg"
                  width={36}
                  height={36}
                  alt="notifications"
                />
              </div>
            </div>
            <div className="relative w-[30px] h-[30px] rounded-[10px] border-[#c7c7c7] border flex items-center justify-center sm:hidden">
              <Image src="/images/icons/bell.svg" fill alt="notifications" />
            </div>
          </div>

          {/* Bottom flex: search/sort bar */}
          <div className="flex flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-6 mt-4">
            {/* Search Box */}
            <div className="relative w-full w-[193px] sm:w-[382px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <InputField
                label=""
                name="Search Files"
                placeholder="Search Files"
                className="w-full h-[35px] sm:h-[50px] pl-10 rounded-[10px] text-[12px] sm:text-[18px] font-medium"
              />
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-[6px] sm:gap-[18px] w-full sm:w-[288px] sm:h-[50px]">
              <Text
                as="p1"
                className="font-medium text-[12px] sm:text-[22px] w-[78px] h-[26px] whitespace-nowrap"
              >
                Sort by:
              </Text>
              <Listbox value={selectedBrand} onChange={setSelectedBrand}>
                <div className="relative w-full">
                  <Listbox.Button className="relative w-full h-[45px] p-2 border rounded-lg border-[#e6e6e6] text-left focus:outline-none">
                    <span className="flex items-center gap-2">
                      {selectedBrand ? (
                        selectedBrand.brand_logo.endsWith(".svg") ? (
                          <Image
                            src={selectedBrand.brand_logo}
                            width={24}
                            height={24}
                            alt="Selected brand"
                          />
                        ) : (
                          <span className="text-sm">
                            {selectedBrand.brand_logo}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-[12px] sm:text-[16px]">
                          All Brands
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
                  <Listbox.Options className="absolute left-[-50px] mt-4 max-h-60 sm:w-[245px] z-10 overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
                    {(!isMobile ? BRANDS_DESKTOP : BRANDS_MOBILE).map(
                      (brand: Brand) => (
                        <Listbox.Option
                          key={brand.id}
                          value={brand}
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
                                className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]"
                              />
                              {brand.brand_logo.endsWith(".svg") ? (
                                <div className="relative w-[50px] h-[20px] sm:w-[55px] sm:h-[24px] flex items-center justify-center">
                                  <Image
                                    src={brand.brand_logo}
                                    fill
                                    style={{ objectFit: "contain" }}
                                    alt="Brand logo"
                                  />
                                </div>
                              ) : (
                                <span className="text-sm">
                                  {brand.brand_logo}
                                </span>
                              )}
                            </div>
                          )}
                        </Listbox.Option>
                      )
                    )}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          </div>
        </div>

        {/* Tools Display */}
        <div className="flex justify-center sm:justify-start items-center">
          <div className="flex flex-col items-center justify-center py-12">
            {tools.length === 0 && (
              <>
                {/* Empty State */}
                <div className="flex flex-col justify-center items-center w-[204px] h-[204px] sm:w-[261px] sm:h-[261px] bg-[#e8e8e8] rounded-[150px] border-[#e8e8e8]">
                  <div className="relative w-[90px] h-[90px] sm:w-[140px] sm:h-[140px]">
                    <Image
                      src="/images/icons/wrench.svg"
                      fill
                      style={{ objectFit: "contain" }}
                      alt="wrench"
                    />
                  </div>
                </div>

                <p className="text-gray-500 font-medium text-center mt-[19px]">
                  Tool Inventory is empty
                </p>
              </>
            )}

            {/* Tools Grid when not empty */}
            {tools.length > 0 && (
              <div className="w-full max-w-[343px] sm:max-w-[1200px] mx-auto px-4 sm:px-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px]">
                  {tools.map((tool, index) => (
                    <div
                      key={index}
                      className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[248px] sm:w-[266px] sm:h-[248px]"
                    >
                      {/* Tool image */}

                      <div className="relative inline-block" ref={dropdownRef}>
                        <div className="w-[258px] sm:w-[242px]">
                          <div className="relative w-full h-[150px]">
                            {tool.backgroundImg ? (
                              <Image
                                src={tool.backgroundImg}
                                alt={`${tool.toolType} by ${tool.brand}`}
                                fill
                                style={{ objectFit: "cover" }}
                                className=""
                              />
                            ) : (
                              // Placeholder tool icon
                              <div className="relative w-[80px] h-[80px]">
                                <Image
                                  src="/images/icons/wrench.svg"
                                  fill
                                  style={{ objectFit: "contain" }}
                                  alt="tool"
                                  className="text-gray-400"
                                />
                              </div>
                            )}

                            {/* Three dots menu - square button */}
                            {/* <button className="absolute top-0 right-0 w-6 h-6 bg-white border border-[#E6E6E6] flex items-center justify-center">
                            <MoreVertical className="w-4 h-4 text-[#266ca8]" />
                          </button> */}

                            {/* Three dots button */}
                            <button
                              className="absolute top-0 right-0 w-6 h-6 bg-white border border-[#E6E6E6] flex items-center justify-center"
                              onClick={() =>
                                setOpenDropdown(
                                  openDropdown === index ? null : index
                                )
                              }
                            >
                              <MoreVertical className="w-4 h-4 text-[#266ca8] cursor-pointer" />
                            </button>

                            {/* Dropdown menu */}
                            {openDropdown === index && (
                              <div className="absolute top-6 sm:top-5 right-0 sm:right-2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[118px] h-[76px] sm:min-w-[171px] sm:h-[111px] overflow-hidden">
                                <div className="">
                                  <button
                                    onClick={() => handleMenuClick("Edit")}
                                    className="w-full px-1 py-1 sm:px-3 sm:py-2 text-left flex items-center gap-[5px] hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    <div className="relative w-[14.4px] h-[15.98px]">
                                      <Image
                                        src="/images/icons/edit.svg"
                                        fill
                                        style={{ objectFit: "contain" }}
                                        alt="edit"
                                        className="w-[14px] h-[14px]"
                                      />
                                    </div>
                                    <span className="text-[#266ca8] text-[10px] sm:text-[14px] font-medium grow">
                                      Edit
                                    </span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleMenuClick("Publish to profile")
                                    }
                                    className="w-full px-1 py-1 sm:px-3 sm:py-2 text-left flex items-center gap-[5px] hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    <div className="relative w-[14.4px] h-[15.98px]">
                                      <Image
                                        src="/images/icons/share.svg"
                                        fill
                                        style={{ objectFit: "contain" }}
                                        alt="edit"
                                        className="w-[14px] h-[14px]"
                                      />
                                    </div>
                                    <span className="text-[#808080] text-[10px] sm:text-[14px] font-medium grow">
                                      Publish to profile
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => handleMenuClick("Delete")}
                                    className="w-full px-1 py-1 sm:px-3 text-left flex items-center gap-[5px] hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    <div className="relative w-[14.4px] h-[15.98px]">
                                      <Image
                                        src="/images/icons/delete.svg"
                                        fill
                                        style={{ objectFit: "contain" }}
                                        alt="edit"
                                        className="w-[14px] h-[14px]"
                                      />
                                    </div>
                                    <span className="text-[#ed2929] text-[10px] sm:text-[14px] font-medium grow">
                                      Delete
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tool details */}
                        <div className="w-full h-[70px] flex flex-col justify-center">
                          <div className="flex items-baseline gap-[3px]">
                            <h3 className="font-bold text-[16px]">
                              {tool.toolType}
                            </h3>
                            <span className="text-[14px] font-medium">
                              ({tool.brand})
                            </span>
                          </div>

                          <p className="text-[12px] text-[#b3b3b3] font-medium ">
                            {tool.paperType}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <button
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
          onClick={() => router.push("/tools-inventory/upload-new-tool")}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default MobileToolsInventory;
