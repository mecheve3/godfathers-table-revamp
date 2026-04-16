import svgPaths from "./svg-jtkqn4n3l9";

function Group2() {
  return (
    <div className="absolute contents left-[756px] top-[759.9px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[756px] top-[760px] w-[460px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[783.04px] not-italic text-[64px] text-black top-[759.9px] whitespace-nowrap">START GAME</p>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[380px] top-[441px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[197px] left-[380px] top-[441px] w-[475px]" />
      <div className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[622.7px] not-italic text-[64px] text-black text-center top-[464.56px] whitespace-nowrap">
        <p className="leading-[normal] mb-0">Automatic</p>
        <p className="leading-[normal]">Preset seating</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[1047.56px] top-[440.61px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[197px] left-[1047.56px] top-[440.61px] w-[585px]" />
      <div className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[1331.43px] not-italic text-[64px] text-black text-center top-[478.41px] whitespace-nowrap">
        <p className="leading-[normal] mb-0">Manual</p>
        <p className="leading-[normal]">Choose your seat</p>
      </div>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute bg-[#d9d9d9] h-[912px] left-0 top-0 w-[1920px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[679.27px] not-italic text-[64px] text-black top-[314.5px] whitespace-nowrap">Seating arrangement</p>
      <Group2 />
      <Group />
      <Group1 />
      <div className="absolute flex h-0 items-center justify-center left-[150.93px] top-[859.8px] w-[100px]">
        <div className="flex-none rotate-180">
          <div className="h-0 relative w-[100px]">
            <div className="absolute inset-[-36.82px_-5%_-36.82px_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 105 73.6396">
                <path d={svgPaths.p26845600} fill="var(--stroke-0, black)" id="Arrow 3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}