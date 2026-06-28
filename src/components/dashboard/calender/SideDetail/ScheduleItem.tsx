interface ScheduleItemProps {
  schedule: {
    id: string | number;
    title: string;
    company?: string;
  };
}

const ScheduleItem = ({ schedule }: ScheduleItemProps) => {
  return (
    <div className="p-4 bg-gray-50 rounded-xl flex justify-between items-center group hover:bg-blue-50 transition-colors">
      <div>
        <p className="font-medium text-gray-800 text-[16px]">
          {schedule.title}

          {schedule.company && (
            <span className="text-gray-400 ml-2 text-[14px] font-normal">
              {schedule.company}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ScheduleItem;