import svgPaths from "./svg-z7ucglkpmo";

function Group() {
  return (
    <div className="absolute contents left-[228px] top-[549px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[173px] left-[228px] top-[549px] w-[311px]" />
      <div className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[383px] not-italic text-[64px] text-black text-center top-[549px] whitespace-nowrap">
        <p className="leading-[normal] mb-0">3</p>
        <p className="leading-[normal]">Players</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[582px] top-[549px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[173px] left-[582px] top-[549px] w-[311px]" />
      <div className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[743px] not-italic text-[64px] text-black text-center top-[549px] whitespace-nowrap">
        <p className="leading-[normal] mb-0">4</p>
        <p className="leading-[normal]">Players</p>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[936px] top-[549px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[173px] left-[936px] top-[549px] w-[311px]" />
      <div className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[1099px] not-italic text-[64px] text-black text-center top-[549px] whitespace-nowrap">
        <p className="leading-[normal] mb-0">5</p>
        <p className="leading-[normal]">Players</p>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[1290px] top-[549px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[173px] left-[1290px] top-[549px] w-[311px]" />
      <div className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[1446px] not-italic text-[64px] text-black text-center top-[549px] whitespace-nowrap">
        <p className="leading-[normal] mb-0">6</p>
        <p className="leading-[normal]">Players</p>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents left-[688px] top-[770px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[688px] top-[770.1px] w-[460px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[833px] not-italic text-[64px] text-black top-[770px] whitespace-nowrap">NEXT</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute bg-[#d9d9d9] h-[912px] left-0 top-0 w-[1920px]" />
      <div className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[688px] not-italic text-[64px] text-black top-[395px] whitespace-nowrap">
        <p className="leading-[normal] mb-0">Game type</p>
        <p className="leading-[normal]">&nbsp;</p>
      </div>
      <Group />
      <Group1 />
      <Group2 />
      <Group3 />
      <div className="absolute flex h-0 items-center justify-center left-[71px] top-[829px] w-[100px]">
        <div className="flex-none rotate-180">
          <div className="h-0 relative w-[100px]">
            <div className="absolute inset-[-36.82px_-5%_-36.82px_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 105 73.6396">
                <path d={svgPaths.p26845600} fill="var(--stroke-0, black)" id="Arrow 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Group4 />
    </div>
  );
}