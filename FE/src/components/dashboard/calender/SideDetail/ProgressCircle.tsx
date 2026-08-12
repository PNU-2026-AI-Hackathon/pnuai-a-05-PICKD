const ProgressCircle = ({ percentage }: { percentage: number }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-12 h-12 transform -rotate-90">
        <circle cx="24" cy="24" r={radius} stroke="#E5E7EB" strokeWidth="4" fill="transparent" />
        <circle 
          cx="24" cy="24" r={radius} stroke="#3B82F6" strokeWidth="4" 
          fill="transparent" strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s' }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-gray-700">{percentage}%</span>
    </div>
  );
};

export default ProgressCircle;