import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { resolve } from "path";

export default defineWorkersConfig({
	resolve: {
		alias: {
			'@services': resolve(__dirname, './src/services'),
			'@helpers': resolve(__dirname, './src/helpers'),
			'@ty': resolve(__dirname, './src/types'),
		},
	},
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
			},
		},
	},
});
