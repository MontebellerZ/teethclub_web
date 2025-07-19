import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { config } from "dotenv";

config();

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react(), tailwindcss()],
    base: "/",
  };

  if (command !== "serve") {
    config.base = "/teethclub_web/";
  }

  return config;
});
