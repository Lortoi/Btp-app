interface HeroSectionProps {
  title?: string
  highlightText?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  buttonClassName?: string
  maxWidth?: string
  fontFamily?: string
  fontWeight?: number
}

export function HeroSection({
  title = "Intelligent AI Agents for",
  highlightText = "Smart Brands",
  description = "Transform your brand and evolve it through AI-driven brand guidelines and always up-to-date core components.",
  buttonText = "Join Waitlist",
  onButtonClick,
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  buttonClassName = "",
  maxWidth = "max-w-6xl",
  fontFamily = "Satoshi, sans-serif",
  fontWeight = 500,
}: HeroSectionProps) {
  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick()
    }
  }

  return (
    <section
      className={`relative w-full min-h-screen overflow-hidden bg-transparent flex items-center justify-center ${className}`}
    >
      <div className={`relative z-10 ${maxWidth} mx-auto px-6 w-full`}>
        <div className="text-center">
          <h1
            className={`font-bold text-white text-balance text-4xl sm:text-5xl md:text-6xl xl:text-[80px] leading-tight sm:leading-tight md:leading-tight lg:leading-tight xl:leading-[1.1] mb-6 lg:text-7xl ${titleClassName}`}
            style={{ fontFamily, fontWeight }}
          >
            {title}{" "}
            <span className="text-violet-300 italic">{highlightText}</span>
          </h1>

          <p
            className={`text-lg sm:text-xl text-white/90 text-pretty max-w-2xl mx-auto leading-relaxed mb-10 px-4 ${descriptionClassName}`}
          >
            {description}
          </p>

          <button
            onClick={handleButtonClick}
            className={`px-6 py-4 sm:px-8 sm:py-6 rounded-full border-4 bg-[rgba(63,63,63,1)] border-card text-sm sm:text-base text-white hover:bg-[rgba(63,63,63,0.9)] transition-colors ${buttonClassName}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </section>
  )
}
