function Group2() {
  return (
    <div className="absolute contents left-[586px] top-[650px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[586px] top-[650px] w-[750px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[712px] not-italic text-[64px] text-black top-[650px] whitespace-nowrap">PLAY AS GUEST</p>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[586px] top-[368px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[586px] top-[368px] w-[750px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[862px] not-italic text-[64px] text-black top-[368px] whitespace-nowrap">LOGIN</p>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[586px] top-[509px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[586px] top-[509px] w-[750px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[831px] not-italic text-[64px] text-black top-[509px] whitespace-nowrap">SIGN UP</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute bg-[#d9d9d9] border-10 border-black border-solid h-[912px] left-0 top-0 w-[1920px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[599px] not-italic text-[64px] text-black top-[99px] whitespace-nowrap">GODFATHER’S TABLE</p>
      <Group2 />
      <Group />
      <Group1 />
    </div>
  );
}