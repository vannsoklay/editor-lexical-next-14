"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";

import {
  $getSelectionStyleValueForProperty,
  $isAtNodeEnd,
  $patchStyleText,
  $wrapNodes,
} from "@lexical/selection";

import {
  INSERT_TABLE_COMMAND,
  InsertTableCommandPayload,
} from "@lexical/table";

// import { createCommand } from '@lexical/utils';

import { INSERT_IMAGE_COMMAND, InsertImagePayload } from "./ImagePlugin";

export const TOGGLE_HEADING_COMMAND = createCommand("TOGGLE_HEADING_COMMAND");

import {
  TbAlignLeft,
  TbAlignCenter,
  TbAlignRight,
  TbPhoto,
  TbListNumbers,
  TbListLetters,
  TbLink,
  TbItalic,
  TbPlus,
  TbUnderline,
  TbAlignJustified,
} from "react-icons/tb";
import { RiParagraph } from "react-icons/ri";
import { RxFontBold } from "react-icons/rx";

import {
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  createCommand,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  ParagraphNode,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $isRootOrShadowRoot, EditorState, LexicalNode } from "lexical";
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from "@lexical/utils";

import {
  ListNode,
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $createHeadingNode } from "@lexical/rich-text";

const getSecondRootNode = (targetNode: LexicalNode) => {
  return targetNode.getKey() === "root"
    ? targetNode
    : $findMatchingParent(targetNode, (node: LexicalNode) => {
        const parentNode = node.getParent();
        return parentNode !== null && $isRootOrShadowRoot(parentNode);
      });
};

const FONT_SIZES = [11, 14, 16, 18, 14, 31];

const blockTypeToBlockName = {
  code: "Code Block",
  h1: "Large Heading",
  h2: "Small Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  ol: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
  ul: "Bulleted List",
};

const BLOCK_TYPES = {
  ol: "Numbered List",
  ul: "Bulleted List",
};

type BlockType = (typeof BLOCK_TYPES)[keyof typeof BLOCK_TYPES];

