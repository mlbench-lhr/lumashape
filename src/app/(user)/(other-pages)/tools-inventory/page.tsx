"use client";

// "use client";

// import React, { useState } from "react";
// import Button from "@/components/ui/Button";
// import InputField from "@/components/ui/InputField";
// import Text from "@/components/ui/Text";
// import Image from "next/image";
// import { Listbox } from "@headlessui/react";
// import { useRouter } from "next/navigation";

// type Brand = {
//   id: number;
//   brand_logo: string;
// };

// const BRANDS: Brand[] = [
//   { id: 0, brand_logo: "Custom" },
//   { id: 1, brand_logo: "/images/icons/milwaukee.svg" },
//   { id: 2, brand_logo: "/images/icons/bosch.svg" },
//   { id: 3, brand_logo: "/images/icons/makita.svg" },
// ];

// const ToolsInventory = () => {
//   const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
//   const router = useRouter();

//   return (
//     <>
//       <div className="w-full mx-auto mt-[45px]">
//         <div className="flex justify-between">
//           <Text
//             as="h3"
//             className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary mb-4 inline-block"
//           >
//             Tools Inventory
//           </Text>
// <div className="flex">
//   <Button
//     onClick={() => router.push("/tools-inventory/upload-new-tool")}
//     variant="primary"
//     size="lg"
//   >
//     <Image
//       src="/images/icons/mdi_add.svg"
//       width={24}
//       height={24}
//       alt="add"
//     />
//     Upload New Tool
//   </Button>
//   <div className="flex text-[#bababa] rounded-[14px] border justify-center px-2 mx-2">
//     <Image
//       src="/images/icons/bell.svg"
//       width={36}
//       height={36}
//       alt="notifications"
//     />
//   </div>
// </div>
//         </div>

{
  /* <div className="flex justify-between mt-[20px]">
  <InputField
    label=""
    name="Search Files"
    isSearchable={true}
    className="w-[382px] rounded-[10px]"
  />

  <div className="flex items-center w-[300px]">
    <Text as="p1" className="font-medium w-[100px]">
      Sort By:
    </Text>

    <Listbox value={selectedBrand} onChange={setSelectedBrand}>
      <div className="relative w-[192px]">
        <Listbox.Button className="relative w-full h-[50px] p-2 border rounded-lg border-[#e6e6e6] text-left focus:outline-none">
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
                <span className="text-sm">{selectedBrand.brand_logo}</span>
              )
            ) : (
              <span className="text-gray-400">All Brands</span>
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

        <Listbox.Options className="absolute mt-1 max-h-60 w-[245px] left-[-50px] top-[65px] overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
          {BRANDS.map((brand) => (
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
                    placeholder="All Brands"
                    className="w-4 h-4"
                  />
                  {brand.brand_logo.endsWith(".svg") ? (
                    <div
                      className={`relative ${
                        brand.brand_logo.toLowerCase().includes("milwaukee")
                          ? "w-[48px] h-[24px]"
                          : brand.brand_logo.toLowerCase().includes("bosch")
                          ? "w-[53px] h-[19px]"
                          : brand.brand_logo.toLowerCase().includes("makita")
                          ? "w-[55px] h-[41px]"
                          : ""
                      }`}
                    >
                      <Image
                        src={brand.brand_logo}
                        fill
                        style={{ objectFit: "contain" }}
                        alt="Brand logo"
                      />
                    </div>
                  ) : (
                    <span className="text-sm">{brand.brand_logo}</span>
                  )}
                </div>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  </div>
</div> */
}
//       </div>

//       <div className="flex flex-col justify-center items-center my-[225px]">
//         <div className="flex justify-center w-[261px] h-[261px] bg-[#e8e8e8] rounded-[200px]">
//           <Image
//             src="/images/icons/wrench.svg"
//             width={128.3}
//             height={127.46}
//             alt="Tool"
//           />
//         </div>
//         <Text
//           as="p1"
//           className="inline-block text-[#868795] text-[18px] mt-[15px] font-semibold"
//         >
//           Tool Inventory Is empty
//         </Text>
//       </div>
//     </>
//   );
// };

