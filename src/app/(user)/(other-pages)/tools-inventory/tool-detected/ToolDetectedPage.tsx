"use client";

import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

const ToolDetectedPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paper = searchParams.get("paper");
  const brand = searchParams.get("brand");
  const type = searchParams.get("type");

  return (
    <div className="w-full mx-auto my-[45px]">
      <div className="flex gap-[13px]">
        <div className="py-[13px] px-[11px]">
          <Image
            className="cursor-pointer"
            src="/images/icons/back.svg"
            width={24}
            height={22}
            alt="back"
            onClick={() => router.push("/tools-inventory/upload-new-tool")}
          />
        </div>
        <Text as="h3" className="grow">
          Enter Tool Info
        </Text>
      </div>
      <div className="mt-[15px]">
        <Text as="p1" className="text-[#808080]">
          Review your detected tool details and add to tool inventory
        </Text>
      </div>
      <div className="w-[897px] h-[433px]">
        <div className="relative w-[602px] h-[371px] border border-b-0 rounded-t-[21px] border-dotted border-gray-400 mt-[35px]"></div>
        <div className="flex items-center justify-center w-[602px] h-[62px] border border-t-0 rounded-b-[21px] border-dotted border-gray-400 bg-[#ebebeb]">
          <div className="flex justify-center items-center gap-[11px] h-[33px]">
            <div className="relative h-[24px] w-[24px]">
              <Image
                src="/images/icons/upload.svg"
                fill
                style={{ objectFit: "contain" }}
                alt="upload"
              />
            </div>
            <div className="relative h-full w-[33px]">
              <Image
                src="/images/icons/clipboard.svg"
                fill
                style={{ objectFit: "contain" }}
                alt="upload"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-start w-[581px] h-[191px] my-[45px]">
        <Text as="h5" className="font-bold mb-[23px]">
          Details
        </Text>

        <div className="flex w-full border border-[#e7e7ea] rounded-[20px]">
          {/* left column: labels */}
          <div className="flex flex-col flex-1 px-4 py-2 text-[#808080] font-medium">
            <Text as="p1" className="py-2">
              Paper Type
            </Text>
            <Text as="p1" className="py-2">
              Brand
            </Text>
            <Text as="p1" className="py-2">
              Tool Type
            </Text>
          </div>

          {/* right column: values */}
          <div className="flex flex-col flex-1 px-4 py-2 text-right">
            <Text as="h5" className="py-2">
              {paper || "-"}
            </Text>
            <Text as="h5" className="py-2">
              {brand || "-"}
            </Text>
            <Text as="h5" className="py-2">
              {type || "-"}
            </Text>
          </div>
        </div>
      </div>

      <div className="mt-[60px]">
        <Button
          className="px-[3.5rem] py-[1rem] text-[18px] font-bold"
          variant="primary"
          size="lg"
          // onClick={handleImageOutline}
        >
          <span className="text-[18px] font-semibold">Save To Tool Inventory</span>
        </Button>
      </div>
    </div>
  );
};

export default ToolDetectedPage;
