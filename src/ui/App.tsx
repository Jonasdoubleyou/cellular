import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CellularModel } from '../model/model';
import './App.css';
import { Button, ButtonList, SelectButtonList } from './base/Button';
import { Icon, IconButton } from './base/Icons';
import { ModelUI } from './model/Model';
import { ModelStore } from '../runtime/store';
import { Workspace } from '../runtime/workspace';
import { BlockUI } from './base/Block';

function Loading () {
    return <>....</>;
}

function App() {
  const [workspaces, setWorkspaces] = useState<string[]>([]);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [modelsInWorkspace, setModelsInWorkspace] = useState<string[]>([]);

  const [model, setModel] = useState<CellularModel | null>(null);

  useEffect(() => {
    Workspace.getWorkspaces().then(setWorkspaces);

    Workspace.loadWorkspace("default")
        .then(setWorkspace);
  }, []);

  useEffect(() => {
    if (workspace) {
        workspace.getModels().getModelTitles().then(setModelsInWorkspace);
    }
  }, [workspace]);

  function chooseModel(title: string) {
    if (!workspace) return;

    workspace.getModels().getModel(title).then(setModel);
  }

  function createModel() {
    setModel({
        title: "Untitled",
        blocks: []
    });
  }

  function chooseWorkspace(title: string) {
    Workspace.loadWorkspace(title).then(setWorkspace);
  }

  function createWorkspace(title: string) {
    // TODO
  }

  if (!workspace) {
    return (
        <div className="app">
            <Loading />    
        </div>
      );
  }

  if (!model) {
    return (
        <div className="app">
            <div className="app-intro-header">
                <div className="app-intro-title">
                    CELLULAR
                </div>
            </div>
            <BlockUI.Row>
                <BlockUI>
                    <BlockUI.Header>
                        <BlockUI.Title title="Models" />
                    </BlockUI.Header>
                    
                    <ButtonList>
                        {modelsInWorkspace.map(title => <Button text={title} onClick={() => chooseModel(title)}/>)}
                    </ButtonList>

                    <IconButton onClick={createModel} icon='add' highlight text="Create Model" />
                </BlockUI>

                <BlockUI>
                    <BlockUI.Header>
                        <BlockUI.Title title="Workspaces" />
                    </BlockUI.Header>

                    <SelectButtonList options={workspaces} onChose={chooseWorkspace} chosen={workspace?.name} />

                    <IconButton icon='add' highlight text="Add Workspace" />
                </BlockUI>
            </BlockUI.Row>
            <BlockUI.Connecter />
            <BlockUI.Row>
                <BlockUI>
                    <BlockUI.Header>
                        <BlockUI.Title title="About" />
                    </BlockUI.Header>
                </BlockUI>

                <BlockUI>
                    <BlockUI.Header>
                        <BlockUI.Title title="Need help?" />
                    </BlockUI.Header>
                </BlockUI>
            </BlockUI.Row>
        </div>
    );
  }
  
  return <ModelUI model={model} workspace={workspace} />;
}

export default App;
