const badgeColors = [
  "px-3 py-1.5 bg-[#FFF1F0] text-[#E77975]",
  "px-3 py-1.5 bg-[#FFF8ED] text-[#E9A13B]",
  "px-3 py-1.5 bg-[#F0E4DD] text-[#A28267]",
  "px-3 py-1.5 bg-[#E2F4E7] text-[#79AF86]",
  "px-3 py-1.5 bg-[#EBEFFF] text-[#3657C5]",
  "px-3 py-1.5 bg-[#E1DCFD] text-[#C082F6]",
  "px-3 py-1.5 bg-pink-100 text-pink-500",
  "px-3 py-1.5 bg-indigo-100 text-indigo-500",
  "px-3 py-1.5 bg-teal-100 text-teal-500",
  "px-3 py-1.5 bg-cyan-100 text-cyan-500",
];

export const getPositionColor = (position: string) => {
  let hash = 0;

  for (let i = 0; i < position.length; i++) {
    hash = position.charCodeAt(i) + ((hash << 5) - hash);
  }
  return badgeColors[Math.abs(hash) % badgeColors.length];
};
