// src/app/styled-jsx-registry.js
"use client";

// در Next.js (App Router) برای اینکه <style jsx> در
// Client Components واقعاً پیج شود، باید یک StyleRegistry
// از خود styled-jsx در layout ریشه وصل شود.
// بدون آن، کلاس‌های jsx-xxxx اضافه می‌شوند ولی <style>
// تولید نمی‌شود و CSS اعمال نمی‌شود.
import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { StyleRegistry, createStyleRegistry } from "styled-jsx";

export default function StyledJsxRegistry({ children }) {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [jsxStyleRegistry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = jsxStyleRegistry.styles();
    jsxStyleRegistry.flush();
    return <>{styles}</>;
  });

  return (
    <StyleRegistry registry={jsxStyleRegistry}>
      {children}
    </StyleRegistry>
  );
}
