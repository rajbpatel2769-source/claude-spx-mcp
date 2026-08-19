import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

interface Env {
  MARKET_DATA: KVNamespace;
}

function createServer(env: Env) {
  const server = new McpServer({
    name: "SPX Market Data",
    version: "1.0.0",
  });

  server.registerTool(
    "get_spx_market_data",
    {
      description:
        "Get the latest SPX Daily, 2-hour, and 1-hour TradingView market data stored in Cloudflare KV.",
      inputSchema: z.object({}),
    },
    async () => {
      const [dailyRaw, twoHourRaw, oneHourRaw] = await Promise.all([
        env.MARKET_DATA.get("SPX:1D"),
        env.MARKET_DATA.get("SPX:120"),
        env.MARKET_DATA.get("SPX:60"),
      ]);

      const daily = dailyRaw ? JSON.parse(dailyRaw) : null;
      const twoHour = twoHourRaw ? JSON.parse(twoHourRaw) : null;
      const oneHour = oneHourRaw ? JSON.parse(oneHourRaw) : null;

      const payload = {
        symbol: "SPX",
        daily,
        twoHour,
        oneHour,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return createMcpHandler(
      () => createServer(env),
      {
        route: "/mcp",
      }
    )(request, env, ctx);
  },
};
