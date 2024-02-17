
export function Select<T>({ options, onChange, map }: { options: T[], onChange: (option: T) => void, map: (it: T) => string }) {
    return <select onChange={e => { if(e.target.selectedIndex > 0) onChange(options[e.target.selectedIndex - 1])}}>
        <option>Select something</option>
        {options.map((it, index) => <option value={index}>{map(it)}</option>)}
    </select>;
}