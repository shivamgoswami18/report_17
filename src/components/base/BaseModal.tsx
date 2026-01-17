import { Dialog } from "primereact/dialog";
import { classNames } from "primereact/utils";
import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import BaseButton from "./BaseButton";
import BaseInput from "./BaseInput";

interface BaseModalProps {
  visible: boolean;
  onHide: () => void;
  header?: string | React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  closable?: boolean;
  closeOnEscape?: boolean;
  dismissableMask?: boolean;
  modal?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  position?:
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  style?: React.CSSProperties;
  maxWidth?: string;
  showCloseIcon?: boolean;
  blockScroll?: boolean;
  searchEnabled?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchDebounceMs?: number;
}

const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onHide,
  header,
  footer,
  children,
  className = "",
  headerClassName = "",
  contentClassName = "",
  footerClassName = "",
  closable = true,
  closeOnEscape = true,
  dismissableMask = true,
  modal = true,
  draggable = false,
  resizable = false,
  position = "center",
  style,
  maxWidth = "32rem",
  showCloseIcon = true,
  blockScroll = true,
  searchEnabled = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  searchDebounceMs = 500,
}) => {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (visible && searchEnabled && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [visible, searchEnabled]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (localSearchValue !== searchValue) {
      debounceTimerRef.current = setTimeout(() => {
        onSearchChange?.(localSearchValue);
      }, searchDebounceMs);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localSearchValue, searchDebounceMs, onSearchChange, searchValue]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchValue(e.target.value);
  };

  const handleClearSearch = () => {
    setLocalSearchValue("");
    onSearchChange?.("");
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  const renderHeader = () => {
    if (!searchEnabled) {
      return header;
    }

    return (
      <div className="flex flex-col md:flex-row gap-3 w-full">
        {header && <div className="text-lg font-semibold">{header}</div>}
        <div className="relative md:mx-[16px] w-full md:w-auto md:flex-1">
          <BaseInput
            ref={searchInputRef}
            type="text"
            value={localSearchValue}
            onChange={handleSearchInputChange}
            placeholder={searchPlaceholder}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {localSearchValue && (
            <BaseButton
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent border-0"
              aria-label="Clear search"
            >
              <FaTimes className="w-4 h-4" />
            </BaseButton>
          )}
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    if (footer === null) return null;
    if (footer) {
      return <div className={footerClassName}>{footer}</div>;
    }
    return null;
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={renderHeader()}
      footer={renderFooter()}
      closable={closable}
      closeOnEscape={closeOnEscape}
      dismissableMask={dismissableMask}
      modal={modal}
      draggable={draggable}
      resizable={resizable}
      position={position}
      blockScroll={blockScroll}
      style={{ maxWidth, ...style }}
      className={classNames("mx-4 custom-modal", className)}
      headerClassName={classNames(headerClassName)}
      contentClassName={contentClassName}
    >
      {!showCloseIcon && closable && (
        <style>{`
          .p-dialog-header-close { display: none !important; }
        `}</style>
      )}
      {children}
    </Dialog>
  );
};

export default BaseModal;