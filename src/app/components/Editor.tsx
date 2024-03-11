"use client";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import ToolbarEditor from "@/plugins/RichToolbarPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TableContext } from "@/plugins/TablePlugin";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import TableCellActionMenuPlugin from "@/plugins/TableActionMenuPlugin";
import TableCellResizer from "@/plugins/TableCellResizer";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { ImageNode } from "@/plugins/nodes/ImageNode";
import { ListNode, ListItemNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";

import theme from "./themes/Theme";

import { useRef, useState } from "react";
import ImagePlugin from "@/plugins/ImagePlugin";
import { ParagraphNode, TextNode } from "lexical";
import { Card, Divider } from "@nextui-org/react";

export default function MyEditor() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLElement | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);

  const onRef = (ref: HTMLDivElement | null) => {
    if (ref) {
      editorRef.current = ref;
    }
  };

  const editorConfig = {
    theme: theme,
    namespace: "daily-standup-editor",
    onError(error: unknown) {
      throw error;
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      TableCellNode,
      TableNode,
      TableRowNode,
      ImageNode,
      TextNode,
      ParagraphNode,
      ListNode,
      ListItemNode,
      LinkNode,
    ],
  };

  return (
    <Card shadow="sm" radius="md" className="p-0">
      <LexicalComposer initialConfig={editorConfig}>
        <div className="relative border-none pb-6">
          <TableContext>
            <div className="w-full h-14 px-1 flex items-center">
              <ToolbarEditor />
            </div>
            <Divider className="text-bold" />
            <RichTextPlugin
              contentEditable={
                <div ref={onRef}>
                  <ContentEditable className="relative min-h-40 outline-none" />
                </div>
              }
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />

            <ImagePlugin />
            <TablePlugin />
            <TableCellResizer />
            <ListPlugin />
            <CheckListPlugin />
            <LinkPlugin />

            {floatingAnchorElem && (
              <>
                <TableCellActionMenuPlugin anchorElem={floatingAnchorElem} />
              </>
            )}
          </TableContext>
        </div>
      </LexicalComposer>
    </Card>
  );
}

function Placeholder() {
  return (
    <div className="absolute top-16 left-3.5 ml-1.5 select-none painter-none inline-block overflow-hidden">
      Play around with the table plugin...
    </div>
  );
}