// export default ToolsInventory;

import React, { useState } from "react";
import { ChevronDown, Search, Bell, Plus, Menu } from "lucide-react";
import HamburgerMenu from "@/components/ui/HamburgerMenu";
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

const BRANDS: Brand[] = [
  { id: 0, brand_logo: "Custom" },
  { id: 1, brand_logo: "Milwaukee" },
  { id: 2, brand_logo: "Bosch" },
  { id: 3, brand_logo: "Makita" },
];

const MobileToolsInventory = () => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}

      {/* Status Bar Simulation */}
      <HamburgerMenu />

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Title and Notification */}
        <div className="flex items-center justify-between mb-6">
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
            {/* <Bell className="w-5 h-5 text-gray-600" /> */}
            <Image
              src="/images/icons/bell.svg"
              fill
              alt="notifications"
            />
          </div>
        </div>

        <div className="flex relative w-[350px] mx-auto sm:w-full sm:mx-0 justify-between mt-[20px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <InputField
            label=""
            name="Search Files"
            placeholder="Search Files"
            className="w-[193px] sm:w-[382px] pl-10 rounded-[10px]"
          />

          <div className="flex items-center w-[136px] sm:w-[300px]">
            <Text as="p1" className="font-medium text-[12px] w-[100px]">
              Sort By:
            </Text>

            <Listbox value={selectedBrand} onChange={setSelectedBrand}>
              <div className="relative w-[192px]">
                <Listbox.Button className="relative w-full h-[50px] p-2 border rounded-lg border-[#e6e6e6] text-left focus:outline-none">
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
                      <span className="text-gray-400">All Brands</span>
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

                <Listbox.Options className="absolute mt-1 max-h-60 w-[150px] left-[-50px] z-10 sm:w-[245px] top-[65px] overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
                  {BRANDS.map((brand) => (
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
                            placeholder="All Brands"
                            className="w-4 h-4"
                          />
                          {brand.brand_logo.endsWith(".svg") ? (
                            <div
                              className={`relative ${
                                brand.brand_logo
                                  .toLowerCase()
                                  .includes("milwaukee")
                                  ? "w-[48px] h-[24px]"
                                  : brand.brand_logo
                                      .toLowerCase()
                                      .includes("bosch")
                                  ? "w-[53px] h-[19px]"
                                  : brand.brand_logo
                                      .toLowerCase()
                                      .includes("makita")
                                  ? "w-[55px] h-[41px]"
                                  : ""
                              }`}
                            >
                              <Image
                                src={brand.brand_logo}
                                fill
                                style={{ objectFit: "contain" }}
                                alt="Brand logo"
                              />
                            </div>
                          ) : (
                            <span className="text-sm">{brand.brand_logo}</span>
                          )}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
        </div>

        {/* <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Files"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-700 font-medium whitespace-nowrap">
              Sort by:
            </span>
            <div className="relative flex-1">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="text-gray-600">
                  {selectedBrand ? selectedBrand.brand_logo : "All Brands"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-10">
                  {BRANDS.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => {
                        setSelectedBrand(brand);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        {selectedBrand?.id === brand.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="text-gray-900">{brand.brand_logo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div> */}

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12">
          {/* Blue dashed border container */}
          <div className="relative border-2 border-dashed border-blue-400 rounded-lg p-8 mb-4">
            {/* Corner squares */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-400"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-400"></div>

            {/* Tool Icon Circle */}
            <div className="w-48 h-48 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <div className="w-16 h-16 text-gray-400">
                {/* Wrench Icon SVG */}
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-full h-full"
                >
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                </svg>
              </div>
            </div>

            {/* Text */}
            <p className="text-gray-500 font-medium text-center">
              Tool Inventory is empty
            </p>

            {/* Dimensions label */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
              262.57 × 240
            </div>
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <button className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors">
          <Plus className="w-6 h-6 text-white" onClick={() => router.push("/tools-inventory/upload-new-tool")}/>
        </button>
      </div>
    </div>
  );
};

export default MobileToolsInventory;
