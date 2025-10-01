"use client";

type Brand = {
  id: number;
  brand_logo: string; // just a string path to the image
};

const BRANDS: Brand[] = [
  {
    id: 0,
    brand_logo: "Custom",
  },
  {
    id: 1,
    brand_logo: "/images/icons/milwaukee.svg",
  },
  {
    id: 2,
    brand_logo: "/images/icons/bosch.svg", // a text string
  },
  {
    id: 3,
    brand_logo: "/images/icons/makita.svg", // a text string
  },
];

const Dropdown: React.FC = () => {
  return (
    <div className="border rounded-[10px] bg-[#ffffff] w-[230px] h-[145px]">
      <div className="flex flex-col items-start">
        {BRANDS.map((brand: Brand) => (
          <div key={brand.id} className="flex">
            <input className="w-[24px] h-[24px]" type="checkbox" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dropdown;
