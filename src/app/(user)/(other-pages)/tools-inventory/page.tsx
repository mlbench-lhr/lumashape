// "use client";

// // "use client";

// // import React, { useState } from "react";
// // import Button from "@/components/ui/Button";
// // import InputField from "@/components/ui/InputField";
// // import Text from "@/components/ui/Text";
// // import Image from "next/image";
// // import { Listbox } from "@headlessui/react";
// // import { useRouter } from "next/navigation";

// // type Brand = {
// //   id: number;
// //   brand_logo: string;
// // };

// // const BRANDS: Brand[] = [
// //   { id: 0, brand_logo: "Custom" },
// //   { id: 1, brand_logo: "/images/icons/milwaukee.svg" },
// //   { id: 2, brand_logo: "/images/icons/bosch.svg" },
// //   { id: 3, brand_logo: "/images/icons/makita.svg" },
// // ];

// // const ToolsInventory = () => {
// //   const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
// //   const router = useRouter();

// //   return (
// //     <>
// //       <div className="w-full mx-auto mt-[45px]">
// //         <div className="flex justify-between">
// //           <Text
// //             as="h3"
// //             className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary mb-4 inline-block"
// //           >
// //             Tools Inventory
// //           </Text>
// // <div className="flex">
// //   <Button
// //     onClick={() => router.push("/tools-inventory/upload-new-tool")}
// //     variant="primary"
// //     size="lg"
// //   >
// //     <Image
// //       src="/images/icons/mdi_add.svg"
// //       width={24}
// //       height={24}
// //       alt="add"
// //     />
// //     Upload New Tool
// //   </Button>
// //   <div className="flex text-[#bababa] rounded-[14px] border justify-center px-2 mx-2">
// //     <Image
// //       src="/images/icons/bell.svg"
// //       width={36}
// //       height={36}
// //       alt="notifications"
// //     />
// //   </div>
// // </div>
// //         </div>

// {
//   /* <div className="flex justify-between mt-[20px]">
//   <InputField
//     label=""
//     name="Search Files"
//     isSearchable={true}
//     className="w-[382px] rounded-[10px]"
//   />

//   <div className="flex items-center w-[300px]">
//     <Text as="p1" className="font-medium w-[100px]">
//       Sort By:
//     </Text>

//     <Listbox value={selectedBrand} onChange={setSelectedBrand}>
//       <div className="relative w-[192px]">
//         <Listbox.Button className="relative w-full h-[50px] p-2 border rounded-lg border-[#e6e6e6] text-left focus:outline-none">
//           <span className="flex items-center gap-2">
//             {selectedBrand ? (
//               selectedBrand.brand_logo.endsWith(".svg") ? (
//                 <Image
//                   src={selectedBrand.brand_logo}
//                   width={24}
//                   height={24}
//                   alt="Selected brand"
//                 />
//               ) : (
//                 <span className="text-sm">{selectedBrand.brand_logo}</span>
//               )
//             ) : (
//               <span className="text-gray-400">All Brands</span>
//             )}
//           </span>
//           <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
//             <Image
//               src="/images/icons/arrow_down.svg"
//               width={20}
//               height={20}
//               alt="chevron down"
//             />
//           </span>
//         </Listbox.Button>

//         <Listbox.Options className="absolute mt-1 max-h-60 w-[245px] left-[-50px] top-[65px] overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
//           {BRANDS.map((brand) => (
//             <Listbox.Option
//               key={brand.id}
//               value={brand}
//               className={({ active }) =>
//                 `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
//                   active ? "text-blue-900" : "text-gray-900"
//                 }`
//               }
//             >
//               {({ selected }) => (
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="radio"
//                     readOnly
//                     checked={selected}
//                     placeholder="All Brands"
//                     className="w-4 h-4"
//                   />
//                   {brand.brand_logo.endsWith(".svg") ? (
//                     <div
//                       className={`relative ${
//                         brand.brand_logo.toLowerCase().includes("milwaukee")
//                           ? "w-[48px] h-[24px]"
//                           : brand.brand_logo.toLowerCase().includes("bosch")
//                           ? "w-[53px] h-[19px]"
//                           : brand.brand_logo.toLowerCase().includes("makita")
//                           ? "w-[55px] h-[41px]"
//                           : ""
//                       }`}
//                     >
//                       <Image
//                         src={brand.brand_logo}
//                         fill
//                         style={{ objectFit: "contain" }}
//                         alt="Brand logo"
//                       />
//                     </div>
//                   ) : (
//                     <span className="text-sm">{brand.brand_logo}</span>
//                   )}
//                 </div>
//               )}
//             </Listbox.Option>
//           ))}
//         </Listbox.Options>
//       </div>
//     </Listbox>
//   </div>
// </div> */
// }
// //       </div>

