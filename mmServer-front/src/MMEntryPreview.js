import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";

import toast, { Toaster } from 'react-hot-toast';

import { Button } from 'reactstrap';

// const REACT_APP_PROXY = process.env.REACT_APP_PROXY
const REACT_APP_PROXY = `http://${window.location.hostname}:5001`  // TODO(mcotton): read env data from API call


const MMEntryPreview = (props) => {
    const detailEntry = useSelector(state => state.detailEntry);
    const [mimetypeGuess, setMimetypeGuess] = useState(null);

    useEffect(() => {
        getDetail();
    }, []);

    if (!detailEntry) return <div></div>;

    const getDetail = () => {
        if (!detailEntry) return;

        fetch(REACT_APP_PROXY + '/api/detail/' + detailEntry.hashes[0])
            .then(function(response) {
                if (response.ok) {
                    return response.json()
                }
                throw response;
            })
            .then(function(data) {
                console.log(data);
                setMimetypeGuess(data.mimetype);
            })
            .catch(err => {
                console.error(err);
                toast.error(err.message);
            })
    }

    const previewTemplate = (entry) => {
        if (!mimetypeGuess) {
            return <div>(Preview not available.)</div>
        } else if (mimetypeGuess.startsWith("video")) {
            return (
                <video style={{width: "100%"}} controls preload="metadata">
                    <source src={`${REACT_APP_PROXY}/stream/${entry.hashes[0]}`} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            );
        } else if (mimetypeGuess.startsWith("audio")) {
            return (
                <audio style={{minWidth: "75%", maxWidth: "90%"}} controls preload="metadata">
                    <source src={`${REACT_APP_PROXY}/stream/${entry.hashes[0]}`} type="audio/mp4" />
                    Your browser does not support the audio tag.
                </audio>
            );
        } else if (mimetypeGuess.startsWith("image")) {
            return (
                <img style={{maxWidth: "90vw", maxHeight: "90vh"}} src={`${REACT_APP_PROXY}/api/data/${entry.hashes[0]}`} />
            );
        } else if (mimetypeGuess.startsWith("application/pdf")) {
            return (
                <iframe style={{minWidth: "80vw", minHeight: "80vh"}} src={`${REACT_APP_PROXY}/stream/${entry.hashes[0]}#toolbar=0`} />
            );
        } else {
            return <div>(Preview not available.)</div>;
        }
    }

    return (
        <div key={detailEntry.id}>
            <div>Name: { detailEntry.name }</div>
            <div>Size: { detailEntry.size }</div>
            <div>Type: { mimetypeGuess }</div>
            {previewTemplate(detailEntry)}
            <div><a target="_blank" href={`${REACT_APP_PROXY}/stream/${detailEntry.hashes[0]}`}>(Raw)</a></div>
            {/*<div>
                {% if data.mimetype == None %}
                    <div>(Preview not available.)</div>
                {% elif data.mimetype.startswith('video') %}
                    <div>Player</div>
                    <video width="100%" controls preload=metadata>
                        <source src="/stream/{{ data.item.hashes[0] }}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                {% elif data.mimetype.startswith('audio') %}
                    <div>Player</div>
                    <audio width="50%" controls preload=metadata>
                        <source src="/stream/{{ data.item.hashes[0] }}" type="audio/mp4">
                        Your browser does not support the audio tag.
                    </audio>
                {% elif data.mimetype.startswith('image') %}
                    <div>Image</div>
                    <img width="50%" src="/download/{{ data.item.hashes[0] }}">
                    </img>
                {% elif data.mimetype.startswith('application/pdf') %}
                    <div>PDF</div>
                    <iframe width="40%" height="80%" src="/stream/{{ data.item.hashes[0] }}#toolbar=0">
                    </iframe>
                {% else %}
                    <div>(Preview not available.)</div>
                {% endif %}
            </div>*/}
            <Toaster />
        </div>
    );
}

export default MMEntryPreview;
