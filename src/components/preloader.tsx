"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "omg-bridge-preloader-shown";
const VISIBLE_MS = 2600;
const FADE_MS = 400;

export function Preloader() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // sessionStorage unavailable — still show once
    }

    setVisible(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const fadeTimer = window.setTimeout(() => setHiding(true), VISIBLE_MS);
    const removeTimer = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = prevOverflow;
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
    }, VISIBLE_MS + FADE_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`preloader${hiding ? " is-hiding" : ""}`}
      aria-hidden="true"
      role="presentation"
    >
      <div className="preloader-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/omg-logo-light.webp" alt="" />
      </div>
      <style jsx>{`
        .preloader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: var(--bg);
          display: grid;
          place-items: center;
          opacity: 1;
          transition: opacity ${FADE_MS}ms ease;
        }
        .preloader.is-hiding {
          opacity: 0;
          pointer-events: none;
        }
        .preloader-logo {
          animation: pre-pulse 1.6s ease-in-out infinite;
          will-change: transform, opacity;
          filter: drop-shadow(0 0 32px rgba(0, 181, 181, 0.18));
        }
        .preloader-logo img {
          height: 56px;
          width: auto;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
        }
        @keyframes pre-pulse {
          0%, 100% {
            opacity: 0.55;
            transform: scale(0.97);
          }
          50% {
            opacity: 1;
            transform: scale(1.04);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .preloader-logo {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
