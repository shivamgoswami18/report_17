import Link from "next/link";
import {
  footerConstants,
  customerServiceIcons,
  socialMediaIcons,
} from "@/components/constants/HomePage";

const HomeFooter = () => {
  const footerColumns = footerConstants?.columns;
  const customerServiceItems = footerConstants?.customerService;
  const legalLinks = footerConstants?.legalLinks;
  const socialMediaItems = footerConstants?.socialMedia;

  return (
    <footer className="w-full bg-obsidianBlack text-white">
      <div className="w-full mx-auto max-w-container px-[20px] py-[40px] xs:px-[32px] md:px-[64px] desktop:px-[120px] md:py-[56px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[28px] md:gap-[40px] lg:gap-[56px]">
          {footerColumns?.map((column) => (
            <div key={column?.title} className="flex flex-col">
              <h3 className="text-textBase font-extraLight text-white text-opacity-50 mb-[16px] uppercase xl:leading-[100%] tracking-[0px]">
                {column?.title}
              </h3>
              <ul className="flex flex-col gap-[8px] list-none marker:none">
                {column?.links?.map((link) => (
                  <li key={link?.label}>
                    <Link
                      href={link?.href}
                      className="text-textBase text-white hover:text-stoneGray transition-colors xl:leading-[32px] tracking-[0px] no-underline"
                    >
                      {link?.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col">
            <h3 className="text-textBase font-extraLight text-white text-opacity-50 mb-[16px] uppercase xl:leading-[100%] tracking-[0px]">
              {footerConstants?.customerServiceTitle}
            </h3>
            <ul className="flex flex-col gap-[12px]">
              {customerServiceItems?.map((item, index) => (
                <li key={item?.text} className="flex items-start gap-[10px]">
                  {customerServiceIcons?.[index]}
                  {item?.isLink && item?.href ? (
                    <a
                      href={item.href}
                      className="text-textBase text-white hover:text-stoneGray transition-colors xl:leading-[100%] tracking-[0px] no-underline"
                    >
                      {item?.text}
                    </a>
                  ) : (
                    <span className="text-textBase text-white hover:text-stoneGray transition-colors xl:leading-[100%] tracking-[0px]">
                      {item?.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-white bg-opacity-10"></div>

      <div className="w-full mx-auto max-w-container px-[20px] py-[16px] xs:px-[32px] md:px-[64px] desktop:px-[120px] md:py-[20px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-[16px] md:gap-[24px]">
          <div className="flex flex-col sm:flex-row items-center gap-[6px] sm:gap-[10px]">
            <p className="text-titleMid font-bold text-white xl:leading-[100%] xl:tracking-[-1px]">
              {footerConstants?.logo}
            </p>
            <span className="text-textSm text-white text-opacity-50 font-extraLight xl:leading-[100%] tracking-[0px]">
              {footerConstants?.copyright}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center">
            {legalLinks?.map((link, index) => (
              <div key={link?.label} className="flex items-center">
                <Link
                  href={link?.href}
                  className="text-textSm text-white text-opacity-50 font-extraLight xl:leading-[100%] tracking-[0px] hover:text-white transition-colors no-underline"
                >
                  {link?.label}
                </Link>
                {index < (legalLinks?.length ?? 0) - 1 && (
                  <span className="text-white text-opacity-50 text-textSm mx-[6px]">
                    •
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-[12px]">
            {socialMediaItems?.map((item, index) => (
              <Link
                key={item?.id}
                href={item?.href}
                className="text-white hover:text-opacity-50 transition-colors flex items-center justify-center no-underline"
              >
                {socialMediaIcons?.[index]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
