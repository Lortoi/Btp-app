import { motion } from "framer-motion"

interface HeroSectionProps {
  title?: string
  highlightText?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  className?: string
}

export function HeroSection({
  title = "PLANCHAIS",
  highlightText = "Construire pour durer",
  description = "Votre application professionnelle",
  buttonText = "Se connecter",
  onButtonClick,
  className = "",
}: HeroSectionProps) {
  return (
    <section
      className={`relative w-full min-h-screen overflow-hidden flex items-center justify-center ${className}`}
    >
      <div className="relative z-10 max-w-4xl mx-auto px-6 w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-bold tracking-tight text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4">
            {title}
          </h1>
          <p className="text-brand-light italic text-xl sm:text-2xl mb-3">{highlightText}</p>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">{description}</p>
          <button
            type="button"
            onClick={onButtonClick}
            className="px-8 py-3 rounded-lg bg-brand text-[#0A0A0A] font-medium hover:bg-brand-light transition-colors shadow-glow-sm"
          >
            {buttonText}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
