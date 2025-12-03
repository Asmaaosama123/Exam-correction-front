"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ControleTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    // If theme is system or not set, start with light
    if (!theme || theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  // Use resolvedTheme to get the actual theme (handles system theme)
  // Show loading state until mounted to avoid flash
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" aria-label="تبديل السمة">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">تبديل السمة</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="تبديل السمة"
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
      <span className="sr-only">تبديل السمة</span>
    </Button>
  );
}
