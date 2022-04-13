module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // require("@tailwindcss/typography"), !!! NOT WORKING !!!
    require("daisyui")
  ],

  daisyui: {
    styled: true,
    themes: ["cupcake", "night"],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: "",
    // darkTheme: "night"
  }
}