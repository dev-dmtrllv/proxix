import { PluginOption, defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const fullReloadAlways = {
	handleHotUpdate: () => 
	{

	}
};

export default defineConfig({
	plugins: [
		react({
			babel: {
				parserOpts: {
					plugins: ["@babel/plugin-proposal-decorators", "decorators-legacy", "classProperties"]
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
	],
	server: {
		hmr: false
	}
})
