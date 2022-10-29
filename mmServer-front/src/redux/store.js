import {createStore, applyMiddleware} from "redux";
import thunkMiddleware from "redux-thunk";

import {
    CLEAR_COLLECTION_ENTRY,
    CLEAR_DETAIL_ENTRY,
    COLLECTION_ENTRY,
    DETAIL_ENTRY,
    ENTRIES,
    ENTRIES_FILTER,
} from './actionConstants';

const INITIAL_STATE = {
    // modal states
    entries: null,
    entriesFilter: null,
    detailEntry: null,
    collectionEntry: null,
}

const rootReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case CLEAR_COLLECTION_ENTRY:
            return {...state, collectionEntry: null}
        case CLEAR_DETAIL_ENTRY:
            return {...state, detailEntry: null}
        case COLLECTION_ENTRY:
            return {...state, collectionEntry: action.payload.entry}
        case DETAIL_ENTRY:
            return {...state, detailEntry: action.payload.entry}
        case ENTRIES:
            return {...state, entries: action.payload.entries}
        case ENTRIES_FILTER:
            return {...state, entriesFilter: action.payload.entriesFilter}
        default:
            return state
    }
}

export default createStore(rootReducer, applyMiddleware(thunkMiddleware));
