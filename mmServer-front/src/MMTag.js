import React from 'react';
import { useDispatch, useSelector } from "react-redux";
import { clearDetailEntry } from "./redux/actions";

import { Button } from 'reactstrap';


const MMTag = (props) => {
    return (
        <div className="badge badge-pill badge-primary" style={{backgroundColor: props.color}}>
            {props.tag}
        </div>
    );
}

export default MMTag;
