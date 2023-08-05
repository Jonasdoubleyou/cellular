import React, { useCallback, useState } from 'react';
import { CellularModel } from '../model/model';
import './App.css';
import { ButtonList } from './base/Button';
import { Icon, IconButton } from './base/Icons';
import { ModelUI } from './model/Model';

function App() {
  const [model, _setModel] = useState<CellularModel>({
    title: "Hello World",
    blocks: []
  });

  const setModel = useCallback((model: CellularModel) => {
     console.log(`Updated Model`, model);
    _setModel(model);
  }, []);

  return (
    <div className="app">
        <div className="app-header">
          <div className="app-title">
            CELLULAR <div className="app-title-model">/ {model.title}</div>
          </div>
          <div className="app-nav">
            <ButtonList>
              <IconButton icon="add" text="Add" />
              <IconButton icon="save" />
              <IconButton icon="settings" />
            </ButtonList>

          </div>
        </div>
        <ModelUI model={model} setModel={setModel} />
    </div>
  );
}

export default App;
