// src/components/ui/EmojiPicker.js
"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";

export default function EmojiPickerWrapper({ onEmojiSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePicker = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const pickerHeight = 350; // ارتفاع تقریبی پکر
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      let top;
      // اگر فضای پایین کافی است، به پایین باز شود، در غیر این صورت به بالا
      if (spaceBelow > pickerHeight) {
        top = rect.bottom + 8;
      } else if (spaceAbove > pickerHeight) {
        top = rect.top - pickerHeight - 8;
      } else {
        // اگر هیچ کدام کافی نیست، به پایین باز شود (با اسکرول)
        top = rect.bottom + 8;
      }
      setPosition({
        top: top,
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePicker}
        style={{
          background: "none",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
          padding: "0 8px",
          color: "var(--gray)",
        }}
      >
        😊
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={pickerRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 9999,
            }}
          >
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                onEmojiSelect(emojiData.emoji);
                setIsOpen(false);
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}