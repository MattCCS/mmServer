import React from 'react';
import { useDispatch } from "react-redux";
import { setDetailEntry } from "./redux/actions";

import { Button } from 'reactstrap';

import MMTag from "./MMTag";


export const mmListHeader = () => {
    return (
        <div className="list-header" style={{display: "flex"}}>
            <strong style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center"}}>
                Service
            </strong>
            <strong style={{flex: 4, display: "flex", alignItems: "center", justifyContent: "center"}}>
                Name
            </strong>
            <strong style={{flex: 4, display: "flex", alignItems: "center", justifyContent: "center"}}>
                Tags
            </strong>
        </div>
    );
}


const tagTemplate = (tag) => {
    return <MMTag tag={tag}/>
}


export const MMListItem = (props) => {
    const dispatch = useDispatch();

    const setDetailEntryEvent = (entry) => {
        dispatch(setDetailEntry(entry));
    }

    return (
        <div className="list-entry" style={{display: "flex"}}>
            {/*{% if entry.name.endswith(".zip") %}
                <a href="/zipdetail/{{ item.hashes[0] }}">ZIP: {{ item.name }}</a> ({{ item.service }})
            {% else %}*/}
            {/*<a href={`http://localhost:5001/detail/${entry.hashes[0]}`}>{entry.name}</a>*/}
            <div style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center"}}>
                ({props.entry.service})
            </div>
            <Button className="mc-button" style={{flex: 4}} onClick={() => setDetailEntryEvent(props.entry)}>
                {props.entry.name}
            </Button>
            <div style={{flex: 4, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap"}}>
                {props.entry.tags.map(tagTemplate)}
            </div>
            {/*{% endif %}*/}
        </div>
    );
}
