import "./Tree.css";

export function TreeNode({ children, name }: React.PropsWithChildren<{ name: string }>) {
    return <details className="tree-node" open>
        <summary className="tree-node-name">
            <div className="tree-node-title">{name}</div>
        </summary>
        <div className="tree-node-children">
            {children}
        </div>
    </details>
}