import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
	base: "/proxix",
	build: {
		outDir: "./docs"
	},
	plugins: [
		topLevelAwait(),
		react({
			babel: {
				parserOpts: {
					plugins: ["decorators-legacy", "classProperties"]
				}
			}
		}),
		{
			handleHotUpdate({ server })
			{
				server.ws.send({ type: "full-reload" })
				return []
			},
		} as any
	]
})
