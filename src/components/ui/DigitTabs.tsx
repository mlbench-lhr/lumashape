const DigitTabs = ({ digit }: { digit: number }) => {
    return (
        <div className="flex items-center justify-center w-[44px] h-[44px] border rounded-[10px] border-solid border-[#e7e7ea]">
            <span className="text-[#868795]">{digit}</span>
        </div>
    )
}

export default DigitTabs;