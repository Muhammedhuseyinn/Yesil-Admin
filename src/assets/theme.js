// src/assets/theme.js

// Define a palette for convenience
const palette = [
    {
      // orange
      text: "#f97316",
      Alwan: (opacity) => `rgba(251, 146, 60, ${opacity})`,
    },
    {
      // dark gray
      text: "#334155",
      Alwan: (opacity) => `rgba(30, 41, 59, ${opacity})`,
    },
    {
      // purple
      text: "#7c3aed",
      Alwan: (opacity) => `rgba(167, 139, 250, ${opacity})`,
    },
    {
      // green
      text: "#009950",
      Alwan: (opacity) => `rgba(0, 179, 89, ${opacity})`,
    },
    {
      // teal
      text: "#14b8a6",
      Alwan: (opacity) => `rgba(45, 212, 191, ${opacity})`,
    },
    {
      // red
      text: "#dc2626",
      Alwan: (opacity) => `rgba(248, 113, 113, ${opacity})`,
    },
  ];
  
  // Export theme colors
  export const themeColors = {
    ...palette[3], // main green from palette
    bg: "#FEFAF7",
  
    // Logo colors
    mainGreen: "#01615F",
    mainGreen_lessdark: "#028C89",
    mainGreen_verylight: "#e5efef",
    mainGreen_dark: "#01403E",
  
    lightBlue: "#e0f2f1",
  
    subGreen: "#AEBD5B",
  
    // yellow
    accentYellow: "#F4D03F",
    accentYellow_light: "#F8E58A",
    accentYellow_dark: "#C7A62E",
  
    // blue
    subBlue: "#1D262D",
  
    // white
    accentBeige: "#F1E0C6",
    neutralOffWhite: "#F7F7F7",
    white: "#FFFFFF",
  
    // green
    supportingSageGreen: "#A6B98B",
    supportingDustyRose: "#E6A5B8",
  
    // grey
    mediumGray: "#4B5563",
    darkGray: "#333333",
    lightGray: "#A8A8A8",
  
    // brown
    woodLightTone: "#D1A15A",
  };
  