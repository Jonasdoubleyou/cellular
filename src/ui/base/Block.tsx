import * as React from "react";
import './Block.css';
import { IconButton } from "./Icons";

export function BlockUI({ children }: React.PropsWithChildren<{}>) {
    return <div className="block">
        {children}
    </div>
}

BlockUI.Header = ({ children }: React.PropsWithChildren<{}>) => (
    <div className="block-header">
        {children}
    </div>
);

BlockUI.Footer = ({ children }: React.PropsWithChildren<{}>) => (
    <div className="block-footer">
        {children}
    </div>
);

BlockUI.Title = ({ title }: { title: string | React.ReactElement }) => (
    <div className="block-title">
        {title}
    </div>
);

BlockUI.Connecter = ({ description }: { description?: string }) => (
    <div className="block-connector">
       {description}
    </div>
)

BlockUI.Row = ({ children }: React.PropsWithChildren<{}>) => (
    <div className="block-row">
        {children}
    </div>
);