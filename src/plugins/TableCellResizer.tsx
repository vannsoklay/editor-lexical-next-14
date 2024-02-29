"use client";

import type { TableDOMCell } from "@lexical/table";
import type { LexicalEditor } from "lexical";
import "../app/globals.css";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableRowNode,
  getDOMCellFromTarget,
  $isTableSelection,
} from "@lexical/table";
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  COMMAND_PRIORITY_HIGH,
  //   $isGridSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import * as React from "react";
import {
  MouseEventHandler,
  ReactPortal,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type MousePosition = {
  x: number;
  y: number;
};

type MouseDraggingDirection = "right" | "bottom";

const MIN_ROW_HEIGHT = 33;
const MIN_COLUMN_WIDTH = 50;

function TableCellResizer({
  editor,
}: {
  editor: LexicalEditor;
}): React.ReactNode {
  const targetRef = useRef<HTMLElement | null>(null);
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const tableRectRef = useRef<DOMRect | null>(null);

  const mouseStartPosRef = useRef<MousePosition | null>(null);
  const [mouseCurrentPos, updateMouseCurrentPos] =
    useState<MousePosition | null>(null);

  const [activeCell, updateActiveCell] = useState<TableDOMCell | null>(null);
  const [isSelectingGrid, updateIsSelectingGrid] = useState<boolean>(false);
  const [draggingDirection, updateDraggingDirection] =
    useState<MouseDraggingDirection | null>(null);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (payload) => {
        const selection = $getSelection();
        const isGridSelection = $isTableSelection(selection);

        if (isSelectingGrid !== isGridSelection) {
          updateIsSelectingGrid(isGridSelection);
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  });

  const resetState = useCallback(() => {
    updateActiveCell(null);
    targetRef.current = null;
    updateDraggingDirection(null);
    mouseStartPosRef.current = null;
    tableRectRef.current = null;
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      setTimeout(() => {
        const target = event.target;

        if (draggingDirection) {
          updateMouseCurrentPos({
            x: event.clientX,
            y: event.clientY,
          });
          return;
        }

        if (resizerRef.current && resizerRef.current.contains(target as Node)) {
          return;
        }

        if (targetRef.current !== target) {
          targetRef.current = target as HTMLElement;
          const cell = getDOMCellFromTarget(target as HTMLElement);

          if (cell && activeCell !== cell) {
            editor.update(() => {
              const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);
              if (!tableCellNode) {
                throw new Error("TableCellResizer: Table cell node not found.");
              }

              const tableNode =
                $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
              const tableElement = editor.getElementByKey(tableNode.getKey());

              if (!tableElement) {
                throw new Error("TableCellResizer: Table element not found.");
              }

              targetRef.current = target as HTMLElement;
              tableRectRef.current = tableElement.getBoundingClientRect();
              updateActiveCell(cell);
            });
          } else if (cell == null) {
            resetState();
          }
        }
      }, 0);
    };

    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [activeCell, draggingDirection, editor, resetState]);

  const isHeightChanging = (direction: MouseDraggingDirection) => {
    if (direction === "bottom") return true;
    return false;
  };

  const updateRowHeight = useCallback(
    (newHeight: number) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }

      editor.update(() => {
        const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
        if (!$isTableCellNode(tableCellNode)) {
          throw new Error("TableCellResizer: Table cell node not found.");
        }

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

        const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

        const tableRows = tableNode.getChildren();

        if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
          throw new Error("Expected table cell to be inside of table row.");
        }

        const tableRow = tableRows[tableRowIndex];

        if (!$isTableRowNode(tableRow)) {
          throw new Error("Expected table row");
        }

        tableRow.setHeight(newHeight);
      });
    },
    [activeCell, editor]
  );

  const updateColumnWidth = useCallback(
    (newWidth: number) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }
      editor.update(() => {
        const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
        if (!$isTableCellNode(tableCellNode)) {
          throw new Error("TableCellResizer: Table cell node not found.");
        }

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

        const tableColumnIndex =
          $getTableColumnIndexFromTableCellNode(tableCellNode);

        const tableRows = tableNode.getChildren();

        for (let r = 0; r < tableRows.length; r++) {
          const tableRow = tableRows[r];

          if (!$isTableRowNode(tableRow)) {
            throw new Error("Expected table row");
          }

          const tableCells = tableRow.getChildren();

          if (tableColumnIndex >= tableCells.length || tableColumnIndex < 0) {
            throw new Error("Expected table cell to be inside of table row.");
          }

          const tableCell = tableCells[tableColumnIndex];

          if (!$isTableCellNode(tableCell)) {
            throw new Error("Expected table cell");
          }

          tableCell.setWidth(newWidth);
        }
      });
    },
    [activeCell, editor]
  );

  const toggleResize = useCallback(
    (direction: MouseDraggingDirection): MouseEventHandler<HTMLDivElement> =>
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) {
          throw new Error("TableCellResizer: Expected active cell.");
        }

        if (draggingDirection === direction && mouseStartPosRef.current) {
          const { x, y } = mouseStartPosRef.current;

          if (activeCell === null) {
            return;
          }

          const { height, width } = activeCell.elem.getBoundingClientRect();

          if (isHeightChanging(direction)) {
            const heightChange = Math.abs(event.clientY - y);

            const isShrinking = direction === "bottom" && y > event.clientY;

            updateRowHeight(
              Math.max(
                isShrinking ? height - heightChange : heightChange + height,
                MIN_ROW_HEIGHT
              )
            );
          } else {
            const widthChange = Math.abs(event.clientX - x);

            const isShrinking = direction === "right" && x > event.clientX;

            updateColumnWidth(
              Math.max(
                isShrinking ? width - widthChange : widthChange + width,
                MIN_COLUMN_WIDTH
              )
            );
          }

          resetState();
        } else {
          mouseStartPosRef.current = {
            x: event.clientX,
            y: event.clientY,
          };
          updateMouseCurrentPos(mouseStartPosRef.current);
          updateDraggingDirection(direction);
        }
      },
    [
      activeCell,
      draggingDirection,
      resetState,
      updateColumnWidth,
      updateRowHeight,
    ]
  );

  const getResizers = useCallback(() => {
    if (activeCell) {
      const { height, width, top, left } =
        activeCell.elem.getBoundingClientRect();

      const styles = {
        bottom: {
          backgroundColor: "none",
          cursor: "row-resize",
          height: "10px",
          left: `${window.scrollX + left}px`,
          top: `${window.scrollY + top + height}px`,
          width: `${width}px`,
        },
        right: {
          backgroundColor: "none",
          cursor: "col-resize",
          height: `${height}px`,
          left: `${window.scrollX + left + width}px`,
          top: `${window.scrollY + top}px`,
          width: "10px",
        },
      };

      const tableRect = tableRectRef.current;

      if (draggingDirection && mouseCurrentPos && tableRect) {
        if (isHeightChanging(draggingDirection)) {
          styles[draggingDirection].left = `${
            window.scrollX + tableRect.left
          }px`;
          styles[draggingDirection].top = `${
            window.scrollY + mouseCurrentPos.y
          }px`;
          styles[draggingDirection].height = "3px";
          styles[draggingDirection].width = `${tableRect.width}px`;
        } else {
          styles[draggingDirection].top = `${
            window.scrollY + tableRect.top
          }px`;
          styles[draggingDirection].left = `${
            window.scrollX + mouseCurrentPos.x
          }px`;
          styles[draggingDirection].width = "3px";
          styles[draggingDirection].height = `${tableRect.height}px`;
        }

        styles[draggingDirection].backgroundColor = "#adf";
      }

      return styles;
    }

    return {
      bottom: null,
      left: null,
      right: null,
      top: null,
    };
  }, [activeCell, draggingDirection, mouseCurrentPos]);

  const resizerStyles = getResizers();

  return (
    <div ref={resizerRef}>
      {activeCell != null && !isSelectingGrid && (
        <>
          <div
            className="TableCellResizer__resizer TableCellResizer__ui"
            style={resizerStyles.right || undefined}
            onMouseDown={toggleResize("right")}
            onMouseUp={toggleResize("right")}
          />
          <div
            className="TableCellResizer__resizer TableCellResizer__ui"
            style={resizerStyles.bottom || undefined}
            onMouseDown={toggleResize("bottom")}
            onMouseUp={toggleResize("bottom")}
          />
        </>
      )}
    </div>
  );
}

export default function TableCellResizerPlugin(): ReactPortal | null {
  const [editor] = useLexicalComposerContext();
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  return useMemo(() => {
    if (editorContainerRef.current) {
      return createPortal(
        <TableCellResizer editor={editor} />,
        editorContainerRef.current
      );
    } else {
      return null;
    }
  }, [editor]);
}
// export default function TableCellResizerPlugin(): ReactPortal {
//     const [editor] = useLexicalComposerContext();
  
//     return useMemo(
//       () => createPortal(<TableCellResizer editor={editor} />, document.body),
//       [editor]
//     );
//   }