import React, { useState, useId, useRef, createRef } from "@wordpress/element";
import "./NestedComponents.scss";

import { EditOnly, SaveOnly } from "./SwiftState";
import { plus } from '@wordpress/icons';
import {
	Button,
  Popover,
  Toolbar,
  ToolbarGroup,
  ToolbarButton,
  Slot,
  SlotFillProvider,
} from "@wordpress/components";

import { chevronUp, chevronDown, chevronLeft, chevronRight, close } from "@wordpress/icons";

function uniqueId(obj: any) {
  const jsonString = JSON.stringify(obj);
  let hash = 0;

  for (let i = 0; i < jsonString.length; i++) {
    const charCode = jsonString.charCodeAt(i);
    hash = (hash << 5) - hash + charCode;
    hash |= 0;
  }
  if (hash < 0) {
    hash = -hash;
  }
  return hash.toString();
}

/**
 * NestedComponentsProps type.
 * @typedef {object} NestedComponentsProps
 * @property {string} value - The object that holds the data for the nested components
 */
interface NestedComponentsProps<T> {
  value: T[];
  emptyObject?: T;
  className?: string;
  slotName?: string;
  horizontal?: boolean;
	maxItems: number;
  onChange: (value: T[]) => void;
  children: (
    value: T,
    index?: number,
		slot?: string,
    update?: (obj: Partial<T>) => void
  ) => React.ReactNode;
}

const NestedEditor = <T,>({
  value,
  emptyObject = {} as T,
  className,
  slotName,
	maxItems,
	horizontal = false,
  onChange,
  children,
}: NestedComponentsProps<T>) => {
  const [toolbar, setToolbar] = useState(-1);
	const popoverAnchor = useRef<any[]>([]);

  function addChild() {
    onChange([...value, { ...emptyObject }]);
  }

  function removeChild(atIndex: number) {
    onChange(value.filter((_, index) => index !== atIndex));
		setToolbar(-1);
  }

  function moveChild(fromIndex: number, toIndex: number) {
    const newChildren = [...value];
    const [child] = newChildren.splice(fromIndex, 1);
    newChildren.splice(toIndex, 0, child);
		setToolbar(toIndex);
    onChange(newChildren);
  }

	function moveUp(index: number) {
		if (index > 0) {
			moveChild(index, index - 1);
		}
	}

	function moveDown(index: number) {
		if (index < value.length - 1) {
			moveChild(index, index + 1);
		}
	}

  const updateChild = (atIndex: number) => (partialChanges: Partial<T>) => {
    const newChildren = [...value];
    newChildren[atIndex] = { ...newChildren[atIndex], ...partialChanges };
    onChange(newChildren);
  };

  return (
    <>
      <div className={`nested-components ${className}`}>
        {value.map((v, i) => (
          <div
            key={i}
            onFocus={() => setToolbar(i)}
            ref={(ref) => (popoverAnchor.current[i] = ref)}
          >
            {toolbar === i && (
              <Popover
                onClose={() => setToolbar(-1)}
                placement="top-start"
                anchor={popoverAnchor.current[i]}
              >
                <Toolbar
                  label="NestedEditor"
                  id="nestedEditor"
                  className={toolbar === i ? "open" : ""}
                >
                  <ToolbarGroup>
                    <ToolbarButton
                      icon={close}
                      onClick={() => {
                        removeChild(i);
                      }}
                    ></ToolbarButton>
                  </ToolbarGroup>
                  <ToolbarGroup>
                    <ToolbarButton
                      icon={horizontal ? chevronLeft : chevronUp}
                      onClick={() => {
                        moveUp(i);
                      }}
                    ></ToolbarButton>
                    <ToolbarButton
                      icon={horizontal ? chevronRight : chevronDown}
                      onClick={() => {
                        moveDown(i);
                      }}
                    ></ToolbarButton>
                  </ToolbarGroup>
                  {slotName && <Slot name={`${slotName}_${i}`} />}
                </Toolbar>
              </Popover>
            )}
            {children(v, i, `${slotName}_${i}`, updateChild(i))}
          </div>
        ))}
      </div>
      <Button
				disabled={value.length >= maxItems}
        icon={plus}
        variant="tertiary"
        onClick={addChild}
        style={{ background: "white" }}
				className="nested-components__button"
      />
    </>
  );
};

/**
 * A utility element that handles adding/removing children
 * without the use of Gutenberg blocks. Useful for blocks
 * that wish to have more finite control over children.
 * @param {string} props.className - The class name for the component
 * @param {string} props.value - The object that holds the data for the nested components
 * @param {string} props.children - The component to render for each child
 * @param {string} props.emptyObject - The object to clone when adding a new child
 * @param {string} props.slotName - If provided, the editor menu will appear in the slot provided. Useful if combining with LiveTextInput.
 * @param {string} props.onChange - The function to call when the children change
 * @returns {React.ReactElement} The NestedComponents component
 */
const NestedComponents = <T,>(props: NestedComponentsProps<T>) => {
	const { className, value, children } = props;

	return (
    <>
      <SaveOnly>
        <div className={className}>{value.map((v,i) => children(v,i))}</div>
      </SaveOnly>
      <EditOnly>
				<NestedEditor {...props} />
      </EditOnly>
    </>
  );
};

export default NestedComponents;