import React from "react";
import { Checkbox } from "primereact/checkbox";

interface BaseCheckboxProps {
  name: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelClassName?: string;
  checkboxClassName?: string;
  disabled?: boolean;
}

const BaseCheckbox: React.FC<BaseCheckboxProps> = ({
  name,
  label,
  checked,
  onChange,
  labelClassName = "",
  checkboxClassName = "",
  disabled = false,
}) => {
  const id = `${name}-checkbox`;

  return (
    <label
      htmlFor={id}
      className={`${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} select-none ${labelClassName}`}
    >
     <Checkbox
        inputId={id}
        checked={checked}
        onChange={(e) => onChange(!!e.checked)}
        disabled={disabled}
        pt={{
          box: {
            className: checkboxClassName,
          },
        }}
      />

      {label && (
        <span className="px-[6px]">{label}</span>
      )}
    </label>
  );
};

export default BaseCheckbox;
