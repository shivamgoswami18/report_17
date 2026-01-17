"use client";

import React, { useState, forwardRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import BaseButton from "./BaseButton";

export interface BaseInputProps {
  autoComplete?: string;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  fullWidth?: boolean;
  label?: string;
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  type?: string;
  value?: string;
  handleBlur?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  touched?: boolean;
  maxLength?: number;
  rows?: number;
  cols?: number;
  helperText?: string;
  helperTextClassName?: string;
  labelClassName?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  numbersOnly?: boolean;
  lowercase?: boolean;
}

const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      autoComplete,
      className,
      defaultValue,
      disabled,
      error,
      fullWidth,
      name,
      onChange,
      placeholder,
      label,
      readOnly,
      required,
      type,
      value,
      handleBlur,
      touched,
      maxLength,
      rows = 4,
      cols,
      helperText,
      helperTextClassName,
      labelClassName,
      onKeyDown,
      icon,
      suffix,
      numbersOnly = false,
      lowercase,
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => {
      setShowPassword(!showPassword);
    };

    const handleChangeInternal = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      let value = e.target.value;

      if (numbersOnly) {
        const numericValue = value.replace(/[^0-9]/g, "");

        if (value !== numericValue) {
          e.target.value = numericValue;
          value = numericValue;
        }
      }

      if (lowercase) {
        const lowerValue = value.toLowerCase();
        if (lowerValue !== value) {
          e.target.value = lowerValue;
          value = lowerValue;
        }
      }

      onChange?.(e);
    };

    const handleNumbersOnlyKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      if (numbersOnly) {
        const allowedKeys = [
          "Backspace",
          "Delete",
          "Tab",
          "Escape",
          "Enter",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Home",
          "End",
        ];

        const isNumber = /^[0-9]$/.test(e.key);
        const isAllowedKey = allowedKeys.includes(e.key);
        const isCtrlA = e.ctrlKey && e.key === "a";
        const isCtrlC = e.ctrlKey && e.key === "c";
        const isCtrlV = e.ctrlKey && e.key === "v";
        const isCtrlX = e.ctrlKey && e.key === "x";

        if (
          !isNumber &&
          !isAllowedKey &&
          !isCtrlA &&
          !isCtrlC &&
          !isCtrlV &&
          !isCtrlX
        ) {
          e.preventDefault();
        }
      }
      onKeyDown?.(e);
    };

    const renderInputField = () => {
      const commonProps = {
        id: name,
        name,
        className: `w-full ${className} ${
          error && touched ? "!border-red-500" : ""
        }`,
        autoComplete,
        defaultValue,
        disabled,
        placeholder,
        readOnly,
        onBlur: handleBlur,
        onKeyDown: numbersOnly ? handleNumbersOnlyKeyDown : onKeyDown,
        value,
        onChange: numbersOnly || lowercase ? handleChangeInternal : onChange,
        maxLength,
        "aria-describedby": error && touched ? `error-${name}` : undefined,
      };

      if (type === "textarea") {
        return (
          <InputTextarea
            {...commonProps}
            rows={rows}
            cols={cols}
            autoResize={false}
          />
        );
      }

      return (
        <InputText {...commonProps} type={getInputType()} ref={ref} />
      );
    };

    const getInputType = () => {
      if (type === "password") {
        return showPassword ? "text" : "password";
      }
      return type;
    };

    return (
      <div className={`${fullWidth ? "w-full" : ""} text-start`}>
        {label && (
          <label htmlFor={name} className={`${labelClassName} block `}>
            {label}
            {required && <span className="text-black">*</span>}
          </label>
        )}
        {helperText && (
          <div className={`${helperTextClassName}`}>{helperText}</div>
        )}
        <div className="relative flex items-center">
          {renderInputField()}

          {icon && (
            <span
              className={`absolute left-[14px] flex items-center ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {icon}
            </span>
          )}

          {suffix && (
            <span className="absolute right-3 text-coolGray text-textSm pointer-events-none">
              {suffix}
            </span>
          )}

          {type === "password" && (
            <BaseButton
              type="button"
              onClick={handleClickShowPassword}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer bg-transparent border-none p-0 focus:ring-0"
            >
              {showPassword ? (
                <FaEye className="text-coolGray w-[16px] h-[16px]" />
              ) : (
                <FaEyeSlash className="text-coolGray w-[16px] h-[16px]" />
              )}
            </BaseButton>
          )}
        </div>

        {error && touched && (
          <small id={`error-${name}`} className="p-error text-[12px] fullhd:text-textLg">
            {error}
          </small>
        )}
      </div>
    );
  }
);

BaseInput.displayName = "BaseInput";

export default BaseInput;