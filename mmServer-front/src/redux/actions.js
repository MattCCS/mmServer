import {
    CLEAR_COLLECTION_ENTRY,
    CLEAR_DETAIL_ENTRY,
    COLLECTION_ENTRY,
    DETAIL_ENTRY,
    ENTRIES,
    ENTRIES_FILTER,
} from './actionConstants';


export const clearCollectionEntry = val => ({
    type: CLEAR_COLLECTION_ENTRY,
})

export const clearDetailEntry = val => ({
    type: CLEAR_DETAIL_ENTRY,
})

export const setDetailEntry = val => ({
    type: DETAIL_ENTRY,
    payload: {
        entry: val,
    }
})

export const setCollectionEntry = val => ({
    type: COLLECTION_ENTRY,
    payload: {
        entry: val,
    }
})

export const setEntries = val => ({
    type: ENTRIES,
    payload: {
        entries: val,
    }
})

export const setEntriesFilter = val => ({
    type: ENTRIES_FILTER,
    payload: {
        entriesFilter: val,
    }
})
