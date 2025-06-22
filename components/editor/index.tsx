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