function getSelectedNode(selection: RangeSelection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

export default function ToolbarEditor() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState<BlockType>(BLOCK_TYPES.ol);

  const [selectedFontSize, setSelectedFontSize] = useState<number>(16);
  const toolbarRef = useRef<HTMLDivElement>(null);
  // const [canUndo, setCanUndo] = useState<boolean>(false);
  // const [canRedo, setCanRedo] = useState<boolean>(false);
  // const [blockType, setBlockType] = useState<BlockType>(BLOCK_TYPES.P);
  // const [selectedElementKey, setSelectedElementKey] = useState<string | null>(
  //   null
  // );
  // const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] =
  //   useState<boolean>(false);
  // const [codeLanguage, setCodeLanguage] = useState<string>("");
  // const [isRTL, setIsRTL] = useState<boolean>(false);
  const [isLink, setIsLink] = useState<boolean>(false);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [isOl, setIsOl] = useState<boolean>(false);
  const [isUl, setIsUl] = useState<boolean>(false);

  const updateToolCondition = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const anchorNode = selection.anchor.getNode();
    const targetNode = getSecondRootNode(anchorNode);

    if ($isListNode(targetNode)) {
      const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
      const type = parentList
        ? parentList.getListType()
        : targetNode.getListType();
      setBlockType(type);
      return;
    }
    setBlockType(BLOCK_TYPES.ol);

    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsUnderline(selection.hasFormat("underline"));

    // Update links
    const node = getSelectedNode(selection);
    const parent = node.getParent();
    if ($isLinkNode(parent) || $isLinkNode(node)) {
      setIsLink(true);
    } else {
      setIsLink(false);
    }
  }, []);

  useEffect(() => {
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolCondition();
      });
    });
  }, [editor, updateToolCondition]);

  // const [isUnOrderList, isOrderList, isCheckList] = useMemo(
  //   () => [
  //     blockType === BLOCK_TYPES.UL,
  //     blockType === BLOCK_TYPES.OL,
  //     blockType === BLOCK_TYPES.CL,
  //   ],
  //   [blockType]
  // );

  // const toggleUnOrderList = useCallback(() => {
  //   if (!isUnOrderList) {
  //     editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  //     return;
  //   }
  //   editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
  // }, [editor, isUnOrderList]);

  const insertTable = (payload: InsertTableCommandPayload) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, payload);
  };
  const insertImage = (payload: InsertImagePayload) => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
  };

  const insertLink = useCallback(
    (e: any) => {
      e.preventDefault();
      if (!isLink) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
      } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      }
    },
    [editor, isLink]
  );

  const Fill = () => {
    const rows = prompt("Enter the number of rows:", "");
    const columns = prompt("Enter the number of columns:", "");

    if (
      isNaN(Number(columns)) ||
      columns == null ||
      rows == null ||
      columns === "" ||
      rows === "" ||
      isNaN(Number(rows))
    ) {
      return;
    }

    insertTable({ columns: columns, rows: rows });
  };

  const handleUpload = () => {
    insertImage({
      altText: "URL image",
      src: "https://cdn.britannica.com/84/232784-050-1769B477/Siberian-Husky-dog.jpg",
    });
  };

  const [selectedKeys, setSelectedKeys] = React.useState<any>(new Set(["10"]));
  const [fontSize, setFontSize] = React.useState<any>(new Set(["10"]));

  const selectedValue = React.useMemo(
    () => Array.from(selectedKeys).join(", ").replaceAll("_", " "),
    [selectedKeys]
  );

  return (
    <div className="flex space-x-4" ref={toolbarRef}>
      <div className="pr-1 flex items-center">
        <Dropdown>
          <DropdownTrigger>
            <Button
              isIconOnly
              aria-label="paragraph"
              className="bg-white"
              onClick={() => {
                // editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
              }}
            >
              <RiParagraph fontSize={18} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="font-size"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            onAction={(value) => {
              editor.update(() => {
                const selection = $getSelection();
                if (value == 0) {
                  if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createParagraphNode());
                  }
                }
                if (value == 1) {
                  if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h1"));
                  }
                }
                if (value == 2) {
                  if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h2"));
                  }
                }
                if (value == 3) {
                  if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h3"));
                  }
                }
                if (value == 4) {
                  if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h4"));
                  }
                }
                if (value == 5) {
                  if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h5"));
                  }
                }
                if (value == 6) {
                  if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h6"));
                  }
                }
              });
            }}
          >
            <DropdownItem key="0">Normal</DropdownItem>
            <DropdownItem key="1">Headline 1</DropdownItem>
            <DropdownItem key="2">Headline 2</DropdownItem>
            <DropdownItem key="3">Headline 3</DropdownItem>
            <DropdownItem key="4">Headline 4</DropdownItem>
            <DropdownItem key="5">Headline 5</DropdownItem>
            <DropdownItem key="6">Headline 6</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" size="sm" className="capitalize">
              {fontSize}px
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="font-size"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={fontSize}
            onSelectionChange={setFontSize}
            onAction={(value) => {
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  $patchStyleText(selection, {
                    ["font-size"]: `${value}px`,
                  });
                }
              });
            }}
          >
            <DropdownItem key="10">10px</DropdownItem>
            <DropdownItem key="12">12px</DropdownItem>
            <DropdownItem key="13">13px</DropdownItem>
            <DropdownItem key="14">14px</DropdownItem>
            <DropdownItem key="16">16px</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      <div className="pr-1">
        <Button
          isIconOnly
          aria-label="paragraph"
          className="bg-white"
          onClick={(e) => {
            e.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          }}
        >
          <RxFontBold fontSize={20} />
        </Button>
      </div>
      <div className="pr-1">
        <Button
          isIconOnly
          aria-label="paragraph"
          className="bg-white"
          onClick={(e) => {
            e.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          }}
        >
          <TbItalic fontSize={18} />
        </Button>
      </div>
      <div className="pr-1">
        <Button
          isIconOnly
          aria-label="paragraph"
          className="bg-white"
          onClick={(e) => {
            e.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
          }}
        >
          <TbUnderline fontSize={18} />
        </Button>
      </div>

      <div className="flex items-center">
        <Divider orientation="vertical" className="pr-0.5 h-5" />
      </div>
      <div className="px-1">
        <Button
          isIconOnly
          aria-label="left"
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
          }}
          className="bg-white"
        >
          <TbAlignLeft fontSize={18} />
        </Button>
      </div>
      <div className="pr-1">
        <Button
          isIconOnly
          aria-label="center"
          className="bg-white"
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
          }}
        >
          <TbAlignCenter fontSize={18} />
        </Button>
      </div>
      <div className="pr-1">
        <Button
          isIconOnly
          aria-label="right"
          className="bg-white"
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
          }}
        >
          <TbAlignRight fontSize={18} />
        </Button>
      </div>
      <div className="pr-1">
        <Button
          isIconOnly
          aria-label="center"
          className="bg-white"
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
          }}
        >
          <TbAlignJustified fontSize={18} />
        </Button>
      </div>
      <div className="flex items-center">
        <Divider orientation="vertical" className="pr-0.5 h-5" />
      </div>
      <div className="px-1">
        <Button
          isIconOnly
          aria-label="order-list"
          className="bg-white"
          onClick={(e) => {
            e.preventDefault();
            if(!isUl){
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
              setIsUl(true)
              return
            }
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            setIsUl(false)  
          }}
        >
          <TbListLetters fontSize={18} />
        </Button>
      </div>

      <div className="pr-1">
        <Button
          isIconOnly
          aria-label="order-list"
          className="bg-white"
          onClick={(e) => {
            e.preventDefault();
            if(!isOl){
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
              setIsOl(true)
              return
            }
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            setIsOl(false) 
            
          }}
        >
          <TbListNumbers fontSize={18} />
        </Button>
      </div>
      <div className="flex items-center">
        <Divider orientation="vertical" className="pr-0.5 h-5" />
      </div>
      <div className="px-1">
        <Button
          isIconOnly
          aria-label="order-list"
          className="bg-white"
          onClick={() => {
            // e.preventDefault();
            
          }}
        >
          <TbLink fontSize={18} />
        </Button>
      </div>
      <div className="pr-1">
        <Button
          isIconOnly
          onClick={() => handleUpload()}
          aria-label="image"
          className="bg-white"
        >
          <TbPhoto fontSize={18} />
        </Button>
      </div>
      <div className="pr-1">
        <Button
          onClick={() => Fill()}
          endContent={<TbPlus />}
          aria-label="tale"
          className="bg-white"
        >
          Insert
        </Button>
      </div>
    </div>
  );
}