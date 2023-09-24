import "./Button.css"

export function ButtonList({ children, right }: React.PropsWithChildren<{ right?: boolean }>) {
    return <div className={right ? "button-list button-list-right no-print" : "button-list no-print"}>
        {children}
    </div>
}

export function Button({ text, onClick, highlight }: { text: string, onClick: () => void, highlight?: boolean }) {
    return <div className={highlight ? "button button-highlight no-print" : "button no-print"} onClick={onClick}>{text}</div>
}

export function SelectButtonList({ options, onChose, chosen, map }: { options: string[], onChose: (option: string) => void, chosen: string | null, map?: (option: string) => string }) {
    return <ButtonList>
        {options.map(option => <Button text={map?.(option) ?? option} onClick={() => onChose(option)} highlight={option === chosen} />)}
    </ButtonList>
}