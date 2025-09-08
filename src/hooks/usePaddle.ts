import { useEffect } from "react";

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
      // @ts-expect-error - Paddle is attached globally
      if (window.Paddle) {
        console.log("✅ Paddle SDK script loaded, calling Paddle.Setup...");
        // @ts-expect-error - Paddle is attached globally
        window.Paddle.Setup({
          environment: env, // 👈 explicitly set environment
          token: clientToken,
        });
        // @ts-expect-error 
        console.log("🔧 Paddle.Setup complete:", {
          env,
          clientToken: clientToken ? "✅ present" : "❌ missing",
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
