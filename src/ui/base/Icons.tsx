import * as React from "react";
import "./Icons.css";

// c.f. https://fonts.google.com/icons (thanks Googol!)
export type IconName = 
  | 'play_arrow'
  | 'add'
  | 'cancel'
  | 'save'
  | 'menu'
  | 'settings'
  | 'print';

export type IconProps = {
    icon: IconName;
};

export function Icon ({ icon }: IconProps) {
    return (
        <span className="icon material-symbols-outlined">
            {icon}
        </span>
    );
}

export function IconButton({ text, onClick, small, highlight, ...iconProps }: { icon: IconName, text?: string, small?: true, highlight?: true, onClick?: () => void } & IconProps) {
    return (
        <button className={"icon-button no-print " + (small ? "icon-button_small" : "") + (highlight ? "icon-button_highlight" : "")} onClick={onClick}>
            <Icon {...iconProps} />
            {text && <div className="icon-button-text">{text}</div>}
        </button>
    )
}