// //       <div className="flex flex-col justify-center items-center my-[225px]">
// //         <div className="flex justify-center w-[261px] h-[261px] bg-[#e8e8e8] rounded-[200px]">
// //           <Image
// //             src="/images/icons/wrench.svg"
// //             width={128.3}
// //             height={127.46}
// //             alt="Tool"
// //           />
// //         </div>
// //         <Text
// //           as="p1"
// //           className="inline-block text-[#868795] text-[18px] mt-[15px] font-semibold"
// //         >
// //           Tool Inventory Is empty
// //         </Text>
// //       </div>
// //     </>
// //   );
// // };

// // export default ToolsInventory;
// import React, { useEffect, useState } from "react";
// import { Search, Plus } from "lucide-react";
// import Button from "@/components/ui/Button";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import Text from "@/components/ui/Text";
// import { Listbox } from "@headlessui/react";
// import InputField from "@/components/ui/InputField";

// type Brand = {
//   id: number;
//   brand_logo: string;
// };

// type Tool = {
//   userEmail: string;
//   paperType: string;
//   brand: string;
//   toolType: string;
//   description?: string;
//   purchaseLink?: string;
//   backgroundImg?: string;
// };

// const BRANDS_DESKTOP: Brand[] = [
//   { id: 0, brand_logo: "Custom" },
//   { id: 1, brand_logo: "/images/icons/milwaukee.svg" },
//   { id: 2, brand_logo: "/images/icons/bosch.svg" },
//   { id: 3, brand_logo: "/images/icons/makita.svg" },
// ];

// const BRANDS_MOBILE: Brand[] = [
//   { id: 0, brand_logo: "Custom" },
//   { id: 1, brand_logo: "/images/icons/milwaukee_mobile.svg" },
//   { id: 2, brand_logo: "/images/icons/bosch_mobile.svg" },
//   { id: 3, brand_logo: "/images/icons/makita_mobile.svg" },
// ];

// const Tools: Tool[] = [];

// const MobileToolsInventory = () => {
//   const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
//   const router = useRouter();
//   const [isMobile, setIsMobile] = useState(false);
//   const [tools, setTools] = useState<Tool[]>([]);

//   // Function to check if the device is mobile or desktop
//   const checkDeviceType = () => {
//     const width = window.innerWidth;
//     setIsMobile(width <= 768); // Adjust breakpoint if needed
//   };

//   // Rerender the component when the window is resized
//   useEffect(() => {
//     const handleResize = () => {
//       checkDeviceType();
//     };

//     // Initial check
//     checkDeviceType();

//     window.addEventListener("resize", handleResize);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     const fetchTools = async () => {
//       const token = localStorage.getItem("auth-token");
//       if (!token) return;

//       const res = await fetch("/api/user/tool/getAllTools", {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) throw new Error("Failed to fetch tools");

//       const data = await res.json();
//       return data.tools;
//     };

//     const initialize = async () => {
//       try {
//         const tools = await fetchTools();
//         setTools(tools);
//         // Handle the fetched tools
//       } catch (error) {
//         console.error("Error fetching tools:", error);
//       }
//     };

//     initialize();
//   }, []);

//   return (
//     <div className="flex flex-col min-h-screen">
//       {/* Main Content */}
//       <div className="px-0 md:px-4 py-6 flex-1">
//         {/* Title and Notification */}
//         <div className="mx-auto w-full max-w-[343px] sm:max-w-[1200px]">
//           {/* Top flex: header */}
//           <div className="flex items-center justify-between w-full h-full sm:h-[64px]">
//             <h1 className="text-2xl font-bold text-gray-900">Tool Inventory</h1>
//             <div className="flex sm:flex hidden">
//               <Button
//                 onClick={() => router.push("/tools-inventory/upload-new-tool")}
//                 variant="primary"
//                 size="lg"
//               >
//                 <Image
//                   src="/images/icons/mdi_add.svg"
//                   width={24}
//                   height={24}
//                   alt="add"
//                 />
//                 Upload New Tool
//               </Button>
//               <div className="flex text-[#bababa] rounded-[14px] border justify-center px-2 mx-2">
//                 <Image
//                   src="/images/icons/bell.svg"
//                   width={36}
//                   height={36}
//                   alt="notifications"
//                 />
//               </div>
//             </div>
//             <div className="relative w-[30px] h-[30px] rounded-[10px] border-[#c7c7c7] border flex items-center justify-center sm:hidden">
//               <Image src="/images/icons/bell.svg" fill alt="notifications" />
//             </div>
//           </div>

