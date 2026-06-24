"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { navigation } from "@/lib/constants";
import { Button } from "@/components/ui/button";

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
      {open ? (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="font-semibold">Navigation</span>
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
          <nav className="grid gap-1 p-4">
            {navigation.map((item) => (
              <Link
                className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                href={item.href}
                key={item.name}
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
