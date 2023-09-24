
export function Select<T>({ options, onChange, map }: { options: T[], onChange: (option: T) => void, map: (it: T) => string }) {
    return <select onChange={e => onChange(options[e.target.selectedIndex])}>
        {options.map((it, index) => <option value={index}>{map(it)}</option>)}
    </select>;
}