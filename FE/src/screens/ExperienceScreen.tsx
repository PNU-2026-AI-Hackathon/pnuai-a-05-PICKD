import { useMemo, useState } from "react";
import {
  Columns3,
  Grid2X2,
  List,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import ExperienceHeader from "../components/experience/ExperienceHeader";
import ExperienceTable from "../components/experience/ExperienceTable";
import ExperienceEntryModal from "../components/experience/modal/ExperienceEntryModal";
import ExperienceDetailModal from "../components/experience/modal/ExperienceDetailModal";

import { MOCK_EXPERIENCES } from "../constants/experience/mockExperiences";
import { EXPERIENCE_TYPES } from "../constants/experience/experiencePresets";

import type { ExperienceItem } from "../types/experience";

const FILTERS = ["전체", "고정됨", ...EXPERIENCE_TYPES];

export default function ExperienceScreen() {
  const [experiences, setExperiences] =
    useState<ExperienceItem[]>(MOCK_EXPERIENCES);

  const [selectedItem, setSelectedItem] = useState<ExperienceItem | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("전체");
  const [searchText, setSearchText] = useState("");

  const filteredExperiences = useMemo(() => {
    return experiences.filter((item) => {
      const searchValue = searchText.trim().toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        item.name.toLowerCase().includes(searchValue) ||
        item.type.toLowerCase().includes(searchValue) ||
        (item.org ?? "").toLowerCase().includes(searchValue);

      const matchesFilter =
        selectedFilter === "전체" ||
        (selectedFilter === "고정됨" && Boolean(item.pinned)) ||
        item.type === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [experiences, searchText, selectedFilter]);

  const createNewExperience = () => {
    const newItem: ExperienceItem = {
      id: Date.now(),

      type: "프로젝트",

      name: "새 경험",

      org: "",
      period: "",
      role: "",

      competencies: [],
      keywords: [],

      status: "정보 부족",

      missing: [],

      linkedExperienceIds: [],

      fields: {},

      important: false,
      pinned: false,

      customTopFields: [],
      hiddenFieldKeys: [],
      topFieldOrder: undefined,
      fieldLabels: {},
    };

    setExperiences((prev) => [newItem, ...prev]);
    setSelectedItem(newItem);
    setEntryOpen(false);
  };

  const updateExperience = (updatedItem: ExperienceItem) => {
    setSelectedItem(updatedItem);

    setExperiences((prev) =>
      prev.map((experience) =>
        experience.id === updatedItem.id ? updatedItem : experience,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-[60px] py-[30px]">
      <div className="mx-auto max-w-[1780px]">
        <ExperienceHeader />

        <div className="mt-[26px] flex items-center justify-between">
          {/* LEFT */}
          <button
            onClick={() => setEntryOpen(true)}
            className="
              inline-flex h-[38px] items-center gap-2
              rounded-[10px]
              bg-[#3B78D8]
              px-4
              text-[15px] font-[700] text-white
              shadow-sm
              transition-colors hover:bg-[#2563EB]
            "
          >
            <Plus size={18} strokeWidth={2.3} />
            경험 추가
          </button>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-[34px] w-[190px] items-center gap-2
                rounded-[10px]
                border border-[#E2E8F0]
                bg-white
                px-3
              "
            >
              <Search size={16} className="text-[#64748B]" />

              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="항목명 검색"
                className="
                  w-full bg-transparent
                  text-[15px] font-[500] text-[#0F172A]
                  outline-none
                  placeholder:text-[#64748B]
                "
              />
            </div>

            <button
              className="
                flex h-[34px] w-[34px] items-center justify-center
                rounded-[10px]
                border border-[#E2E8F0]
                bg-white
                text-[#64748B]
                transition-colors hover:bg-[#F8FAFC]
              "
            >
              <SlidersHorizontal size={17} />
            </button>

            <button
              className="
                flex h-[34px] w-[34px] items-center justify-center
                rounded-[10px]
                border border-[#E2E8F0]
                bg-white
                text-[#64748B]
                transition-colors hover:bg-[#F8FAFC]
              "
            >
              <Columns3 size={17} />
            </button>

            <div className="flex items-center gap-2">
              <button
                className="
                  flex h-[34px] w-[34px] items-center justify-center
                  rounded-[10px]
                  border border-[#E2E8F0]
                  bg-white
                  text-[#0F172A]
                  transition-colors hover:bg-[#F8FAFC]
                "
              >
                <List size={18} />
              </button>

              <button
                className="
                  flex h-[34px] w-[34px] items-center justify-center
                  rounded-[10px]
                  border border-[#E2E8F0]
                  bg-white
                  text-[#94A3B8]
                  transition-colors hover:bg-[#F8FAFC]
                "
              >
                <Grid2X2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* FILTER */}
        <div className="mt-[14px] flex items-center gap-2">
          {FILTERS.map((filter) => {
            const active = selectedFilter === filter;

            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`
                  h-[32px]
                  rounded-[10px]
                  px-3
                  text-[14px]
                  font-[500]
                  transition-colors
                  ${
                    active
                      ? "bg-[#EFF6FF] text-[#2563EB]"
                      : "text-[#64748B] hover:bg-white"
                  }
                `}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* TABLE */}
        <ExperienceTable
          items={filteredExperiences}
          onRowClick={(item) => {
            setSelectedItem(item);
          }}
        />

        {/* ENTRY MODAL */}
        <ExperienceEntryModal
          open={entryOpen}
          onClose={() => setEntryOpen(false)}
          onDirectInput={createNewExperience}
          onImport={() => {
            console.log("자소서 파일 불러오기");
          }}
        />

        {/* DETAIL MODAL */}
        <ExperienceDetailModal
          open={!!selectedItem}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onChange={updateExperience}
        />
      </div>
    </div>
  );
}