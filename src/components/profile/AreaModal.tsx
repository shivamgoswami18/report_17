import React, { useEffect, useState } from "react";
import BaseModal from "@/components/base/BaseModal";
import BaseButton from "@/components/base/BaseButton";
import { getTranslationSync } from "@/i18n/i18n";
import { fetchCounties } from "@/lib/api/AuthApi";
import { Area } from "../auth/Register";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

interface AreaModalProps {
  visible: boolean;
  value: string[];
  onChange: (areas: string[]) => void;
  onClose: () => void;
}

function AreaModal({ visible, value, onChange, onClose }: AreaModalProps) {
  const [counties, setCounties] = useState<Area[]>([]);
  const [allCounties, setAllCounties] = useState<Area[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(value);
  const [searchQuery, setSearchQuery] = useState("");

   useEffect(() => {
      if (visible) {
        setSelectedAreas(value);
      }
    }, [visible, value]);
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchCounties("", 100000);
      setCounties(data);
      setAllCounties(data);
    };
    fetchData();
  }, []);
  const handleAreaSelect = (countyId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(countyId)
        ? prev.filter((id) => id !== countyId)
        : [...prev, countyId]
    );
  };
  const handleSearch = (value: string) => {
    setSearchQuery(value);

    if (!value.trim()) {
      setCounties(allCounties);
      return;
    }

    setCounties(
      allCounties.filter((county) =>
        county.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };
  const handleSave = () => {
    if (!selectedAreas.length) return;
    onChange(selectedAreas)
    onClose();
  };
  const handleCancel = () => {
    onClose();
  };
  const confirmCancel = () => {
    onClose();
  };
  return (
      <BaseModal
        visible={visible}
        onHide={handleCancel}
        header={t("registerLabel.selectServiceAreas")}
        maxWidth="600px"
        contentClassName="py-[12px] px-[12px]"
        footerClassName="py-4 px-6"
        headerClassName="py-4 px-6 text-lg font-semibold"
        searchEnabled
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder={t("baseTableConstants.search")}
        footer={
          <div className="flex justify-end gap-[10px]">
            <BaseButton
              label={t("commonConstants.cancel")}
              onClick={confirmCancel}
              className="bg-transparent text-obsidianBlack border-solid border border-lightGrayGamma rounded-lg px-6 py-2"
            />
            <BaseButton
              label={t("commonConstants.save")}
              onClick={handleSave}
              disabled={!selectedAreas.length}
              className="bg-deepTeal text-white rounded-lg border-0 px-6 py-2 font-medium disabled:opacity-50"
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {counties.map((county) => (
            <BaseButton
              key={county._id}
              onClick={() => handleAreaSelect(county._id)}
              className={`px-6 py-4 rounded-lg border-2 text-center font-medium cursor-pointer transition-all ${
                selectedAreas.includes(county._id)
                  ? "border-solid border-deepTeal bg-deepTeal bg-opacity-5 text-deepTeal"
                  : "border-solid border-lightGrayGamma bg-white text-obsidianBlack hover:border-deepTeal hover:border-opacity-50"
              }`}
            >
              {county.name}
            </BaseButton>
          ))}
        </div>
      </BaseModal>
  );
}

export default AreaModal;
