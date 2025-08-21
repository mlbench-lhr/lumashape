"use client";

import Text from "@/components/ui/Text";
import { Listbox } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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

const UploadNewTool = () => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  return (
    <>
      <div className="w-full mx-auto">
        <div className="flex gap-[13px]">
          <div className="py-[13px] px-[11px]">
            <Image
              src="/images/icons/back.svg"
              width={24}
              height={22}
              alt="back"
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
              <Listbox value={selectedBrand} onChange={setSelectedBrand}>
                <div className="relative w-full">
                  <Listbox.Button className="relative w-full h-[50px] border p-4 rounded-lg border-[#e6e6e6] text-left focus:outline-none">
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
                        <span className="text-[#808080]">
                          Select paper type
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

                  <Listbox.Options className="absolute mt-1 max-h-60 w-[245px] left-[-50px] top-[65px] overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
                    {BRANDS.map((brand) => (
                      <Listbox.Option
                        key={brand.id}
                        value={brand}
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
                              placeholder="All Brands"
                              className="w-4 h-4"
                            />
                            {brand.brand_logo.endsWith(".svg") ? (
                              <Image
                                src={brand.brand_logo}
                                width={48}
                                height={24}
                                alt="Brand logo"
                              />
                            ) : (
                              <span className="text-sm">
                                {brand.brand_logo}
                              </span>
                            )}
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <div className="flex items-center justify-center w-1/2 mt-[30px] border rounded-[21px] border-dotted border-gray-400">
              <div className="flex flex-col items-center">
                <div className="p-[15px]">
                  <Image
                    src="/images/icons/upload.svg"
                    width={30}
                    height={30}
                    alt="upload"
                  />
                </div>
                <p className="mt-[15px] text-[14px] font-semibold">
                  Drag & Drop the image or Click{" "}
                  <Link href="/upload" className="text-blue-500 underline">
                    Click
                  </Link>{" "}
                  to upload
                </p>
              </div>
            </div>
          </div>
          <div className="flex-[1]"></div>
        </div>
      </div>
    </>
  );
};

export default UploadNewTool;
