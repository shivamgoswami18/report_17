"use client";

import React from "react";
import { InputSwitch } from "primereact/inputswitch";
import { FaSpinner } from "react-icons/fa";

interface BaseToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

const BaseToggle: React.FC<BaseToggleProps> = ({
  checked,
  onChange,
  disabled,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-[48px] h-[24px]">
        <FaSpinner className="animate-spin text-base text-obsidianBlack text-opacity-25" />
      </div>
    );
  }
  return (
    <InputSwitch
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(!!e.value)}
    />
  );
};

export default BaseToggle;
