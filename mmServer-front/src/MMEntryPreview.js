import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";

import toast, { Toaster } from 'react-hot-toast';

import { Button, Card, CardHeader } from 'reactstrap';
import { ListGroup, ListGroupItem } from 'reactstrap';

import { REACT_APP_PROXY } from "./environment.js"


const TimestampsElem = (props) => {
    const timestamps = (props.timestamps || []).sort((a, b) => a.time - b.time)

    const timestampElem = (timestamp) => {
        const h = Math.floor(timestamp.time / 3600).toString().padStart(1, '0')
        const m = Math.floor(timestamp.time % 3600 / 60).toString().padStart(2, '0')
        const s = Math.floor(timestamp.time % 60).toString().padStart(2, '0')

        const tsHuman = (h > 0 ? `${h}:` : ``) + (m > 0 ? `${m}:` : `00:`) + s

        return (
            <ListGroupItem style={{padding: `.25rem`, display: `flex`}}>
                <span style={{color: `#007bff`}} onClick={() => props.callback(timestamp.time)}>
                    {tsHuman} - {timestamp.note}
                </span>
            </ListGroupItem>
        )
    }

    return (timestamps.length) ? (
        <Card style={{ width: `18rem`, margin: `auto` }}>
            <CardHeader>Timestamps</CardHeader>
            <ListGroup flush>
                {timestamps.map(timestampElem)}
            </ListGroup>
        </Card>
    ) : <></>
}


