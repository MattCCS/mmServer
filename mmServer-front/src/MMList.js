import React, { useState, useEffect } from 'react';
// import './MMList.css';

import { Button, Card, CardBody, Input, Label } from 'reactstrap';
import _ from "lodash";
import toast, { Toaster } from 'react-hot-toast';

import { useDispatch, useSelector } from "react-redux";
import { setEntries } from "./redux/actions";

import MMListFilter from "./MMListFilter";
import { MMListItem, mmListHeader } from "./MMListItem";


const notify = (err) => toast.error(err);

const seekDebounce = _.debounce((val, callback) => callback(val), 500)
const volumeDebounce = _.debounce((val, callback) => callback(val), 20)

const REACT_APP_PROXY = process.env.REACT_APP_PROXY
console.log(REACT_APP_PROXY)


const MMList = () => {
    const entries = useSelector(state => state.entries);
    const entriesFilter = useSelector(state => state.entriesFilter);

    const dispatch = useDispatch();

    useEffect(() => {
        if (!entries) {
            getList();
        }
    }, []);

    const setEntriesEvent = (entries) => {
        dispatch(setEntries(entries));
    }

    const getList = () => {
        fetch(REACT_APP_PROXY + '/api/list')
            .then(function(response) {
                if (response.ok) {
                    return response.json()
                }
                throw response;
            })
            .then(function(data) {
                console.log(data);
                setEntriesEvent(data.items);
            })
            .catch(err => {
                console.error(err);
                toast.error(err.message);
            })
    }

    const listEntryTemplate = (entry) => {
        // const isZip = entry.name.endsWith(".zip");
        const hash = entry.hashes[0];
        return (
            <MMListItem key={entry.id} entry={entry} />
        );
    }

    const listEntriesTemplate = (entries) => {
        if (!entries) return <div></div>;
        if (entriesFilter) {
            entries = _.filter(entries, e => _.includes(e.name.toLowerCase(), entriesFilter.toLowerCase()));
        }
        if (entries.length > 10000) return <>Too many entries (filter with text).</>;
        return (
            <div className="list-entries">
                {entries.map(listEntryTemplate)}
            </div>
        );
    }

    return (
        <div>
            <MMListFilter />
            <div style={{margin: "0 10% 0 10%", paddingTop: "2em"}}>
                {mmListHeader()}
                {listEntriesTemplate(entries)}
            </div>
            <Toaster />
        </div>
    );
}

export default MMList;
