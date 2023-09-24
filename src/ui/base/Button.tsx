import "./Button.css"

export function ButtonList({ children, right }: React.PropsWithChildren<{ right?: boolean }>) {
    return <div className={right ? "button-list button-list-right" : "button-list"}>
        {children}
    </div>
}