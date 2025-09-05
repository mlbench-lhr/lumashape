"use client";

import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const ToolDetectedPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const paper = searchParams.get("paper");
  const brand = searchParams.get("brand");
  const type = searchParams.get("type");
  const imageUrl = searchParams.get("imageUrl");
  const description = searchParams.get("description");
  const purchaseLink = searchParams.get("purchaseLink");

  const handleSave = async () => {
    const savedToken = localStorage.getItem("auth-token");

    setIsSaving(true);
    try {
      const res = await fetch("/api/user/tool/saveTool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ 
          paper, 
          brand, 
          type, 
          imageUrl, 
          description, 
          purchase_link: purchaseLink 
        }),
      });
      
      if (res.ok) {
        router.push("/tools-inventory");
      } else {
        console.error("Failed to save tool");
      }
    } catch (error) {
      console.error("Error saving tool:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    // Go back to page 2 with current data
    const params = new URLSearchParams();
    if (paper) params.set("paper", paper);
    if (brand) params.set("brand", brand);
    if (type) params.set("type", type);
    if (imageUrl) params.set("imageUrl", imageUrl);
    if (description) params.set("description", description);
    if (purchaseLink) params.set("purchaseLink", purchaseLink);
    
    router.push(`/tools-inventory/upload-new-tool-page2?${params.toString()}`);
  };

  return (
    <div className="w-full mx-auto my-[20px] sm:my-[45px]">
      <div className="flex gap-[10px] sm:gap-[13px]">
        <div className="py-[10px] sm:py-[13px] px-[8px] sm:px-[11px]">
          <Image
            className="cursor-pointer"
            src="/images/icons/back.svg"
            width={24}
            height={22}
            alt="back"
            onClick={handleBack}
          />
        </div>
        <Text as="h3" className="grow text-[18px] sm:text-[20px] font-semibold">
          Upload New Tool - Review
        </Text>
      </div>

      <div className="mt-[10px] sm:mt-[15px]">
        <Text as="p1" className="text-[#808080] text-[14px] sm:text-[16px]">
          Review your detected tool details and add to tool inventory
        </Text>
      </div>

      <div className="w-full sm:w-[897px] h-auto mt-[20px] sm:mt-[35px]">
        <div
          className="relative w-full sm:w-[602px] h-[371px] border border-b-0 rounded-t-[21px] border-dotted border-gray-400"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <div className="flex items-center justify-center w-full sm:w-[602px] h-[62px] border border-t-0 rounded-b-[21px] border-dotted border-gray-400 bg-[#ebebeb]">
          <div className="flex justify-center items-center gap-[8px] sm:gap-[11px] h-[30px] sm:h-[33px]">
            <div className="relative h-[20px] sm:h-[24px] w-[20px] sm:w-[24px]">
              <Image
                src="/images/icons/upload.svg"
                fill
                style={{ objectFit: "contain" }}
                alt="upload"
              />
            </div>
            <div className="relative h-[20px] sm:h-[24px] w-[20px] sm:w-[33px]">
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

      <div className="flex flex-col justify-start w-full sm:w-[581px] h-auto my-[20px] sm:my-[45px]">
        <Text
          as="h5"
          className="font-bold mb-[10px] sm:mb-[23px] text-[16px] sm:text-[18px]"
        >
          Details
        </Text>

        <div className="flex flex-col w-full border border-[#e7e7ea] rounded-[20px]">
          {/* Basic details in two columns */}
          <div className="flex">
            {/* left column: labels */}
            <div className="flex flex-col flex-1 px-4 py-2 text-[#808080] font-medium text-[14px] sm:text-[16px]">
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
            <div className="flex flex-col flex-1 px-4 py-2 text-right text-[14px] sm:text-[16px]">
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

          {/* Description as full-width section */}
          <div className="border-t border-[#e7e7ea] px-4 py-3">
            <Text as="p1" className="text-[#808080] font-medium text-[14px] sm:text-[16px] mb-2 block">
              Description
            </Text>
            <Text as="h5" className="text-[14px] sm:text-[16px] leading-relaxed">
              {description || "-"}
            </Text>
          </div>

          {/* Purchase Link as full-width section if exists */}
          {purchaseLink && (
            <div className="border-t border-[#e7e7ea] px-4 py-3">
              <Text as="p1" className="text-[#808080] font-medium text-[14px] sm:text-[16px] mb-2 block">
                Purchase Link
              </Text>
              <a 
                href={purchaseLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 underline hover:text-blue-700 text-[14px] sm:text-[16px] break-all"
              >
                {purchaseLink}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="mt-[30px] sm:mt-[60px]">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="px-[2rem] py-[0.75rem] text-[16px] sm:text-[18px] font-bold w-full sm:w-auto"
          variant="primary"
          size="lg"
        >
          <span className="text-[16px] sm:text-[18px] font-semibold">
            {isSaving ? "Saving..." : "Save To Tool Inventory"}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default ToolDetectedPage;