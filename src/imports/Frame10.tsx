import svgPaths from "./svg-rvidiiide8";

function Group() {
  return (
    <div className="absolute contents left-[749px] top-[752px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[749px] top-[752px] w-[460px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[766px] not-italic text-[64px] text-black top-[752px] whitespace-nowrap">START GAME</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute bg-[#d9d9d9] h-[912px] left-0 top-0 w-[1920px]" />
      <Group />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[754px] not-italic text-[64px] text-black top-[117px] whitespace-nowrap">MATCH LOBBY</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[394px] not-italic text-[64px] text-black top-[293px] whitespace-nowrap">Players</p>
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[326px] left-[687px] top-[293px] w-[754px]" />
      <div className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[704px] not-italic text-[64px] text-black top-[293px] whitespace-nowrap">
        <p className="leading-[normal] mb-0">You</p>
        <p className="leading-[normal] mb-0">Player2</p>
        <p className="leading-[normal]">&nbsp;</p>
      </div>
      <div className="absolute flex h-0 items-center justify-center left-[84px] top-[814px] w-[100px]">
        <div className="flex-none rotate-180">
          <div className="h-0 relative w-[100px]">
            <div className="absolute inset-[-36.82px_-5%_-36.82px_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 105 73.6396">
                <path d={svgPaths.p26845600} fill="var(--stroke-0, black)" id="Arrow 5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}