//           {/* Bottom flex: search/sort bar */}
//           <div className="flex flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-6 mt-4">
//             {/* Search Box */}
//             <div className="relative w-full sm:w-[382px]">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <InputField
//                 label=""
//                 name="Search Files"
//                 placeholder="Search Files"
//                 className="w-full h-[45px] pl-10 rounded-[10px]"
//               />
//             </div>

//             {/* Sort By */}
//             <div className="flex items-center gap-2 w-full sm:w-[288px]">
//               <Text as="p1" className="font-medium text-[14px] sm:text-[12px]">
//                 Sort by:
//               </Text>
//               <Listbox value={selectedBrand} onChange={setSelectedBrand}>
//                 <div className="relative w-full">
//                   <Listbox.Button className="relative w-full h-[45px] p-2 border rounded-lg border-[#e6e6e6] text-left focus:outline-none">
//                     <span className="flex items-center gap-2">
//                       {selectedBrand ? (
//                         selectedBrand.brand_logo.endsWith(".svg") ? (
//                           <Image
//                             src={selectedBrand.brand_logo}
//                             width={24}
//                             height={24}
//                             alt="Selected brand"
//                           />
//                         ) : (
//                           <span className="text-sm">
//                             {selectedBrand.brand_logo}
//                           </span>
//                         )
//                       ) : (
//                         <span className="text-gray-400 text-[12px]">
//                           All Brands
//                         </span>
//                       )}
//                     </span>
//                     <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
//                       <Image
//                         src="/images/icons/arrow_down.svg"
//                         width={20}
//                         height={20}
//                         alt="chevron down"
//                       />
//                     </span>
//                   </Listbox.Button>
//                   <Listbox.Options className="absolute mt-1 max-h-60 w-full sm:w-[245px] z-10 overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
//                     {(!isMobile ? BRANDS_DESKTOP : BRANDS_MOBILE).map(
//                       (brand: Brand) => (
//                         <Listbox.Option
//                           key={brand.id}
//                           value={brand}
//                           className={({ active }) =>
//                             `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
//                               active ? "text-blue-900" : "text-gray-900"
//                             }`
//                           }
//                         >
//                           {({ selected }) => (
//                             <div className="flex items-center gap-2">
//                               <input
//                                 type="radio"
//                                 readOnly
//                                 checked={selected}
//                                 className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]"
//                               />
//                               {brand.brand_logo.endsWith(".svg") ? (
//                                 <div className="relative w-[50px] h-[20px] sm:w-[55px] sm:h-[24px] flex items-center justify-center">
//                                   <Image
//                                     src={brand.brand_logo}
//                                     fill
//                                     style={{ objectFit: "contain" }}
//                                     alt="Brand logo"
//                                   />
//                                 </div>
//                               ) : (
//                                 <span className="text-sm">
//                                   {brand.brand_logo}
//                                 </span>
//                               )}
//                             </div>
//                           )}
//                         </Listbox.Option>
//                       )
//                     )}
//                   </Listbox.Options>
//                 </div>
//               </Listbox>
//             </div>
//           </div>
//         </div>

//         {/* Empty State */}
//         <div className="flex-1 flex justify-center items-center">
//           <div className="flex flex-col items-center justify-center py-12">
//             {tools.length === 0 && (
//               <>
//                 {/* Blue dashed border container */}
//                 <div className="flex flex-col justify-center items-center w-[204px] h-[204px] sm:w-[261px] sm:h-[261px] bg-[#e8e8e8] rounded-[150px] border-[#e8e8e8]">
//                   {/* Corner squares */}
//                   <div className="relative w-[90px] h-[90px] sm:w-[140px] sm:h-[140px]">
//                     <Image
//                       src="/images/icons/wrench.svg"
//                       fill
//                       style={{ objectFit: "contain" }}
//                       alt="wrench"
//                     />
//                   </div>
//                 </div>

