import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Text from "@/components/ui/Text";
import Image from "next/image";
import React from "react";

const ToolsInventory = () => {
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
              type="submit"
              variant="primary"
              size="lg"
              className=""
              // disabled={loading}
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
            // placeholder="Search Files"
            isSearchable={true}
            className="w-[382px] rounded-[10px]"
          />
          <div className="flex items-center w-[300px]">
            <Text as="p1" className="font-medium w-[100px]">
              Sort By:
            </Text>
            <InputField label="" name="All Brands" placeholder="All Brands" isDropdown={true} />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center my-[225px]">
        <div className="flex justify-center w-[261] h-[261] bg-[#e8e8e8] rounded-[200px]">
          <Image src="/images/icons/wrench.svg" width={128.3} height={127.46} alt="Tool"/>
        </div>
        <Text as="p1" className="inline-block text-[#868795] text-[18px] mt-[15px] font-semibold">Tool Inventory Is empty</Text>
      </div>
    </>
  );
};

export default ToolsInventory;
