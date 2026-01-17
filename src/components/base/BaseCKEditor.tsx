"use client";

import { Editor } from "primereact/editor";
import { FormikProps } from "formik";
import { useEffect, useState } from "react";

export interface BaseEditorProps<FormValues> {
  formik: FormikProps<FormValues>;
  name: keyof FormValues & string;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  required?: boolean;
  labelClassName?: string;
}
type ToolbarButton = {
  type: "button";
  className: string;
  value?: string;
};

type ToolbarSelect = {
  type: "select";
  className: string;
  options: {
    value: string;
    label: string;
  }[];
};

type ToolbarItem = ToolbarButton | ToolbarSelect;

export const editorToolbarOptions: ToolbarItem[] = [
  { type: "button", className: "ql-bold" },
  { type: "button", className: "ql-italic" },
  { type: "button", className: "ql-underline" },
  { type: "button", className: "ql-list", value: "ordered" },
  { type: "button", className: "ql-list", value: "bullet" },
  {
    type: "select",
    className: "ql-align",
    options: [
      { value: "", label: "left" },
      { value: "center", label: "center" },
      { value: "right", label: "right" },
      { value: "justify", label: "justify" },
    ],
  }
];

export const BaseCKEditor = <FormValues,>({
  formik,
  name,
  label,
  disabled = false,
  placeholder,
  maxLength,
  className = "",
  labelClassName = "",
  required = false,
}: BaseEditorProps<FormValues>) => {
  const [error, setError] = useState<string | null>(null);

  const value = (formik.values[name] as unknown as string) ?? "";
  useEffect(() => {
    if (maxLength && value.length > maxLength) {
      setError(`Maximum ${maxLength} characters allowed`);
    } else {
      setError(null);
    }
  }, [value, maxLength]);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className={`${labelClassName} block`}>
          {label}
          {required && <span className="text-black">*</span>}
        </label>
      )}
      <div style={{ border: "1px solid #EAEAEA", borderRadius: "8px" }}>
        <Editor
          id={name}
          value={value}
          onTextChange={(e) => formik.setFieldValue(name, e.htmlValue ?? "")}
          onBlur={() => formik.setFieldTouched(name, true)}
          placeholder={placeholder}
          readOnly={disabled}
          style={{ minHeight: "200px", border: "none" }}
          headerTemplate={
            <span className="ql-formats flex gap-2">
              {editorToolbarOptions.map((item, index) => {
                if (item.type === "button") {
                  return (
                    <button
                      key={index}
                      className={item.className}
                      value={item.value}
                    />
                  );
                }

                if (item.type === "select") {
                  return (
                    <select key={index} className={item.className}>
                      {item.options.map((opt, i) => (
                        <option key={i} value={opt.value}></option>
                      ))}
                    </select>
                  );
                }
                return null;
              })}
            </span>
          }
          pt={{
            toolbar: {
              className: "!border-0 !border-b !border-b-[#EAEAEA]",
            },
            content: {
              className:
                "!font-light !text-textBase !px-[16px] !text-obsidianBlack py-[12px] !placeholder:text-obsidianBlack !placeholder:text-opacity-30 !placeholder:text-textSm !placeholder:font-light !xl:placeholder:[line-height:20px] !xl:placeholder:tracking-[0%] !xl:leading-[20px] !xl:tracking-[0%]",
            },
          }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {maxLength && (
        <p className="text-xs text-gray-500">
          {value.length}/{maxLength} characters
        </p>
      )}
    </div>
  );
};
