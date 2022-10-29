import React from 'react';
import { useDispatch, useSelector } from "react-redux";
import { clearDetailEntry } from "./redux/actions";

import { Button } from 'reactstrap';
import toast, { Toaster } from 'react-hot-toast';

import MMEntryPreview from "./MMEntryPreview.js"


const REACT_APP_PROXY = process.env.REACT_APP_PROXY


const MMEntry = (props) => {
    const detailEntry = useSelector(state => state.detailEntry);

    const dispatch = useDispatch();

    const clearDetailEntryEvent = () => {
        dispatch(clearDetailEntry());
    }

    const startCastingEntry = () => {
        fetch(`${REACT_APP_PROXY}/api/cast/${detailEntry.hashes[0]}`)
            .then(function(response) {
                if (response.ok) {
                    return response.json()
                }
                throw response;
            })
            .then(function(data) {
                console.log(data);
                toast.success("Casting...")
            })
            .catch(err => {
                console.error(err);
                toast.error(`Something went wrong: ${err.message}`);
            })
    }

    if (!detailEntry) return <></>;

    return (
        <>
            <Button className="mc-button" onClick={clearDetailEntryEvent}>Back</Button>
            <Button className="mc-button" onClick={startCastingEntry}>Cast to TV</Button>
            <MMEntryPreview />
            <div style={{padding: "0 10% 0 10%"}}>
                <pre style={{backgroundColor: "#D9D9D9", whiteSpace: "pre-wrap", textAlign: "left"}}>
                    {JSON.stringify(detailEntry)}
                </pre>
            </div>

            <Toaster />
        </>
    );
}

export default MMEntry;
