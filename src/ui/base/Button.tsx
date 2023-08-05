import "./Button.css"

export function ButtonList({ children }: React.PropsWithChildren<{}>) {
    return <div className="button-list">
        {children}
    </div>
}