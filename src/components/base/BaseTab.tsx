"use client";

import React from "react";
import { TabView, TabPanel } from "primereact/tabview";

interface BaseTabsProps {
  readonly tabs: readonly string[];
  readonly activeIndex: number;
  readonly onChange: (index: number, label: string) => void;
  readonly className?: string;
  readonly tabHeaderIcons?: readonly React.ReactNode[];
  readonly tabClassName?: string;
}

export default function BaseTabs({
  tabs,
  activeIndex,
  onChange,
  className,
  tabHeaderIcons,
  tabClassName
}: BaseTabsProps) {
  const tabHeaderTemplate = (tab: string, index: number) => {
    return (
      <div className="tabview-header-icon flex items-center">
        {tabHeaderIcons && tabHeaderIcons[index] && (
          <span className="mr-2">{tabHeaderIcons[index]}</span>
        )}
        <span>{tab}</span>
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      <TabView
        activeIndex={activeIndex}
        onTabChange={(e) => onChange(e.index, tabs[e.index])}
        className={`custom-tabview ${tabClassName ?? ""}`}
      >
        {tabs?.map((tab, index) => (
          <TabPanel
            key={tab}
            header={tabHeaderTemplate(tab, index)}
          ></TabPanel>
        ))}
      </TabView>
    </div>
  );
}
