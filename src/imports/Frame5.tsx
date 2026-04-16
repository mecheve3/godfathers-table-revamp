function Group() {
  return (
    <div className="absolute contents left-[688px] top-[654px]">
      <div className="absolute bg-[#d9d9d9] border border-black border-solid h-[77px] left-[688px] top-[654px] w-[460px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[705px] not-italic text-[64px] text-black top-[654px] whitespace-nowrap">START GAME</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute bg-[#d9d9d9] border-10 border-black border-solid h-[912px] left-0 top-0 w-[1920px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[599px] not-italic text-[64px] text-black top-[99px] whitespace-nowrap">GODFATHER’S TABLE</p>
      <Group />
    </div>
  );
}