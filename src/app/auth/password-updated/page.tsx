import Image from "next/image";

const PasswordUpdatedPage = () => {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Centered Sign-Up Form */}
      <div className="w-full flex flex-col justify-center items-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center">
            <Image
              src="/images/icons/auth/Tick.svg"
              alt=""
              width={173}
              height={173}
            />
            <p className="mt-[22px] text-[24px] font-bold">Password Updated</p>

            <button
              className="w-full mt-[35px] bg-primary text-white py-2.5 cursor-pointer px-4 rounded-lg transition-colors font-medium mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back To Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordUpdatedPage;
