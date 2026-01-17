interface TypingIndicatorProps {
  dotSize?: string;
  dotColor?: string;
  dotOpacityClass?: string;
  gap?: string;
  className?: string;
}

const TypingIndicator = ({
  dotSize = "w-[8px] h-[8px]",
  dotColor = "bg-obsidianBlack",
  dotOpacityClass = "bg-opacity-60",
  gap = "gap-[4px]",
  className = "",
}: TypingIndicatorProps) => {
  return (
    <div className={`flex ${gap} items-center ${className}`}>
      <span
        className={`${dotSize} ${dotColor} ${dotOpacityClass} rounded-full typing-dot-animation typing-dot-animation-delay-0`}
      ></span>
      <span
        className={`${dotSize} ${dotColor} ${dotOpacityClass} rounded-full typing-dot-animation typing-dot-animation-delay-200`}
      ></span>
      <span
        className={`${dotSize} ${dotColor} ${dotOpacityClass} rounded-full typing-dot-animation typing-dot-animation-delay-400`}
      ></span>
    </div>
  );
};

export default TypingIndicator;
