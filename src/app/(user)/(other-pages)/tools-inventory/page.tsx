"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Text from "@/components/ui/Text";
import Image from "next/image";
import { Listbox } from "@headlessui/react";
import { useRouter } from "next/navigation";

type Brand = {
  id: number;
  brand_logo: string;
};

const BRANDS: Brand[] = [
  { id: 0, brand_logo: "Custom" },
  { id: 1, brand_logo: "/images/icons/milwaukee.svg" },
  { id: 2, brand_logo: "/images/icons/bosch.svg" },
  { id: 3, brand_logo: "/images/icons/makita.svg" },
];

const ToolsInventory = () => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const router = useRouter();

  return (
    <>
      <div className="w-full mx-auto mt-[45px]">
        <div className="flex justify-between">
          <Text
            as="h3"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary mb-4 inline-block"
          >
            Tools Inventory
          </Text>
          <div className="flex">
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
        </div>

        <div className="flex justify-between mt-[20px]">
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
      </div>

      <div className="flex flex-col justify-center items-center my-[225px]">
        <div className="flex justify-center w-[261px] h-[261px] bg-[#e8e8e8] rounded-[200px]">
          <Image
            src="/images/icons/wrench.svg"
            width={128.3}
            height={127.46}
            alt="Tool"
          />
        </div>
        <Text
          as="p1"
          className="inline-block text-[#868795] text-[18px] mt-[15px] font-semibold"
        >
          Tool Inventory Is empty
        </Text>
      </div>
    </>
  );
};

export default ToolsInventory;
