import { useEffect } from "react";

declare global {
  interface Window {
    Paddle?: {
      Setup: (options: { token: string; environment?: string }) => void;
      Checkout: {
        open: (options: Record<string, unknown>) => void;
      };
    };
  }
}

export const usePaddle = () => {
  const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string;
  const env = import.meta.env.VITE_PADDLE_ENV || "sandbox";

  useEffect(() => {
    if (document.getElementById("paddle-js")) {
      console.log("⚠️ Paddle script already loaded, skipping...");
      return;
    }

    console.log(`⬇️ Loading Paddle SDK for environment: ${env}`);

    const script = document.createElement("script");
    script.id = "paddle-js";
    script.src =
      env === "sandbox"
        ? "https://sandbox-cdn.paddle.com/paddle/v2/paddle.js"
        : "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;

    script.onload = () => {
      if (window.Paddle) {
        console.log("✅ Paddle SDK script loaded, calling Paddle.Setup...");

        // 🔑 Log what’s actually being passed in
        console.log("🔑 Paddle client token (from env):", clientToken);
        console.log("🌍 Paddle environment (from env):", env);

        window.Paddle.Setup({
          token: clientToken,
          environment: env,
        });

        console.log("🔧 Paddle.Setup complete:", {
          env,
          tokenPresent: !!clientToken,
        });
      } else {
        console.error("❌ Paddle SDK did not attach to window");
      }
    };

    script.onerror = () => {
      console.error("🔥 Failed to load Paddle SDK script");
    };

    document.body.appendChild(script);
  }, [clientToken, env]);
};
