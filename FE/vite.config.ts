import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    {
      name: "landingpage-static-route",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/landingpage" || req.url === "/landingpage/") {
            req.url = "/landingpage/index.html";
          }
          next();
        });
      },
    },
  ],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
