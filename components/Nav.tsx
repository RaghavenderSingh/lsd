"use client";
import React, { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useTheme } from "next-themes";
import { ModeToggle } from "./ModeToggle";

export default function Nav() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex justify-between items-center p-4">
      <div>
        <p className="text-2xl font-bold">Hyper Stake</p>
        <p className="text-sm font-semibold">Cohort 3 Assignment</p>
      </div>

      <div className="flex gap-4">
        <div className="flex justify-center items-center">
          <ModeToggle />
        </div>
        <div>
          {mounted && (
            <WalletMultiButton
              style={{
                color: "white",
                backgroundColor: "black",
                border: "1px solid white",
                borderRadius: "0.5rem",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
