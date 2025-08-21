"use client";

import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { Listbox } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Paper = {
  id: number;
  type: string;
};

const BRANDS: Paper[] = [
  { id: 0, type: "A3" },
  { id: 1, type: "A4" },
  { id: 2, type: "US Letter" },
];

const UploadNewTool = () => {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

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
              <Listbox value={selectedPaper} onChange={setSelectedPaper}>
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

                  <Listbox.Options className="absolute mt-1 max-h-60 w-[245px] right-5 top-[50px] overflow-auto rounded-[10px] bg-white p-4 text-base shadow-lg focus:outline-none sm:text-sm">
                    {BRANDS.map((paper) => (
                      <Listbox.Option
                        key={paper.id}
                        value={paper}
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
                            <span className="text-sm">{paper.type}</span>
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <div className="relative w-1/2 h-[433px] border border-b-0 mt-[30px] rounded-[21px] bg-[#f9fcff] border-dotted border-gray-400">
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
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center h-[376px]">
                <div className="flex flex-col items-center">
                  <div className="p-[15px]">
                    <Image
                      src="/images/icons/upload.svg"
                      width={30}
                      height={30}
                      alt="upload"
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="mt-[15px] text-[16px] leading-[18px] font-semibold text-center">
                    Drag & Drop the image or <br />
                    <Link href="/upload" className="text-blue-500 underline">
                      Click
                    </Link>{" "}
                    to upload
                  </p>
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
              <div className="mt-[60px]">
                <Button
                  className="px-[3.5rem] py-[1rem]"
                  variant="primary"
                  size="lg"
                >
                  Continue
                </Button>
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
