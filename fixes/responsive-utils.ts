// src/lib/responsive-utils.ts
export const responsiveClasses = {
  // Grilles responsive ComeUp-style
  productGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8",
  
  // Espacements responsive
  container: "px-4 sm:px-6 lg:px-8",
  section: "py-6 sm:py-8 lg:py-12",
  
  // Typographie responsive
  heading: "text-2xl sm:text-3xl lg:text-4xl font-bold",
  subheading: "text-lg sm:text-xl lg:text-2xl font-semibold",
  body: "text-sm sm:text-base lg:text-lg",
  
  // Boutons responsive
  button: "min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-primary",
  buttonSmall: "h-8 w-8 min-h-[44px] min-w-[44px] touch-manipulation",
  
  // Images responsive
  image: "w-full aspect-[16/9] object-cover rounded-xl",
  imageSmall: "w-full aspect-square object-cover rounded-lg",
  
  // Cartes responsive
  card: "rounded-xl border border-border bg-card shadow-md hover:shadow-xl transition-all duration-300",
  cardHover: "hover:-translate-y-2 hover:scale-105",
  
  // Focus states
  focus: "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
  
  // Animations
  transition: "transition-all duration-300 ease-out",
  hover: "hover:translate-x-1 hover:scale-105"
};

export const breakpoints = {
  mobile: 'max-width: 640px',
  tablet: 'min-width: 641px and max-width: 1023px',
  desktop: 'min-width: 1024px'
};

export const getResponsiveValue = (mobile: string, tablet: string, desktop: string) => {
  return `${mobile} sm:${tablet} lg:${desktop}`;
};