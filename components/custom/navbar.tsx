"use client";

import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Image from "next/image";
import { useState } from "react";

export const Navbar = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isSignedIn } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white dark:bg-black">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="/" className="flex items-center gap-2">
          <Image
            src="/devtasker.svg"
            alt="DevTasker Logo"
            width={20}
            height={20}
            className="dark:invert justify-center items-center mb-1"
          />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            DevTasker
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:order-2 gap-4 items-center">
          {isSignedIn ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                baseTheme: resolvedTheme === "dark" ? dark : undefined,
                elements: {
                  userButtonPopoverFooter: {
                    display: "none",
                  },
                  userButtonPopoverCard:
                    resolvedTheme === "dark"
                      ? "bg-[#262626] border-neutral-700"
                      : undefined,
                  userButtonPopoverActionButton:
                    resolvedTheme === "dark"
                      ? "hover:bg-neutral-800"
                      : undefined,
                  userButtonPopoverActionButtonText:
                    resolvedTheme === "dark" ? "text-white" : undefined,
                },
              }}
            />
          ) : (
            <ButtonGroup>
              <SignInButton mode="modal">
                <Button variant="outline" className="rounded-xl">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline" className="rounded-xl">
                  Get Started
                </Button>
              </SignUpButton>
            </ButtonGroup>
          )}
          <Button variant="ghost" onClick={toggleTheme}>
            <Sun className="dark:hidden h-4 w-4" />
            <Moon className="hidden dark:block h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden gap-2 items-center">
          <Button variant="ghost" onClick={toggleTheme}>
            <Sun className="dark:hidden h-4 w-4" />
            <Moon className="hidden dark:block h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={toggleMenu} className="p-2">
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="w-full md:hidden mt-4">
            <div className="flex flex-col gap-3 pb-3">
              {isSignedIn ? (
                <div className="flex justify-center py-2">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      baseTheme: resolvedTheme === "dark" ? dark : undefined,
                      elements: {
                        userButtonPopoverFooter: {
                          display: "none",
                        },
                        userButtonPopoverCard:
                          resolvedTheme === "dark"
                            ? "bg-[#262626] border-neutral-700"
                            : undefined,
                        userButtonPopoverActionButton:
                          resolvedTheme === "dark"
                            ? "hover:bg-neutral-800"
                            : undefined,
                        userButtonPopoverActionButtonText:
                          resolvedTheme === "dark" ? "text-white" : undefined,
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="rounded-xl w-full">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button variant="outline" className="rounded-xl w-full">
                      Get Started
                    </Button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