//                 <p className="text-gray-500 font-medium text-center mt-[19px]">
//                   Tool Inventory is empty
//                 </p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Floating Add Button */}
//       <div className="fixed bottom-6 right-6 sm:hidden">
//         <button
//           className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
//           onClick={() => router.push("/tools-inventory/upload-new-tool")}
//         >
//           <Plus className="w-6 h-6 text-white" />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default MobileToolsInventory;

"use client";

import React, { useEffect, useState } from "react";
import { Search, Plus, MoreVertical } from "lucide-react";
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="px-0 md:px-4 py-6 flex-1">
        {/* Title and Notification */}
        <div className="mx-auto w-full max-w-[343px] sm:max-w-[1200px]">
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
            <div className="relative w-full sm:w-[382px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <InputField
                label=""
                name="Search Files"
                placeholder="Search Files"
                className="w-full h-[45px] pl-10 rounded-[10px]"
              />
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2 w-full sm:w-[288px]">
              <Text as="p1" className="font-medium text-[14px] sm:text-[12px]">
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
                        <span className="text-gray-400 text-[12px]">
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
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full sm:w-[245px] z-10 overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
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
        <div className="flex items-center">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {tools.map((tool, index) => (
                    // <div
                    //   key={index}
                    //   className="bg-white border border-gray-200 overflow-hidden w-[266px] h-[248px]"
                    // >
                    //   {/* Tool image */}
                    //   <div className="relative w-[242px] h-[178px] bg-[#d4d4d4] flex items-center justify-center">
                    //     {tool.backgroundImg ? (
                    //       <Image
                    //         src={tool.backgroundImg}
                    //         alt={`${tool.toolType} by ${tool.brand}`}
                    //         fill
                    //         style={{ objectFit: "contain" }}
                    //       />
                    //     ) : (
                    //       // Placeholder tool icon
                    //       <div className="relative w-[80px] h-[80px]">
                    //         <Image
                    //           src="/images/icons/wrench.svg"
                    //           fill
                    //           style={{ objectFit: "contain" }}
                    //           alt="tool"
                    //           className="text-gray-400"
                    //         />
                    //       </div>
                    //     )}

                    //     {/* Three dots menu - square button */}
                    //     <button className="absolute top-3 right-3 w-6 h-6 bg-white border border-gray-200 flex items-center justify-center">
                    //       <MoreVertical className="w-4 h-4 text-gray-600" />
                    //     </button>
                    //   </div>

                    //   {/* Tool details */}
                    //   <div className="p-4 h-[68px]">
                    //     <div className="flex items-baseline gap-1 mb-1">
                    //       <h3 className="font-semibold text-gray-900">
                    //         {tool.toolType}
                    //       </h3>
                    //       <span className="text-sm text-gray-600">
                    //         ({tool.brand})
                    //       </span>
                    //     </div>

                    //     <p className="text-gray-500 text-sm">
                    //       {tool.paperType}
                    //     </p>
                    //   </div>
                    // </div>
                    <div
                      key={index}
                      className="bg-white rounded-xl border border-[#E6E6E6] overflow-hidden shadow-sm hover:shadow transition-shadow"
                    >
                      <div className="relative w-full aspect-[4/3] bg-[#F4F4F4]">
                        {tool.backgroundImg ? (
                          <Image
                            src={tool.backgroundImg}
                            // alt={`${tool.toolType} by ${tool.brand}`}
                            alt="sdfgdf"
                            fill
                            className="object-cover"
                            priority={index < 6}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                              src="/images/icons/wrench.svg"
                              width={84}
                              height={84}
                              alt="tool"
                            />
                          </div>
                        )}

                        <button
                          className="absolute top-3 right-3 h-9 px-3 rounded-md bg-white/95 border border-gray-200 shadow-sm flex items-center justify-center"
                          aria-label="More"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-700" />
                        </button>
                      </div>

                      <div className="px-6 pt-4 pb-6">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-semibold text-[#1F2D3D] leading-tight">
                            {tool.toolType}
                          </h3>
                          <span className="text-xl text-[#667085]">
                            ({tool.brand})
                          </span>
                        </div>

                        <p className="mt-3 text-2xl text-[#98A2B3]">
                          {tool.paperType}
                        </p>
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