const MMEntryPreview = (props) => {
    const detailEntry = useSelector(state => state.detailEntry)
    const [mimetypeGuess, setMimetypeGuess] = useState(null)
    const [currentTime, setCurrentTime] = useState(0.0)
    const [duration, setDuration] = useState(0.0)
    const [percent, setPercent] = useState(0.0)
    const [playerLoaded, setPlayerLoaded] = useState(false)
    const [showingNote, setShowingNote] = useState(false)
    const [timestamps, setTimestamps] = useState([])

    const playerRef = useRef();

    const play = () => {
        if (duration > 0) playerRef.current.play()
    }

    const pause = () => {
        if (duration > 0) playerRef.current.pause()
    }

    const seek = (seconds) => {
        if (duration > 0) playerRef.current.currentTime = seconds
    }

    const playerFirstLoadHook = () => {
        setPlayerLoaded(true)
        // playerRef.current.currentTime = 30

        // if (duration === 0) return
        // seek(30)
    }

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
                parseTags(data.item.tags)
            })
            .catch(err => {
                console.error(err);
                toast.error(err.message);
            })
    }

    const parseTimestamps = (tags) => {
        const regex = /@time=(?<time>[^:]+):(?<noteJson>.+)/

        const timestamps = []
        tags.forEach(tag => {
            const match = tag.match(regex)
            if (match !== null) {
                timestamps.push({
                    time: parseFloat(match.groups.time),
                    note: JSON.parse(match.groups.noteJson),
                })
            }
        })
        return timestamps
    }

    const parseTags = (tags) => {
        console.log(tags)
        setTimestamps(parseTimestamps(tags))
    }

    const setPlayerStats = (event) => {
        const video = event.currentTarget;
        const currentTime = video.currentTime;
        const duration = video.duration;

        setCurrentTime(currentTime)
        setDuration(duration)
        setPercent(duration ? (currentTime / duration) : 0.0)
    }

    const showNoteForm = () => {
        pause()
        setShowingNote(true)
    }

    const submitNote = (event) => {
        event.preventDefault();
        const note = event.target.note.value

        const data = {
            time: currentTime.toFixed(2),
            note,
        }
        console.log(data)

        fetch(`${REACT_APP_PROXY}/api/timestamp/${detailEntry.hashes[0]}`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                  "Content-Type": "application/json",
                },
            })
            .then(function(response) {
                if (response.ok) {
                    return response
                }
                throw response;
            })
            .then(function(resp) {
                console.log(resp);
            })
            .catch(err => {
                console.error(err);
                toast.error(err.message);
            })

        toast.success(`Added note @ ${currentTime.toFixed(1)}s`);
        setShowingNote(false)
        play()
    }

    const noteForm = (
        <form onSubmit={submitNote}>
            <label for="note"><em>Note at {currentTime.toFixed(1)} seconds</em></label><br/>
            <input type="text" id="note" name="note" placeholder="Your note here..."/><br/>
            <input type="submit" value="Submit"/>
        </form> 
    )

    const previewTemplate = (entry) => {
        let element;
        let style = {flex: 1, maxHeight: "75vh"};

        if (!mimetypeGuess) {
            element = <div>(Preview not available.)</div>;
        } else if (mimetypeGuess.startsWith("video")) {
            element = (
                <video
                    ref={playerRef}
                    onTimeUpdate={setPlayerStats}
                    onLoadedMetadata={playerFirstLoadHook}
                    style={{width: "100%", height: "auto", maxHeight: "100%"}}
                    controls
                    autoPlay={true}
                    preload="metadata"
                    crossOrigin="anonymous">
                    <source src={`${REACT_APP_PROXY}/stream/${entry.hashes[0]}`} type="video/mp4" />
                    <track src={`${REACT_APP_PROXY}/subtitles/${entry.hashes[0]}`} default kind="captions" srcLang="en"/>
                    Your browser does not support the video tag.
                </video>
            );
            style.maxWidth = "fit-content"
        } else if (mimetypeGuess.startsWith("audio")) {
            element = (
                <audio
                    ref={playerRef}
                    onTimeUpdate={setPlayerStats}
                    onLoadedMetadata={playerFirstLoadHook}
                    style={{minWidth: "75%", maxWidth: "90%"}}
                    controls
                    autoPlay={true}
                    preload="metadata">
                    <source src={`${REACT_APP_PROXY}/stream/${entry.hashes[0]}`} type="audio/mp4" />
                    Your browser does not support the audio tag.
                </audio>
            );
        } else if (mimetypeGuess.startsWith("image")) {
            element = (
                <img style={{maxWidth: "75vw", maxHeight: "75vh"}} src={`${REACT_APP_PROXY}/api/data/${entry.hashes[0]}`} />
            );
        } else if (mimetypeGuess.startsWith("application/pdf")) {
            // #toolbar=0 (to hide the PDF tools)
            element = (
                <iframe style={{minWidth: "75vw", minHeight: "75vh"}} src={`${REACT_APP_PROXY}/stream/${entry.hashes[0]}`} />
            );
        } else {
            element = <div>(Preview not available.)</div>;
        }

        return (
            <>
                <div style={{display: "flex", justifyContent: "center"}}>
                    <div style={style}>
                        {element}
                    </div>
                </div>
                {/*{showingNote ? noteForm : <><button onClick={showNoteForm}>Note</button><br/></>}*/}
{/*                <div>currentTime: {currentTime}</div>
                <div>duration: {duration}</div>
                <div>percent: {percent}</div>
                <button onClick={play}>play</button>
                <button onClick={pause}>pause</button>
                <button onClick={() => seek(30)}>seek 30</button>*/}
            </>
        );
    }

    return (
        <div key={detailEntry.id}>
            {previewTemplate(detailEntry)}
            <a target="_blank" href={`${REACT_APP_PROXY}/stream/${detailEntry.hashes[0]}`}>
                { detailEntry.name }
            </a><br/>
            {showingNote ? noteForm : <button onClick={showNoteForm}>Note</button>}
            <br/>
            {<TimestampsElem timestamps={timestamps} callback={time => seek(time)} />}
            {/*<div>Size: { detailEntry.size }</div>
            <div>Type: { mimetypeGuess }</div>*/}
            <Toaster />
        </div>
    );
}

export default MMEntryPreview;
