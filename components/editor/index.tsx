"use client";

import {
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
} from "@mdxeditor/editor";
import dynamic from "next/dynamic";
import { forwardRef } from "react";
import { useEffect } from "react";

interface Props extends Omit<MDXEditorProps, "markdown" | "onchange"> {
  value: string;
  fieldChange: (value: string) => void;
}

const InitializedEditor = dynamic(() => import("./InitializedMDXEditor"), {
  ssr: false,
});

const Editor = forwardRef<MDXEditorMethods, Props>(
  ({ value, fieldChange, ...props }, ref) => {
useEffect(() => {
  const style = document.createElement("style");
  style.innerHTML = `
    .mdxeditor__dropdown-menu,
    .mdxeditor__codeblock-language-dropdown {
      max-height: 250px !important;
      overflow-y: auto !important;
      overscroll-behavior: contain !important;
    }
    body > .mdxeditor__portal {
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);
  return () => {
    document.head.removeChild(style);
  };
}, []);

    return (
      <InitializedEditor
        {...props}
        markdown={value}
        fieldChange={fieldChange}
        editorRef={ref}
      />
    );
  }
);

export default Editor;
