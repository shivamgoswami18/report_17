import React, { useEffect, useState } from "react";
import BaseModal from "@/components/base/BaseModal";
import BaseButton from "@/components/base/BaseButton";
import { getTranslationSync } from "@/i18n/i18n";
import { fetchServiceCategories } from "@/lib/api/AuthApi";
import { ServiceCategory } from "../auth/Register";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

interface ServiceModalProps {
  visible: boolean;
  value: string[];
  onChange: (services: string[]) => void;
  onClose: () => void;
}

function ServiceModal({
  visible,
  value,
  onChange,
  onClose,
}: ServiceModalProps) {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );
  const [allServiceCategories, setAllServiceCategories] = useState<
    ServiceCategory[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  useEffect(() => {
    if (visible) {
      setSelectedServices(value);
    }
  }, [visible, value]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchServiceCategories("", 100000);
      setServiceCategories(data);
      setAllServiceCategories(data);
    };
    fetchData();
  }, []);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (!value) {
      setServiceCategories(allServiceCategories);
      return;
    }

    setServiceCategories(
      allServiceCategories.filter((service) =>
        service.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const handleServiceSave = () => {
    onChange(selectedServices);
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onHide={handleCancel}
      header={t("registerLabel.selectServiceCategories")}
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
            onClick={handleCancel}
            className="bg-transparent text-obsidianBlack border-solid border border-lightGrayGamma rounded-lg px-6 py-2"
          />
          <BaseButton
            label={t("commonConstants.save")}
            onClick={handleServiceSave}
            disabled={selectedServices.length === 0}
            className="bg-deepTeal text-white rounded-lg border-0 px-6 py-2 font-medium disabled:opacity-50"
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {serviceCategories.map((service) => (
          <BaseButton
            key={service._id}
            onClick={() => handleServiceSelect(service._id)}
            className={`px-6 py-4 rounded-lg border-2 text-center font-medium cursor-pointer transition-all ${
              selectedServices.includes(service._id)
                ? "border-solid border-deepTeal bg-deepTeal bg-opacity-5 text-deepTeal"
                : "border-solid border-lightGrayGamma bg-white text-obsidianBlack hover:border-deepTeal hover:border-opacity-50"
            }`}
          >
            {service.name}
          </BaseButton>
        ))}
      </div>
    </BaseModal>
  );
}

export default ServiceModal;