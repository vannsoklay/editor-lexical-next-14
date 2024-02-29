import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

//省略

import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  EditorState,
  LexicalNode,
} from "lexical";
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils";
import {
  ListNode,
  $isListNode,
  // 省略
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export const BLOCK_TYPES = {
  UL: "bullet",
  OL: "number",
  CL: "check",
  P: "paragraph",
} as const;



import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";

type Context = {
  toggleUnOrderList: () => void;
  toggleOrderList: () => void;
  toggleCheckList: () => void;
};

const ToolContext = createContext<Context>({
  toggleUnOrderList: () => {},
  toggleOrderList: () => {},
  toggleCheckList: () => {},
});

const useProvideTool = (): Context => {
  const [editor] = useLexicalComposerContext();

  const toggleUnOrderList = useCallback(() => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  }, [editor]);

  const toggleOrderList = useCallback(() => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  }, [editor]);

  const toggleCheckList = useCallback(() => {
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
  }, [editor]);

  return {
    toggleUnOrderList,
    toggleOrderList,
    toggleCheckList,
  };
};

export const ToolProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useProvideTool();

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
};

export const useTool = () => {
  return useContext(ToolContext);
};
