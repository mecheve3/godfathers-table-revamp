import svgPaths from "./svg-he89ufdyh9";

function Group() {
  return (
    <div className="absolute contents left-[639px] top-[395px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[639px] top-[395px] w-[460px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[688px] not-italic text-[64px] text-black top-[395px] whitespace-nowrap">Quick match</p>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[639px] top-[703px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[639px] top-[703px] w-[460px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[703px] not-italic text-[64px] text-black top-[703px] whitespace-nowrap">Join match</p>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[639px] top-[549px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[639px] top-[549px] w-[460px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[672px] not-italic text-[64px] text-black top-[549px] whitespace-nowrap">Create match</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute bg-[#d9d9d9] h-[912px] left-0 top-0 w-[1920px]" />
      <Group />
      <Group2 />
      <Group1 />
      <div className="absolute flex h-0 items-center justify-center left-[71px] top-[838px] w-[100px]">
        <div className="flex-none rotate-180">
          <div className="h-0 relative w-[100px]">
            <div className="absolute inset-[-36.82px_-5%_-36.82px_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 105 73.6396">
                <path d={svgPaths.p26845600} fill="var(--stroke-0, black)" id="Arrow 1" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}