import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, {type ToastList} from './App.tsx'
import {
    Repo,
    BroadcastChannelNetworkAdapter,
    IndexedDBStorageAdapter,
    RepoContext, isValidAutomergeUrl,
} from "@automerge/react";

// Now we can get on with our lives

const repo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [new BroadcastChannelNetworkAdapter()],
})

// Check the URL for a document to load
const locationHash = document.location.hash.substring(1);

// Depending if we have an AutomergeUrl, either find or create the document
let handle;
if (isValidAutomergeUrl(locationHash)) {
    handle = await repo.find(locationHash);
} else {
    handle = repo.create<ToastList>({
        toasts: [],
    });
    // Set the location hash to the new document we just made.
    document.location.hash = handle.url;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <RepoContext.Provider value={repo}>
          <App  docUrl={handle.url}/>
      </RepoContext.Provider>
  </StrictMode>,
)
