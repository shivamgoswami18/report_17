"use client";

import AuthHeader from "@/components/common/AuthHeader";
import AuthFooter from "@/components/common/AuthFooter";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  return (
    <div className="min-h-screen">
      <AuthHeader />

      <main
        className={
          isLoginPage
            ? "overflow-hidden md:px-[20px] lg:px-[30px] xl:px-[60px] py-[9px]"
            : "desktop:min-h-screen fullhd:min-h-[80vh] md:px-[20px] lg:px-[30px] xl:px-[60px] py-[9px]"
        }
      >
        {children}
      </main>

      <AuthFooter />
    </div>
  );
}
