"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import type { PropsWithChildren } from "react";

export function ThemedClerkProvider({ children }: PropsWithChildren) {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: resolvedTheme === "dark" ? "#ffffff" : "#000000",
          colorBackground: resolvedTheme === "dark" ? "#262626" : "#ffffff",
          colorInputBackground:
            resolvedTheme === "dark" ? "#3a3a3a" : "#ffffff",
          colorInputText: resolvedTheme === "dark" ? "#ffffff" : "#000000",
          colorText: resolvedTheme === "dark" ? "#ffffff" : "#000000",
          colorTextSecondary: resolvedTheme === "dark" ? "#a3a3a3" : "#737373",
          colorDanger: resolvedTheme === "dark" ? "#ef4444" : "#dc2626",
        },
        elements: {
          formButtonPrimary:
            resolvedTheme === "dark"
              ? "bg-white hover:bg-gray-200 text-black transition-colors"
              : "bg-black hover:bg-gray-800 text-white transition-colors",
          card:
            resolvedTheme === "dark"
              ? "bg-[#262626] shadow-lg border border-neutral-700"
              : "bg-white shadow-lg",
          headerTitle:
            resolvedTheme === "dark" ? "text-white" : "text-black",
          headerSubtitle:
            resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600",
          socialButtonsBlockButton:
            resolvedTheme === "dark"
              ? "border border-neutral-700 hover:bg-neutral-800 transition-colors text-white"
              : "border hover:bg-gray-50 transition-colors",
          socialButtonsBlockButtonText:
            resolvedTheme === "dark" ? "text-white" : "text-black",
          formFieldLabel:
            resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700",
          formFieldInput:
            resolvedTheme === "dark"
              ? "bg-[#3a3a3a] border-neutral-700 text-white"
              : "bg-white border-gray-300 text-black",
          footerActionLink:
            resolvedTheme === "dark"
              ? "text-white hover:text-gray-300"
              : "text-black hover:text-gray-700",
          identityPreviewText:
            resolvedTheme === "dark" ? "text-white" : "text-black",
          identityPreviewEditButtonIcon:
            resolvedTheme === "dark" ? "text-white" : "text-black",
          formHeaderTitle:
            resolvedTheme === "dark" ? "text-white" : "text-black",
          formHeaderSubtitle:
            resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600",
          otpCodeFieldInput:
            resolvedTheme === "dark"
              ? "bg-[#3a3a3a] border-neutral-700 text-white"
              : "bg-white border-gray-300 text-black",
          alert: resolvedTheme === "dark" ? "text-white" : "text-black",
          alertText: resolvedTheme === "dark" ? "text-white" : "text-black",
          dividerLine:
            resolvedTheme === "dark" ? "bg-neutral-700" : "bg-gray-300",
          dividerText:
            resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600",
          formResendCodeLink:
            resolvedTheme === "dark"
              ? "text-white hover:text-gray-300"
              : "text-black hover:text-gray-700",
          modalBackdrop: "backdrop-blur-sm",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
