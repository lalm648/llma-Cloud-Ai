"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { navigation }   from "@/lib/constants";
import { Button }       from "@/components/ui/button";
import { ThemeToggle }  from "@/components/theme/theme-toggle";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Drawer header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="font-semibold text-foreground">Navigation</span>
            <div className="flex items-center gap-1">
              <ThemeToggle variant="icon" />
              <Button
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Links */}
          <nav className="grid gap-0.5 overflow-y-auto p-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
