import { IconButton } from "./Icons";
import "./Popup.css";

export function Popup({ children, title, onClose }: React.PropsWithChildren<{ title: string, onClose: () => void }>) {
    return <div className="popup">
        <div className="popup-content">
            <div className="popup-header">
                <div className="popup-title">{title}</div>
                <IconButton icon="cancel" text="Close" onClick={onClose} />
            </div>
            {children}
        </div>
    </div>;
}